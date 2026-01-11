

struct RenderUniforms {
    mvp: mat4x4<f32>,      
    space_min: vec3<f32>,  
    _pad1: f32,            
    space_max: vec3<f32>,  
    min_temp: f32,         
    max_temp: f32,         
    _pad2: vec3<f32>,      
};

@group(0) @binding(0) var<uniform> u : RenderUniforms;
@group(0) @binding(1) var t_heat : texture_3d<f32>;

struct VOut {
    @builtin(position) position : vec4<f32>,
    @location(0) uvw : vec3<f32>,
};

@vertex
fn vs(@location(0) pos: vec3<f32>) -> VOut {
    var out: VOut;
    out.position = u.mvp * vec4<f32>(pos, 1.0);
    
    let dims = vec3<f32>(textureDimensions(t_heat));
    let range = u.space_max.xyz - u.space_min.xyz;
    
    let normalized = (pos - u.space_min.xyz) / range;
    
    out.uvw = (normalized * (dims - 1.0) + 0.5) / dims;
    
    return out;
}

@fragment
fn fs(in: VOut) -> @location(0) vec4<f32> {
    let dims = vec3<f32>(textureDimensions(t_heat));
    
    let coords = vec3<i32>(in.uvw * dims);
    
    let s = textureLoad(t_heat, coords, 0);
    
    let final_temp = s.r;
    let final_diff = s.g;

    let t = clamp(((final_temp - u.min_temp) / (u.max_temp - u.min_temp)), 0.0, 1.0);
    return vec4<f32>(t, 0.0, 1.0 - t, 1.0);
}

