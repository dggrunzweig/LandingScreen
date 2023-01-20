#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_rms;
uniform float u_rms_sum;
uniform float u_frequency;
uniform vec3 u_frame_color;
uniform float u_speck_offset;
uniform int u_grid_mode;
uniform int u_color_mode;

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
    float width_variance = 0.07 * perlin2d(5.0 * st + time);
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

vec3 circle_grid(vec2 pos, float time, float mod_1, float mod_2, int mode, int color_mode) {
    vec3 dark_lilac = vec3(0.686,0.624,0.788);
    vec3 light_lilac = vec3(0.929,0.89,1.);

    vec3 dark_blue = vec3(0.365,0.427,0.494);
    vec3 dark_green = vec3(0.09,0.647,0.537);

    vec3 color_1 = vec3(0.0);
    vec3 color_2 = vec3(0.0);
    if (color_mode == 0) {
        color_1 = light_lilac;
        color_2 = dark_lilac;
    } else if (color_mode == 1) {
        color_1 = dark_blue;
        color_2 = dark_green;
    }
    


    vec3 dots = vec3(0.0);   
    float i = 0.0, j = 0.0;
    // grid
    if (mode == 0) {
        const vec2 size = vec2(10.0,10.0);
        vec2 scaled_pos = pos * size;
        for (float x = 0.0; x < size.x; x++) {
            for (float y = 0.0; y < size.y; y++) {
                float radius = mod_1 + 0.1 * abs(sin(2.0 * time));
                float randomized_scalar = perlin1d(121.2414 * (x + y) + time / 10.0);
                vec3 color = 1.0 - mix(color_1, color_2, randomized_scalar);
                // vec2 center_point = vec2(x + 0.4 * perlin1d(6.0212 * x) * cos(perlin1d(3.12 * x) * 5.0 * time), y + perlin1d(3.12 * y) * sin(perlin1d(3.12 * y) * 5.0 * time));
                vec2 noise_position = vec2(x,y);
                vec2 center_point = vec2(x + 0.1 * cos(2.0 * PI * time) * rand2d(noise_position), y + 0.1 * sin(2.0 * PI * time) *  rand2d(noise_position) + 0.2 * sin(y + 0.5 * mod_2));
                vec3 new_dots = color * paint_dot(scaled_pos - 0.5, center_point, radius, time, 0.6);
                dots = dots + new_dots;
            }
        }
    } else if (mode == 1) {
        // randomized floating
        const vec2 size = vec2(10.0,10.0);
        vec2 scaled_pos = pos * size;
        for (float i = 0.0; i < size.x * size.y; ++i) {
            // generate a new random position for every circle
            vec2 circle_pos = vec2(size.x * perlin1d(i + mod_2 / 50.0), size.y * perlin1d(i + 12123.1 + mod_2 / 50.0));
            float radius = mod_1 + 0.1 * abs(sin(2.0 * time));//0.1 + 0.5 * perlin2d(5. * vec2(i,j) + time);
            float randomized_scalar = perlin1d(14.2414 * i);
            vec3 color = 1.0 - mix(color_1, color_2, step(0.5, randomized_scalar));
            vec3 new_dots = color * paint_dot(scaled_pos - 0.5, circle_pos, radius, time, 0.6);
            dots = dots + new_dots;
        }
    } else if (mode == 2) {
        // Spiral grid
        const vec2 size = vec2(10.0,10.0);
        vec2 scaled_pos = pos * size;
        const float total_count = size.x * size.y;
        float cos_radius = 10.0 * mod_1 + size.x / 1.8;
        float sin_radius = 10.0 * mod_1 + size.y / 2.34;
        for (float i = 0.0; i < total_count; ++i) {
            float interval = 2.0 * PI / 3.1 * i;
            float decay = exp(-1.9 * i / total_count);
            // add some noise to the radius
            cos_radius = cos_radius + 0.2 * (2.0 * rand2d(vec2(i,i)) - 1.0);
            sin_radius = sin_radius + 0.2 * (2.0 * rand2d(vec2(i,i)) - 1.0);
            
            vec2 circle_pos = vec2(size.x/2.0 + cos_radius * decay * cos(interval + mod_2 / 10.0), size.y/2.0 + decay * sin_radius * sin(interval + mod_2 / 10.0));
            float radius = 0.1 + 0.5 * mod_1 + 0.05 * abs(sin(2.0 * time));//0.1 + 0.5 * perlin2d(5. * vec2(i,j) + time);
            float randomized_scalar = perlin1d(14.2414 * i);
            vec3 color = 1.0 - mix(color_1, color_2, step(0.5, randomized_scalar));
            vec3 new_dots = color * paint_dot(scaled_pos, circle_pos, radius, time, 0.6);
            dots = dots + new_dots;
        }
    }
    return dots;
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

vec3 frame(vec2 st, vec3 current_color, float inset_width, vec3 inset_color, float frame_width, vec2 pixel_width) {
    float frame_scalar = 1.0 - roundedFrame(st, vec2(1.0 - inset_width, 1.0 - inset_width), 0.03, 0.01);
    frame_scalar = frame_scalar;
    if (st.x < frame_width || st.x >= 1.0 - frame_width - pixel_width.x || st.y < frame_width || st.y > 1.0 - frame_width - pixel_width.y)
        return vec3(0.0);
    if (frame_scalar >= 1.0)
        return inset_color;
    else
        return current_color;
}


	

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

    float grain = 0.05 * rand2d(st);
    float specks = ink_specks(st, u_speck_offset);
    vec3 dots = circle_grid(st, u_time / 5.0, u_rms, u_rms_sum, u_grid_mode, u_color_mode);

    // light mode

    vec3 background_color = vec3(0.0);
    
    if (u_color_mode == 0) {
        background_color = vec3(1.0, 0.97,0.97);
    } else if (u_color_mode == 1) {
        background_color = vec3(0.918,0.949,0.973);
    }

    vec3 sum = background_color - vec3((specks + grain)) - dots;
    
    // create a frame
    float inset_width = 0.15;
    float frame_width = 0.005;

    gl_FragColor = vec4(frame(st, sum, inset_width, u_frame_color, frame_width, 1.0 / u_resolution), 1.0);
}
