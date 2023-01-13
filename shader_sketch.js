// a shader variable
let image_width = 800;
let image_height = 800;
let frame_rate = 60;

let ripple_shader;
let ripple_buffer;

let spatial_f = 20;
let oscillation_f = 0.6;
let duration = 5;

let position_1 = [0.0, 0.0];
let position_2 = [1.0, 1.0];
let position_3 = [0.0, 1.0];

let time_1 = 0;
let time_2 = duration * 0.42;
let time_3 = duration * 0.71;

function preload(){
  // load the shader
  ripple_shader = loadShader('ripple.vert', 'ripple.frag');
}

function setup() {
  // disables scaling for retina screens which can create inconsistent scaling between displays
  pixelDensity(1);
  
  // shaders require WEBGL mode to work
  createCanvas(windowWidth, windowHeight);
  noStroke();

  frameRate(frame_rate);
  
  ripple_buffer = createGraphics(image_width, image_height, WEBGL);
}

function draw() {
  // we can draw the background each frame or not.
  // if we do we can use transparency in our shader.
  // if we don't it will leave a trailing after image.
  // background(0);
  // shader() sets the active shader with our shader
  time_1 = time_1 + 1/frame_rate;
  time_2 = time_2 + 1/frame_rate;
  time_3 = time_3 + 1/frame_rate;

  ripple_shader.setUniform("u_resolution", [image_width, image_height]);
  ripple_shader.setUniform("u_spatial_frequency", spatial_f);
  ripple_shader.setUniform("u_oscillation_frequency", oscillation_f);
  ripple_shader.setUniform("u_duration", duration);
  ripple_shader.setUniform("u_pos_1", position_1);
  ripple_shader.setUniform("u_pos_2", position_2);
  ripple_shader.setUniform("u_pos_3", position_3);
  ripple_shader.setUniform("u_time_1", time_1);
  ripple_shader.setUniform("u_time_2", time_2);
  ripple_shader.setUniform("u_time_3", time_3);

  ripple_buffer.shader(ripple_shader);

  
  // rect gives us some geometry on the screen to draw the shader on
  ripple_buffer.rect(0,0,image_width,image_height);
  image(ripple_buffer,0,0,image_width,image_height);

  if (time_1 > duration * 2) {
    position_1 = [Math.random(), Math.random()];
    time_1 = 0;
  }
  if (time_2 > duration * 2) {
    position_2 = [Math.random(), Math.random()];
    time_2 = 0;
  }
  if (time_3 > duration * 2) {
    position_3 = [Math.random(), Math.random()];
    time_3 = 0;
  }
}


function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}
