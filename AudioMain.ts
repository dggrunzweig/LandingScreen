import Analyzer from './audio/Analyzer.ts'
import AudioMixer from './audio/AudioMixer.ts'
import LFO from './audio/LFO.ts'
import {NoteState, RandomMarkovCreate, RandomMarkovGenerateNote} from './audio/RandomMarkov.ts';
import {BitCrushCurve, HyperTanDistortionCurve} from './audio/SaturationDesigner.ts';
import TapeDelay from './audio/TapeDelay.ts'
import {BPMToTime, createAudioContext, createBiquadFilter, createGain, CreateNoiseOscillator, createOscillator, createReverb, createStereoPanner, createWaveShaper, db2mag, GetMaxAbsValue, NoteToPitch} from './audio/Utilities.ts';

interface ADSR {
  a: number, d: number, s: number, sl: number, r: number
}

interface OscDesc {
  type: OscillatorType, freq: number, adsr: ADSR
}

const SimpleFM =
    (ctx: AudioContext, output_node: GainNode, carrier_desc: OscDesc,
     mod_desc: OscDesc, mod_depth_hz: number, velocity: number,
     start_time: number, pan = 0) => {
      const adsr = carrier_desc.adsr;
      const mod_adsr = mod_desc.adsr;
      const osc =
          createOscillator(ctx, carrier_desc.type, carrier_desc.freq, 0);
      const mod = createOscillator(ctx, mod_desc.type, mod_desc.freq, 0);
      const mod_gain = createGain(ctx, mod_depth_hz);
      const mod_env = createGain(ctx, 0);
      const vca = createGain(ctx, 0.0);
      const panner = createStereoPanner(ctx, pan);
      const vel_gain = createGain(ctx, velocity);
      osc.connect(vca).connect(panner).connect(vel_gain).connect(output_node);
      mod.connect(mod_gain).connect(mod_env).connect(osc.frequency);
      osc.start();
      mod.start();
      vca.gain.setTargetAtTime(1, start_time, adsr.a / 2.5);
      vca.gain.setTargetAtTime(adsr.sl, start_time + adsr.a, adsr.d / 2.5);
      vca.gain.setTargetAtTime(
          0, start_time + adsr.a + adsr.d + adsr.s, adsr.r / 2.5);
      mod_env.gain.setTargetAtTime(1, start_time, mod_adsr.a / 2.5);
      mod_env.gain.setTargetAtTime(
          mod_adsr.sl, start_time + mod_adsr.a, mod_adsr.d / 2.5);
      mod_env.gain.setTargetAtTime(
          0, start_time + mod_adsr.a + mod_adsr.d + mod_adsr.s,
          mod_adsr.r / 2.5);
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

class AudioMain {
  private bpm = 60;
  private time_per_step: number;
  private ctx: AudioContext;
  private num_sequences = 3;
  private loaded = false;
  private started = false;
  private playing = false;
  private analyzer: Analyzer;
  private states: NoteState[];
  private transition_matrix: number[][];
  private output_gain: GainNode;
  private mixer: AudioMixer;
  private levels: number[];
  private sequence_inputs = new Array<GainNode>();
  private delay: TapeDelay;
  private chord_lfo: LFO;
  private seq_timers: number[];
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
    this.delay =
        new TapeDelay(this.ctx, Math.random, BPMToTime(this.bpm, 2 / 8), 0.4);

    this.output_gain = createGain(this.ctx, 0.0);
    createReverb(this.ctx, 4.1, 5000, false).then((send_b) => {
      this.mixer = new AudioMixer(this.output_gain, this.delay.input, send_b);
      this.delay.connect(this.output_gain);
      send_b.connect(this.output_gain);

      const noise = CreateNoiseOscillator(this.ctx);
      const noise_filter =
          createBiquadFilter(this.ctx, 'lowpass', 4000, 1.0, 0.0);
      noise.connect(noise_filter)
          .connect(this.mixer.AddTrack(this.ctx, -45, -40, -40, 0));
      this.startable_nodes.push(noise);

      // const saturator =
      //     createWaveShaper(this.ctx, HyperTanDistortionCurve(0, 0), '4x');

      // chord
      const chord_osc_1 =
          createOscillator(this.ctx, 'sine', NoteToPitch('C', 3), 0);
      const chord_osc_2 =
          createOscillator(this.ctx, 'sine', NoteToPitch('G', 3), 0);
      const chord_osc_3 =
          createOscillator(this.ctx, 'sine', NoteToPitch('D', 4), 0);
      this.startable_nodes.push(chord_osc_1, chord_osc_2, chord_osc_3);
      const chord_gain = createGain(this.ctx, 0);
      chord_osc_1.connect(chord_gain);
      chord_osc_2.connect(chord_gain);
      chord_osc_3.connect(chord_gain);
      this.chord_lfo = new LFO(this.ctx, 0.1, db2mag(-40), db2mag(-20));
      this.chord_lfo.connect(chord_gain.gain);
      chord_gain.connect(this.mixer.AddTrack(this.ctx, 0, -12, -24, 0));

      // sequence inputs
      for (let i = 0; i < this.num_sequences; ++i) {
        this.sequence_inputs.push(this.mixer.AddTrack(this.ctx, -6, -6, -6, 0));
      }

      this.output_gain.connect(this.ctx.destination);
      this.loaded = true;
    });
  }
  private ScheduleNotes(
      out: GainNode, ci: number, ct: number, la: number, oct_multiplier: number,
      prob: number, step_mod: number, mod_depth: number, mod_rate: number,
      attack = 0.1, velocity = 1.0): number[] {
    const now = this.ctx.currentTime;
    while (ct < now + la) {
      const cs = this.states[ci];  // current state
      const note_frequency = NoteToPitch(cs.n, cs.o) * oct_multiplier;
      const pan = 2 * Math.random() - 1;
      const r_t = cs.d * this.time_per_step * step_mod;
      const main_adsr = {
        a: attack,
        d: 0.5 * r_t,
        s: 0.2,
        sl: db2mag(-9),
        r: r_t,
      };
      const mod_adsr = {...main_adsr, d: 0.4, sl: db2mag(-40)};


      if (Math.random() < prob) {
        const c_d = {
          type: <OscillatorType>'sine',
          freq: note_frequency,
          adsr: main_adsr
        };
        const m_d = {
          type: <OscillatorType>'sine',
          freq: mod_rate * note_frequency,
          adsr: mod_adsr
        };
        SimpleFM(this.ctx, out, c_d, m_d, mod_depth, velocity, ct, pan);
      }
      ci = RandomMarkovGenerateNote(ci, this.transition_matrix);
      ct += main_adsr.r;
    }
    return [ci, ct];
  }
  public GetMixerLevels(peak = true, alpha = 0.98) {
    if (this.loaded && this.started) {
      let new_levels = this.mixer.GetMixerLevels(!peak);
      if (this.levels) {
        new_levels = this.levels.map((val, i) => {
          return alpha * val + (1 - alpha) * new_levels[i];
        });
      }
      this.levels = new_levels;
      return new_levels;
    }
    return new Array(this.num_sequences + 2).fill(0);
  }
  public start() {
    if (this.ctx.state == 'suspended') {
      this.ctx.resume();
      console.log('context resumed');
    }
    if (this.loaded) {
      if (!this.started) {
        this.startable_nodes.forEach((node) => {node.start()});
        this.delay.start();
        this.chord_lfo.start();
        this.started = true;
      }
      if (this.playing) {
        console.log('Pause');
        const fade_out = 2.0;
        this.output_gain.gain.setTargetAtTime(0, 0, fade_out / 2.5);
        setTimeout(() => {
          this.seq_timers.forEach((timer) => {clearTimeout(timer)});
        }, fade_out * 1000);
      } else {
        console.log('Play');
        this.ct = new Array(this.num_sequences).fill(this.ctx.currentTime);
        this.ci = new Array(this.num_sequences)
                      .fill(0)
                      .map(
                          () => {return Math.floor(
                              Math.random() * this.states.length)});
        const la = 2;
        const velocity = [db2mag(-6), 1., db2mag(-30)];
        const oct = [1, 4, 20];
        const prob = [0.7, 0.2, 0.1];
        const step_mod = [4, 2, 8];
        const mod_depth = [40, 200, 200];
        const mod_rate = [1.502, 3.03, 0.05];
        const attack = [0.9, 0.01, 4.0];
        this.seq_timers = new Array(this.num_sequences).fill(0).map((_, i) => {
          // initial scheduling
          [this.ci[i], this.ct[i]] = this.ScheduleNotes(
              this.sequence_inputs[i], this.ci[i], this.ct[i], la, oct[i],
              prob[i], step_mod[i], mod_depth[i], mod_rate[i], attack[i],
              velocity[i]);
          // rescheduling every la seconds
          return setInterval(() => {
            [this.ci[i], this.ct[i]] = this.ScheduleNotes(
                this.sequence_inputs[i], this.ci[i], this.ct[i], la, oct[i],
                prob[i], step_mod[i], mod_depth[i], mod_rate[i], attack[i],
                velocity[i]);
          }, la * 1000);
        });
        this.output_gain.gain.setTargetAtTime(1, this.ctx.currentTime, 4.0);
      }
      this.playing = !this.playing;
    }
  }
}

export default AudioMain;