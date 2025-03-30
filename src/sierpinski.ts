import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import * as dat from 'dat.gui';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const canvas = document.getElementById("bg") as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas
});

// DEFINE CONSTANTS 

const SIZE = 100; // Tetrahedron size
const POINT_AMOUNT = 1000000; // Amount of points rendered
const tetrahedronVertices = generateTetrahedronVertices();

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(300);
camera.position.setY(150);
camera.position.setX(100);

const gridHelper = new THREE.GridHelper(200, 50);

const controls = new OrbitControls(camera, renderer.domElement);

let sierpinskiPoints: THREE.Points | null = null;
let tetrahedronPoints: THREE.Points | null = null;

const guiOptions = {
  showTetrahedron: true,
  showSierpinski: true,
  pointAmount: 10000,
};

const gui = new dat.GUI();
const folder = gui.addFolder('Geometry');

folder.add(guiOptions, 'showTetrahedron').name('Tetrahedron').onChange((value) => {
  if (tetrahedronPoints) tetrahedronPoints.visible = value;
});

folder.add(guiOptions, 'showSierpinski').name('Sierpinski Tetrahedron').onChange((value) => {
  if (sierpinskiPoints) sierpinskiPoints.visible = value;
});

folder.add(guiOptions, 'pointAmount', 10000, 1000000, 10000).name('Number of Points').onChange((value: number) => {
  if (tetrahedronPoints) {
    scene.remove(tetrahedronPoints);
  }
  if (sierpinskiPoints) {
    scene.remove(sierpinskiPoints);
  }

  tetrahedronPoints = createTetrahedronPoints(value);
  sierpinskiPoints = createSierPoints(value);

  tetrahedronPoints.visible = guiOptions.showTetrahedron;
  sierpinskiPoints.visible = guiOptions.showSierpinski;
});

sierpinskiPoints = createSierPoints(guiOptions.pointAmount);
tetrahedronPoints = createTetrahedronPoints(guiOptions.pointAmount);

animate();

function animate() {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

//returns an array with 4 elements [a, b, c, d] that are to be used as weights for the vetices in a tetrahedron
function generateVerticesWeights() {
  let rValues: number[] = [Math.random(), Math.random(), Math.random()];// make an array with 3 random values [0-1]
  rValues.sort((a, b) => a - b); //sort

  let a = rValues[0];
  let b = rValues[1] - rValues[0];
  let c = rValues[2] - rValues[1];
  let d = 1 - rValues[2];

  let weights: number[] = [a, b, c, d];
  return weights;
}

function getRandomTetrahedronPoint(): { point: [number, number, number], weights: number[] } {


  let weights = generateVerticesWeights();

  let x = weights[0] * tetrahedronVertices[0][0] + 
          weights[1] * tetrahedronVertices[1][0] + 
          weights[2] * tetrahedronVertices[2][0] + 
          weights[3] * tetrahedronVertices[3][0];

  let y = weights[0] * tetrahedronVertices[0][1] + 
          weights[1] * tetrahedronVertices[1][1] +
          weights[2] * tetrahedronVertices[2][1] +
          weights[3] * tetrahedronVertices[3][1];

  let z = weights[0] * tetrahedronVertices[0][2] + 
          weights[1] * tetrahedronVertices[1][2] + 
          weights[2] * tetrahedronVertices[2][2] + 
          weights[3] * tetrahedronVertices[3][2];

  return { point: [x, y, z], weights };
}

function getColorFromWeights(weights: number[]): THREE.Color {
  const c0 = new THREE.Color(0xff0000); // Red
  const c1 = new THREE.Color(0x00ff00); // Green
  const c2 = new THREE.Color(0x0000ff); // Blue
  const c3 = new THREE.Color(0xffff00); // Yellow

  const color = new THREE.Color(0x000000); // Start from black

  color.add(c0.clone().multiplyScalar(weights[0]));
  color.add(c1.clone().multiplyScalar(weights[1]));
  color.add(c2.clone().multiplyScalar(weights[2]));
  color.add(c3.clone().multiplyScalar(weights[3]));

  return color;
}

function generateTetrahedronVertices(): [number, number, number][] {
  const s = SIZE;
  const inr = s * Math.sqrt(3) / 6;

  const A: [number, number, number] = [-s / 2, 0, -inr];
  const B: [number, number, number] = [ s / 2, 0, -inr];
  const C: [number, number, number] = [0, 0, 2 * inr];
  const h = s * Math.sqrt(2 / 3);
  const D: [number, number, number] = [0, h, 0];

  return [A, B, C, D];
}

function getMidpoint(point1: [number, number, number], point2: [number, number, number]): [number, number, number] {
  return [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2
  ];
}

function getRandomVertice(): [number, number, number] {
  let index = Math.floor(Math.random() * 4);
  return tetrahedronVertices[index];
}

function createSierPoints(count: number) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];

  // Prime step: start at a known point and run a few iterations to get close to the attractor
  let currentPoint = getRandomTetrahedronPoint().point;
  const burnInSteps = 20;
  for (let i = 0; i < burnInSteps; i++) {
    const vertex = getRandomVertice();
    currentPoint = getMidpoint(currentPoint, vertex);
  }

  for (let i = 0; i < count; i++) {
    // Choose a new vertex and get midpoint
    const vertex = getRandomVertice();
    currentPoint = getMidpoint(currentPoint, vertex);

    // Add position and color
    const [x, y, z] = currentPoint;
    positions.push(x, y, z);

    colors.push(Math.random(), Math.random(), Math.random());
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
}

function createTetrahedronPoints(count: number) {
  // Create an empty geometry to hold all point positions and colors
  const geometry = new THREE.BufferGeometry();

  const positions: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < count; i++) {
    // Get point and weights
    const { point: [x, y, z], weights } = getRandomTetrahedronPoint();

    // Add position to array
    positions.push(x, y, z);

    // Get color based on weights
    const color = getColorFromWeights(weights);

    colors.push(color.r, color.g, color.b); // Add RGB values (normalized 0–1)
  }

  // Attach positions to geometry
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  // Create a material for the points
  const material = new THREE.PointsMaterial({
    size: 0.05,                // Size of each point
    vertexColors: true,       // Use per-vertex color (from `colors` array)
  });

  // Create the Points object
  const points = new THREE.Points(geometry, material);

  // Add to scene
  scene.add(points);
  return points;
}