


struct Uniforms { // 32
    voxel_size: f32, // 4
    dt: f32, // 4
    nx: u32, // 4
    ny: u32, // 4
    nz: u32, // 4
    _padding: u32, // 4
    _padding2: vec2<u32>, //8
}

@group(0) @binding(0) var<storage, read> temp_in : array<f32>;
@group(0) @binding(1) var<storage, read_write> temp_out : array<f32>;
@group(0) @binding(2) var<storage, read_write> diff_grid : array<f32>;
@group(0) @binding(3) var<uniform> p : Uniforms;
@group(0) @binding(4) var heat_texture : texture_storage_3d<rgba16float, write>;

fn get_idx(x: u32, y: u32, z: u32) -> u32 {
    return x + (y * p.nx) + (z * p.nx * p.ny);
}

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) id : vec3<u32>) {


    let idx = get_idx(id.x, id.y, id.z);

    if (id.x <= 0u || id.y <= 0u || id.z <= 0u || id.x >= p.nx-1u || id.y >= p.ny-1u || id.z >= p.nz-1u) {
        textureStore(heat_texture, id, vec4<f32>(0.0, diff_grid[idx], 0.0, 1.0));
        return;
    }

    let curr = temp_in[idx];
    
    let lap = (temp_in[get_idx(id.x + 1u, id.y, id.z)] + temp_in[get_idx(id.x - 1u, id.y, id.z)] - (2.0 * curr)) +
              (temp_in[get_idx(id.x, id.y + 1u, id.z)] + temp_in[get_idx(id.x, id.y - 1u, id.z)] - (2.0 * curr)) +
              (temp_in[get_idx(id.x, id.y, id.z + 1u)] + temp_in[get_idx(id.x, id.y, id.z - 1u)] - (2.0 * curr));



    var newTempValue = curr + ((p.dt * diff_grid[idx]) / (p.voxel_size * p.voxel_size)) * lap;

    
    newTempValue = clamp(newTempValue, 0.0, 10000.0);


    temp_out[idx] = newTempValue;


    textureStore(heat_texture, id, vec4<f32>(newTempValue, diff_grid[idx], 0.0, 1.0));

}




