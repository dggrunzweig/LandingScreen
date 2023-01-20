#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_rms;
uniform float u_frequency;

mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
}

float rand2d(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// outputs a value between 0 and 1
float perlin1d(float pos) {
    float seed = 1.0;
    // get a random value for the floor point and the ceiling point
    float low = rand2d(vec2(floor(pos), seed));
    float high = rand2d(vec2(floor(pos + 1.0), seed));
    // interpolation value
    float interp = fract(pos);

    // smoother transitioning using smooth step (hermite function)
    return mix(low, high, smoothstep(0., 1., interp));
}

float perlin2d(vec2 pos)
{
    vec2 i = floor(pos);
    vec2 f = fract(pos);

    // Four corners in 2D of a tile
    float a = rand2d(i);
    float b = rand2d(i + vec2(1.0, 0.0));
    float c = rand2d(i + vec2(0.0, 1.0));
    float d = rand2d(i + vec2(1.0, 1.0));

    // Smooth Interpolation

    // Cubic Hermine Curve.  Same as SmoothStep()
    vec2 u = f*f*(3.0-2.0*f);
    // u = smoothstep(0.,1.,f);

    // Mix 4 coorners percentages
    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float paint_dot(in vec2 st, in vec2 center, in float radius, float time, float width){
    width = clamp(0.0, 1.0, width); 
    // float width_variance = 0.1 * perlin2d(20.0 * st + time);
    float width_variance = 0.05 * perlin2d(5.0 * st + time);
    float pressure_variance = 0.5 + 0.5 * perlin2d(10.0 * st + time);
    width = 1.0 - width;
    vec2 dist = abs(st-center);
    float inner_radius = width * radius + width_variance;
    float inner_circle = 1.0 - smoothstep(inner_radius-(radius*0.01),
                         inner_radius+(radius*0.01),
                         dot(dist,dist)*4.0);
    float outer_radius = radius + width_variance;
    float outer_circle = smoothstep(outer_radius-(radius*0.01),
                         outer_radius+(radius*0.01),
                         dot(dist,dist)*4.0);
	return pressure_variance * (1. - (outer_circle + inner_circle));
}

vec3 circle_grid(vec2 pos, float time, float modulator) {
    vec3 dark_lilac = vec3(0.686,0.624,0.788);
    vec3 light_lilac = vec3(0.929,0.89,1.);
    const vec2 size = vec2(10.0,10.0);
    vec2 scaled_pos = pos * size;
    vec3 dots = vec3(0.0);   
    float i = 0.0, j = 0.0;
    // grid
    // for (float x = 0.0; x < size.x; x++) {
    //     for (float y = 0.0; y < size.y; y++) {
    //         float radius = 0.1;// + 0.2 * abs(sin(2.0 * time));//0.1 + 0.5 * perlin2d(5. * vec2(i,j) + time);
    //         dots = dots + paint_dot(scaled_pos - 0.5, vec2(x,y), radius, time, 0.4);
    //     }
    // }
    // randomized
    for (float i = 0.0; i < size.x * size.y; ++i) {
        // generate a new random position for every circle
        vec2 circle_pos = vec2(size.x * perlin1d(i + time / 10.0), size.y * perlin1d(i + 12123.1 + time / 10.0));
        float radius = modulator + 0.1 * abs(sin(2.0 * time));//0.1 + 0.5 * perlin2d(5. * vec2(i,j) + time);
        float randomized_scalar = perlin1d(14.2414 * i);
        vec3 color = 1.0 - mix(light_lilac, dark_lilac, step(0.5, randomized_scalar));
        vec3 new_dots = color * paint_dot(scaled_pos - 0.5, circle_pos, radius, time, 0.6);
        dots = dots + new_dots;
    }
    return dots;
}

float mask(vec2 pos, float time, float value) {
    float mask = step(0.5, perlin2d(50.0 * pos + time)) + 0.4 * rand2d(pos);
    mask = clamp(0.0, 1.0, mask);
    return value * mask;
}

float sine_texture(vec2 pos, float rate, float time) {

    return abs(sin(rate * 2.0 * PI * pos.y + time));
}

float ink_specks(vec2 pos, float offset) {
    float specks = smoothstep(0.97, 1.0, perlin2d(132.323 * pos + offset));
    return specks;
}

float roundedFrame (vec2 pos, vec2 size, float radius, float thickness)
{
    size = size / 2.0;
  vec2 uv = vec2(0.5, 0.5);
  float d = length(max(abs(uv - pos),size) - size) - radius;
  return smoothstep(0.55, 0.45, (d / thickness) * 5.0);
}

vec3 frame(vec2 st, vec3 current_color, float frame_width) {
    vec3 frame_color = vec3(0.90,0.914,0.918);
    float frame_scalar = 1.0 - roundedFrame(st, vec2(0.88, 0.88), 0.03, frame_width);
    if (frame_scalar == 1.0)
        return frame_color;
    else
        return current_color;
}


	

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy / u_resolution.xy; 

    float grain = 0.10 * rand2d(st); 
    float specks = ink_specks(st, 18.0);
    vec3 dots = circle_grid(st, u_time / 5.0, u_rms);
    float background_color = 15.0/255.0;
    
    vec3 sum = vec3(1.0 - (background_color + specks + grain)) - dots;
    // vec3 sum = vec3((background_color + specks + grain)) + (lilac) * dots;
    // create a frame
    float frame_width = 0.03;
    
    gl_FragColor = vec4(frame(st, sum, frame_width), 1.0);
}
