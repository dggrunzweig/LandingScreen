import ChordModule from "./Audio/ChordModule.js";
import TapeDelay from "./Audio/TapeDelay.js";
import SmoothNoiseLFO from "./audio/SmoothNoiseLFO.js";
import { db2mag, GetRMS } from "./Audio/Utilities.js";

let canvas;

let image_height = 400;
let image_width = 400;
let frame_rate = 60;

let oscillator_rate = 0.05;

let frame_color = [0.992,0.996,0.996];

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
  dot_shader = loadShader('dots.vert', 'dots.frag');
}

window.setup  = () => {
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

  // audio setup //-------------------
   audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
   chord_module = new ChordModule(audio_ctx, 200, 0, 100, 1);

   chord_module.setOutputVolume(-16);
   chord_module.setFilterLFO(oscillator_rate, 750);
   chord_module.setSynthNoiseGain(-30);
   let amp_mod = audio_ctx.createGain();
   let amp_mod_lfo = new SmoothNoiseLFO(audio_ctx, 0.5);
   amp_mod_lfo.connect(amp_mod.gain);
   amp_mod_lfo.setRange(db2mag(-16), db2mag(0));
    amp_mod_lfo.start();

   let output_gain = audio_ctx.createGain();
    output_gain.gain.value = 0.0;

   let tape_delay = new TapeDelay(audio_ctx, .50, 0.75, 0.75);

   // hook up
   chord_module.output.connect(amp_mod).connect(tape_delay.input);
   tape_delay.output.connect(output_gain).connect(audio_ctx.destination);

   output_gain.gain.linearRampToValueAtTime(1.0, audio_ctx.currentTime + 10.0);

   // analyzer
   analyzer = audio_ctx.createAnalyser();
   analyzer.fftSize = 512;
   output_gain.connect(analyzer);  
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


window.draw = () =>  {

// get data from audio
const bufferLength = analyzer.frequencyBinCount;
const dataArray = new Float32Array(bufferLength);
analyzer.getFloatTimeDomainData(dataArray);
last_rms = last_rms + 0.05 * (GetRMS(dataArray) - last_rms);
rms_sum += last_rms;

if (rms_sum > 1000.0 * 2 * Math.Pi)
  rms_sum = 0.0;

// trigger new synth line
let frequency = 100;
note_index += 0.1;

if (fract(time / 4.0) < 1.0 / frame_rate) {

    chord_module.trigger(frequency, audio_ctx.currentTime, 1.0, 0.5 + Math.random(), 1.5);
}

  // lines
  dot_shader.setUniform("u_resolution", [image_width, image_height]);
  dot_shader.setUniform("u_time", time);
  dot_shader.setUniform("u_rms", last_rms);
  dot_shader.setUniform("u_rms_sum", rms_sum);
  dot_shader.setUniform("u_frequency", frequency);
  dot_shader.setUniform("u_speck_offset", speck_offset);
  dot_shader.setUniform("u_grid_mode", grid_mode);
  dot_shader.setUniform("u_color_mode", color_mode);
  // let scaled_bg_color = [frame_color[0] / 255.0, frame_color[1] / 255.0, frame_color[2] / 255.0];
  dot_shader.setUniform("u_frame_color", frame_color);

  dot_buffer.shader(dot_shader);
  dot_buffer.rect(border_width,border_width,image_width,image_height);

  image(dot_buffer,border_width,border_width,image_width,image_height);
  
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
