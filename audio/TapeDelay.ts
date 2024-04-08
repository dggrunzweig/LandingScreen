import { createBiquadFilter, createStereoPanner, db2mag, createGain, createWaveShaper, RampToValue } from "./Utilities.ts";
import { HyperTanDistortionCurve } from "./SaturationDesigner.ts";

interface DLMHistory {
  time: number,
  delay: number
}

class TapeDelay {
  private ctx: AudioContext;
  public input: GainNode; // input
  private o: GainNode; // output gain
  private dt: number; // delay time
  private delay: DelayNode; // delay line
  public fb: GainNode; // feedback
  private p_l: StereoPannerNode; // panner left, create width
  private p_r: StereoPannerNode; // panner right, create width
  private wr: number; // wobble rate
  private wd: number; // wobble depth
  private r: Function; // psuedo random number generator function
  constructor(context: AudioContext, prng: Function, time: number, feedback = 0.3, wobble_rate = 0.2, wobble_depth = 0.1, eq_low_gain_dB = -1, eq_high_gain_dB = -2) {
    this.ctx = context;

    // input gain and output gain
    this.input = context.createGain();
    // output gain
    this.o = context.createGain();

    // Delay Line components
    this.dt = time;
    this.delay = context.createDelay(time + 0.1); // time + wobble room
    this.fb = createGain(context, feedback);

    // Tone Controls for feedback loop
    const eq_low = createBiquadFilter(context, "lowshelf", 500, 1.0, eq_low_gain_dB);
    const eq_high = createBiquadFilter(context, "highshelf", 2000, 1.0, eq_high_gain_dB);

    // Feedback loop effects
    // saturator
    const saturator = createWaveShaper(context, HyperTanDistortionCurve(0, 1.5));

    // diffusion
    const diffusion = createBiquadFilter(context, "allpass", 500, 1.0, 0.0);

    // connect 
    // eq and compress before going into delay line
    this.input.connect(eq_low).connect(eq_high).connect(saturator).connect(diffusion).connect(this.delay);
    this.delay.connect(this.fb).connect(eq_low); //fb loop
    this.delay.connect(this.o);

    // Panning
    this.p_l = createStereoPanner(context, -1);
    this.p_r = createStereoPanner(context, 1);
    const widening_l = createBiquadFilter(context, "allpass", 1000, 1.0, 0.0);
    const widening_r = createBiquadFilter(context, "allpass", 2000, 1.0, 0.0)
    this.o.connect(widening_l).connect(this.p_l);
    this.o.connect(widening_r).connect(this.p_r);

    // apply settings
    // wobble rate input is from 0 to 1
    // max rate is 10 Hz
    this.wr = 10 * wobble_rate;
    // wobble depth input is from 0 to 1
    // max depth is 40 ms
    this.wd = wobble_depth * 0.04;
    this.r = prng;
  }
  setFeedback(feedback_dB: number) {
    RampToValue(this.fb.gain, 0, db2mag(feedback_dB), 0.01);
  }
  setOutputGain(gain_dB: number) {
    RampToValue(this.o.gain, 0, db2mag(gain_dB), 0.01);
  }
  connect(node: AudioNode) {
    this.p_l.connect(node);
    this.p_r.connect(node);
  }



  dlm(history_data: DLMHistory, tla: number): DLMHistory {
    // modulate the delay line
    const tp = 1 / this.wr;
    const ct = this.ctx.currentTime;
    let t = history_data.time;
    let dl = history_data.delay;
    while (t < (ct + tla)) {
      // new delay time
      const d = this.dt + this.r() * this.wd;
      this.delay.delayTime.setValueCurveAtTime([dl, d], t, tp);
      t += tp;
      dl = d;
    }
    return { time: t, delay: dl }
  }

  start() {
    // modulate the delay line
    let data = { time: this.ctx.currentTime, delay: this.dt }
    const tla = 2; // timer look ahead
    data = this.dlm(data, tla);
    setInterval(() => {
      data = this.dlm(data, tla);
    }, tla * 500); // call timer twice per look ahead period
  }
}

export default TapeDelay;