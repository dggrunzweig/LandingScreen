#ifdef GL_ES
precision mediump float;
#endif

const float PI = 3.14159;
uniform float u_time;
uniform vec2 u_resolution;

// // uniform float u_brush_noise;
// // uniform float u_brush_pressure_variation;
// // uniform float u_speck_depth;
// // uniform float u_bright_thresh;
// // uniform float u_bright_intensity;
// // uniform float u_speck_offset;
// // uniform float u_speck_zoom;
// // uniform float u_speck_threshold;
// // uniform float u_wave_direction;
// // uniform float u_wave_direction_variance;
// // uniform float u_wave_chop;
// // uniform float u_moon_pos;
// // uniform float u_horizon_light;

// // Color
// vec3 hexToFloatColor(int hex_color) {
//   float r = float(hex_color / 256 / 256);
//   float g = float(hex_color / 256 - int(r * 256.0));
//   float b = float(hex_color - int(r * 256.0 * 256.0) - int(g * 256.0));
//   return vec3(r / 255.0, g / 255.0, b / 255.0);
// }

// // math
// float pow2(float x) { return x * x; }

// // Angles and Rotation
// float rad2deg(float rad) { return rad / PI * 180.0; }
// float deg2rad(float deg) { return deg / 180.0 * PI; }

// mat2 rotate2d(float angle) {
//   return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
// }

// vec2 rotateAroundPoint(vec2 st, vec2 position, float angle) {
//   vec2 st_mod = st - position;
//   st_mod = st_mod * rotate2d(angle);
//   st_mod = st_mod + position;
//   return st_mod;
// }

// // Noise + Random

// float rand2d(vec2 co) {
//   return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
// }

// // outputs a value between 0 and 1
// float perlin1d(float pos) {
//   float seed = 1.0;
//   // get a random value for the floor point and the ceiling point
//   float low = rand2d(vec2(floor(pos), seed));
//   float high = rand2d(vec2(floor(pos + 1.0), seed));
//   // interpolation value
//   float interp = fract(pos);

//   // smoother transitioning using smooth step (hermite function)
//   return mix(low, high, smoothstep(0., 1., interp));
// }

// float perlin2d(vec2 pos) {
//   vec2 i = floor(pos);
//   vec2 f = fract(pos);

//   // Four corners in 2D of a tile
//   float a = rand2d(i);
//   float b = rand2d(i + vec2(1.0, 0.0));
//   float c = rand2d(i + vec2(0.0, 1.0));
//   float d = rand2d(i + vec2(1.0, 1.0));

//   // Cubic Hermine Curve.  Same as SmoothStep()
//   vec2 u = f * f * (3.0 - 2.0 * f);
//   // u = smoothstep(0.,1.,f);

//   // Mix 4 coorners percentages
//   return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
// }

// // Wave forms
// float wave(vec2 pos, float wave_length, float speed, vec2 direction,
//            float amplitude, float time, float sharpness) {
//   float frequency = 2. * PI / wave_length;
//   float phase = speed * frequency;
//   float theta = dot(direction, pos);
//   // scale to be from 0 - amplitude
//   float smooth_wave =
//       amplitude * (0.5 + 0.5 * sin(theta * frequency + time * phase));
//   float sharp_wave =
//       amplitude * (1. - abs(cos(theta * frequency + time * phase)));
//   return mix(smooth_wave, sharp_wave, sharpness);
// }

// // calculate normals
// vec2 waveNormals(vec2 pos, float wave_length, float speed, vec2 direction,
//                  float amplitude, float time, float sharpness) {
//   float frequency = 2. * PI / wave_length;
//   float phase = speed * frequency;
//   float theta = dot(direction, pos);
//   // scale to be from 0 - amplitude
//   float A_x = amplitude * direction.x * frequency;
//   float A_y = amplitude * direction.y * frequency;
//   float smooth_wave = (0.5 + 0.5 * sin(theta * frequency + time * phase));
//   float sharp_wave = (1. - abs(cos(theta * frequency + time * phase)));
//   float wave_mix = mix(smooth_wave, sharp_wave, sharpness);
//   return vec2(A_x * wave_mix, A_y * wave_mix);
// }

// // returns height then vec3 normal
// vec4 waveField(vec3 pos, float time) {
//   float height = 0.0;
//   vec2 normal = vec2(0.0);

//   // low freq waves
//   float rad_wave_angle = deg2rad(22.);
//   vec2 direction = 0.2 * vec2(cos(rad_wave_angle), sin(rad_wave_angle));
//   // vec2 direction = vec2(0.1, 0.17);

//   // fundamental frequency
//   float wavelen_fundamental = 0.6;

//   float amplitude = 0.1;
//   float wavelength = wavelen_fundamental;
//   float speed = 0.06;
//   height += wave(pos.xz, wavelength, speed, direction, amplitude, time, 0.0);
//   normal +=
//       waveNormals(pos.xz, wavelength, speed, direction, amplitude, time,
//       0.0);
//   amplitude = 0.1;
//   wavelength = 0.9 * wavelen_fundamental;
//   height += wave(pos.xz, wavelength, speed, direction, amplitude, time, 0.0);
//   normal +=
//       waveNormals(pos.xz, wavelength, speed, direction, amplitude, time,
//       0.0);

//   // high freq waves
//   for (float i = 0.; i < 8.; ++i) {
//     float amplitude = 0.03 * perlin1d(1.9 * i);
//     float wavelength =
//         (1. + perlin1d(1.8 * i)) * wavelen_fundamental / (i + 2.);
//     float speed = 0.06;
//     float angle = (i * 0.05) / 360.;
//     direction = vec2(cos(angle), sin(angle));
//     // vec2 direction_offset = vec2(perlin1d(0.19 * i), perlin1d(0.29 * i));
//     height += wave(pos.xz, wavelength, speed, direction, amplitude, time,
//     0.1); normal +=
//         waveNormals(pos.xz, wavelength, speed, direction, amplitude, time,
//         0.1);
//   }
//   vec3 n = vec3(-normal, 1.0);
//   n = normalize(n);
//   return vec4(height, n);
// }

// float phong_model_light(vec3 normal, vec3 vec_to_light, vec3 vec_to_camera,
//                         float diffuse_strength, float spec_strength,
//                         float ambient_strength) {
//   vec_to_light = normalize(vec_to_light);
//   normal = normalize(normal);
//   vec_to_camera = normalize(vec_to_camera);
//   float diffuse = diffuse_strength * max(0., dot(normal, vec_to_light));
//   vec3 spec_vec = reflect(vec_to_light, normal);
//   float specular = spec_strength * pow(dot(spec_vec, vec_to_camera), 12.);
//   return diffuse + specular + ambient_strength;
// }

// // returns color based on ray marching collison results
// float ray_march(in vec3 ro, in vec3 rd, in float time) {
//   float total_distance_traveled = 0.0;
//   const int NUMBER_OF_STEPS = 16;
//   const float MINIMUM_HIT_DISTANCE = 0.001;

//   vec3 waterPlaneHigh = vec3(0.0, 2.0, 0.0);
//   vec3 waterPlaneLow = vec3(0.0, -1.0, 0.0);

//   float max_distance = 100.;

//   for (int i = 0; i < NUMBER_OF_STEPS; ++i) {
//     vec3 current_position = ro + total_distance_traveled * rd;

//     vec4 wave_field_data = waveField(current_position, time);
//     float height = wave_field_data[0];
//     vec3 wave_point = vec3(current_position.x, height, current_position.z);
//     float dist = distance(current_position, wave_point);

//     if (dist < MINIMUM_HIT_DISTANCE) {
//       vec3 normal =
//           vec3(wave_field_data[1], wave_field_data[2], wave_field_data[3]);
//       // taper normal vector off towards horizon
//       normal = mix(normal, vec3(0.0, 1.0, 0.0), smoothstep(0., 0.02, dist));

//       vec3 dir_to_camera = normalize(ro - wave_point);
//       vec3 moon_position = vec3(10.0, (0.0 - 0.5) * 80.0, -50.0);
//       // surface to light source
//       vec3 dir_to_moon = normalize(wave_point - moon_position);

//       float diffuse_intensity_moon =
//           phong_model_light(normal, dir_to_moon, dir_to_camera, 0.4, 4.0,
//           0.1);

//       vec3 camera_flash_pos = vec3(0.0, 2.5, 0.5);
//       // surface to light source
//       vec3 dir_to_flash = normalize(wave_point - camera_flash_pos);
//       float flash_distance = distance(camera_flash_pos, wave_point);
//       float flash_attenuation = 2. / flash_distance;
//       float diffuse_intensity_flash =
//           flash_attenuation *
//           phong_model_light(normal, dir_to_flash, dir_to_camera, 0.5, 4.0,
//           0.1);
//       return 0.6 * diffuse_intensity_moon + 0.6 * diffuse_intensity_flash;
//     }

//     if (total_distance_traveled > max_distance) {
//       break;
//     }
//     total_distance_traveled += dist;
//   }
//   return 0.0;
// }

void main() {
  // position of the pixel divided by resolution, to get normalized positions
  // the canvas st.x now hold x-pos, st.y now holds y-pos.
  //   vec2 st = gl_FragCoord.xy / u_resolution.xy;

  //   vec2 pos_rm = st * 2. - 1.;

  //   vec3 camera_position = vec3(.0, 1.1, -6.0);
  //   vec3 ro = camera_position;
  //   vec3 rd = vec3(pos_rm, 1.0);

  //   float exposure = ray_march(ro, rd, u_time);

  gl_FragColor = vec4(1. * sin(u_time), 1.0, 1.0, 1.0);
}