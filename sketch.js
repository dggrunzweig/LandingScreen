// Fourier Transform Drawing Machine
// https://www.youtube.com/watch?v=MY4luNgGfms  

let canvas;
let image_width = 500;
let image_height = 500;

// light mode
let background_color = 240;

const border_width = 15;
const inset_width = 3;

let canvas_width = image_width + 2 * border_width;
let canvas_height = image_height + 2 * border_width;

let noise_data = Array(image_width * image_height);
let frame_rate = 30;

let frequency_range_x = 20;
let frequency_range_y = 0.2;
let frequency_x = 1.0 * Math.random();
let frequency_y = 1.0 * Math.random();
let phase_x_counter = 2 * Math.PI * Math.random();
let phase_y_counter = 2 * Math.PI * Math.random();

function generateWaveformGrid(x_pos, y_pos, x_rate, y_rate, x_phase_rad = 0, y_phase_rad = 0) {

    const lightmode = false;

    // light mode
    const r_range = [208, 238];
    const g_range = [212, 238];
    const b_range = [230, 245];

    // dark mode
    // const r_range = [20, 25];
    // const g_range = [20, 25];
    // const b_range = [20, 70];

    const r_scale = r_range[1] - r_range[0];
    const g_scale = g_range[1] - g_range[0];
    const b_scale = b_range[1] - b_range[0];

    // iterate over image to create grid
    loadPixels();
    let d = pixelDensity();

    // weights and frequencies for x and y spectrum
    x_harm = [0.6,1];
    x_weight = [0.5, 0.5];
    y_harm = [1,1.7];
    y_weight = [0.5, 0.5];

    for (let x = 0; x < image_width; x++) {
        const x_input = 2 * Math.PI * x / image_width;
        for (let y = 0; y < image_height; y++) {
            const y_input = 2 * Math.PI * y / image_height;
            let wave_output = 0;
            for (let i = 0; i < x_harm.length; ++i) {
                wave_output += x_weight[i] * Math.cos(x_harm[i] * x_rate * x_input + x_phase_rad + 0.5*x_input);
            }
            for (let j = 0; j < y_harm.length; ++j) {
                wave_output += y_weight[j] * Math.cos(y_harm[j] * y_rate * y_input + y_phase_rad + 0.5*x_input);
            }
            let noise = noise_data[x * image_height + y];
            // const r_pixel = noise;
            // const g_pixel = noise;
            // const b_pixel = noise;
            if (!lightmode) noise = -noise;
            const r_pixel = r_range[0] + r_scale * wave_output - noise;
            const g_pixel = g_range[0] + g_scale * wave_output - noise;
            const b_pixel = b_range[0] + b_scale * wave_output - noise;
        
            set(x+x_pos, y+y_pos, [r_pixel, g_pixel, b_pixel, 255]); 
        }
    }

   
    updatePixels();
}

function createNoise() {
    const noise_depth = 10;    
    for (let y = 0; y < image_height; ++y) {
        for (let x = 0; x < image_width; ++x) {
            noise_data[y*image_width + x] = Math.floor(noise_depth/2 * noise(x,y) + noise_depth/2 * Math.random());
        }
    }   
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

function setup() {
    canvas = createCanvas(canvas_width, canvas_height);
    var x = (windowWidth - canvas_width) / 2;
    var y = 0.1 * (windowHeight - canvas_height);
    canvas.position(x, y);

    createNoise();

    background(background_color);
    drawInset();

    frameRate(frame_rate);
    noLoop();
}

function windowResized() {
    var x = (windowWidth - canvas_width) / 2;
    var y = 0.1 * (windowHeight - canvas_height);
    canvas.position(x, y);
}  

  
function draw() {

    generateWaveformGrid(border_width, border_width, frequency_range_x * sin(frequency_x), frequency_range_y * cos(frequency_y), 2 * Math.PI * Math.sin(phase_x_counter), 2 * Math.PI * Math.cos(phase_y_counter));
    // generateWaveformGrid(border_width, border_width, frequency_x, frequency_y, phase_x_counter, phase_y_counter);

    frequency_x = frequency_x + 1 / (8*frame_rate);
    frequency_y = frequency_y + 1 / (8*frame_rate);
    phase_x_counter = phase_x_counter + 1 / (8*frame_rate);
    phase_y_counter = phase_y_counter + 1 / (8*frame_rate);
    
    if (frequency_x > 2 * Math.PI) frequency_x = 0;
    if (frequency_y > 2 * Math.PI) frequency_y = 0;
    if (phase_x_counter > 2 * Math.PI) phase_x_counter = 0;
    if (phase_y_counter > 2 * Math.PI) phase_y_counter = 0;

}