// ── VIDEO / CANVAS FALLBACK ───────────────────────────────────────────
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const video = document.getElementById('bgVideo');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const particles = [];
for (let i = 0; i < 100; i++) {
  particles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    r: Math.random() * 1.8 + 0.3,
    alpha: Math.random() * 0.6 + 0.1,
  });
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const grad = ctx.createRadialGradient(canvas.width*0.3, canvas.height*0.4, 0, canvas.width*0.3, canvas.height*0.4, canvas.width*0.9);
  grad.addColorStop(0, 'rgba(0,15,35,1)');
  grad.addColorStop(1, 'rgba(0,0,5,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
    ctx.fill();
  });
  requestAnimationFrame(drawParticles);
}
drawParticles();

// Vidéo : si elle charge, elle passe devant
video.addEventListener('canplay', () => {
  canvas.style.display = 'none';
  video.style.display = 'block';
  video.play().catch(() => {});
});
video.addEventListener('error', () => {
  canvas.style.display = 'block';
  video.style.display = 'none';
});

// ── MUSIC ──────────────────────────────────────────────────────────────
const audio = document.getElementById('localAudio');
const btn = document.getElementById('musicBtn');
const iconPlay = document.getElementById('iconPlay');
const iconPause = document.getElementById('iconPause');
const label = document.getElementById('musicLabel');
let playing = false;

function setPlaying(state) {
  playing = state;
  iconPlay.style.display = state ? 'none' : 'block';
  iconPause.style.display = state ? 'block' : 'none';
  label.textContent = state ? 'Pause' : 'Musique';
  btn.classList.toggle('playing', state);
}
btn.addEventListener('click', () => {
  if (playing) { audio.pause(); setPlaying(false); }
  else { audio.muted = false; audio.play().then(() => setPlaying(true)).catch(e => console.log(e)); }
});
window.addEventListener('click', function tryAutoplay(e) {
  if (e.target.closest('#musicBtn')) return;
  audio.muted = false;
  audio.play().then(() => { setPlaying(true); window.removeEventListener('click', tryAutoplay); }).catch(() => {});
});

// ── 3D TITLE avec Three.js TextGeometry ───────────────────────────────
(function() {
  const el = document.getElementById('three-canvas');
  if (!el) return;

  const W = el.clientWidth || 600;
  const H = el.clientHeight || 220;

  const renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 10);

  // Lumières dramatiques
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(5, 8, 8);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xaaccff, 1);
  rimLight.position.set(-6, -4, 3);
  scene.add(rimLight);

  const pointLight = new THREE.PointLight(0xffffff, 3, 30);
  pointLight.position.set(0, 0, 6);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0x8888ff, 1.5, 20);
  pointLight2.position.set(-5, 3, 4);
  scene.add(pointLight2);

  // Texture canvas pour le texte extrudé (simulation 3D via canvas)
  function makeExtrudedText(text) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 256;
    const cx = c.getContext('2d');

    // Fond transparent
    cx.clearRect(0, 0, 1024, 256);

    const font = 'bold 200px "Black Han Sans", Impact, sans-serif';
    cx.font = font;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';

    // Ombre portée (profondeur)
    for (let i = 8; i > 0; i--) {
      cx.fillStyle = `rgba(${40-i*4},${40-i*4},${40-i*4},${0.6 - i*0.05})`;
      cx.fillText(text, 512 + i, 128 + i);
    }

    // Face principale avec gradient métal
    const grad = cx.createLinearGradient(0, 30, 0, 220);
    grad.addColorStop(0,   '#ffffff');
    grad.addColorStop(0.3, '#dddddd');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.7, '#aaaaaa');
    grad.addColorStop(1,   '#eeeeee');
    cx.fillStyle = grad;
    cx.shadowColor = 'rgba(255,255,255,0.9)';
    cx.shadowBlur = 25;
    cx.fillText(text, 512, 128);

    // Reflet brillant
    cx.shadowBlur = 0;
    const shine = cx.createLinearGradient(0, 30, 0, 110);
    shine.addColorStop(0, 'rgba(255,255,255,0.5)');
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    cx.fillStyle = shine;
    cx.fillText(text, 512, 128);

    return new THREE.CanvasTexture(c);
  }

  const texture = makeExtrudedText('in10cis');
  const geo = new THREE.PlaneGeometry(10, 2.5);
  const mat = new THREE.MeshPhysicalMaterial({
    map: texture,
    transparent: true,
    roughness: 0.1,
    metalness: 0.9,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Particules 3D
  const pgeo = new THREE.BufferGeometry();
  const count = 250;
  const pos = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 18;
    pos[i*3+1] = (Math.random() - 0.5) * 8;
    pos[i*3+2] = (Math.random() - 0.5) * 6;
    sizes[i]   = Math.random() * 2 + 0.5;
  }
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pmat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.5 });
  const points = new THREE.Points(pgeo, pmat);
  scene.add(points);

  // Mouse parallax
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;

    // Smooth mouse follow
    tmx += (mx - tmx) * 0.05;
    tmy += (my - tmy) * 0.05;

    // Flottement 3D fluide
    mesh.rotation.x = Math.sin(t * 0.6) * 0.1 + tmy * -0.12;
    mesh.rotation.y = Math.sin(t * 0.4) * 0.15 + tmx * 0.15;
    mesh.rotation.z = Math.sin(t * 0.3) * 0.02;
    mesh.position.y = Math.sin(t * 0.7) * 0.2;

    // Lumière dynamique
    pointLight.position.x = Math.sin(t * 0.8) * 5;
    pointLight.position.y = Math.cos(t * 0.5) * 2.5;
    pointLight2.position.x = Math.cos(t * 0.6) * 4;

    // Rotation particules
    points.rotation.y += 0.003;
    points.rotation.x = Math.sin(t * 0.2) * 0.2;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    const W2 = el.clientWidth;
    const H2 = el.clientHeight;
    renderer.setSize(W2, H2);
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
  });
})();

// ── SCROLL ANIMATIONS ──────────────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// ── CURSOR GLOW ────────────────────────────────────────────────────────
const cursorGlow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
});