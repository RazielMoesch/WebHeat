import simulationRendererShaderCode from "./shaders/simulation_renderer.wgsl?raw";

class SimulationRenderer {
    constructor(gpu) {
        this.gpu = gpu;
        this.device = gpu.device;
        this.format = gpu.format;
        this.shaderModule = this.device.createShaderModule({ code: simulationRendererShaderCode });
        this.pipeline = null;
        this.createPipeline();
        
        this.vertexCount = 0;
        this.vertexBuffer = null;
        this.uniform = new Float32Array(32);
        this.uniformBuffer = this.device.createBuffer({
            size: 128,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.bindGroup = null;
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
                }]
            },
            primitive: { topology: "triangle-list", cullMode: "back" },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus"
            }
        });
    }

    uploadVertices(vertices) {
        if (!vertices || vertices.length < 3) return;

        const data = vertices instanceof Float32Array ? vertices : new Float32Array(vertices);

        if (!this.vertexBuffer || this.vertexBuffer.size !== data.byteLength) {
            if (this.vertexBuffer) this.vertexBuffer.destroy();
            this.vertexBuffer = this.device.createBuffer({
                size: data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });
        }
        
        this.vertexCount = data.length / 3;
        this.device.queue.writeBuffer(this.vertexBuffer, 0, data);

    }

    uploadSpace(space) {
        const vertices = space.vertices;
        if (!vertices || vertices.length < 3) return;

        const data = vertices instanceof Float32Array ? vertices : new Float32Array(vertices);

        if (!this.vertexBuffer || this.vertexBuffer.size !== data.byteLength) {
            if (this.vertexBuffer) this.vertexBuffer.destroy();
            this.vertexBuffer = this.device.createBuffer({
                size: data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            });
        }
        
        let min_temp = Infinity;
        let max_temp = -Infinity;

        for ( let i = 0; i < space.temp_grid.length; i++ ) {
            if (space.temp_grid[i] < min_temp) min_temp = space.temp_grid[i];
            if (space.temp_grid[i] > max_temp) max_temp = space.temp_grid[i];
        }


        console.log("temps: ", min_temp, max_temp);

        const bounds = new Float32Array([
            space.min[0], space.min[1], space.min[2], 0,
            space.max[0], space.max[1], space.max[2],
            min_temp,
            max_temp
        ])
        this.uniform.set(bounds, 16);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniform);

        this.vertexCount = data.length / 3;
        this.device.queue.writeBuffer(this.vertexBuffer, 0, data);
        if (min_temp === Infinity || max_temp === -Infinity) return;
    }

    uploadUniform(data, offset) {
        this.uniform.set(data, offset);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniform);
    }

    uploadTexture(textureView, sampler) {
        this.bindGroup = null; 

        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: textureView },
            ]
        });
    }

    draw(encoder, descriptor) {

        if (!this.vertexBuffer || !this.bindGroup || this.vertexCount === 0) {
            if (!this.bindGroup) console.log("no bind group");
            return;
        }
            
            
        
        const pass = encoder.beginRenderPass(descriptor);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertexCount);
        pass.end();
    }

    destroy() {
        if (this.vertexBuffer) this.vertexBuffer.destroy();
        if (this.uniformBuffer) this.uniformBuffer.destroy();
        this.bindGroup = null;
        this.vertexCount = 0;
    }
}

export default SimulationRenderer;