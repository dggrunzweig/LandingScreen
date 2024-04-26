// import {Pane} from 'tweakpane';

// @ts-ignore
import * as THREE from '../three.module.min.js';

import {clamp} from './audio/Utilities.ts';
import AudioMain from './AudioMain.ts';
import fragment from './shaders/fragment.ts'
import vertex from './shaders/vertex.ts'

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
const renderer = new THREE.WebGLRenderer();
let start_svg = document.getElementById('start-svg');
let start_time = 0;
let fading_out = false;

const PARAMS = {
  color_base: '#090100',
  color_1: '#750313',
  color_2: '#8F0618',
  color_accent: '#7C36EA',
  color_saturation: 66,
  color_light: 143,
  noise_level: 0.2,
  tilt_1: 0.09,
  tilt_2: 1.26,
  tilt_3: 1.65,
  tilt_height: 0.35,
};

class rgb_color {
  r = 0;
  g = 0;
  b = 0;
}

const hexToRGB = (hex_color: string): rgb_color => {
  const value = parseInt('0x' + hex_color.slice(1));
  return {
    r: (value / 256 / 256) % 256,
    g: ((value / 256) % 256),
    b: (value % 256)
  };
};

const saturateColor = (rgb: rgb_color, saturation: number): rgb_color => {
  const sat = saturation / 100;
  const gray = rgb.r * 0.3086 + rgb.g * 0.6094 + rgb.b * 0.0820;

  const out_color = new rgb_color();
  out_color.r = Math.round(rgb.r * sat + gray * (1 - sat));
  out_color.g = Math.round(rgb.g * sat + gray * (1 - sat));
  out_color.b = Math.round(rgb.b * sat + gray * (1 - sat));

  return out_color;
};

const lightColor = (rgb: rgb_color, lightness: number): rgb_color => {
  const l = lightness / 100;

  const out_color = new rgb_color();
  out_color.r = l * rgb.r;
  out_color.g = l * rgb.g;
  out_color.b = l * rgb.b;

  return out_color;
};

const color_mod =
    (rgb: rgb_color, s: number, l: number) => {
      return lightColor(saturateColor((rgb), s), l);
    }

const rgbToGLSL = (rgb: rgb_color): THREE.Vector3 => {
  return new THREE.Vector3(rgb.r / 256, rgb.g / 256, rgb.b / 256);
};
const hexToGLSL = (hex_color: string) => {
  return rgbToGLSL(hexToRGB(hex_color));
};

const audio = new AudioMain();
const uniforms = {
  u_mixer_levels: {value: [0., 0., 0., 0., 0., 0.]},
  u_mouse_xy: {value: new THREE.Vector2(0, 0)},
  u_grid_width: {value: 1 / (audio.GetMouseNotes().length)},
  u_time: {value: 0.0},
  u_resolution:
      {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
  u_base_color: {value: hexToGLSL(PARAMS.color_base)},
  u_color_1: {
    value: rgbToGLSL(color_mod(
        hexToRGB(PARAMS.color_1), PARAMS.color_saturation, PARAMS.color_light))
  },
  u_color_2: {
    value: rgbToGLSL(color_mod(
        hexToRGB(PARAMS.color_2), PARAMS.color_saturation, PARAMS.color_light))
  },
  u_color_accent: {
    value: rgbToGLSL(color_mod(
        hexToRGB(PARAMS.color_accent), PARAMS.color_saturation,
        PARAMS.color_light))
  },
  u_tilt_window:
      {value: new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3)},
  u_tilt_height: {value: PARAMS.tilt_height},
  u_noise_level: {value: PARAMS.noise_level}
};

// const pane = new Pane();

// pane.addBinding(PARAMS, 'color_base').on('change', () => {
//   uniforms.u_base_color.value = hexToGLSL(PARAMS.color_base);
// });
// pane.addBinding(PARAMS, 'color_1').on('change', () => {
//   uniforms.u_color_1.value = hexToGLSL(PARAMS.color_1);
// });
// pane.addBinding(PARAMS, 'color_2').on('change', () => {
//   uniforms.u_color_2.value = hexToGLSL(PARAMS.color_2);
// });
// pane.addBinding(PARAMS, 'color_accent').on('change', () => {
//   uniforms.u_color_accent.value = hexToGLSL(PARAMS.color_accent);
// });
// pane.addBinding(PARAMS, 'color_saturation', {min: 0, max: 100})
//     .on('change', () => {
//       uniforms.u_color_1.value = rgbToGLSL(color_mod(
//           hexToRGB(PARAMS.color_1), PARAMS.color_saturation,
//           PARAMS.color_light));
//       uniforms.u_color_2.value = rgbToGLSL(color_mod(
//           hexToRGB(PARAMS.color_2), PARAMS.color_saturation,
//           PARAMS.color_light));
//       uniforms.u_color_accent.value = rgbToGLSL(color_mod(
//           hexToRGB(PARAMS.color_accent), PARAMS.color_saturation,
//           PARAMS.color_light));
//     });

// pane.addBinding(PARAMS, 'color_light', {min: 0, max: 200}).on('change', ()
// => {
//   uniforms.u_color_1.value = rgbToGLSL(color_mod(
//       hexToRGB(PARAMS.color_1), PARAMS.color_saturation,
//       PARAMS.color_light));
//   uniforms.u_color_2.value = rgbToGLSL(color_mod(
//       hexToRGB(PARAMS.color_2), PARAMS.color_saturation,
//       PARAMS.color_light));
//   uniforms.u_color_accent.value = rgbToGLSL(color_mod(
//       hexToRGB(PARAMS.color_accent), PARAMS.color_saturation,
//       PARAMS.color_light));
// });
// pane.addBinding(PARAMS, 'noise_level', {min: 0, max: 1}).on('change', () => {
//   uniforms.u_noise_level.value = PARAMS.noise_level;
// });
// pane.addBinding(PARAMS, 'tilt_1', {min: -2, max: 2}).on('change', () => {
//   uniforms.u_tilt_window.value =
//       new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
// });
// pane.addBinding(PARAMS, 'tilt_2', {min: -2, max: 2}).on('change', () => {
//   uniforms.u_tilt_window.value =
//       new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
// });
// pane.addBinding(PARAMS, 'tilt_3', {min: -2, max: 2}).on('change', () => {
//   uniforms.u_tilt_window.value =
//       new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
// });
// pane.addBinding(PARAMS, 'tilt_height', {min: 0, max: 4}).on('change', () => {
//   uniforms.u_tilt_height.value = PARAMS.tilt_height;
// });


const init =
    () => {
      // Create a plane geometry
      const geometry = new THREE.PlaneGeometry(2, 2);

      // Create a shader material
      const material = new THREE.ShaderMaterial(
          {uniforms: uniforms, vertexShader: vertex, fragmentShader: fragment});

      // Create a mesh with the shader material
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Set up renderer
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      // start clock
      clock.start();
    }

// Animation function
const animate = () => {
  requestAnimationFrame(animate);

  uniforms.u_time.value = clock.getElapsedTime();
  const levels = audio.GetMixerLevels();
  uniforms.u_mixer_levels.value = levels;

  // Render the scene
  renderer.render(scene, camera);

  // text fade
  if (audio.playing || fading_out) {
    let fade = clamp(1.0 - (clock.getElapsedTime() - start_time) / 2, 0, 1.);
    if (fading_out) {
      fade = clamp((clock.getElapsedTime() - start_time) / 2, 0, 1.);
    }
    svg_color(fade);
  }
  if (!audio.playing) {
    svg_color(1.);
  }
};

// Handle window resize
window.addEventListener('resize', () => {
  console.log('Window Resizing');
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  uniforms.u_resolution.value =
      new THREE.Vector2(window.innerWidth, window.innerHeight);
});

window.addEventListener('keypress', (ev: KeyboardEvent) => {
  if (ev.key == 'z') {
    full_screen();
  }
})

const svg_color = (opacity: number) => {
  if (start_svg) {
    if (opacity < .01) {
      start_svg.style.display = 'none';
      return;
    } else {
      start_svg.style.display = 'initial';
    }
    const flash = 0.4 +
        0.6 * (0.5 * (1 + Math.sin(1 * Math.PI * clock.getElapsedTime())));
    start_svg.style.opacity = '' + opacity * flash;
  }
};

renderer.domElement.onmousemove = (e: MouseEvent) => {
  const x =
      Math.min(Math.max(0, e.offsetX / renderer.domElement.clientWidth), 1.);
  const y = 1 -
      Math.min(Math.max(0, e.offsetY / renderer.domElement.clientHeight), 1.);
  uniforms.u_mouse_xy.value = new THREE.Vector2(x, y);
  audio.UpdateMouse(x, y);
};

renderer.domElement.ontouchmove = (e: TouchEvent) => {
  const touches = e.changedTouches;
  for (let i = 0; i < touches.length; ++i) {
    const t = touches[i];
    const x =
        Math.min(Math.max(0, t.clientX / renderer.domElement.clientWidth), 1.);
    const y = 1 -
        Math.min(Math.max(0, t.clientY / renderer.domElement.clientHeight), 1.);
    uniforms.u_mouse_xy.value = new THREE.Vector2(x, y);
    audio.UpdateMouse(x, y);
  }
};

const start = () => {
  audio.start();
  fading_out = !audio.playing
  start_time = clock.getElapsedTime();
};

renderer.domElement.onmouseup = () => {
  start();
};

if (start_svg) {
  start_svg.onmouseup = () => {
    start();
  };
}

const full_screen = () => {
  const el = renderer.domElement;
  if (el.requestFullscreen) el.requestFullscreen();
};

init();
animate();