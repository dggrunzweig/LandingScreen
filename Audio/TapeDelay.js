import SmoothNoiseLFO from "./SmoothNoiseLFO.js"

class TapeDelay {
    constructor(context, time, feedback = 0.3, echo_mix = 1.0, wobble_rate = 0.2, wobble_depth = 0.1, eq_low_gain_dB = -1, eq_high_gain_dB = -2) {
      this.context = context;

      // input gain and output gain
      this.input = this.context.createGain();
      this.output = this.context.createGain();

      // Delay Line components
      this.delay_time = time;
      this.delay = context.createDelay(time);
      this.delay.delayTime.value = time;
      this.feedback = context.createGain();
      this.feedback.gain.value = feedback;

      // Delay Line modulation
      this.delay_line_mod = new SmoothNoiseLFO(context, wobble_rate);

      // Tone Controls for feedback loop
      this.eq_low = context.createBiquadFilter();
      this.eq_low.type = "lowshelf";
      this.eq_low.gain.setValueAtTime(0, this.context.currentTime); // dB
      this.eq_low.frequency.value = 500;  

      this.eq_high = context.createBiquadFilter();
      this.eq_high.type = "highshelf";
      this.eq_high.gain.setValueAtTime(0, this.context.currentTime); // dB
      this.eq_high.frequency.value = 2000;

      // Feedback loop effects
      // saturator
      this.saturator = this.context.createWaveShaper();      
      this.saturator.curve = this.HyperTanDistortionCurve(0, 1.5);
      this.saturator.oversample = "4x";

      // diffusion
      this.diffuser = this.context.createBiquadFilter();
      this.diffuser.type = "allpass";
      this.diffuser.frequency.value = 500;
      this.diffuser.gain.value = 0.707;

      // Wet/Dry mix controls
      this.dry = context.createGain();
      this.wet = context.createGain();
      
      // create dry path
      this.input.connect(this.dry);
      this.dry.connect(this.output);

      // create wet path
      // eq and compress before going into delay line
      this.input.connect(this.eq_low).connect(this.eq_high).connect(this.saturator).connect(this.diffuser).connect(this.delay);
      this.delay.connect(this.feedback);
      this.feedback.connect(this.eq_low);
      this.delay.connect(this.wet);
      this.wet.connect(this.output);

      // LFO connections
      this.delay_line_mod.connect(this.delay.delayTime);
      this.delay_line_mod.start();

      // Panning
      this.pan_left = context.createStereoPanner();
      this.pan_right = context.createStereoPanner();
      this.pan_left.pan.value = -1;
      this.pan_right.pan.value = 1;
      this.widener = context.createBiquadFilter();
      this.widener.type = "allpass";
      this.widener.frequency.value = 1000;
      this.output.connect(this.widener).connect(this.pan_left);
      this.output.connect(this.pan_right);

      // apply settings
      this.updateEQLowGain(eq_low_gain_dB);
      this.updateEQHighGain(eq_high_gain_dB);
      this.updateDryWet(echo_mix);
      this.updateWobbleRate(wobble_rate);
      this.updateWobbleDepth(wobble_depth);
    }
    updateDelayTime(time) {
      this.delay_time = time;
      this.delay.delayTime.linearRampToValueAtTime(
        time,
        this.context.currentTime + 0.01
      );
    }
    updateFeedback(level) {
      this.feedback.gain.linearRampToValueAtTime(
        level,
        this.context.currentTime + 0.2
      );
    }
    updateDryWet(gain) {
      this.wet.gain.linearRampToValueAtTime(
        gain,
        this.context.currentTime + 0.01
      );
      this.dry.gain.linearRampToValueAtTime(
        1 - gain,
        this.context.currentTime + 0.01
      );
    }
    updateWobbleRate(rate) {
      // rate is from 0 to 1
      // max rate is 10 Hz
      this.wobble_rate = 10 * rate;
      this.delay_line_mod.setRate(this.wobble_rate);
    }
    updateWobbleDepth(depth) {
      // max variation is 20 ms
      depth = depth * 0.04;
      this.wobble_depth = depth;
      this.delay_line_mod.setRange(this.delay_time, this.delay_time + depth);
    }
    updateEQLowGain(gain_dB) {
      this.eq_low.gain.setValueAtTime(gain_dB, this.context.currentTime); // dB
    }
    updateEQHighGain(gain_dB) {
      this.eq_high.gain.setValueAtTime(gain_dB, this.context.currentTime); // dB
    }
    updateDistortionCurve(curve) {
      curve = Math.round(curve);
      if (curve == 0) this.saturator.curve = this.HyperTanDistortionCurve(0, 1.5);
      if (curve == 1) this.saturator.curve = this.HyperTanDistortionCurve(0, 3);
    }

    // A hyper tan distortion curve
    // ceiling -> max allowable output volume
    // boost_dB -> a boosting factor in decibels, the higher it is the more easily the signal will distort
    // curve_size -> the resolution of the curve, default is 512
    HyperTanDistortionCurve(ceiling_dB = 0, boost_dB = 3, curve_size = 512) {
      const curve = new Float32Array(curve_size);

      // a lower ceiling will result in the signal breaking up at lower volumes
      let scalar = Math.pow(10,ceiling_dB / 20);
      let scalar_boost = Math.pow(10,boost_dB / 20);

      for (let i = 0; i < curve_size; i++) {
        // from -1 to 1
        const x = (i * 2) / curve_size - 1;
        curve[i] = scalar * Math.tanh(scalar_boost * x);
      }
      return curve;
    }
    connect(node) {
      this.pan_left.connect(node);
      this.pan_right.connect(node);
    }
  }

export default TapeDelay;