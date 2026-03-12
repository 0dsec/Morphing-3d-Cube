const canvas = document.getElementById("cubeCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
// Cube and Camera
const cubeSize = 120;
const cameraDistance = 700;
const focalLength = 500;

// Spin Speed
let rotX = 0;
let rotY = 0;
const rotSpeedX = 0.0012;
const rotSpeedY = 0.0017;

// 8 cube corners
const baseVertices = [
  { x: -1, y: -1, z: -1 },
  { x:  1, y: -1, z: -1 },
  { x:  1, y:  1, z: -1 },
  { x: -1, y:  1, z: -1 },
  { x: -1, y: -1, z:  1 },
  { x:  1, y: -1, z:  1 },
  { x:  1, y:  1, z:  1 },
  { x: -1, y:  1, z:  1 }
];

// Faces defined by vertex indices
const faces = [
  [0, 1, 2, 3], // back
  [4, 5, 6, 7], // front
  [0, 1, 5, 4], // top
  [2, 3, 7, 6], // bottom
  [1, 2, 6, 5], // right
  [0, 3, 7, 4]  // left
];

// Edges for outline
const edges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7]
];

// Morphing
const morphData = baseVertices.map(() => ({
  amp1: 0.18 + Math.random() * 0.12,
  amp2: 0.08 + Math.random() * 0.08,
  amp3: 0.04 + Math.random() * 0.05,

  freq1: 0.45 + Math.random() * 0.35,
  freq2: 0.80 + Math.random() * 0.55,
  freq3: 1.20 + Math.random() * 0.85,

  phase1: Math.random() * Math.PI * 2,
  phase2: Math.random() * Math.PI * 2,
  phase3: Math.random() * Math.PI * 2
}));

function rotateX(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
}

function rotateY(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  };
}

function project(point) {
  const z = point.z + cameraDistance;
  const scale = focalLength / z;

  return {
    x: point.x * scale + canvas.width / 2,
    y: point.y * scale + canvas.height / 2,
    z
  };
}

function polygonDepth(face, points3D) {
  let total = 0;
  for (const index of face) {
    total += points3D[index].z;
  }
  return total / face.length;
}

function getMorphScale(index, time) {
  const m = morphData[index];

  const wave1 = Math.sin(time * m.freq1 + m.phase1) * m.amp1;
  const wave2 = Math.sin(time * m.freq2 + m.phase2) * m.amp2;
  const wave3 = Math.sin(time * m.freq3 + m.phase3) * m.amp3;

  return 1 + wave1 + wave2 + wave3;
}

function getDeformedVertices(time) {
  return baseVertices.map((v, i) => {
    const stretch = getMorphScale(i, time);

    return {
      x: v.x * cubeSize * stretch,
      y: v.y * cubeSize * stretch,
      z: v.z * cubeSize * stretch
    };
  });
}

function draw(timestamp) {
  const time = timestamp * 0.001;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  rotX += rotSpeedX;
  rotY += rotSpeedY;

  const deformed = getDeformedVertices(time);

  const rotated3D = deformed.map((vertex) => {
    let p = rotateX(vertex, rotX);
    p = rotateY(p, rotY);
    return p;
  });

  const projected = rotated3D.map(project);

  const sortedFaces = [...faces].sort(
    (a, b) => polygonDepth(b, rotated3D) - polygonDepth(a, rotated3D)
  );

  for (const face of sortedFaces) {
    ctx.beginPath();
    ctx.moveTo(projected[face[0]].x, projected[face[0]].y);

    for (let i = 1; i < face.length; i++) {
      ctx.lineTo(projected[face[i]].x, projected[face[i]].y);
    }

    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(projected[a].x, projected[a].y);
    ctx.lineTo(projected[b].x, projected[b].y);
    ctx.stroke();
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);