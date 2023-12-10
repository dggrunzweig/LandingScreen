import * as THREE from 'three';
import vertex from './shaders/vertex.js'
import fragment from './shaders/fragment.js'
import { Pane } from 'tweakpane';

const pane = new Pane();
const PARAMS = {
  gradient_size: 0.0001,
}

const uniforms = {
  u_gradient_size: { value: PARAMS.gradient_size },
  u_time: { value: 0.0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};

pane.addBinding(PARAMS, 'gradient_size', { min: 0.000001, max: 0.1 }).on('change', (ev) => {
  uniforms.u_gradient_size.value = ev.value;

});

const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
const renderer = new THREE.WebGLRenderer();

const init = () => {
  // Create a plane geometry
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Create a shader material
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertex,
    fragmentShader: fragment
  });

  // Create a mesh with the shader material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Set up renderer
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // start clock
  clock.start();

  console.log("Loaded");
  // Start the animation
}

// Animation function
const animate = () => {
  requestAnimationFrame(animate);

  uniforms.u_time.value = clock.getElapsedTime();

  // Render the scene
  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  console.log("Window Resizing");
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(newWidth, newHeight);

  uniforms.u_resolution.value.set([newWidth, newHeight]);
});


init();
animate();