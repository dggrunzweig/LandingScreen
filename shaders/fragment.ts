const fragment = /* glsl */ `

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mixer_levels[6];
uniform vec2 u_mouse_xy;
uniform float u_grid_width;
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

float circle(vec2 st, vec2 center, float radius, float smoothing) {
  float dist = sqrt(pow(st.x - center.x, 2.0) + pow(st.y - center.y, 2.0));
  return 1.0 - smoothstep(radius*smoothing, radius, dist);
}


float ring(vec2 st, vec2 center, float radius, float width) {
  return circle(st, center, radius, 0.9) - circle(st, center, radius - width, 0.9);
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

vec3 base_color(bool dark) {
  if (dark)
    return vec3(0.004,0.012,0.027);
  else
    return vec3(0.992,0.957,0.906);
}

vec3 color_field(vec2 st, float t, vec2 grid) {
  vec3 color_1 = vec3(0.675,0.231,0.145); // red
  vec3 color_2 = vec3(0.675,0.498,0.145); // marigold
  vec3 color_3 = vec3(0.353,0.29,0.675); // blue
  vec3 base = base_color(true);
  float stripes = (0.95 + 0.05 * stepped_random_2d(st, vec2(1., 0.001)));
  float noise = rand2d(st) * 0.1;
  float texture = clamp(stripes - noise, 0., 1.);
  vec3 st_move = vec3(perlin1d(t) * sin(-t / 20.), perlin1d(0.1 * t) * cos(t / 15.), 0.1 * sin(t / 2.)); // moves st to animate field
  float color_1_map = fbn(2.0 * st + st_move.x, st + st_move.y, st + st_move.z , 0.4, 0.5, 0.6);
  color_1 = mix(base, color_1, color_1_map);
  float color_2_map = fbn(st - 0.1 * st_move.x, 1.2 * st - st_move.y, 1.2 * st - st_move.z, 0.2 , 0.5, 0.7);
  color_2 = mix(base, color_2, color_2_map);
  // add blue color
  float color_3_map = (1.1 - color_1_map) * stepped_random_2d(st, grid) * stripes;
  vec3 color = mix(color_1, color_3, smoothstep(0.7, 1.0, color_3_map + 40. * u_mixer_levels[4]));
  // add marigold
  color = mix(color, color_2, smoothstep(0.6, 1., color_2_map));
  // add highlights based on mouse position
  float mouse_x = u_grid_width * (floor(u_mouse_xy.x / u_grid_width) + 0.5);
  color = mix(color, hexToFloatColor(0xFDE9CD), u_mixer_levels[5] * 5.0 * hannWindow(st.x, mouse_x, 2.0 * u_grid_width) * hannWindow(st.y, u_mouse_xy.y, 1.5));
  vec3 c = mix(base, color, texture);
  return c;
}

float tilt_window(float x, float st_1, float peak, float st_2) {
  return smoothstep(st_1, peak, x) * (1. - smoothstep(peak, st_2, x));
}

float grain(vec2 st, float t, float noise_depth, vec2 width) {
  vec2 grain_d = width; 
  float circles = 0.0;
  vec2 grid_pos = st;
  float scale = 0.7 + 0.3 * sin(2. * stepped_random_2d(grid_pos, grain_d) * t); // subtle flashing
  vec2 xy = mod(grid_pos, grain_d); // grid
  vec2 center = vec2(0.5, 0.5) * grain_d; // center of each square
  // create randomized offset for each square
  center *= (2. - 2.0 * vec2((1. - stepped_random_2d(st, grain_d)), stepped_random_2d(st, grain_d)));
  // move centers with mixer 1 data
  center += grain_d * (0.5 - vec2(perlin1d(t / 11.), perlin1d(-t / 7.))) * u_mixer_levels[1];

  // size scaling with mixer data
  float mouse_x = u_grid_width * floor(u_mouse_xy.x / u_grid_width);
  float sound_size = 1.0 + u_mixer_levels[5] * sin(2.0 * 2. * PI * (u_time + stepped_random(st.x, width.x))) * (0.2 + step(mouse_x, vUv.x) - step(mouse_x + u_grid_width, vUv.x)); 

  for (float i = 0.; i < 3.; ++i) {
    center += 0.1 * (vec2(0.5) - vec2(perlin1d(0.15 * t * stepped_random(st.x, grain_d.x)), perlin1d(-0.23 * t* stepped_random(st.y, grain_d.y))));
    circles = mix(circles, 1.0, scale * circle(xy, center, sound_size * 0.7 * grain_d.y, 0.7 + 0.2 * sin(0.25 * u_time)));
  }

  return circles;
}

void main()
{
  float a_r = u_resolution.y / u_resolution.x;
  float width = u_grid_width / a_r;
  vec2 st = vec2(vUv.x / a_r, vUv.y);
  vec2 square_width = vec2(width, 0.08 + 0.6 * tilt_window(quantize(st.x, width), 0.1, 0.8, 1.7));
  float f_rate = 10.;
  float quant_time = quantize(u_time, 1. / f_rate);
  float grains = grain(st, quant_time, 0.1, square_width);
  vec3 colors = color_field(vUv, quant_time, square_width * vec2(a_r));  
  // gl_FragColor = vec4(colors, 1.0);
  gl_FragColor = vec4(mix(base_color(true), colors, grains), 1.0);

  // gl_FragColor = vec4(vec3(circle(vUv, u_mouse_xy, 0.1)), 1.0);
}
`;

export default fragment;