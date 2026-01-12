import geometryRendererShaderCode from "./shaders/geometry_renderer.wgsl?raw";
import { mat4 } from "gl-matrix";

class GeometryRenderer {
    constructor(gpu, canvas) {
        this.gpu = gpu;
        this.device = gpu.device;
        this.format = gpu.format;

        this.shaderModule = this.device.createShaderModule({ code: geometryRendererShaderCode });
        this.pipeline = null;
        this.createPipeline();

        this.vertexCount = 0;
        this.vertexBuffer = null;

        this.uniform = new Float32Array(20);
        this.uniformBuffer = this.device.createBuffer({
            size: 80,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.uniformBindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
        });

        this.uploading = false;

        const mvp = mat4.create();
        const proj = mat4.create();
        const view = mat4.create();
        

        mat4.perspective(proj, Math.PI / 4, canvas.width/canvas.height, 0.1, 1000.0);
        mat4.lookAt(view, [0, 0, 5], [0, 0, 0], [0, 1, 0]);
        mat4.multiply(mvp, proj, view);

        this.uploadUniform(mvp, 0);
        this.uploadUniform([0.6, 0.6, 0.6, 1.0], 16); 

    }

    createPipeline() {
        this.pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.shaderModule,
                entryPoint: "vs",
                buffers: [{
                    arrayStride: 12,
                    attributes: [{ shaderLocation: 0, offset: 0, format: "float32x3" }]
                }]
            },
            fragment: {
                module: this.shaderModule,
                entryPoint: "fs",
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
                        alpha: { srcFactor: "one", dstFactor: "one", operation: "add" }
                    } 
                }]
            },
            primitive: { 
                topology: "triangle-list", 
                cullMode: "none" 
            },
            depthStencil: { depthWriteEnabled: true, depthCompare: 'less', format: "depth24plus" }
        });
    }

    uploadVertices(vertices) {
        this.uploading = true;
        if (!vertices || vertices.length < 3) {
            console.warn("no vertices found in uploadVertices");
            return;
            }

        if (!this.vertexBuffer || vertices.byteLength !== this.vertexBuffer.size) {
            if (this.vertexBuffer) this.vertexBuffer.destroy();
            this.vertexBuffer = this.device.createBuffer({
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });
        }
        else {
            console.warn("Did not recreate vertex buffer");
        }


        this.vertexCount = vertices.length / 3;
        this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
        this.uploading = false;
    }


    uploadUniform(data, offset) {
        this.uniform.set(data, offset);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniform);
    }

    draw(encoder, descriptor) {



        if (this.uploading) {
            console.warn("Cancelled render due to uploading");
            return;
        }

        // if (!this.vertexBuffer || this.vertexCount === 0) {
        //     console.log("Issue with vertex buffer");
        //     return;
        // }
        const pass = encoder.beginRenderPass(descriptor);
        
        if (this.vertexBuffer && this.vertexCount > 0) {
            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, this.uniformBindGroup);
            pass.setVertexBuffer(0, this.vertexBuffer);
            pass.draw(this.vertexCount); 
        }
        
        pass.end();
    }
}

export default GeometryRenderer;