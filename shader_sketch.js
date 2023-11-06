import { Pane } from 'tweakpane';
import p5 from 'p5';

let canvas;

let image_height = 400;
let image_width = 400;
let frame_rate = 60;

let frame_color = [0.992, 0.996, 0.996];

const border_width = 0;
let canvas_width = image_width + 2 * border_width;
let canvas_height = image_height + 2 * border_width;

// a shader variable
let shader;
let buffer;

// time counter
let time = 0;

// params
const PARAMS = {
  rate: 0.5,
  phase: 0,
}

const pane = new Pane();
pane.addBinding(PARAMS, 'rate', { min: 0, max: 100 });
pane.addBinding(PARAMS, 'phase', { min: 0, max: 100 });

window.preload = () => {
  // load the shader
  shader = loadShader('waveform.vert', 'waveform.frag');
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

  buffer = createGraphics(image_width, image_height, WEBGL);
  buffer.noStroke();
}

window.draw = () => {
  // lines
  shader.setUniform("u_resolution", [image_width, image_height]);
  // shader.setUniform("u_time", time);
  shader.setUniform("u_rate", [PARAMS.rate, PARAMS.rate]);
  shader.setUniform("u_phase", [PARAMS.phase, PARAMS.phase]);

  buffer.shader(shader);
  buffer.rect(border_width, border_width, image_width, image_height);

  image(buffer, border_width, border_width, image_width, image_height);

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

  buffer = createGraphics(image_width, image_height, WEBGL);
  buffer.noStroke();
}
