#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform float u_spatial_frequency;
uniform float u_oscillation_frequency;
uniform float u_duration;
uniform float u_time_1;
uniform float u_time_2;
uniform float u_time_3;
uniform vec2 u_pos_1;
uniform vec2 u_pos_2;
uniform vec2 u_pos_3;

float sinc2d(float spatial_frequency, vec2 position, vec2 center) {
    float r = sqrt(pow((position.x - center.x),2.0) + pow((position.y - center.y),2.0));
    return exp(-r / 0.1) * abs(cos(spatial_frequency * 2.0 * PI * r));
}

float createRipples(float spatial_frequency, vec2 pos, vec2 center, float time, float ripple_rate, float duration) {
    return sin(PI * time/duration) * exp(-time / duration) * abs(cos(2.0 * PI * ripple_rate * time)) * sinc2d(spatial_frequency, pos, center); 
    // return sin(PI * time/duration) * sinc2d(spatial_frequency, pos, center); 
}

float rand2d(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy/u_resolution; 
 
  vec2 r_range = vec2(190.0 / 255.0, 230.0 / 255.0);
  vec2 g_range = vec2(200.0 / 255.0, 230.0 / 255.0);
  vec2 b_range = vec2(230.0 / 255.0, 245.0 / 255.0);
  vec3 color;
  float ripple_value_1 = createRipples(u_spatial_frequency, st, u_pos_1, u_time_1, u_oscillation_frequency, u_duration);
  float ripple_value_2 = createRipples(u_spatial_frequency, st, u_pos_2, u_time_2, u_oscillation_frequency, u_duration);
  float ripple_value_3 = createRipples(u_spatial_frequency, st, u_pos_3, u_time_3, u_oscillation_frequency, u_duration);
  float sum_values = ripple_value_1 + ripple_value_2 + ripple_value_3;

  color = vec3(r_range.x + (r_range.y - r_range.x) * sum_values, g_range.x + (g_range.y - g_range.x) * sum_values, b_range.x + (b_range.y - b_range.x) * sum_values);
  
  vec3 noise;
  float noise_value = 0.05 * rand2d(st);
  noise = vec3(noise_value);


  // gl_FragColor is a built in shader variable, and your .frag file must contain it
  // We are setting the vec3 color into a new vec4, with a transparency of 1 (no opacity)
	gl_FragColor = vec4(color + noise, 1.0);  // vec4(r,g,b,a)

    
}
