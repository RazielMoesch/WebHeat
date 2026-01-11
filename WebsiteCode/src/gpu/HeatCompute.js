import heatComputeShaderCode from "./shaders/compute_heat.wgsl?raw";

class HeatCompute {
    constructor(gpu, resolution = 50) {
        this.gpu = gpu;
        this.device = gpu.device;
        this.resolution = resolution;

        this.voxelSize = null;
        this.nx = null;
        this.ny = null;
        this.nz = null;

        this.shaderModule = this.device.createShaderModule({ code: heatComputeShaderCode });
        this.pipeline = null;
        this.createPipeline();

        this.tempGridCount = 0;
        this.tempBuffer1 = null;
        this.tempBuffer2 = null;
        this.diffBuffer = null;

        this.uniform = new Float32Array(8);

        
        this.uniformBuffer = this.device.createBuffer({
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.texture = null;
        this.textureView = null;
        this.sampler = this.device.createSampler({
            magFilter: 'nearest',
            minFilter: "nearest",
            mipmapFilter: "nearest",
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            addressModeW: "clamp-to-edge",
        });

        this.bindA = null;
        this.bindB = null;
        this.stepCount = 0;
    }

    createPipeline() {
        this.pipeline = this.device.createComputePipeline({
            layout: "auto",
            compute: {
                module: this.shaderModule,
                entryPoint: "main"
            }
        });
    }

    uploadUniform(data, offset) {
        this.uniform.set(data, offset);
    }

    uploadSpace(space) {
        if (!space.temp_grid || !space.diff_grid) return;

        this.voxelSize = space.voxelSize;
        this.nx = space.nx;
        this.ny = space.ny;
        this.nz = space.nz;

        console.log("Space Dimensions: ", this.nx, this.ny, this.nz );
        console.log("voxel size: ", this.voxelSize);


        const dimensionsChanged = this.texture && (
            this.texture.width !== this.nx || 
            this.texture.height !== this.ny || 
            this.texture.depthOrArrayLayers !== this.nz
        );


        if (!this.tempBuffer1 || space.temp_grid.length !== this.tempGridCount || dimensionsChanged) {
            if (this.tempBuffer1) this.tempBuffer1.destroy();
            if (this.tempBuffer2) this.tempBuffer2.destroy();
            if (this.diffBuffer) this.diffBuffer.destroy();
            if (this.texture) this.texture.destroy();

            const tempUsage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST;

            this.tempBuffer1 = this.device.createBuffer({ size: space.temp_grid.byteLength, usage: tempUsage });
            this.tempBuffer2 = this.device.createBuffer({ size: space.temp_grid.byteLength, usage: tempUsage });
            this.diffBuffer = this.device.createBuffer({
                size: space.diff_grid.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
            });

            this.texture = this.device.createTexture({
                size: [this.nx, this.ny, this.nz],
                dimension: '3d',
                format: 'rgba16float',
                usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
            });
            this.textureView = this.texture.createView();
            this.tempGridCount = space.temp_grid.length;
        }


        this.device.queue.writeBuffer(this.tempBuffer1, 0, space.temp_grid);
        this.device.queue.writeBuffer(this.tempBuffer2, 0, space.temp_grid);
        this.device.queue.writeBuffer(this.diffBuffer, 0, space.diff_grid);


        const layout = this.pipeline.getBindGroupLayout(0);
        this.bindA = this.device.createBindGroup({
            layout,
            entries: [
                { binding: 0, resource: { buffer: this.tempBuffer1 } },
                { binding: 1, resource: { buffer: this.tempBuffer2 } },
                { binding: 2, resource: { buffer: this.diffBuffer } },
                { binding: 3, resource: { buffer: this.uniformBuffer } },
                { binding: 4, resource: this.textureView }
            ]
        });

        this.bindB = this.device.createBindGroup({
            layout,
            entries: [
                { binding: 0, resource: { buffer: this.tempBuffer2 } },
                { binding: 1, resource: { buffer: this.tempBuffer1 } },
                { binding: 2, resource: { buffer: this.diffBuffer } },
                { binding: 3, resource: { buffer: this.uniformBuffer } },
                { binding: 4, resource: this.textureView }
            ]
        });
    }

    step(dt, nSteps) {
        if (!this.bindA || !this.bindB) return;

        const f32Uniforms = new Float32Array([this.voxelSize, dt]);
        const u32Uniforms = new Uint32Array([this.nx, this.ny, this.nz]);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, f32Uniforms);
        this.device.queue.writeBuffer(this.uniformBuffer, 8, u32Uniforms);

        const encoder = this.device.createCommandEncoder();
        for (let i = 0; i < nSteps; i++) {
            const group = (this.stepCount % 2 === 0) ? this.bindA : this.bindB;
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, group);
            pass.dispatchWorkgroups(
                Math.ceil(this.nx / 4),
                Math.ceil(this.ny / 4),
                Math.ceil(this.nz / 4)
            );
            pass.end();
            this.stepCount++;
        }
        this.device.queue.submit([encoder.finish()]);
    }

    

    stepWEncoder(encoder, dt, nSteps) {

        if (!this.bindA || !this.bindB) return;

        const buffer = new ArrayBuffer(32);
        const f32 = new Float32Array(buffer);
        const u32 = new Uint32Array(buffer);

        f32[0] = this.voxelSize; 
        f32[1] = dt;            
        u32[2] = this.nx;        
        u32[3] = this.ny;      
        u32[4] = this.nz;      

        this.device.queue.writeBuffer(this.uniformBuffer, 0, buffer);

        for ( let i = 0; i < nSteps; i++ ) {

            const group = (this.stepCount % 2 === 0) ? this.bindA : this.bindB;
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, group);
            pass.dispatchWorkgroups(
                Math.ceil(this.nx / 4),
                Math.ceil(this.ny / 4),
                Math.ceil(this.nz / 4),
            );

            pass.end();
            console.log("completed compute pass.")
            this.stepCount++;
        }



    }

    getRenderData() {
        return { 
            texture: this.textureView, 
            sampler: this.sampler 
        };
    }
}

export default HeatCompute;