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
uniform float u_warp_depth;
uniform float u_warp_rate;
uniform float u_small_variance_rate;
uniform float u_scratch_thresh;
uniform float u_scratch_len;
uniform float u_ring_thickness;
uniform float u_num_rings;
uniform vec4 u_paint_gradient_settings;

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

float ink_specks(vec2 pos, float offset, float zoom, float threshold) {
  float specks = smoothstep(
      threshold, 1.0, perlin2d(zoom * vec2(153.323, 312.89) * pos + offset));
  return specks;
}

float tree_splits(vec2 st, vec2 center, float radius, float slice_position,
                  float depth) {
  vec2 dist = (st - center);
  // angle between center point and input point
  float angle = rad2deg(atan(dist.y, dist.x)) + 180.0;
  // distance from point to center point
  dist = abs(dist);
  float dist_mag = sqrt(dot(dist, dist));

  // slice position with variance as you move across radial distance
  slice_position = slice_position + perlin1d(100.0 * dist_mag);
  // width of slice in degree
  float slice_width_deg = (3.0 + perlin1d(100.0 * dist_mag));
  // softness of slice edge
  float slice_softness = 0.1;
  float radial_length = radius / 1.0;
  float start_pos = radius * (1.0 - depth);
  float end_pos = radius;
  // this taper ensures that the lines get thinner as they approach the center
  float taper = (dist_mag - start_pos) / (radius - start_pos);
  slice_width_deg = taper * slice_width_deg;
  float radial_taper = step(start_pos, dist_mag) - step(end_pos, dist_mag);
  float angular_taper =
      smoothstep(slice_position, slice_position + slice_softness, angle) -
      smoothstep(slice_position + slice_width_deg,
                 slice_position + slice_width_deg + slice_softness, angle);
  return radial_taper * angular_taper;
}

float tree_ring(in vec2 st, in vec2 center, in float radius, in float thickness,
                in float seed, in float warp_depth, in float warp_rate,
                in float small_variance_rate, in float scratch_thresh,
                float scratch_len, vec4 paint_gradient_settings) {
  vec2 dist = (st - center);
  // angle between center point and input point
  float angle = rad2deg(atan(dist.y, dist.x)) + 180.0;
  // distance from point to center point
  dist = abs(dist);
  float dist_mag = sqrt(dot(dist, dist));
  // large modulations in the radius
  float large_variance =
      warp_depth * radius *
      perlin1d(seed + warp_rate * sin(deg2rad(angle + 50.0 * radius)));
  // small modulations in the variance
  float small_variance = thickness * perlin2d(small_variance_rate * st + seed);
  // update distance with the variance
  dist_mag = dist_mag + large_variance + small_variance;
  // noise based on angle from the center point, and some splotches for texture
  float scratches =
      1.0 - 0.9 * step(scratch_thresh,
                       perlin2d(vec2(
                           angle,
                           scratch_len * dist_mag)));  // + 20.0 * dist_mag);
  float splotches =
      ink_specks(st, seed, 1.0, 0.9) * (1.0 - step(radius, dist_mag));
  float paint_gradients =
      paint_gradient_settings[0] * rand2d(st) *
      ink_specks(st, paint_gradient_settings[1], paint_gradient_settings[2],
                 paint_gradient_settings[3]) *
      (1.0 - step(radius, dist_mag));
  float pixel_depth =
      scratches *
      (smoothstep(radius - 0.002, radius, dist_mag) -
       smoothstep(radius + thickness, radius + thickness + 0.002, dist_mag));

  return clamp(0.0, 1.0, pixel_depth - splotches + paint_gradients);
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
  float specks = ink_specks(st, u_speck_offset, 1.0, 0.97);
  vec3 background_color_rgb = vec3(0.988, 0.984, 0.961);
  const float max_radius = 0.35;
  const float num_rings = 30.0;
  float step_size = max_radius / num_rings;
  float seed = 6.5;  // 0.75 * sin(u_time / 10.0) + 6.5;  // 6.5;
  float variance = 0.2;
  float thickness = u_ring_thickness * step_size;
  vec2 center_point = vec2(0.5, 0.5);
  vec2 draw_pt = rotateAroundPoint(st, center_point, deg2rad(143.));
  float rings = 0.0;  // tree_ring(draw_pt, center_point, max_radius +
                      // step_size, 2.0 * thickness, seed, variance);
  float radius = step_size;

  // draw rings
  for (float i = 0.0; i < num_rings; ++i) {
    // vary the thickness of the rings
    float density_factor = (0.5 + 0.75 * perlin1d(50.0 * i));
    float thickness_r = thickness * density_factor;
    // make the last ring thicker
    if (i == num_rings - 1.0) {
      thickness_r = thickness * 3.0;
      float texture = 1.0 - 0.2 * rand2d(st);
      rings += texture * tree_ring(draw_pt, center_point, radius, thickness_r,
                                   seed, u_warp_depth, u_warp_rate,
                                   u_small_variance_rate, u_scratch_thresh,
                                   u_scratch_len, u_paint_gradient_settings);

    } else {
      rings +=
          tree_ring(draw_pt, center_point, radius, thickness_r, seed,
                    u_warp_depth, u_warp_rate, u_small_variance_rate,
                    u_scratch_thresh, u_scratch_len, u_paint_gradient_settings);
    }

    radius += step_size * (0.15 + density_factor);
  }

  // draw splits
  // create the random dips
  const int num_splits = 11;
  const float split_step_size = 360.0 / float(num_splits);
  float split_pos = 0.0;  // angle
  for (int i = 0; i < num_splits; ++i) {
    rings = mix(rings, 0.0,
                tree_splits(draw_pt, center_point, radius, split_pos,
                            0.7 * perlin1d(float(i))));
    split_pos += split_step_size * (1.0 + perlin1d(float(i)));
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
