class GPUContext {
    constructor(canvas, device, context, format) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        this.depthTexture = null;
        this.resize(Math.floor(this.canvas.clientWidth), Math.floor(this.canvas.clientHeight));
    }

    static async create(canvas, alphaMode = "opaque") {
        if (!canvas) return;
        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const format = navigator.gpu.getPreferredCanvasFormat();
        const context = canvas.getContext("webgpu");

        context.configure({
            device: device,
            format: format,
            alphaMode: alphaMode,
        });

        return new GPUContext(canvas, device, context, format);
    }

    begin() {
        const encoder = this.device.createCommandEncoder();
        const colorTexture = this.context.getCurrentTexture();
        
        if (colorTexture.width !== this.depthTexture?.width || 
            colorTexture.height !== this.depthTexture?.height) {
            this.resize(colorTexture.width, colorTexture.height);
        }

        const descriptor = {
            colorAttachments: [{
                view: colorTexture.createView(), 
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: "clear",
                storeOp: "store",
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(), 
                depthClearValue: 1.0,
                depthLoadOp: "clear",
                depthStoreOp: "store"
            }
        };

        return { encoder, descriptor };
    }

    createBuffer(size, usage) {
        return this.device.createBuffer({ size, usage });
    }

    submit(encoder) {
        this.device.queue.submit([encoder.finish()]);
    }

    resize(w, h) {
        const width = Math.max(1, Math.floor(w));
        const height = Math.max(1, Math.floor(h));

        if (this.depthTexture && this.depthTexture.width === width && this.depthTexture.height === height) {
            return;
        }

        this.canvas.width = width;
        this.canvas.height = height;

        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

        if (this.depthTexture) {
            this.depthTexture.destroy();
        }

        this.depthTexture = this.device.createTexture({
            size: [width, height],
            format: "depth24plus",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }
}

export default GPUContext;