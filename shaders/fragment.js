const fragment = /* glsl */ `

varying vec2 vUv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mixer_levels[5];

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
  return 1.0 - smoothstep(radius - 0.01, radius, dist);
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

vec3 hexToFloatColor(int hex_color) {
  float r = float(hex_color / 256 / 256);
  float g = float(hex_color / 256 - int(r * 256.0));
  float b = float(hex_color - int(r * 256.0 * 256.0) - int(g * 256.0));
  return vec3(r / 255.0, g / 255.0, b / 255.0);
}

float fbn(vec2 st, float gain_1, float gain_2, float gain_3) {
  return gain_1 * perlin2d(st) + gain_2 * perlin2d(2. * st) + gain_3 * perlin2d(3. * st);
}

float squares(vec2 st, float t, float noise_depth) {
  vec2 variance = vec2(0.5 - rand(t));
  float noise = noise_depth * rand2d(st + variance);
  float cuts = smoothstep(0.94, 0.941, quantize(perlin2d(10.0 * st  + 100. * variance), 0.05));
  float line_width = 0.01;
  vec2 pos = st;// + vec2(0., 0.5 * stepped_random(st.x + t, line_width));
  vec2 squares = step(vec2(line_width/2.), mod(pos,vec2(line_width)));
  return squares.x * squares.y;//clamp((1. - cuts * square)  - noise, 0., 1.);
}

float grain(vec2 st, float t, float noise_depth) {
  float grain_d = 0.05;//0.01 + 0.01 * abs(sin(t));
  float noise = noise_depth * rand2d(st);
  float grains = 0.;
  for (float i = 0.; i < 2.; ++i) {
    vec2 xy = mod(st, vec2(grain_d));
    vec2 center = vec2(grain_d * stepped_random_2d(st, vec2(grain_d)));
    center += 0.1 * grain_d * vec2(sin((i + 1.) * t), sin((i + 1.) * 2. * t));
    grains += circle(xy, center, 0.4 * grain_d);
  }
  return clamp(grains - noise, 0., 1.);
}

void main()
{
    float f_rate = 10.;
    float quant_time = quantize(u_time, 1. / f_rate);
    float exposure = 0.9 + 0.1 * rand(quant_time);
    float grains = grain(vUv, quant_time, 0.1);
    vec3 circles = vec3(0.);
    for (int i = 2; i < 5; ++i) {
      float level = u_mixer_levels[i];
      float float_i = float(i);
      circles[i - 2] += ring(vUv, vec2(perlin1d(0.01 * float_i * quant_time), perlin1d(0.01 * 2. * float_i* quant_time)), 2.0 * level, 0.01);
    }
    circles = clamp(circles, 0., 1.);
    // gl_FragColor = vec4(vec3(grains * circles), 1.0);
    gl_FragColor = vec4(vec3(grains), 1.0);
}
`;

export default fragment;