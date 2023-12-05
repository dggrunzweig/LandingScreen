const fragment = /* glsl */ `

varying vec2 vUv;
uniform float u_time;

// Constants
#define MAX_STEPS 15 // Mar Raymarching steps
#define MAX_DIST 200. // Max Raymarching distance
#define TEXTURE_HEIGHT 1.
#define TEXTURE_ELEV -2.
 
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

float SurfTexture(vec3 p) {
  float t = u_time;
  float noise_0 = perlin2d(0.2 * p.xz + t);
  float noise_1 = perlin2d(0.31 * p.xz + t);
  float noise_2 = perlin2d(0.6 * p.xz + t);
  float noise_3 = perlin2d(2.0 * p.xz + t);
  float noise_4 = perlin2d(80.0 * p.xz + t);
  float weights[5] = float[5](0.05, 0.1, 2., 0.3, 0.01);
  float noise[5] =  float[5](noise_0, noise_1, noise_2, noise_3, noise_4);
  float noise_sum = 0.;
  float weight_sum = 0.;
  for (int i = 0; i < 5; ++i) {
    noise_sum += weights[i] * noise[i];
    weight_sum += weights[i];
  }
  float height = 1. / weight_sum * noise_sum;
  return TEXTURE_ELEV + TEXTURE_HEIGHT * height;
}

vec3 PlaneNormals(float plane_height) {
  vec3 A = vec3(0., plane_height, 0.);
  vec3 B = vec3(1., plane_height, 1.);
  vec3 C = vec3(2., plane_height, 3.);
  return cross(A - B, C - B);
}

bool DoesLineIntersectPlane(float plane_height, vec3 lo, vec3 ld) {
  // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
  // get normal of plane
  vec3 n_p = PlaneNormals(plane_height);
  // create point on plane
  vec3 p0 = vec3(0., plane_height, 0.);
  // determine distance to plane
  float numer = dot((p0 - lo), n_p);
  float denom = dot(ld, n_p);
  // if denom is 0, then they do not intersect (in parallel)
  // if numerator is 0, the plane contains the line
  if (denom == 0. || numer == 0.) return false;
  if (numer / denom < 0.) return false; // negative would indicate that intersection is behind the camera
  return true;
}

float DistToPlane(float plane_height, vec3 lo, vec3 ld) {
  // https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
  // get normal of plane
  vec3 n_p = PlaneNormals(plane_height);
  // create point on plane
  vec3 p0 = vec3(0., plane_height, 0.);
  // determine distance to plane
  float numer = dot((p0 - lo), n_p);
  float denom = dot(ld, n_p);
  return numer / denom;
}

vec3 NormalFromGradient(vec3 p)
{ 
    float h = SurfTexture(p);
    float e = 0.01; // Gradient Step Size
    // calculate gradient to get normal
    float dx = SurfTexture(p + vec3(e, 0., 0.)) - SurfTexture(p - vec3(e, 0., 0.));
    float dy = 2. * e;//h - SurfTexture(p + vec3(0., e, 0.));
    float dz = SurfTexture(p + vec3(0., 0., e)) - SurfTexture(p - vec3(0., 0., e));
    vec3 n = vec3(dx, dy, dz);
    return normalize(n);
}
 
float RayMarch(vec3 ro, vec3 rd) 
{
  if (DoesLineIntersectPlane(TEXTURE_ELEV + TEXTURE_HEIGHT, ro, rd)) {
    float dO = 0.;
    float dT = 0.1; // step size
    float lh = 0.;
    float ly = 0.;
    // ray march if the ray is valid to intersect the plane
    for(int i = 0; i < MAX_STEPS; i++)
    {
      vec3 p = ro + rd * dO;
      float h = SurfTexture(p);
      if (p.y < h) {
        return dO - dT + dT*(lh-ly)/(p.y-ly-h+lh);
      }
      lh = h;
      ly = p.y;
      dT = 0.1 * float(i * i);
      dO += dT;
      if (dO > MAX_DIST) return -1.0;
    }
  } else {
    return -1.0;
  }
}
 

float lighting(vec3 p, float d)
{ 
    // Light Position
    vec3 light_pos = vec3(0., 1., 10.); 
    vec3 l = normalize(light_pos-p); // normalized light to object vector
    vec3 n = NormalFromGradient(p); // Get Normal Vector
   
    float diffuse_lighting = dot(n,l); // Calculate diffused lighting from dot product
    diffuse_lighting = clamp(diffuse_lighting,0.,1.); // Clamp so it doesnt go below 0

    float ambient_lighting = 0.2;
    // Shadows      
    return clamp(diffuse_lighting + ambient_lighting, 0., 1.0);
}

vec3 color_map(vec3 p) {
  float scale = map(p.y, TEXTURE_ELEV, TEXTURE_ELEV + TEXTURE_HEIGHT, 0., 1.);
  return mix(vec3(0.188,0.271,0.161), vec3(1.0, 1.0, 1.0), scale);
}
 
void main()
{
    vec2 uv = 2.*vUv - 1.;
    vec3 camera_pos = vec3(0,2.0,-2); // Ray Origin/Camera
    vec3 rd = normalize(vec3(uv.x,uv.y,0.) - camera_pos); // Ray Direction From Camera through pixel
    vec3 ro = vec3(uv.x, uv.y, 0.);
    float d = RayMarch(ro,rd); // Distance
    if (d < 0.) 
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else {
      vec3 p = ro + rd * d;
      vec3 color = color_map(p);
      float light_scale = lighting(p, d);
      color = mix(vec3(0.0, 0.0, 0.0), color, light_scale);
  
      // Set the output color
      gl_FragColor = vec4(color, 1.0);
    }
    // float text = (SurfTexture(vec3(20.0 * vUv.x, 0., 20. * vUv.y)) - TEXTURE_ELEV) / TEXTURE_HEIGHT;
    // gl_FragColor = vec4(vec3(text), 1.0);

}
`;

export default fragment;