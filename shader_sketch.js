let canvas;

let image_height = 400;
let image_width = 400;
let frame_rate = 60;

let oscillator_rate = 0.05;

let frame_color = [0.992, 0.996, 0.996];

let rotation = 143.0;//360 * Math.random();
console.log("Rotation: " + rotation);

let speck_offset = 100 * Math.random();

let grid_mode = Math.floor(3 * Math.random());
let color_mode = Math.floor(2 * Math.random());

console.log(grid_mode, color_mode);

const border_width = 0;

let canvas_width = image_width + 2 * border_width;
let canvas_height = image_height + 2 * border_width;

// a shader variable
let dot_shader;
let dot_buffer;

let note_index = 0;

let time = 0;

// audio
let chord_module;
let audio_ctx;
let analyzer;
let last_rms = 0.0;
let rms_sum = 0.0;

window.preload = () => {
  // load the shader
  dot_shader = loadShader('rings.vert', 'rings.frag');
}

window.setup = () => {
  // disables scaling for retina screens which can create inconsistent scaling between displays
  pixelDensity(1);

  // shaders require WEBGL mode to work
  let min_dim = Math.min(windowHeight, windowWidth);
  console.log(min_dim);
  image_height = 0.8 * min_dim;
  image_width = 0.8 * min_dim;
  canvas_width = image_width + 2 * border_width;
  canvas_height = image_height + 2 * border_width;
  canvas = createCanvas(canvas_width, canvas_height);
  var x = (windowWidth - canvas_width) / 2;
  var y = (windowHeight - canvas_height) / 2;
  canvas.position(x, y);

  noStroke();
  background(frame_color);
  frameRate(frame_rate);

  dot_buffer = createGraphics(image_width, image_height, WEBGL);
  dot_buffer.noStroke();

}


function writeText(time) {
  // text
  let brightness = 200;
  const text_size = 16;
  const box_width = 200;
  const box_height = 100;

  const text_alpha_offset = 150.0;
  const text_alpha_mod_depth = 75.0;

  textSize(text_size);
  let s = '>> Welcome';
  let alpha = text_alpha_offset;//text_alpha_offset + text_alpha_mod_depth * Math.sin(30 * time);
  fill(brightness, brightness, brightness, alpha);
  text(s, 2 * border_width, 2 * border_width, box_width, box_height);
  s = '>> About';
  fill(brightness, brightness, brightness, alpha);
  text(s, 2 * border_width, 2 * border_width + text_size, box_width, box_height);
  s = '>> Works';
  fill(brightness, brightness, brightness, alpha);
  text(s, 2 * border_width, 2 * border_width + 2 * text_size, box_width, box_height);
  s = '>> Contact';
  fill(brightness, brightness, brightness, alpha);
  text(s, 2 * border_width, 2 * border_width + 3 * text_size, box_width, box_height);
}


window.draw = () => {
  // lines
  dot_shader.setUniform("u_resolution", [image_width, image_height]);
  dot_shader.setUniform("u_time", time);
  dot_shader.setUniform("u_speck_offset", speck_offset);
  dot_shader.setUniform("u_frame_color", frame_color);
  dot_shader.setUniform("u_rotation", rotation);

  dot_buffer.shader(dot_shader);
  dot_buffer.rect(border_width, border_width, image_width, image_height);

  image(dot_buffer, border_width, border_width, image_width, image_height);

  time = time + 1 / frame_rate;

  //   writeText(0.0);

}


window.windowResized = () => {
  let min_dim = Math.min(windowHeight, windowWidth);
  image_height = 0.8 * min_dim;
  image_width = 0.8 * min_dim;
  canvas_width = image_width + 2 * border_width;
  canvas_height = image_height + 2 * border_width;
  var x = (windowWidth - canvas_width) / 2;
  var y = (windowHeight - canvas_height) / 2;
  canvas = createCanvas(canvas_width, canvas_height);
  canvas.position(x, y);
  // drawInset();

  dot_buffer = createGraphics(image_width, image_height, WEBGL);
  dot_buffer.noStroke();
}
