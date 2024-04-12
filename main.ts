import * as THREE from 'three';
import {Pane} from 'tweakpane';

import {clamp} from './audio/Utilities.ts';
import AudioMain from './AudioMain.ts';
import fragment from './shaders/fragment.ts'
import vertex from './shaders/vertex.ts'

const PARAMS = {
  color_base: '#040b14',
  color_1: '#792515',
  color_2: '#b57335',
  color_accent: '#5a49ac',
  tilt_1: 0.09,
  tilt_2: 1.26,
  tilt_3: 1.65,
  tilt_height: 0.35,
};

const hexToGLSL = (hex_color: string) => {
  const value = parseInt('0x' + hex_color.slice(1));
  return new THREE.Vector3(
      ((value / 256 / 256) % 256) / 256, ((value / 256) % 256) / 256,
      (value % 256) / 256);
};

const audio = new AudioMain();
const uniforms = {
  u_mixer_levels: {value: [0., 0., 0., 0., 0., 0.]},
  u_mouse_xy: {value: new THREE.Vector2(0, 0)},
  u_grid_width: {value: 1 / audio.GetMouseNotes().length},
  u_time: {value: 0.0},
  u_resolution:
      {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
  u_base_color: {value: hexToGLSL(PARAMS.color_base)},
  u_color_1: {value: hexToGLSL(PARAMS.color_1)},
  u_color_2: {value: hexToGLSL(PARAMS.color_2)},
  u_color_accent: {value: hexToGLSL(PARAMS.color_accent)},
  u_tilt_window:
      {value: new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3)},
  u_tilt_height: {value: PARAMS.tilt_height},
};

// if (import.meta.env.DEV) {
//   const pane = new Pane();

//   pane.addBinding(PARAMS, 'color_base').on('change', () => {
//     uniforms.u_base_color.value = hexToGLSL(PARAMS.color_base);
//   });
//   pane.addBinding(PARAMS, 'color_1').on('change', () => {
//     uniforms.u_color_1.value = hexToGLSL(PARAMS.color_1);
//   });
//   pane.addBinding(PARAMS, 'color_2').on('change', () => {
//     uniforms.u_color_2.value = hexToGLSL(PARAMS.color_2);
//   });
//   pane.addBinding(PARAMS, 'color_accent').on('change', () => {
//     uniforms.u_color_accent.value = hexToGLSL(PARAMS.color_accent);
//   });
//   pane.addBinding(PARAMS, 'tilt_1', {min: -2, max: 2}).on('change', () => {
//     uniforms.u_tilt_window.value =
//         new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
//   });
//   pane.addBinding(PARAMS, 'tilt_2', {min: -2, max: 2}).on('change', () => {
//     uniforms.u_tilt_window.value =
//         new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
//   });
//   pane.addBinding(PARAMS, 'tilt_3', {min: -2, max: 2}).on('change', () => {
//     uniforms.u_tilt_window.value =
//         new THREE.Vector3(PARAMS.tilt_1, PARAMS.tilt_2, PARAMS.tilt_3);
//   });
//   pane.addBinding(PARAMS, 'tilt_height', {min: 0, max: 4}).on('change', ()
//   => {
//     uniforms.u_tilt_height.value = PARAMS.tilt_height;
//   });
// }

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
const renderer = new THREE.WebGLRenderer();
let start_svg = document.getElementById('start-svg');
let start_time = 0;
let fading_out = false;
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
};

// Handle window resize
window.addEventListener('resize', () => {
  console.log('Window Resizing');
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  uniforms.u_resolution.value =
      new THREE.Vector2(window.innerWidth, window.innerHeight);
});

const svg_color = (opacity: number) => {
  if (start_svg) {
    if (opacity < .01) {
      start_svg.style.display = 'none';
      return;
    } else {
      start_svg.style.display = 'initial';
    }

    const c = `rgba(255, 255, 255, ${opacity})`;
    start_svg.style.fill = c;
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


init();
animate();