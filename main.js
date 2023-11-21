import * as THREE from 'three';

// Set up scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a plane geometry
const geometry = new THREE.PlaneGeometry(2, 2);

const clock = new THREE.Clock();
let fragmentShader
let vertexShader;
let mesh;

const uniforms = {
  u_time: { value: 0.0 },
  u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};

fetch('shader.frag')
  .then(response => response.text())
  .then((fshader) => {
    fragmentShader = fshader;
    fetch('shader.vert')
      .then(response => response.text())
      .then((vshader) => {
        vertexShader = vshader;

        // Create a shader material
        const material = new THREE.ShaderMaterial({
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          uniforms: uniforms
        });

        // Create a mesh with the shader material
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Set camera position
        camera.position.z = 5;

        // start clock
        clock.start();

        console.log("Loaded");
        // Start the animation
        animate();

      });
  });


// Animation function
const animate = () => {
  requestAnimationFrame(animate);

  uniforms.u_time.value = clock.getElapsedTime();

  // Render the scene
  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(newWidth, newHeight);

  uniforms.u_resolution.value.set([newWidth, newHeight]);
});
