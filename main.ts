// @ts-ignore Import module
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

import {clamp} from './audio/Utilities.ts';
import AudioMain from './AudioMain.ts';
import fragment from './shaders/fragment.ts'
import vertex from './shaders/vertex.ts'

const audio = new AudioMain();
const uniforms = {
  u_mixer_levels: {value: [0., 0., 0., 0., 0.]},
  u_mouse_xy: {value: new THREE.Vector2(0, 0)},
  u_time: {value: 0.0},
  u_resolution:
      {value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
};

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

      console.log('Loaded');
      // Start the animation
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

const start = () => {
  audio.start();
  if (!audio.playing) fading_out = true;
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