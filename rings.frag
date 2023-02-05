#ifdef GL_ES
precision mediump float;
#endif

// Helper
#define PI 3.1415926538

// These are our passed in information from the sketch.js
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_frame_color;
uniform float u_speck_offset;
uniform float u_rotation;

float rad2deg(float rad) { return rad / PI * 180.0; }

float deg2rad(float deg) { return deg / 180.0 * PI; }

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

vec2 rotateAroundPoint(vec2 st, vec2 position, float angle) {
  vec2 st_mod = st - position;
  st_mod = st_mod * rotate2d(angle);
  st_mod = st_mod + position;
  return st_mod;
}

float rand2d(vec2 co) {
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

float perlin2d(vec2 pos) {
  vec2 i = floor(pos);
  vec2 f = fract(pos);

  // Four corners in 2D of a tile
  float a = rand2d(i);
  float b = rand2d(i + vec2(1.0, 0.0));
  float c = rand2d(i + vec2(0.0, 1.0));
  float d = rand2d(i + vec2(1.0, 1.0));

  // Smooth Interpolation

  // Cubic Hermine Curve.  Same as SmoothStep()
  vec2 u = f * f * (3.0 - 2.0 * f);
  // u = smoothstep(0.,1.,f);

  // Mix 4 coorners percentages
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float ink_specks(vec2 pos, float offset, float threshold) {
  float specks = smoothstep(threshold, 1.0,
                            perlin2d(vec2(153.323, 312.89) * pos + offset));
  return specks;
}

float tree_splits(float dist, float angle) {
  // slice position
  float slice_position = 90.0;
  // width of slice in degrees
  float slice_width_deg = 7.0;
  // softness of slice edge
  float slice_softness = 1.0;
  return perlin2d(vec2(100.0 * dist, angle)) *
         (smoothstep(slice_position, slice_position + slice_softness, angle) -
          smoothstep(slice_position + slice_width_deg,
                     slice_position + slice_width_deg + slice_softness, angle));
}

float tree_ring(in vec2 st, in vec2 center, in float radius, in float thickness,
                in float seed, in float variance_factor) {
  vec2 dist = (st - center);
  // angle between center point and input point
  float angle = rad2deg(atan(dist.y, dist.x)) + 180.0;
  // distance from point to center point
  dist = abs(dist);
  float dist_mag = sqrt(dot(dist, dist));
  // large modulations in the radius
  float large_variance =
      radius / variance_factor * perlin1d(seed + 10.0 * st.x);
  // small modulations in the variance
  float small_variance = thickness * perlin2d(40.0 * st + seed);
  // update distance with the variance
  dist_mag = dist_mag + large_variance + small_variance;
  // noise based on angle from the center point, and some splotches for texture
  float pen_variance = 1.0 - 0.3 * perlin1d(10.0 * angle + 20.0 * dist_mag) -
                       ink_specks(st, seed, 0.8);

  float pixel_depth =
      pen_variance * (smoothstep(radius, radius + thickness / 2.0, dist_mag) -
                      smoothstep(radius + 1.5 * thickness,
                                 radius + 2.0 * thickness, dist_mag));
  // create the random dips

  pixel_depth = mix(pixel_depth, 1.0, tree_splits(dist_mag, angle));

  return pixel_depth;
}

float roundedFrame(vec2 pos, vec2 size, float radius, float thickness) {
  size = size / 2.0;
  vec2 uv = vec2(0.5, 0.5);
  float d = length(max(abs(uv - pos), size) - size) - radius;
  return smoothstep(0.55, 0.45, (d / thickness) * 5.0);
}

vec3 frame(vec2 st, vec3 current_color, float inset_width, vec3 inset_color,
           float frame_width, vec2 pixel_width) {
  float frame_scalar =
      1.0 -
      roundedFrame(st, vec2(1.0 - inset_width, 1.0 - inset_width), 0.03, 0.01);
  frame_scalar = frame_scalar;
  if (frame_scalar >= 1.0)
    return inset_color;
  else
    return current_color;
}

void main() {
  // position of the pixel divided by resolution, to get normalized positions on
  // the canvas st.x now hold x-pos, st.y now holds y-pos.
  vec2 st = gl_FragCoord.xy / u_resolution.xy;

  float grain = 0.05 * rand2d(st);
  float specks = ink_specks(st, u_speck_offset, 0.97);
  vec3 background_color_rgb = vec3(0.988, 0.984, 0.961);
  const float max_radius = 0.35;
  float seed = 6.5;  // u_time / 10.0 + 6.5;  // 6.5;
  const float variance = 7.0;
  const float thickness = 0.005;
  vec2 center_point = vec2(0.5, 0.5);
  vec2 draw_pt = rotateAroundPoint(st, center_point, deg2rad(143.));
  float rings =
      tree_ring(draw_pt, center_point, max_radius, thickness, seed, variance);
  const int num_rings = 31;
  float step_size = max_radius / float(num_rings);
  float radius = step_size;
  for (int i = 0; i < num_rings; ++i) {
    rings += tree_ring(draw_pt, center_point, radius,
                       thickness * (0.5 + perlin1d(50.0 * float(i))), seed,
                       variance);
    radius += step_size * (0.25 * perlin1d(1.0 * float(i)) + 1.0);
  }

  vec3 sum = mix(background_color_rgb, vec3(0.0), specks + grain);
  sum = mix(sum, vec3(0.05), rings);

  // create a frame
  float inset_width = 0.15;
  float frame_width = 0.005;

  gl_FragColor = vec4(frame(st, sum, inset_width, u_frame_color, frame_width,
                            1.0 / u_resolution),
                      1.0);
}
