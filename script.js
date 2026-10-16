/* ====== EDITÁ SOLO ESTO ====== */
const CONFIG = {
  nombre: 'DAMIÁN',
  edad: 7,
  fecha: '2026-11-21T17:00:00',          // AAAA-MM-DDTHH:MM:SS
  lugar: 'Salón de fiestas "Pista Veloz"',
  direccion: 'Salta Capital, Argentina',  // se usa para el mapa
  whatsapp: '5493870000000',              // código país + área + número, sin + ni espacios
  musica: 'musica/hotwheels.mp3',         // opcional: si no existe, suena una música generada
  galeria: ['1.png', '2.png', '3.png', '4.png', '5.png']
};
/* ============================== */

const $ = id => document.getElementById(id);
const fecha = new Date(CONFIG.fecha);

// Textos
$('nombre').textContent = CONFIG.nombre;
$('introNombre').textContent = CONFIG.nombre + '!';
$('edad').textContent = CONFIG.edad;
$('fechaTxt').textContent = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
$('horaTxt').textContent = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
$('lugarTxt').textContent = CONFIG.lugar;
const q = encodeURIComponent(CONFIG.direccion);
$('map').src = `https://maps.google.com/maps?q=${q}&output=embed`;
$('como').href = `https://www.google.com/maps/search/?api=1&query=${q}`;

// Galería (agregá más fotos al array de CONFIG.galeria)
CONFIG.galeria.forEach((n, i) => {
  const img = new Image();
   img.src = `imagenes/${n}`; img.alt = 'Hot Wheels'; img.className = 'rv';
  img.style.transitionDelay = i * 0.1 + 's';
  $('gallery').appendChild(img);
});
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('on')), { threshold: .2 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// Cuenta regresiva
let prev = {};
function tick() {
  let diff = fecha - new Date();
  if (diff <= 0) { $('count').hidden = true; $('fin').hidden = false; return; }
  const v = {
    d: Math.floor(diff / 864e5),
    h: Math.floor(diff % 864e5 / 36e5),
    m: Math.floor(diff % 36e5 / 6e4),
    s: Math.floor(diff % 6e4 / 1e3)
  };
  for (const k in v) {
    const el = $(k);
    if (prev[k] !== v[k]) {
      el.textContent = String(v[k]).padStart(2, '0');
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    }
  }
  prev = v;
}
setInterval(tick, 1000); tick();

// ===== Sonido =====
let ctx, timer, audio, playing = false;
const AC = window.AudioContext || window.webkitAudioContext;

function rev() { // sonido de motor al arrancar
  ctx = ctx || new AC();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(60, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + .9);
  g.gain.setValueAtTime(.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + 1);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 1);
}
function beep(f, type, dur, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
}
function kick() {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(150, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + .15);
  g.gain.setValueAtTime(.4, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .2);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + .2);
}
function synth() { // música "racing" generada con el navegador
  ctx = ctx || new AC(); ctx.resume();
  const notes = [110, 110, 131, 110, 147, 110, 131, 165]; let i = 0;
  clearInterval(timer);
  timer = setInterval(() => {
    const n = notes[i % 8];
    beep(n, 'sawtooth', .18, .1);
    if (i % 2 === 0) beep(n * 4, 'square', .1, .04);
    if (i % 4 === 0) kick();
    i++;
  }, 214);
}
function playMusic() {
  playing = true; $('music').textContent = '🔊';
  if (!CONFIG.musica) return synth();
  audio = audio || new Audio(CONFIG.musica);
  audio.loop = true; audio.volume = .6;
  audio.addEventListener('error', synth, { once: true });
  audio.play().catch(synth);
}
function stopMusic() {
  playing = false; $('music').textContent = '🔇';
  clearInterval(timer); audio && audio.pause();
}
$('music').onclick = () => playing ? stopMusic() : playMusic();

// ===== Confeti =====
const cv = $('confetti'), c2 = cv.getContext('2d'); let ps = [];
function resize() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener('resize', resize); resize();
function confetti() {
  const cols = ['#ffd400', '#ff6a00', '#e8191c', '#fff', '#2e8bff'];
  for (let i = 0; i < 150; i++) ps.push({
    x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 3,
    s: Math.random() * 8 + 4, c: cols[i % 5], r: Math.random() * 6
  });
  loop();
}
function loop() {
  c2.clearRect(0, 0, cv.width, cv.height);
  ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.r += .2;
    c2.save(); c2.translate(p.x, p.y); c2.rotate(p.r); c2.fillStyle = p.c; c2.fillRect(-p.s / 2, -p.s / 2, p.s, p.s / 2); c2.restore(); });
  ps = ps.filter(p => p.y < innerHeight + 20);
  if (ps.length) requestAnimationFrame(loop);
}

// ===== Entrada: mantené apretado para acelerar -> sale disparado -> bandera a cuadros =====
let charge = 0, holding = false, launched = false, eng, engG;
const fill = $('fill'), car = $('carpic');
function engine(on) {
  if (on && !eng) {
    ctx = ctx || new AC(); ctx.resume();
    eng = ctx.createOscillator(); engG = ctx.createGain();
    eng.type = 'sawtooth'; engG.gain.value = .08;
    eng.connect(engG).connect(ctx.destination); eng.start();
  } else if (!on && eng) { eng.stop(); eng = null; }
}
function step() {
  if (launched) return;
  charge = Math.max(0, Math.min(100, charge + (holding ? 1.4 : -3)));
  fill.style.strokeDashoffset = 339.3 * (1 - charge / 100);
  $('intro').style.setProperty('--p', charge / 100); // el auto avanza por la ruta
  car.classList.toggle('rev', holding && charge > 5);
    engineRpm(charge);
  if (charge >= 100) return launch();
  if (holding || charge > 0) requestAnimationFrame(step); else { engine(false); car.classList.remove('rev'); }
}
function press() { if (launched) return; holding = true; engine(true); requestAnimationFrame(step); }
function release() { holding = false; }
function launch() {
  launched = true; engine(false); rev();
  car.classList.remove('rev'); car.classList.add('go');
  setTimeout(() => $('wipe').classList.add('run'), 350);
  setTimeout(() => {
    $('intro').style.display = 'none';
    $('invite').hidden = false;
    scrollTo(0, 0); playMusic(); confetti();
  }, 1100);
}
const b = $('start');
b.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, release));
b.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
b.addEventListener('keyup', release);

// ===== Confirmación por WhatsApp =====
function enviar(va) {
  const nombre = $('quien').value.trim();
  if (!nombre) { $('quien').focus(); $('quien').placeholder = 'Escribí tu nombre primero'; return; }
  const txt = va
    ? `¡Hola! Soy ${nombre} y confirmo mi asistencia al cumple de ${CONFIG.nombre} 🏎️🏁 Vamos ${$('cant').value}.`
    : `¡Hola! Soy ${nombre}. Lamentablemente no podré ir al cumple de ${CONFIG.nombre}. ¡Que lo disfruten!`;
  if (va) confetti();
  setTimeout(() => open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`, '_blank'), va ? 900 : 0);
}
$('ok').onclick = () => enviar(true);
$('no').onclick = () => enviar(false);
