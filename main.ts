import * as THREE from 'three';
import {Pane} from 'tweakpane';

import AudioMain from './AudioMain.ts';
import fragment from './shaders/fragment.js'
import vertex from './shaders/vertex.js'

const audio = new AudioMain();

const uniforms = {
  u_mixer_levels: {value: [0., 0., 0., 0., 0.]},
  u_total_levels: {value: [0., 0., 0., 0., 0.]},
  u_time: {value: 0.0},
  u_resolution:
      {value: new THREE.Vector2(window.innerWidth, window.innerHeight)}
};

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
const renderer = new THREE.WebGLRenderer();
let total_levels = new Array<number>(5).fill(0);

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
      const min_dim = Math.min(window.innerWidth, window.innerHeight);
      camera.aspect = 1.0;
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
  total_levels = total_levels.map((val, i) => {return val + levels[i]});
  uniforms.u_total_levels.value = total_levels;

  // Render the scene
  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  console.log('Window Resizing');
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  uniforms.u_resolution.value =
      new THREE.Vector2(window.innerWidth, window.innerHeight);
});

window.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    audio.start();
  }
});



init();
animate();