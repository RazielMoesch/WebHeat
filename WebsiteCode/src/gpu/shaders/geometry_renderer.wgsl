



struct Uniforms {

    mvp: mat4x4<f32>, // 64
    color: vec3<f32>, // 12
    opacity: f32, // 4 

}

@group(0) @binding(0) var<uniform> u : Uniforms;


@vertex
fn vs ( @location(0) position: vec3<f32> ) -> @builtin(position) vec4<f32> {


    return u.mvp * vec4<f32>(position, 1.0);

   
}

@fragment
fn fs () -> @location(0) vec4f {

    return vec4<f32>( u.color , u.opacity );

}


