#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform vec2 u_rate;
uniform vec2 u_phase;

float rand2d(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float rng( in vec2 pos )
{
    return fract(sin( pos.y + pos.x*78.233 )*43758.5453)*2.0 - 1.0;
}

float perlin( in float pos )
{
    float a = rng( vec2(floor(pos), 1.0) );
    float b = rng( vec2(ceil( pos), 1.0) );
    
    float a_x = rng( vec2(floor(pos), 2.0) );
    float b_x = rng( vec2(ceil( pos), 2.0) );
    
    a += a_x*fract(pos);
    b += b_x*(fract(pos)-1.0);

    // Interpolate values    
    return a + (b-a)*smoothstep(0.0,1.0,fract(pos));
}

vec4 paint_stroke(vec2 pos, vec2 start_point, vec2 dimensions, float noise_val) {
    float texture_noise = 1.0 - 0.4 * rand2d(pos);
    float width_variation = 0.01 * noise_val;//0.03 * perlin(2.0 * pos.y);
    dimensions.x = dimensions.x + 2.0 * width_variation;
    if (pos.x < start_point.x + dimensions.x && pos.x > start_point.x) {
        if (pos.y < start_point.y + dimensions.y && pos.y > start_point.y) {
            float scaled_y_pos = (pos.y - start_point.y) / dimensions.y;
            float scaled_x_pos = (pos.x - start_point.x) / dimensions.x;
            float pressure_variation_y = scaled_y_pos * (1.0 - 0.1 * perlin(4.0 * (pos.y)));
            float pressure_variation_x = sin(PI * scaled_x_pos + width_variation);
            return vec4(0.0, 0.0, texture_noise * pressure_variation_x * pressure_variation_y * (0.8 + 0.2 * noise_val), 1.0);
        }
    } else {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
}
	

void main() {
  // position of the pixel divided by resolution, to get normalized positions on the canvas
  // st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy/u_resolution; 
  float y_val = st.y;
  float noise_val = perlin(0.3 * gl_FragCoord.x + 5.0 * perlin(0.01 * gl_FragCoord.y));
  float time = abs(sin(u_rate.x));
  vec4 stroke_1 = paint_stroke(st, vec2(0.5, 0.2), vec2(0.05, time * 0.7), noise_val);
//   vec4 stroke_2 = paint_stroke(st, vec2(0.7, 0.6), vec2(0.1, 0.7), noise_val);
//   vec4 stroke_3 = paint_stroke(st, vec2(0.5, 0.4), vec2(0.1, 0.7), noise_val);

  // set the pixels value
  gl_FragColor = stroke_1;// + stroke_2 + stroke_3;

}
