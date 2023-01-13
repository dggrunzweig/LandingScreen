let canvas;
let image_width = 800;
let image_height = 300;
let frame_rate = 15;

// light mode vs dark mode
const lightmode = true;

let background_color = 240;

const border_width = 15;
const inset_width = 3;

let canvas_width = image_width + 2 * border_width;
let canvas_height = image_height + 2 * border_width;

let noise_data = Array(image_width * image_height);

let frequency_range_x = 10;
let frequency_range_y = 2;
let frequency_x = 1.0 * Math.random();
let frequency_y = 1.0 * Math.random();
let phase_x_counter = 2 * Math.PI * Math.random();
let phase_y_counter = 2 * Math.PI * Math.random();

// waveform image
let ripple_image;
let perlin_noise_image;

// ripple pos
let ripple_pos_1 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];
let ripple_pos_2 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];
let ripple_pos_3 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];


function sinc2d(freq, x, y, center_x=0, center_y=0)
{
    const r = Math.sqrt(Math.pow((x - center_x),2) + Math.pow((y - center_y),2));
    if (r === 0) {
        return 1
    }
    return (Math.sin(freq * Math.PI * r)) / (freq * Math.PI * r)
}

function createRipples(freq, x, y, center_x, center_y, time, ripple_rate, duration = 10)
{
    return Math.exp(-time / duration) * Math.sin(2 * Math.PI * ripple_rate * time) * sinc2d(freq, x, y, center_x, center_y); 
}

function generateRippleGrid(img, x_pos, y_pos, time) {
    let r_range;
    let g_range;
    let b_range;
    const ripple_rate = 2;
    const ripple_duration = 3.0;
    const ripple_respawn_time = 5 * ripple_duration;
    let ripple_time_1 = time;
    let ripple_time_2 = time + 2 * ripple_duration;
    let ripple_time_3 = time + 4 * ripple_duration;

    let current_loop_1 = ripple_respawn_time * (ripple_time_1 / ripple_respawn_time  - Math.floor(ripple_time_1 / ripple_respawn_time));
    let current_loop_2 = ripple_respawn_time * (ripple_time_2 / ripple_respawn_time  - Math.floor(ripple_time_2 / ripple_respawn_time));
    let current_loop_3 = ripple_respawn_time * (ripple_time_3 / ripple_respawn_time  - Math.floor(ripple_time_3 / ripple_respawn_time));

    if (current_loop_1 > 0.95 * ripple_respawn_time) {
        ripple_pos_1 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];
    }
    if (current_loop_2 > 0.95 * ripple_respawn_time) {
        ripple_pos_2 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];
    }
    if (current_loop_3 > 0.95 * ripple_respawn_time) {
        ripple_pos_3 = [2 * Math.PI * Math.random(), 2 * Math.PI * Math.random()];
    }

    if (lightmode) {
        // light mode
        r_range = [190, 230];
        g_range = [200, 230];
        b_range = [230, 245];
    } else {
        // dark mode
        r_range = [20, 100];
        g_range = [20, 150];
        b_range = [60, 200];
    }

    const r_scale = r_range[1] - r_range[0];
    const g_scale = g_range[1] - g_range[0];
    const b_scale = b_range[1] - b_range[0];

    // iterate over image to create grid
    img.loadPixels();

    for (let x = 0; x < image_width; x++) {
        const x_input = 2 * Math.PI * x / image_width;
        for (let y = 0; y < image_height; y++) {
            const y_input = 2 * Math.PI * y / image_height;
            let ripple_output = createRipples(4, x_input, y_input, ripple_pos_1[0], ripple_pos_1[1], current_loop_1, ripple_rate, ripple_duration);
            ripple_output += createRipples(4, x_input, y_input, ripple_pos_2[0], ripple_pos_2[1], current_loop_2, ripple_rate, ripple_duration);
            ripple_output += createRipples(4, x_input, y_input, ripple_pos_3[0], ripple_pos_3[1], current_loop_3, ripple_rate, ripple_duration);
            let noise = noise_data[x * image_height + y];
            if (!lightmode) noise = -noise;
            const r_pixel = r_range[0] + r_scale * ripple_output - noise;
            const g_pixel = g_range[0] + g_scale * ripple_output - noise;
            const b_pixel = b_range[0] + b_scale * ripple_output - noise;
        
            img.set(x+x_pos, y+y_pos, [r_pixel, g_pixel, b_pixel, 255]); 
        }
    }

    img.updatePixels();
}

function generateWaveformGrid(img, x_pos, y_pos, x_rate, y_rate, x_phase_rad = 0, y_phase_rad = 0) {
    let r_range;
    let g_range;
    let b_range;

    if (lightmode) {
        // light mode
        r_range = [208, 238];
        g_range = [212, 238];
        b_range = [230, 245];
    } else {
        // dark mode
        r_range = [20, 25];
        g_range = [20, 25];
        b_range = [20, 70];
    }

    const r_scale = r_range[1] - r_range[0];
    const g_scale = g_range[1] - g_range[0];
    const b_scale = b_range[1] - b_range[0];

    // iterate over image to create grid
    img.loadPixels();

    // weights and frequencies for x and y spectrum
    x_harm = [0.29, 0.51, 0.69, 1];
    x_weight = [0.25, 0.25, 0.25, 0.25];
    y_harm = [0.2, 1, 1.3, 2.9];
    y_weight = [0.25, 0.25, 0.25, 0.25];

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
            if (!lightmode) noise = -noise;
            const r_pixel = r_range[0] + r_scale * wave_output - noise;
            const g_pixel = g_range[0] + g_scale * wave_output - noise;
            const b_pixel = b_range[0] + b_scale * wave_output - noise;
        
            img.set(x+x_pos, y+y_pos, [r_pixel, g_pixel, b_pixel, 255]); 
        }
    }

    img.updatePixels();
}

function generatePerlinNoiseGrid(img, x_pos, y_pos, offset_x, offset_y, noise_zoom_x = 0.02, noise_zoom_y = 0.02, seed = 1, transparency = 255) {    
    
    // color settings
    let r_range;
    let g_range;
    let b_range;

    if (lightmode) {
        // light mode
        r_range = [200, 238];
        g_range = [200, 238];
        b_range = [220, 255];
    } else {
        // dark mode
        r_range = [20, 25];
        g_range = [20, 40];
        b_range = [20, 25];
    }

    const r_scale = r_range[1] - r_range[0];
    const g_scale = g_range[1] - g_range[0];
    const b_scale = b_range[1] - b_range[0];

    // iterate over image to create grid
    img.loadPixels();

    // perlon noise settings
    noiseDetail(12, 0.5);
    noiseSeed(seed);

    for (let x = 0; x < image_width; x++) {
        for (let y = 0; y < image_height; y++) {
            const perlin_noise_val = noise(noise_zoom_x * (offset_x + x), noise_zoom_y * (offset_y + y));
            let grain_noise = noise_data[x * image_height + y];
            if (!lightmode) grain_noise = -grain_noise;
            const r_pixel = r_range[0] + r_scale * perlin_noise_val - grain_noise;
            const g_pixel = g_range[0] + g_scale * perlin_noise_val - grain_noise;
            const b_pixel = b_range[0] + b_scale * perlin_noise_val - grain_noise;
        
            img.set(x+x_pos, y+y_pos, [r_pixel, g_pixel, b_pixel, transparency]); 
        }
    }

    img.updatePixels();
}

function createGrainNoise() {
    const grain_size = 2;
    const grain_depth = 7;
    for (let y = 0; y < image_height;) {
        for (let x = 0; x < image_width;) {
            const grain_value = Math.floor(map(Math.random(), 0, 1, 0, grain_depth));
            for (let i = 0; i < grain_size; i++) {
                for (let j = 0; j < grain_size; ++j) {
                    const x_pos = x + j;
                    const y_pos = y + i;
                    noise_data[y_pos + x_pos * image_height] = grain_value;
                }
            }
            x = x + grain_size;
        }
        y = y + grain_size;
    } 
}

function showNoise(x_pos, y_pos) {
    loadPixels();
    for (let y = 0; y < image_height; y++) {
        for (let x = 0; x < image_width; x++) {
            let noise = noise_data[y*image_width + x];
            const r_pixel = noise;  
            const g_pixel = noise;
            const b_pixel = noise;
            set(x+x_pos, y+y_pos, [r_pixel, g_pixel, b_pixel, 255]); 
        }
    }
    updatePixels();
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

    createGrainNoise();

    ripple_image = createImage(image_width, image_height);
    perlin_noise_image = createImage(image_width, image_height);

    background(background_color);
    drawInset();

    // generateWaveformGrid(ripple_image, 0, 0, frequency_range_x * frequency_x, frequency_range_y * frequency_y, phase_x_counter, phase_y_counter);
    generateRippleGrid(ripple_image, 0, 0, 0);
    generatePerlinNoiseGrid(perlin_noise_image, 0, 0, frequency_range_x * sin(frequency_x), frequency_range_y * cos(frequency_y),  0.01, 0.01, random(100), 120);

    frameRate(frame_rate);
    // noLoop();

    // showNoise(border_width, border_width);
}

function windowResized() {
    var x = (windowWidth - canvas_width) / 2;
    var y = 0.1 * (windowHeight - canvas_height);
    canvas.position(x, y);
}  

  
function draw() {

    // generateWaveformGrid(ripple_image, 0, 0, frequency_range_x * sin(frequency_x), frequency_range_y * cos(frequency_y), phase_x_counter, phase_y_counter);
    // generateWaveformGrid(ripple_image, 0, 0, frequency_range_x * frequency_x, frequency_range_y * frequency_y, phase_x_counter, phase_y_counter);
    // generatePerlinNoiseGrid(perlin_noise_image, 0, 0, frequency_range_x * sin(frequency_x), frequency_range_y * cos(frequency_y),  0.01, 0.01, random(100));

    generateRippleGrid(ripple_image, 0, 0, millis()/1000);
    image(ripple_image, border_width, border_width);
    image(perlin_noise_image, border_width, border_width);

    frequency_x = frequency_x + 1 / (8*frame_rate);
    frequency_y = frequency_y + 1 / (8*frame_rate);
    phase_x_counter = phase_x_counter + 1 / (frame_rate);
    phase_y_counter = phase_y_counter + 1 / (frame_rate);
    
    if (frequency_x > 100 * Math.PI) frequency_x = 0;
    if (frequency_y > 100 * Math.PI) frequency_y = 0;
    if (phase_x_counter > 100 * Math.PI) phase_x_counter = 0;
    if (phase_y_counter > 100 * Math.PI) phase_y_counter = 0;

}