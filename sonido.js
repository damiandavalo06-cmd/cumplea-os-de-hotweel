/* ===== SONIDOS (se carga DESPUÉS de script.js y reemplaza sus funciones de audio) ===== */

// Motor tipo Fórmula 1: sube de revoluciones, "cambia de marcha" y chilla al final
function engine(on) {
  if (on && !eng) {
    ctx = ctx || new AC(); ctx.resume();
    const master = ctx.createGain(); master.gain.value = 0.0001;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5;
    const amp = ctx.createGain(); amp.gain.value = .2;
    lp.connect(amp).connect(master).connect(ctx.destination);
    const oscs = [['sawtooth', 1, .5], ['sawtooth', 2, .28], ['square', .5, .22]].map(([type, mult, vol]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = 80 * mult; g.gain.value = vol;
      o.connect(g).connect(lp); o.start();
      return { o, mult };
    });
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); // rugosidad del motor
    lfo.frequency.value = 42; lg.gain.value = .1; lfo.connect(lg).connect(amp.gain); lfo.start();
    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const nz = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng = ctx.createGain(); // aire/viento
    nz.buffer = nb; nz.loop = true; nf.type = 'bandpass'; nf.frequency.value = 2200; ng.gain.value = .05;
    nz.connect(nf).connect(ng).connect(master); nz.start();
    master.gain.setTargetAtTime(.15, ctx.currentTime, .05);
    eng = { oscs, lp, master, lfo, stop() { oscs.forEach(x => x.o.stop()); lfo.stop(); nz.stop(); } };
  } else if (!on && eng) {
    const e = eng; eng = null;
    e.master.gain.setTargetAtTime(0, ctx.currentTime, .06);
    setTimeout(() => e.stop(), 400);
  }
}

// Se llama en cada cuadro con la carga (0 a 100). Hay 3 "marchas": al cambiar, el motor baja y vuelve a subir.
function engineRpm(c) {
  if (!eng) return;
  const gear = Math.min(2, Math.floor(c / 33.4)), frac = (c - gear * 33.4) / 33.4;
  const base = [.08, .45, .55][gear];
  const rpm = holding ? base + (1 - base) * frac : .08 + .7 * c / 100; // al soltar baja suave
  const f = 70 + rpm * 640, t = ctx.currentTime;
  eng.oscs.forEach(x => x.o.frequency.setTargetAtTime(f * x.mult, t, .03));
  eng.lp.frequency.setTargetAtTime(500 + rpm * 3800, t, .05);
  eng.master.gain.setTargetAtTime(.14 + .1 * rpm, t, .05);
}

// Pasada de F1 al cruzar la meta (el sonido se aleja y baja de tono)
function rev() {
  ctx = ctx || new AC(); ctx.resume();
  const t = ctx.currentTime, g = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 4;
  lp.frequency.setValueAtTime(4000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 1.4);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.3, t + .15); g.gain.exponentialRampToValueAtTime(.0001, t + 1.5);
  [1, 2].forEach(m => {
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(700 * m, t); o.frequency.exponentialRampToValueAtTime(260 * m, t + 1.4);
    o.connect(lp); o.start(t); o.stop(t + 1.5);
  });
  lp.connect(g).connect(ctx.destination);
}

// Música de carrera: bombo, caja, hi-hat, bajo y melodía a 150 BPM (La menor - Fa - Do - Sol)
function synth() {
  ctx = ctx || new AC(); ctx.resume();
  clearInterval(timer);
  const bus = ctx.createGain(); bus.gain.value = .7; bus.connect(ctx.destination);
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const tone = (t, f, type, dur, vol, cut) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cut;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(lp).connect(g).connect(bus); o.start(t); o.stop(t + dur);
  };
  const noise = (t, dur, vol, hp) => {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = nb; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t); s.stop(t + dur);
  };
  const bombo = t => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
    g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .2);
    o.connect(g).connect(bus); o.start(t); o.stop(t + .2);
  };
  const roots = [45, 41, 48, 43];
  const chords = [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]];
  const arp = [0, 1, 2, 1, 2, 1, 0, 1];
  const st = 60 / 150 / 4; // duración de cada semicorchea
  let i = 0, next = ctx.currentTime + .05;
  timer = setInterval(() => {
    while (next < ctx.currentTime + .2) {
      const s = i % 16, bar = Math.floor(i / 16) % 4, t = next;
      if (s % 4 === 0 || (s === 10 && bar % 2)) bombo(t);
      if (s === 4 || s === 12) { noise(t, .15, .35, 1500); tone(t, 190, 'triangle', .1, .25, 3000); }
      noise(t, .04, s % 2 ? .12 : .06, 7000);
      if (s % 2 === 0) {
        const r = hz(roots[bar]);
        tone(t, s % 4 === 0 ? r : r * 2, 'sawtooth', st * 1.8, .22, 700);
        tone(t, hz(chords[bar][arp[s / 2]] + 12), 'square', st * 1.6, .07, 2600);
      }
      next += st; i++;
    }
  }, 50);
}
