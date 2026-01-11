class Space {
    constructor(ambient_temp = 0, ambient_diff = 1e-5) {
        this.objects = {};
        this.objectCount = 0;
        this.vertices = new Float32Array(0);
        this.ambient_temp = ambient_temp;
        this.ambient_diff = ambient_diff;
        this.min = [0, 0, 0];
        this.max = [0, 0, 0];
        this.nx = 0;
        this.ny = 0;
        this.nz = 0;
        this.voxelSize = 0.1;
        this.temp_grid = null;
        this.diff_grid = null;
    }

    addObject(obj, units = 0.01) {
        let min = [Infinity, Infinity, Infinity];
        let max = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < obj.vertices.length; i += 3) {
            obj.vertices[i] *= units;
            obj.vertices[i + 1] *= units;
            obj.vertices[i + 2] *= units;

            if (obj.vertices[i] < min[0]) min[0] = obj.vertices[i];
            if (obj.vertices[i + 1] < min[1]) min[1] = obj.vertices[i + 1];
            if (obj.vertices[i + 2] < min[2]) min[2] = obj.vertices[i + 2];
            
            if (obj.vertices[i] > max[0]) max[0] = obj.vertices[i];
            if (obj.vertices[i + 1] > max[1]) max[1] = obj.vertices[i + 1];
            if (obj.vertices[i + 2] > max[2]) max[2] = obj.vertices[i + 2];
        }

        const centerX = (min[0] + max[0]) / 2;
        const centerY = (min[1] + max[1]) / 2;
        const centerZ = (min[2] + max[2]) / 2;

        for (let i = 0; i < obj.vertices.length; i += 3) {
            obj.vertices[i] -= centerX;
            obj.vertices[i + 1] -= centerY;
            obj.vertices[i + 2] -= centerZ;
        }

        this.objectCount++;
        this.objects[this.objectCount] = obj;

        const newSize = this.vertices.length + obj.vertices.length;
        const newVertices = new Float32Array(newSize);
        newVertices.set(this.vertices, 0);
        newVertices.set(obj.vertices, this.vertices.length);
        this.vertices = newVertices;

        this.compute(this.voxelSize);
    }

        get_idx(x, y, z) {
            return x + (y * this.nx) + (z * this.nx * this.ny);
        }

        compute(voxelSize = 0.01) {
            try {

            
                this.voxelSize = voxelSize;
                const invVoxelSize = 1.0 / voxelSize;

                let min = [Infinity, Infinity, Infinity];
                let max = [-Infinity, -Infinity, -Infinity];

                const objects = Object.values(this.objects)

                for (const obj of objects) {
                    const v = obj.vertices;
                    for (let i = 0; i < v.length; i += 3) {
                        if (v[i] < min[0]) min[0] = v[i];
                        if (v[i + 1] < min[1]) min[1] = v[i + 1];
                        if (v[i + 2] < min[2]) min[2] = v[i + 2];
                        if (v[i] > max[0]) max[0] = v[i];
                        if (v[i + 1] > max[1]) max[1] = v[i + 1];
                        if (v[i + 2] > max[2]) max[2] = v[i + 2];
                    }
                }

                if (min[0] === Infinity) return;

                const pad = 5 * voxelSize;
                this.min = [min[0] - pad, min[1] - pad, min[2] - pad];
                this.max = [max[0] + pad, max[1] + pad, max[2] + pad];

                this.nx = Math.ceil((this.max[0] - this.min[0]) * invVoxelSize);
                this.ny = Math.ceil((this.max[1] - this.min[1]) * invVoxelSize);
                this.nz = Math.ceil((this.max[2] - this.min[2]) * invVoxelSize);

                const totalVoxels = this.nx * this.ny * this.nz;
                
                this.temp_grid = new Float32Array(totalVoxels).fill(this.ambient_temp);
                this.diff_grid = new Float32Array(totalVoxels).fill(this.ambient_diff);

                for (const obj of objects) {
                    const v = obj.vertices;
                    const spatialGrid = new Array(this.nx * this.nz);

                    for (let i = 0; i < v.length; i += 9) {
                        const xMin = Math.max(0, Math.floor((Math.min(v[i], v[i + 3], v[i + 6]) - this.min[0]) * invVoxelSize));
                        const xMax = Math.min(this.nx - 1, Math.floor((Math.max(v[i], v[i + 3], v[i + 6]) - this.min[0]) * invVoxelSize));
                        const zMin = Math.max(0, Math.floor((Math.min(v[i + 2], v[i + 5], v[i + 8]) - this.min[2]) * invVoxelSize));
                        const zMax = Math.min(this.nz - 1, Math.floor((Math.max(v[i + 2], v[i + 5], v[i + 8]) - this.min[2]) * invVoxelSize));

                        for (let bz = zMin; bz <= zMax; bz++) {
                            for (let bx = xMin; bx <= xMax; bx++) {
                                const cellIdx = bx + bz * this.nx;
                                if (!spatialGrid[cellIdx]) spatialGrid[cellIdx] = [];
                                spatialGrid[cellIdx].push(i);
                            }
                        }
                    }

                    for (let z = 0; z < this.nz; z++) {
                        const worldZ = this.min[2] + (z * voxelSize);
                        for (let x = 0; x < this.nx; x++) {
                            const cellIdx = x + z * this.nx;
                            const triangleIndices = spatialGrid[cellIdx];
                            if (!triangleIndices) continue;

                            const worldX = this.min[0] + (x * voxelSize);
                            let intersections = [];

                            for (const triIdx of triangleIndices) {
                                const y = this._getTriangleYDirect(worldX, worldZ, v, triIdx);
                                if (y !== null) intersections.push(y);
                            }

                            if (intersections.length < 2) continue;
                            intersections.sort((a, b) => a - b);

                            for (let k = 0; k < intersections.length - 1; k += 2) {
                                const yStart = Math.max(0, Math.floor((intersections[k] - this.min[1]) * invVoxelSize));
                                const yEnd = Math.min(this.ny - 1, Math.ceil((intersections[k + 1] - this.min[1]) * invVoxelSize));

                                for (let y = yStart; y <= yEnd; y++) {
                                    const idx = x + (y * this.nx) + (z * this.nx * this.ny);
                                    this.temp_grid[idx] = obj.initial_temp;
                                    this.diff_grid[idx] = obj.heat_diffusivity;
                                }
                            }
                        }
                    }
                }
                } catch {
                    alert("Browser can not use this much memory. Either decrease the scale of the model or reduce the voxel size.")
                }
        }

    _getTriangleYDirect(px, pz, v, i) {
        const x1 = v[i], y1 = v[i + 1], z1 = v[i + 2];
        const x2 = v[i + 3], y2 = v[i + 4], z2 = v[i + 5];
        const x3 = v[i + 6], y3 = v[i + 7], z3 = v[i + 8];

        const det = (z2 - z3) * (x1 - x3) + (x3 - x2) * (z1 - z3);
        if (Math.abs(det) < 1e-9) return null;

        const b1 = ((z2 - z3) * (px - x3) + (x3 - x2) * (pz - z3)) / det;
        const b2 = ((z3 - z1) * (px - x3) + (x1 - x3) * (pz - z3)) / det;
        const b3 = 1.0 - b1 - b2;

        const eps = 1e-6;
        if (b1 >= -eps && b2 >= -eps && b3 >= -eps) {
            return b1 * y1 + b2 * y2 + b3 * y3;
        }
        return null;
    }
}

export default Space;