import Analyzer from './audio/Analyzer.ts'
import LFO from './audio/LFO.ts'
import {NoteState, RandomMarkovCreate, RandomMarkovGenerateNote} from './audio/RandomMarkov.ts';
import {HyperTanDistortionCurve} from './audio/SaturationDesigner.ts';
import TapeDelay from './audio/TapeDelay.ts'
import {BPMToTime, createAudioContext, createBiquadFilter, createGain, CreateNoiseOscillator, createOscillator, createStereoPanner, db2mag, NoteToPitch} from './audio/Utilities.ts';

interface ADSR {
  a: number, d: number, s: number, sl: number, r: number
}
class AudioMain {
  private bpm = 60;
  private time_per_step: number;
  private ctx: AudioContext;
  private loaded = false;
  private started = false;
  private playing = false;
  private analyzer: Analyzer;
  private states: NoteState[];
  private transition_matrix: number[][];
  private output_gain: GainNode;
  private gain_node: GainNode;
  private seq_timer_1: number;
  private seq_timer_2: number;
  private ci: number[];
  private ct: number[];
  private startable_nodes = new Array<AudioNode>();
  constructor() {
    this.ctx = createAudioContext();
    this.time_per_step = BPMToTime(this.bpm, 1 / 16);
    console.log(this.time_per_step);
    this.states = [
      {n: 'C', o: 1, d: 8},
      {n: 'C', o: 2, d: 2},
      {n: 'C', o: 2, d: 5},
      {n: 'C', o: 2, d: 9},
      {n: 'D', o: 2, d: 4},
      {n: 'E', o: 2, d: 4},
      {n: 'E', o: 2, d: 6},
      {n: 'E', o: 2, d: 7},
      {n: 'F#', o: 2, d: 2},
      {n: 'F#', o: 2, d: 3},
      {n: 'G', o: 2, d: 4},
      {n: 'G', o: 2, d: 8},
      {n: 'G', o: 3, d: 1},
      {n: 'A', o: 2, d: 2},
      {n: 'B', o: 2, d: 3},
      {n: 'B', o: 2, d: 5},
      {n: 'C', o: 3, d: 4},
      {n: 'C', o: 3, d: 5},
    ];

    this.transition_matrix = RandomMarkovCreate(this.states);

    this.analyzer = new Analyzer(this.ctx);
    this.gain_node = createGain(this.ctx, db2mag(-30));
    const delay = new TapeDelay(this.ctx, Math.random, 0.25, 0.6);

    delay.start();
    const noise = CreateNoiseOscillator(this.ctx);
    const noise_gain = createGain(this.ctx, db2mag(-70));
    const noise_filter =
        createBiquadFilter(this.ctx, 'lowpass', 4000, 1.0, 0.0);
    const saturator = this.ctx.createWaveShaper();
    saturator.curve = HyperTanDistortionCurve(-3, 9);
    saturator.oversample = '4x';
    const chord_osc_1 =
        createOscillator(this.ctx, 'sine', NoteToPitch('C', 3), 0);
    const chord_osc_2 =
        createOscillator(this.ctx, 'sine', NoteToPitch('G', 3), 0);
    const chord_osc_3 =
        createOscillator(this.ctx, 'sine', NoteToPitch('D', 4), 0);
    this.startable_nodes.push(chord_osc_1);
    this.startable_nodes.push(chord_osc_2);
    this.startable_nodes.push(chord_osc_3);
    const chord_gain = createGain(this.ctx, db2mag(-48));
    chord_osc_1.connect(chord_gain);
    chord_osc_2.connect(chord_gain);
    chord_osc_3.connect(chord_gain);
    const chord_lfo = new LFO(this.ctx, 0.1, db2mag(-60), db2mag(-40));
    chord_lfo.connect(chord_gain.gain);
    chord_lfo.start();

    this.gain_node.connect(this.analyzer.getInputNode());
    this.gain_node.connect(delay.input);
    this.gain_node.connect(saturator);
    delay.connect(saturator);
    delay.setOutputGain(-9);
    noise.connect(noise_filter).connect(noise_gain).connect(saturator);
    chord_gain.connect(delay.input);

    this.output_gain = createGain(this.ctx, 0.0);
    saturator.connect(this.output_gain).connect(this.ctx.destination);
    this.startable_nodes.push(noise);
    this.loaded = true;
  }
  private SimpleFM(
      output_node: GainNode, osc_type: OscillatorType, osc_freq: number,
      mod_type: OscillatorType, mod_freq: number, mod_depth_hz: number,
      start_time: number, adsr: ADSR, pan = 0) {
    const osc = createOscillator(this.ctx, osc_type, osc_freq, 0);
    const mod = createOscillator(this.ctx, mod_type, mod_freq, 0);
    const mod_gain = createGain(this.ctx, mod_depth_hz);
    const vca = createGain(this.ctx, 0.0);
    const panner = createStereoPanner(this.ctx, pan);
    osc.connect(vca).connect(panner).connect(output_node);
    mod.connect(mod_gain).connect(osc.frequency);
    osc.start();
    mod.start();
    vca.gain.setTargetAtTime(1, start_time, adsr.a / 2.5);
    vca.gain.setTargetAtTime(adsr.sl, start_time + adsr.a, adsr.d / 2.5);
    vca.gain.setTargetAtTime(
        0, start_time + adsr.a + adsr.d + adsr.s, adsr.r / 2.5);
    setTimeout(() => {
      osc.stop();
      mod.stop();
      osc.disconnect();
      mod.disconnect();
      mod_gain.disconnect();
      vca.disconnect();
      panner.disconnect();
    }, (start_time + adsr.a + adsr.d + adsr.s + adsr.r) * 1000);
  }
  private ScheduleNotes(
      oct_multiplier: number, ci: number, ct: number, la: number): number[] {
    const now = this.ctx.currentTime;
    while (ct < now + la) {
      const cs = this.states[ci];  // current state
      const note_frequency = NoteToPitch(cs.n, cs.o) * oct_multiplier;
      const attack_durations = [0.005, 0.01, 0.1];
      const pan = 2 * Math.random() - 1;
      const adsr = {
        a: attack_durations[Math.floor(
            Math.random() * attack_durations.length)],
        d: 0.2,
        s: 0.2,
        sl: db2mag(-9),
        r: cs.d * this.time_per_step
      };

      this.SimpleFM(
          this.gain_node, 'sine', note_frequency, 'sine', 3.01 * note_frequency,
          40, ct, adsr, pan);
      ci = RandomMarkovGenerateNote(ci, this.transition_matrix);
      const note_duration = adsr.a + adsr.d + adsr.s + adsr.r;
      ct += cs.d * this.time_per_step;
    }
    return [ci, ct];
  }
  public start() {
    if (this.ctx.state == 'suspended') {
      this.ctx.resume();
      console.log('context resumed');
    }
    if (this.loaded) {
      if (!this.started) {
        this.startable_nodes.forEach((node) => {node.start()});
        this.started = true;
      }
      if (this.playing) {
        console.log('Pause');
        clearTimeout(this.seq_timer_1);
        clearTimeout(this.seq_timer_2);
        this.output_gain.gain.setTargetAtTime(0, 0, 2.0);
      } else {
        console.log('Play');
        this.ct = new Array(2).fill(this.ctx.currentTime);
        this.ci = new Array(2).fill(0).map(
            () => {return Math.floor(Math.random() * this.states.length)});
        const la = 2;
        this.seq_timer_1 = setInterval(() => {
          [this.ci[0], this.ct[0]] =
              this.ScheduleNotes(2, this.ci[0], this.ct[0], la);
        }, la * 1000);
        this.seq_timer_2 = setInterval(() => {
          [this.ci[1], this.ct[1]] =
              this.ScheduleNotes(1, this.ci[1], this.ct[1], la);
        }, la * 1000);
        this.output_gain.gain.setTargetAtTime(1, 0, 2.0);
      }
      this.playing = !this.playing;
    }
  }
}

export default AudioMain;