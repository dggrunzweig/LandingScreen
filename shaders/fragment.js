const fragment = /* glsl */ `

varying vec2 vUv;
uniform float u_time;
uniform float u_gradient_size;

// Constants
#define MAX_STEPS 40 // Mar Raymarching steps
#define MAX_DIST 20. // Max Raymarching distance
#define TEXTURE_HEIGHT 1.
#define TEXTURE_ELEV -2.
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

// float SoftSquareWave(float x, float frequency, float width, float smoothing) {
//   return smoothstep(1.0 - width, 1.0 - width + smoothing, 0.5 * (cos(2. * PI * frequency * x - PI / 4.) + 1.));
// }

// float SurfTexture(vec3 p) {
//   float t = u_time;
//   float noise_0 = SoftSquareWave(p.x, 2., 0.25, 0.02);// * SoftSquareWave(p.z, 2., 0.5, 0.05);
//   float noise_1 = perlin2d(0.31 * p.xz + t);
//   float noise_2 = perlin2d(0.6 * p.xz + t);
//   float noise_3 = perlin2d(2.0 * p.xz + t);
//   float noise_4 = perlin2d(80.0 * p.xz + t);
//   float weights[5] = float[5](0.05, 0.1, 2., 0.3, 0.01);
//   float noise[5] =  float[5](noise_0, noise_1, noise_2, noise_3, noise_4);
//   float noise_sum = 0.;
//   float weight_sum = 0.;
//   for (int i = 0; i < 1; ++i) {
//     noise_sum += weights[i] * noise[i];
//     weight_sum += weights[i];
//   }
//   float height = 1. / weight_sum * noise_sum;
//   return TEXTURE_ELEV + TEXTURE_HEIGHT * height;
// }

// vec3 PlaneNormals(float plane_height) {
//   vec3 A = vec3(0., plane_height, 0.);
//   vec3 B = vec3(1., plane_height, 1.);
//   vec3 C = vec3(2., plane_height, 3.);
//   return cross(A - B, C - B);
// }

// bool DoesLineIntersectPlane(float plane_height, vec3 lo, vec3 ld) {
//   // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
//   // get normal of plane
//   vec3 n_p = PlaneNormals(plane_height);
//   // create point on plane
//   vec3 p0 = vec3(0., plane_height, 0.);
//   // determine distance to plane
//   float numer = dot((p0 - lo), n_p);
//   float denom = dot(ld, n_p);
//   // if denom is 0, then they do not intersect (in parallel)
//   // if numerator is 0, the plane contains the line
//   if (denom == 0. || numer == 0.) return false;
//   if (numer / denom < 0.) return false; // negative would indicate that intersection is behind the camera
//   return true;
// }

// float DistToPlane(float plane_height, vec3 lo, vec3 ld) {
//   // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
//   // get normal of plane
//   vec3 n_p = PlaneNormals(plane_height);
//   // create point on plane
//   vec3 p0 = vec3(0., plane_height, 0.);
//   // determine distance to plane
//   float numer = dot((p0 - lo), n_p);
//   float denom = dot(ld, n_p);
//   return numer / denom;
// }

float MaxVec3(vec3 v) {
  return max(v.x,max(v.y,v.z));
}

// Rotation matrix around the X axis.
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}

// Rotation matrix around the Y axis.
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}

// Rotation matrix around the Z axis.
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}

float SDFBox( vec3 p, vec3 center, vec3 dim, vec3 rotation )
{
  // translate to center, rotate, translate back
  p -= center;
  p = p * rotateX(rotation.x) * rotateY(rotation.y) * rotateZ(rotation.z);
  p += center;

  // create SDF
  vec3 p_diff = p - center;
  vec3 dist = abs(p_diff) - dim / 2.0;
  return length(max(dist,0.0)) + min(MaxVec3(dist),0.0);
}

float SDF(vec3 p) {
  // transforms
 // Rotation in XY
//  float t = sin(u_time) * PI / 4.;
//  mat4 R = mat4(
//  vec4(cos(t), sin(t), 0, 0),
//  vec4(-sin(t), cos(t), 0, 0),
//  vec4(0, 0, 1, 0),
//  vec4(0, 0, 0, 1));

//  p = (vec4(p, 1) * inverse(R)).xyz;

  // determine sdf
  vec3 box_c = vec3(0., 0., 5.);
  vec3 box_d = vec3(1., 1., 1.);
  return SDFBox(p, box_c, box_d, vec3(u_time / 2.));
}

vec3 NormalFromGradient(vec3 p)
{ 
    float e = u_gradient_size; // Gradient Step Size
    float box_d_1 = SDF(p);
    // calculate gradient to get normal
    float dx = box_d_1 - SDF(p - vec3(e, 0., 0.));
    float dy = box_d_1 - SDF(p - vec3(0., e, 0.));
    float dz = box_d_1 - SDF(p - vec3(0., 0., e));
    vec3 n = vec3(dx, dy, dz);
    return normalize(n);
}
 
float RayMarch(vec3 ro, vec3 rd) 
{
  float dO = 0.;
  float dO_last = 0.;
  // ray march if the ray is valid to intersect the plane
  for (int i = 0; i < MAX_STEPS; i++)
  { 
    vec3 p = ro + rd * dO;
    float dT = SDF(p);
    dO += max(dT, 0.0);
    if (abs(dT) < 0.01) {
      return dO;
    }
    if (dO > MAX_DIST) return -1.0;
  }
  return -1.0;
}

 

float lighting(vec3 p)
{ 
    // Light Position
    vec3 light_pos = vec3(0., 2., 3.);
    float light_dist = length(light_pos - p);
    vec3 l = normalize(light_pos-p); // normalized light to object vector
    vec3 n = NormalFromGradient(p); // Get Normal Vector
   
    // diffuse lighting
    float diffuse = dot(n,l); // Calculate diffused lighting from dot product
    diffuse = clamp(diffuse,0.,1.); // Clamp so it doesnt go below 0
  
    // ambient light
    float ambient_lighting = 0.1;

    // specular highlights
    vec3 half_dir = normalize(l + normalize(-p));
    float spec_angle = max(dot(half_dir, n), 0.0);
    float specular = pow(spec_angle, 4.);
    
    return clamp(ambient_lighting + specular / light_dist + diffuse / light_dist, 0., 1.0);
}

vec3 color_map(vec3 p) {
  float scale = map(p.y, TEXTURE_ELEV, TEXTURE_ELEV + TEXTURE_HEIGHT, 0., 1.);
  return mix(vec3(0.188,0.271,0.161), vec3(1.0, 1.0, 1.0), scale);
}

vec3 cartesianToSpherical(vec3 cart) {
  float r = length(cart);
  float theta = atan(cart.y,cart.x);
  float phi = atan(sqrt(cart.x*cart.x+cart.y*cart.y),cart.z);
  return vec3(r, theta, phi);
}
vec3 sphericalToCartesian(vec3 sph_coor) {
  return vec3(sph_coor.x * sin(sph_coor.y) * cos(sph_coor.z), sph_coor.x * sin(sph_coor.y) * sin(sph_coor.z), sph_coor.x * cos(sph_coor.y));
}
 
void main()
{
    vec2 uv = 2.*vUv - 1.;
    float camera_r = 2.0;
    vec3 camera_pos = vec3(0.0,0.,-5.0); // Ray Origin/Camera
    vec3 rd = normalize(vec3(uv.x,uv.y,0.) - camera_pos); // Ray Direction From Camera through pixel
    vec3 ro = camera_pos; 
    float d = RayMarch(ro,rd); // Distance
    if (d < 0.) 
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else {
      vec3 p = ro + rd * d;
      vec3 color = color_map(p);
      float light_scale = lighting(p);
      color = mix(vec3(0.0, 0.0, 0.0), color, light_scale);
  
      // Set the output color
      // gl_FragColor = vec4(color, 1.0);
      gl_FragColor = vec4(vec3(light_scale), 1.);
    }
    // float text = (SurfTexture(vec3(2.0 * vUv.x, 0., 2. * vUv.y)) - TEXTURE_ELEV) / TEXTURE_HEIGHT;
    // gl_FragColor = vec4(vec3(text), 1.0);

}
`;

export default fragment;