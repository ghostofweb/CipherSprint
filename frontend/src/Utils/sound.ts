import type { Settings } from '@ciphersprint/shared';

// Key sounds synthesised with Web Audio: no files to download, instant to
// start, and each press varies slightly so it never sounds like a loop.

type Sound = Exclude<Settings['sound'], 'off'>;

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor({ latencyHint: 'interactive' });
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
}

// 60ms of white noise, reused as the body of every click.
function noiseBuffer(ac: AudioContext): AudioBuffer {
    if (noise) return noise;
    const len = Math.floor(ac.sampleRate * 0.06);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noise;
}

const PROFILES: Record<Sound, { freq: number; q: number; decay: number; tone: number; toneDecay: number; gain: number }> = {
    // A short, bright tick.
    click: { freq: 3200, q: 1.2, decay: 0.03, tone: 0, toneDecay: 0, gain: 0.55 },
    // A heavier strike with a low body, like a type bar landing.
    typewriter: { freq: 1800, q: 0.8, decay: 0.05, tone: 140, toneDecay: 0.06, gain: 0.75 },
    // Muffled, for quiet rooms.
    soft: { freq: 900, q: 0.7, decay: 0.04, tone: 0, toneDecay: 0, gain: 0.4 },
};

export function playKeySound(kind: Settings['sound'], volume: number, error = false) {
    if (kind === 'off' || volume <= 0) return;
    const ac = context();
    if (!ac) return;
    const p = PROFILES[kind];
    const t = ac.currentTime;
    const vary = 0.9 + Math.random() * 0.2;

    const master = ac.createGain();
    master.gain.value = volume;
    master.connect(ac.destination);

    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(ac);
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = p.freq * vary;
    filter.Q.value = p.q;
    const env = ac.createGain();
    env.gain.setValueAtTime(p.gain, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + p.decay);
    src.connect(filter).connect(env).connect(master);
    src.start(t);
    src.stop(t + p.decay + 0.01);

    if (p.tone) {
        const osc = ac.createOscillator();
        osc.frequency.value = p.tone * vary;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + p.toneDecay);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + p.toneDecay + 0.01);
    }

    // A low, short buzz on a wrong key, only if asked for.
    if (error) {
        const osc = ac.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 110;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g).connect(master);
        osc.start(t);
        osc.stop(t + 0.1);
    }
}
