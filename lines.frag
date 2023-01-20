#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_background_color;

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
    // get a random value for the floor point and the ceiling point
    float low = rand2d(vec2(floor(pos.x), floor(pos.y)));
    float high = rand2d(vec2(floor(pos.x + 1.0), floor(pos.y + 1.0)));
    // interpolation value is based on the distance from the floor point to the provided point
    float interp = sqrt(pow(pos.x - floor(pos.x),2.0) + pow(pos.y - floor(pos.y),2.0));

    return mix(low, high, smoothstep(0., 1., interp));
}

vec4 paint_stroke(vec2 pos, vec2 start_point, vec2 dimensions, vec3 background_color) {
    float texture_noise = 1.0 - 0.5 * rand2d(pos);
    float stroke_fiber_pattern = perlin1d(500.0 * pos.x + 3.0 * perlin1d(10.0 * pos.y + 10.0 * start_point.x) + 10.0 * start_point.x);
    float width_variation = 0.005 * perlin1d(10.0 * pos.y + stroke_fiber_pattern);

    float scaled_y_pos = (pos.y - start_point.y) / dimensions.y;
    float scaled_x_pos = (pos.x - (start_point.x - width_variation)) / (dimensions.x + 2.0 * width_variation);

    if (pos.x < start_point.x + dimensions.x + width_variation && pos.x > start_point.x - width_variation) {
        // start noise creates the little variations in the starting point of the lines
        float y_start_noise = 0.01 * (sin(PI * scaled_x_pos)) - 0.01 * perlin1d(1000.0 * pos.x);
        if (pos.y < start_point.y + (dimensions.y - y_start_noise) && pos.y > start_point.y) {
            // pressure variation along y axis, noise and fading as it moves down
            float pressure_variation_y = scaled_y_pos * (1.0 - 0.1 * perlin1d(4.0 * (pos.y)));
            // pressure variation along x axis, 
            float pressure_variation_x = abs(sin(PI * scaled_x_pos + width_variation));
            float pixel_depth = texture_noise * pressure_variation_x * pressure_variation_y * (1.0 - 0.3 * stroke_fiber_pattern);
            return vec4(pixel_depth, pixel_depth, 0.0, 1.0);
        }
    }
    return vec4(0.0, 0.0, 0.0, 1.0);
}
	

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy / u_resolution.xy; 

//   vec2 pos = st.yx*vec2(8.,9.0);

//   st = rotate2d(1.0) * st;
  float time_scalar = u_time / 3.0;

  const float num_strokes = 5.0;
  vec2 start_point = vec2(0.0, -0.05 * perlin1d(0.0) / 2.0);//0.5 * abs(perlin1d(i + 0.1 * time_scalar)) - 0.9/2.0);
  vec4 strokes = paint_stroke(st, start_point, vec2(0.2, 0.9), u_background_color);
  for (float i = 0.0; i < num_strokes - 1.0; ++i) {
    vec2 start_point = vec2((i + 1.0) / num_strokes, -0.05 * perlin1d(i) / 2.0);//0.5 * abs(perlin1d(i + 0.1 * time_scalar)) - 0.9/2.0);
    strokes = strokes + paint_stroke(st, start_point, vec2(0.2 + 0.1 * abs(perlin1d(3.0 * i)), 0.8 + 0.1 * abs(perlin1d(i))), u_background_color);
  }
  gl_FragColor = vec4(1.0 - strokes.r, 1.0 - strokes.g, 1.0 - strokes.b, 1.0);
}
