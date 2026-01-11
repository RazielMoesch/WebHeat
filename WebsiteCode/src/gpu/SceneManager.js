import { mat4 } from "gl-matrix";
import GeometryRenderer from "./GeometryRenderer";
import GPUContext from "./GPUContext";
import SimulationRenderer from "./SimulationRenderer";
import HeatCompute from "./HeatCompute";
import Space from "../data/Space.js";
import Object3D from "../data/Object3D.js";
import CameraControls from "./CameraControls.js";
import { timerRef } from "../global.js";

class SceneManager {
    constructor(canvasRef, gpu) {
        this.canvasRef = canvasRef;
        this.gpu = gpu;
        this.ambient_temperature = 0;
        this.ambient_diffusivity = 1e-5;
        this.obj_temp = 1000;
        this.obj_diff = 1e-3;
        this.voxelSize = 0.01;
        this.space = new Space(this.ambient_temperature, this.ambient_diffusivity);
        this.camera = new CameraControls(this.gpu);
        this.geometryRenderer = new GeometryRenderer(this.gpu, canvasRef.current);
        this.simulationRenderer = new SimulationRenderer(this.gpu);

        this.heatCompute = new HeatCompute(this.gpu, this.space);
        this.viewmode = "";
        this.computeRunning = false;
        this.mvp = mat4.create();
        this.dt = 0.005;
        this.nsteps = 10;
        this.frameID = null;
        this.timestepped = 0;

        this.simulationSpeedScale = 1.0; 
        this.accumulator = 0;
        this.lastTime = 0;

        this.updateCameraUniforms(this.camera.getMVP(this.gpu.canvas.width, this.gpu.canvas.height));

    }

    static async create(canvasRef) {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("SceneManager: Canvas DOM element not found.");
        const gpu = await GPUContext.create(canvas);
        return new SceneManager(canvasRef, gpu);
    }

    changeVoxelSize( voxelSize ) {
        this.voxelSize = voxelSize;
        this.space.ambient_diff = this.ambient_diffusivity;
    }

    changeAmbientTemp( temp ) {
        this.ambient_temperature = temp;
        this.space.ambient_temp = this.ambient_temperature;
    }

    changeAmbientDiff( diff ){
        this.ambient_diffusivity = diff;
        this.space.ambient_diff = this.ambient_diffusivity;

    }
    changeObjectTemp( temp ) {
        this.obj_temp = temp;
        for (const obj of Object.values(this.space.objects)) {
            obj.initial_temp = this.obj_temp;
        }
    }

    changeObjectDiff( diff ) {
        this.obj_diff = diff;
        for (const obj of Object.values(this.space.objects)) {
            obj.heat_diffusivity = this.obj_diff;
        }
    }

    handleFileUpload(vertices, units=0.01) {
        this.stopEngine();
        this.units = units;
        this.voxelSize = units;
        const newObj = new Object3D(vertices, this.obj_temp, this.obj_diff);
        this.space.voxelSize = units;
        this.space.addObject(newObj, units);
        // this.space.compute();
        this.geometryRenderer.uploadVertices(this.space.vertices);
        this.startEngineRealTime();
    }

    startSimulation() {
        this.space.compute(this.voxelSize);

        this.heatCompute.uploadSpace(this.space);
        this.simulationRenderer.uploadSpace(this.space);
        this.viewmode = "simulation";
        this.computeRunning = true;
        console.log("started sim")
    }

    stopSimulation() {
        this.viewmode = "geometry";
        this.computeRunning = false;
    }


    updateCameraUniforms(mvp) {
        if (mvp) this.mvp = mvp;
        this.geometryRenderer.uploadUniform(this.mvp, 0);
        this.simulationRenderer.uploadUniform(this.mvp, 0);
        if (this.heatCompute.nx) {
            this.simulationRenderer.uploadUniform(this.space.min, 16);
            this.simulationRenderer.uploadUniform(this.space.max, 20);
            
        }
    }

    startEngineRealTime() {
        if (this.frameID) return;

        const frame = (now) => {
            if (!this.gpu || !this.gpu.device) return;

           
            if (this.lastTime === 0) this.lastTime = now;
            const realDt = (now - this.lastTime) / 1000; 
            this.lastTime = now;

            if (this.viewmode === "simulation") {
                
                const { encoder, descriptor } = this.gpu.begin();
                if (this.computeRunning) {
                    this.accumulator += realDt * this.simulationSpeedScale;
                    const maxStepsPerFrame = 20; 
                    let stepsThisFrame = 0;
                    while (this.accumulator >= this.dt && stepsThisFrame < maxStepsPerFrame) {
                        this.heatCompute.stepWEncoder(encoder, this.dt, 1);
                        this.accumulator -= this.dt;
                        this.timestepped += this.dt;
                        stepsThisFrame++;
                    }
                }
                


                let { texture, sampler } = this.heatCompute.getRenderData();
                this.simulationRenderer.uploadTexture(texture, sampler);
                this.simulationRenderer.draw(encoder, descriptor);
                
                
                this.gpu.submit(encoder);
                timerRef.current = this.timestepped;

            } else {
                const { encoder, descriptor } = this.gpu.begin();
                this.geometryRenderer.draw(encoder, descriptor);
                this.gpu.submit(encoder);
            }

            this.frameID = requestAnimationFrame(frame);
        };
        this.frameID = requestAnimationFrame(frame);
    }

    startEngine() {

        if (this.frameID) {
            console.log("cancelled engine to to frameID");
            return;
        };

        this.heatCompute.step(0.0001, 1);

        const frame = () => {
            if (!this.gpu || !this.gpu.device) {
                console.log("no gpu found");
                return;
            };

            if (this.computeRunning) {
                this.heatCompute.step(this.dt, this.nsteps);
                this.timestepped += this.dt * this.nsteps;
                console.log("computed heat");
            }

            const { encoder, descriptor } = this.gpu.begin();
            if (this.viewmode === "geometry") {
                this.geometryRenderer.draw(encoder, descriptor);

            } else if (this.viewmode === "simulation") {

                let {texture, sampler} = this.heatCompute.getRenderData();
                if (!texture) console.log("no texture");
                if (!sampler) console.log("no sampler");
                this.simulationRenderer.uploadTexture(texture, sampler);
                this.simulationRenderer.draw(encoder, descriptor);
            }
            this.gpu.submit(encoder);
            this.frameID = requestAnimationFrame(frame);
        };
        this.frameID = requestAnimationFrame(frame);
    }

    stopEngine() {
        if (this.frameID) cancelAnimationFrame(this.frameID);
        this.frameID = null;
        this.timestepped = 0.0;
    }

    startSameEncoderEngine() {

        
        if (this.frameID) {
            console.log("cancelled engine due to frameID");
        }

        this.heatCompute.step(0.000001, 1);

        const frame = () => {

            const {encoder, descriptor} = this.gpu.begin();

            if (this.computeRunning && this.heatCompute) {
                this.heatCompute.stepWEncoder(encoder, this.dt, this.nsteps);
                

            }

            if (this.viewmode === "simulation" && this.simulationRenderer) {
                const {texture, sampler} = this.heatCompute.getRenderData();
                
                this.simulationRenderer.uploadTexture(texture, sampler);
                
                
                this.simulationRenderer.draw(encoder, descriptor);

            }

            else if (this.viewmode === "geometry" && this.geometryRenderer) {
                this.geometryRenderer.draw(encoder, descriptor)
            }

            this.gpu.submit(encoder);

            this.frameID = requestAnimationFrame(frame);


        }
        this.frameID = requestAnimationFrame(frame)
    }


    mouseLeftDown(e) {

        this.camera.leftDown(e.clientX, e.clientY);

    }

    mouseLeftUp() {
        this.camera.leftUp();
    }

    mouseRightDown(e) {
        this.camera.rightDown(e.clientX, e.clientY);

    }

    mouseRightUp() {
        this.camera.rightUp();
    }

    mouseRightMove(e) {
        this.camera.rightMove(e.clientX, e.clientY);
        this.updateCameraUniforms(this.camera.getMVP(this.gpu.canvas.width, this.gpu.canvas.height));
    }

    mouseLeftMove(e) {
        this.camera.leftMove(e.clientX, e.clientY);
        this.updateCameraUniforms(this.camera.getMVP(this.gpu.canvas.width, this.gpu.canvas.height));
    }

    mouseZoom(e) {
        this.camera.zoom(e.deltaY);
        this.updateCameraUniforms(this.camera.getMVP(this.gpu.canvas.width, this.gpu.canvas.height));
    }



}

export default SceneManager;