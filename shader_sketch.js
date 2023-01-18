let canvas;

let image_width = 1000;
let image_height = 800;
let frame_rate = 60;

let background_color = 219;

const border_width = 15;
const inset_width = 10;

let canvas_width = image_width + 2 * border_width;
let canvas_height = image_height + 2 * border_width;


// a shader variable
let waveform_shader;
let waveform_buffer;

let lines_shader;
let lines_buffer;

let frequency_range_x = Math.random() * 4;//  0.4;
let frequency_range_y = Math.random() * 2;//0.2;
let frequency_x = 1.0 * Math.random();
let frequency_y = 1.0 * Math.random();
let phase_x_counter = 2 * Math.PI * Math.random();
let phase_y_counter = 2 * Math.PI * Math.random();

function preload(){
  // load the shader
  waveform_shader = loadShader('waveform.vert', 'waveform.frag');
  lines_shader = loadShader('lines.vert', 'lines.frag');
}


function drawInset() {
    const x_pos = border_width - inset_width;
    const y_pos = border_width - inset_width;

    // create dark edge for shadow effect
    const shadow_color = [background_color-10, background_color-10, background_color-10, 255];
    // slightly less shadow for the bottom edge
    const shadow_color_bottom = [background_color-5, background_color-5, background_color-5, 255];
    
    loadPixels();

    for (let x = 0; x < image_width + 2 * inset_width; x++) {
        for (let y = 0; y < inset_width; y++) {
            set(x_pos + x, y_pos + y, shadow_color); 
            set(x_pos + x, y_pos + image_height + 2 * inset_width - y - 1, shadow_color_bottom); 
        }
    }
    for (let y = 0; y < image_height + 2 * inset_width; y++) {
        for (let x = 0; x < inset_width; x++) {
            set(x_pos + x, y+y_pos, shadow_color); 
            set(x_pos + image_width + 2*inset_width - x - 1, y+y_pos, shadow_color); 
        }
    }

    updatePixels();
}


function getCurrentHour() {
    const date = new Date();
    return date.getHours();
}

function setup() {
  // disables scaling for retina screens which can create inconsistent scaling between displays
  pixelDensity(1);
  
  getCurrentHour();

  // shaders require WEBGL mode to work
  canvas = createCanvas(canvas_width, canvas_height);
  var x = (windowWidth - canvas_width) / 2;
  var y = (windowHeight - canvas_height) / 2;
  canvas.position(x, y);

  noStroke();
  
  background(background_color);
  drawInset();

  frameRate(frame_rate);
  
  waveform_buffer = createGraphics(image_width, image_height, WEBGL);
  lines_buffer = createGraphics(image_width, image_height, WEBGL);
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


function draw() {

    // texture background
//   waveform_shader.setUniform("u_resolution", [image_width, image_height]);
//   waveform_shader.setUniform("u_rate", [frequency_range_x * sin(frequency_x), frequency_range_y * sin(frequency_y)]);
//   waveform_shader.setUniform("u_phase", [phase_x_counter, phase_y_counter]);
//   waveform_buffer.shader(waveform_shader);

//   waveform_buffer.rect(border_width,border_width,image_width,image_height);
//   image(waveform_buffer,border_width,border_width,image_width,image_height);

  // lines
  lines_shader.setUniform("u_resolution", [image_width, image_height]);
  lines_shader.setUniform("u_rate", [frequency_range_x * sin(frequency_x), frequency_range_y * sin(frequency_y)]);
  lines_shader.setUniform("u_phase", [phase_x_counter, phase_y_counter]);
  lines_buffer.shader(lines_shader);

  lines_buffer.fill(0,255);
  lines_buffer.rect(border_width,border_width,image_width,image_height);
  image(lines_buffer,border_width,border_width,image_width,image_height);

  
  frequency_x = frequency_x + 1 / (4*frame_rate);
  frequency_y = frequency_y + 1 / (8*frame_rate);
  phase_x_counter = phase_x_counter + sin(frequency_x) / (frame_rate);
  phase_y_counter = phase_y_counter + sin(frequency_y) / (frame_rate);
  
  if (frequency_x > 2 * Math.PI) frequency_x = 0;
  if (frequency_y > 2 * Math.PI) frequency_y = 0;
  if (phase_x_counter > 2 * Math.PI) phase_x_counter = 0;
  if (phase_y_counter > 2 * Math.PI) phase_y_counter = 0
  
  writeText(frequency_y);
  
}


function windowResized(){
    var x = (windowWidth - canvas_width) / 2;
    var y = (windowHeight - canvas_height) / 2;
    canvas.position(x, y);
//   resizeCanvas(canvas_width, canvas_height);
}
