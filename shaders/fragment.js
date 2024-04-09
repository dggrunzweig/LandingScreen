const fragment = /* glsl */ `

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mixer_levels[5];
uniform float u_total_levels[5];
uniform float u_bark_bands[3];

// Constants
#define PI 3.141592654
 
float map(float value, float min1, float max1, float min2, float max2) {
  return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
}

float rand(float x){
	return fract(sin(dot(x, 12.9898)) * 43758.5453);
}

float rand2d(vec2 p){
  return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float perlin1d(float x) {
  float i = floor(x);
  float f = x - i;
  return mix(rand(i), rand(i + 1.0), smoothstep(0.,1.,f));
}


/* 2D noise */
float perlin2d(vec2 p) {
  // create 4 integer points around
  vec2 p0 = floor(p);
  vec2 p1 = p0 + vec2(1.0, 0.0);
  vec2 p2 = p0 + vec2(0.0, 1.0);
  vec2 p3 = p0 + vec2(1.0, 1.0);
  
  // generate noise at each point
  float r0 = rand2d(p0);
  float r1 = rand2d(p1);
  float r2 = rand2d(p2);
  float r3 = rand2d(p3);
    
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = smoothstep(0., 1., f);

  return mix(r0, r1, u.x) +
            (r2 - r0) * u.y * (1.0 - u.x) +
            (r3 - r1) * u.x * u.y;

}


vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

float circle(vec2 st, vec2 center, float radius) {
  float dist = sqrt(pow(st.x - center.x, 2.0) + pow(st.y - center.y, 2.0));
  return 1.0 - smoothstep(radius*0.6, radius, dist);
}


float ring(vec2 st, vec2 center, float radius, float width) {
  return circle(st, center, radius) - circle(st, center, radius - width);
}

float radial_dist(vec2 st, vec2 center) {
  return sqrt(pow(st.x - center.x, 2.0) + pow(st.y - center.y, 2.0));
}

float radial_angle(vec2 st, vec2 center) {
  float x = (st.x - center.x);
  float y = (st.y - center.y);
  // if (abs(x) < 0.00001) {
  //   if (y < 0.) {
  //     return 1.5 * PI;
  //   }
  //   else {
  //     return 0.5 * PI;
  //   }
  // } else 
    return sign(x) * atan(abs(y) / abs(x));
}

float rect(vec2 st, vec2 lr_corner, vec2 dim) {
  vec2 step_vec = (1.0 - step(dim + lr_corner, st)) * step(lr_corner, st);
  return step_vec.x * step_vec.y;
}

float quantize(float x, float step_size) {
  return floor(x / step_size) * step_size;
}

vec2 quantize_2d(vec2 st, vec2 step_size) {
  return floor(st / step_size) * step_size;
}

float stepped_random(float x, float step_width) {
  return rand(quantize(x, step_width));
}

float stepped_random_2d(vec2 st, vec2 step_width) {
  return rand2d(quantize_2d(st, step_width));
}

float hannWindow(float x, float center, float width) {
  x = x - center + width / 2.;
  if (x > width || x < 0.) return 0.;
  return .5 * (1. - cos(2. * PI * x / width));
}

vec3 hexToFloatColor(int hex_color) {
  float r = float(hex_color / 256 / 256);
  float g = float(hex_color / 256 - int(r * 256.0));
  float b = float(hex_color - int(r * 256.0 * 256.0) - int(g * 256.0));
  return vec3(r / 255.0, g / 255.0, b / 255.0);
}

float fbn(vec2 st_1, vec2 st_2, vec2 st_3, float gain_1, float gain_2, float gain_3) {
  return gain_1 * perlin2d(st_1) + gain_2 * perlin2d(2. * st_2) + gain_3 * perlin2d(3. * st_3);
}

float squares(vec2 st, float t, float noise_depth) {
  float line_width = 0.01;
  vec2 squares = step(vec2(line_width/1.2), mod(st,vec2(line_width)));
  return squares.x * squares.y;
}

vec3 base_color() {
  return vec3(0.004,0.012,0.027);
}

vec3 color_field(vec2 st, float t, float level) {
  vec3 color = vec3(0.675,0.231,0.145); // red
  vec3 base = base_color();
  float stripes = (0.95 + 0.05 * stepped_random_2d(st, vec2(1., 0.001)));
  float noise = rand2d(st) * 0.2;
  float accent_map = fbn(2. * st, 4. * st, 8. * st, 0.4 + 0.2 * abs(sin(t)), 0.5, 0.6);
  accent_map *= (0.4 + 0.6 * hannWindow(st.x + perlin1d(0.1 * t) * perlin1d(10. * st.y), 1.0 + perlin1d(0.1 * t), 0.5));
  accent_map *= stripes;
  accent_map += noise;
  color = mix(color, hexToFloatColor(0xFDE9CD), 2. * level * squares(st, t, 0.));
  vec3 c = mix(base, color, accent_map);
  return c;
}

vec3 grain(vec2 st, float t, float noise_depth) {
  float grain_d = 0.1;
  vec3 circles = base_color();
  vec2 grid_pos = st + vec2(0.4 * sin(0.5 + 0.5 * stepped_random(st.y, grain_d)) + 0.2 * u_mixer_levels[4] * sin(20. * st.y + 6.0 * t), 0.);
  float scale = 0.8 + 0.1 * sin(5. * stepped_random_2d(grid_pos, vec2(grain_d)) * t); // subtle flashing
  vec2 xy = mod(grid_pos, vec2(grain_d)); // grid
    vec2 center = vec2(grain_d * stepped_random_2d(2.0 * grid_pos, vec2(grain_d)));
  for (float i = 0.; i < 3.; ++i) {
    center += 0.2 * grain_d * vec2(10. * u_mixer_levels[int(i) + 1] * sin(i * t), 10. * u_mixer_levels[int(i) + 1] * cos(i * t));
    circles = mix(circles, color_field(grid_pos, t, u_mixer_levels[3]), 0.5 * scale * circle(xy, center, 0.4 * grain_d));
  }
  return circles;
}

void main()
{
    float a_r = u_resolution.y / u_resolution.x;
    vec2 st = vec2(vUv.x / a_r, vUv.y);
    float f_rate = 10.;
    float quant_time = quantize(u_time, 1. / f_rate);
    vec3 grains = grain(st, quant_time, 0.1);
    
    // gl_FragColor = vec4(color_field(vUv), 1.0);
    gl_FragColor = vec4(grains, 1.0);
}
`;

export default fragment;