/**
 * Generates a calm, royalty-free ambient soundtrack with the Web Audio API and
 * exposes it as a MediaStream, so it can be mixed into the demo-video recording.
 * Nothing is loaded from disk — the music is synthesised, so there are no
 * licensing concerns.
 */
export function startStudioMusic(): { stream: MediaStream; stop: () => void } {
  const Ctor: typeof AudioContext =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctor();
  void ctx.resume();

  const dest = ctx.createMediaStreamDestination();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(dest);
  master.connect(ctx.destination); // also audible while recording

  const now = ctx.currentTime;
  master.gain.linearRampToValueAtTime(0.22, now + 1.5);

  // ── Warm pad: three detuned oscillators through a low-pass filter ──────────
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1100;
  filter.connect(master);

  const padGain = ctx.createGain();
  padGain.gain.value = 0.11;
  padGain.connect(filter);

  // Gentle I–vi–IV–V progression (C, Am, F, G), each held for one bar.
  const chords: number[][] = [
    [261.63, 329.63, 392.0],
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 261.63],
    [196.0, 246.94, 293.66],
  ];
  const barLen = 3;
  const padOscs = [0, 1, 2].map((i) => {
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.detune.value = (i - 1) * 6; // slight chorus
    o.connect(padGain);
    o.start();
    return o;
  });
  for (let bar = 0; bar < 16; bar++) {
    const chord = chords[bar % chords.length] ?? chords[0]!;
    const t = now + bar * barLen;
    padOscs.forEach((o, i) => o.frequency.setValueAtTime(chord[i] ?? 261.63, t));
  }

  // ── Bell arpeggio (lookahead scheduler) ────────────────────────────────────
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0];
  const noteEvery = 0.3;
  let step = 0;
  let nextTime = now + 1.5;
  const scheduleAhead = () => {
    const horizon = ctx.currentTime + 0.4;
    while (nextTime < horizon) {
      const base = scale[step % scale.length] ?? 523.25;
      const freq = step % 8 < 4 ? base : base / 2;
      const g = ctx.createGain();
      g.connect(master);
      g.gain.setValueAtTime(0.0001, nextTime);
      g.gain.linearRampToValueAtTime(0.09, nextTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0006, nextTime + 0.5);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = freq;
      o.connect(g);
      o.start(nextTime);
      o.stop(nextTime + 0.55);
      step++;
      nextTime += noteEvery;
    }
  };
  scheduleAhead();
  const interval = window.setInterval(scheduleAhead, 200);

  const stop = () => {
    window.clearInterval(interval);
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(0, t + 0.2);
    window.setTimeout(() => {
      padOscs.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      void ctx.close().catch(() => {});
    }, 300);
  };

  return { stream: dest.stream, stop };
}
