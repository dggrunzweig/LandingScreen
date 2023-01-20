import NoiseOscillator from "./NoiseOscillator.js";
import SmoothNoiseLFO from "./SmoothNoiseLFO.js";
import {intervals, db2mag, mag2db, shuffle} from "./Utilities.js"

class ChordModule {
    constructor(context, frequency, cutoff_fc, duration_ms, variation = 0, transition_time = 0.01) {
      // create components and set default values
      this.context = context;
      this.current_variation = variation;
      this.transition_time = transition_time;
      this.output_gain = 1.0;
      this.current_pitch = 98;

      // default chord
      this.chord_notes = [intervals.root, intervals.second, intervals.fourth, intervals.major_sixth];

     // create custom waveform by defining gain of integer overtones
      const real = new Float32Array(4);
      const imag = new Float32Array(4);
      real[0] = 0; //DC
      imag[0] = 0; //DC
      real[1] = 1; //Fundamental
      imag[1] = 0;
      real[2] = db2mag(-12); //2nd Harmonic
      imag[2] = 0;
      real[3] = db2mag(-10); //3rd Harmonic
      imag[3] = 0;

      const wave = this.context.createPeriodicWave(real, imag);

      // voice 1 - 4
      let current_time = context.currentTime;
      this.voice_1 = this.context.createOscillator();
      this.voice_1.setPeriodicWave(wave);
      this.voice_1.frequency.setValueAtTime(frequency, current_time);
      this.voice_1.detune.setValueAtTime(10, current_time);
      this.voice_1.start();
      
      this.voice_2 = this.context.createOscillator();
      this.voice_2.setPeriodicWave(wave);
      this.voice_2.frequency.setValueAtTime(frequency, current_time);
      this.voice_2.detune.setValueAtTime(5, current_time);
      this.voice_2.start();

      this.voice_3 = this.context.createOscillator();
      this.voice_3.setPeriodicWave(wave);
      this.voice_3.frequency.setValueAtTime(frequency, current_time);
      this.voice_3.detune.setValueAtTime(1, current_time);
      this.voice_3.start();

      this.voice_4 = this.context.createOscillator();
      this.voice_4.setPeriodicWave(wave);
      this.voice_4.frequency.setValueAtTime(frequency, current_time);
      this.voice_4.detune.setValueAtTime(7, current_time);
      this.voice_4.start();

      // high pass filter
      this.filter_1 = this.context.createBiquadFilter();
      this.filter_1.type = "highpass";
      this.filter_1.frequency.setValueAtTime(cutoff_fc, current_time);

      // filter LFO
      this.filter_1_lfo = this.context.createOscillator();
      this.filter_1_lfo.type = "triangle";
      this.filter_1_lfo.frequency.setValueAtTime(1/10, current_time);
      this.filter_1_lfo.start();

      this.filter_1_lfo_depth = this.context.createGain();
      this.filter_1_lfo_depth.gain.setValueAtTime(0, current_time);

      // FM Oscillator
      this.fm_osc = new SmoothNoiseLFO(context,1);
      this.fm_osc.setRange(0, 3);
      this.fm_osc.start();
      this.fm_osc.connect(this.voice_1.frequency);
      this.fm_osc.connect(this.voice_2.frequency);
      this.fm_osc.connect(this.voice_3.frequency);
      this.fm_osc.connect(this.voice_4.frequency);


      // enveloped vca
      this.vca_1 = this.context.createGain();
      this.vca_1.gain.setValueAtTime(0, current_time);
      this.output = this.context.createGain();
      this.output.gain.setValueAtTime(1, current_time);
      this.attackTime = 0.1;
      this.releaseTime = duration_ms / 1000;

      // a bit of noise for analog vibez
      this.noise_module = new NoiseOscillator(context);
      this.noise_gain = context.createGain();
      this.noise_module.low_pass_filter.frequency.setValueAtTime(3000, current_time);
      let noise_volume_dB = -42;
      let noise_volume_scalar = db2mag(noise_volume_dB);
      this.noise_gain.gain.setValueAtTime(noise_volume_scalar, current_time);
      this.noise_module.output.connect(this.noise_gain);
      this.noise_module.start();

      // connect it up
      // voice 1 -> filter -> velocity -> vca
      // voice 2
      // voice 3
      // voice 4
      //                        noise  -> vca
      this.voice_1.connect(this.filter_1);
      this.voice_2.connect(this.filter_1);
      this.voice_3.connect(this.filter_1);
      this.voice_4.connect(this.filter_1);
      this.filter_1.connect(this.vca_1).connect(this.output);
      this.noise_gain.connect(this.vca_1);


      // lfo for filter
      this.filter_1_lfo.connect(this.filter_1_lfo_depth).connect(this.filter_1.frequency);

      // initialize chord
      this.setChord(frequency, variation);

    }
    setSynthWaveform(periodic_waveform) {
      this.voice_1.setPeriodicWave(periodic_waveform);
      this.voice_2.setPeriodicWave(periodic_waveform);
      this.voice_3.setPeriodicWave(periodic_waveform);
      this.voice_4.setPeriodicWave(periodic_waveform);
    }
    setSynthNoiseGain(gain_dB) {
      let noise_volume_scalar = db2mag(gain_dB);
      this.noise_gain.gain.setValueAtTime(noise_volume_scalar, this.context.currentTime);
    }
    setFMSettings(fm_multiplier, depth_hz) {
      this.fm_osc.setRate(fm_multiplier);
      this.fm_osc.setRange(0, depth_hz);
    }
    setOutputVolume(gain_dB) {
      this.output_gain = Math.pow(10, gain_dB / 20.0);
      this.output.gain.linearRampToValueAtTime(this.output_gain, this.context.currentTime + 0.01);
    }
    setFilterCutoffParameters(fc_hz, q_value = 0.25) {
      this.filter_1.frequency.linearRampToValueAtTime(fc_hz, this.context.currentTime + 0.01);
      this.filter_1.Q.linearRampToValueAtTime(q_value, this.context.currentTime + 0.01);
    }
    setFilterLFO(rate_hz, depth_hz = 0) {
        this.filter_1_lfo.frequency.setValueAtTime(rate_hz, this.context.currentTime);
        this.filter_1_lfo_depth.gain.setValueAtTime(depth_hz, this.context.currentTime);
    }
    setFilterType(filter_type) {
      this.filter_1.type.setValueAtTime(filter_type, this.context.currentTime);
    }
    setPitch(pitch_hz) {
      this.current_pitch = pitch_hz;
      this.setChord(this.current_pitch, this.current_variation);
    }
    setChordNotes(notes) {
      if (notes.length == 4) this.chord_notes = notes;
      else console.log("invalid chord note input");
    }
    setChord(pitch_hz, variation) {
        this.current_variation = variation;
        this.current_pitch = pitch_hz;
        const variations_per_octave = 4;
        const octave_offset = Math.floor(variation / variations_per_octave) + 1;
        variation = variation % variations_per_octave; // a value 0-3

        const octave_variation = [0, 1, 1, 1];

        const voice_1_frequency = pitch_hz * octave_offset * this.chord_notes[variation];
        const voice_2_frequency = pitch_hz * (octave_offset + octave_variation[1 % (variation + 1)]) * this.chord_notes[(variation + 1) % variations_per_octave];
        const voice_3_frequency = pitch_hz * (octave_offset + octave_variation[2 % (variation + 1)]) * this.chord_notes[(variation + 2) % variations_per_octave];
        const voice_4_frequency = pitch_hz * (octave_offset + octave_variation[3 % (variation + 1)]) * this.chord_notes[(variation + 3) % variations_per_octave];

        let current_time = this.context.currentTime;
        // clear history
        this.voice_1.frequency.cancelAndHoldAtTime(current_time);
        this.voice_2.frequency.cancelAndHoldAtTime(current_time);
        this.voice_3.frequency.cancelAndHoldAtTime(current_time);
        this.voice_4.frequency.cancelAndHoldAtTime(current_time);
        let current_frequency = this.voice_1.frequency.value;
        this.voice_1.frequency.setValueAtTime(current_frequency, current_time);
        current_frequency = this.voice_2.frequency.value;
        this.voice_2.frequency.setValueAtTime(current_frequency, current_time);
        current_frequency = this.voice_3.frequency.value;
        this.voice_3.frequency.setValueAtTime(current_frequency, current_time);
        current_frequency = this.voice_4.frequency.value;
        this.voice_4.frequency.setValueAtTime(current_frequency, current_time);

        this.voice_1.frequency.linearRampToValueAtTime(voice_1_frequency, current_time + this.transition_time);
        this.voice_2.frequency.linearRampToValueAtTime(voice_2_frequency, current_time + this.transition_time);
        this.voice_3.frequency.linearRampToValueAtTime(voice_3_frequency, current_time + this.transition_time);
        this.voice_4.frequency.linearRampToValueAtTime(voice_4_frequency, current_time + this.transition_time);
    }
    trigger(pitch_hz, at_time, velocity = 1, attack_time_sec, release_time_sec) {
      // update attack time and release time if provided
      if (arguments.length >= 4) this.attackTime = attack_time_sec;
      if (arguments.length >= 5) this.releaseTime = release_time_sec; 
      
      if (pitch_hz != this.current_pitch) this.setChord(pitch_hz, this.current_variation);

      // vca envelop
      // cancel and hold at time cancels all events and holds the current 
      // value mid automation (good for not interrupting previous scheduled events)
      this.vca_1.gain.cancelAndHoldAtTime(at_time); 
      this.vca_1.gain.linearRampToValueAtTime(velocity, at_time + this.attackTime);
      this.vca_1.gain.linearRampToValueAtTime(0.0, at_time + this.attackTime + this.releaseTime);
    }
  }

  export default ChordModule;