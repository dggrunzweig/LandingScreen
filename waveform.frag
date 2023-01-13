#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform vec2 u_rate;
uniform vec2 u_phase;


vec3 generateWaveformGrid(vec2 pos, vec2 rate, vec2 phase) {

    // light mode
    // vec2 r_range = vec2(208.0 / 255.0, 238.0 / 255.0);
    // vec2 g_range = vec2(212.0 / 255.0, 238.0 / 255.0);
    // vec2 b_range = vec2(230.0 / 255.0, 245.0 / 255.0);

    // r_range *= 0.8;
    // g_range *= 0.8;
    // b_range *= 0.8;

    // dark mode
    vec2 r_range = vec2(20.0 / 255.0, 25.0 / 255.0);
    vec2 g_range = vec2(20.0 / 255.0, 25.0 / 255.0);
    vec2 b_range = vec2(20.0 / 255.0, 70.0 / 255.0);

    float r_scale = r_range.y - r_range.x;
    float g_scale = g_range.y - g_range.x;
    float b_scale = b_range.y - b_range.x;

    // weights and frequencies for x and y spectrum
    vec2 x_harm = vec2(0.6, 1.0);
    vec2 x_weight = vec2(0.5, 0.5);
    vec2 y_harm = vec2(1.0, 1.7);
    vec2 y_weight = vec2(0.5, 0.5);

    float x_input = 2.0 * PI * pos.x;
    float y_input = 2.0 * PI * pos.y;
    float wave_output = 0.0;
    for (int i = 0; i < 2; ++i) {
        wave_output += x_weight[i] * cos(x_harm[i] * rate.x * x_input + phase.x + 0.5*x_input);
    }
    for (int j = 0; j < 2; ++j) {
        wave_output += y_weight[j] * cos(y_harm[j] * rate.y * y_input + phase.y + 0.5*x_input);
    }

    float r_pixel = r_range[0] + r_scale * wave_output;
    float g_pixel = g_range[0] + g_scale * wave_output;
    float b_pixel = b_range[0] + b_scale * wave_output;

    return vec3(r_pixel, g_pixel, b_pixel);
}

float rand2d(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy/u_resolution; 
 
  vec3 color = generateWaveformGrid(st, u_rate, u_phase);
  vec3 noise;
  float noise_value = 0.05 * rand2d(st);
  noise = vec3(noise_value);

// set the pixels value
	gl_FragColor = vec4(color + noise, 1.0);  // vec4(r,g,b,a)

}
