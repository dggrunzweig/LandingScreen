import { clamp, createBiquadFilter, createGain, createStereoPanner, createAudioBuffer, db2mag, TiltedHannWindow, ReverseAudioBuffer, createBufferSource, RampToValue } from "./Utilities";
export interface GranularSettings {
    pitch: number, // value in interval steps
    grain_rate_hz: number, // rate of grains, 1 / rate = length of grain in seconds
    overlap: number, //0-1 amount of overlap between grains. 0.5 = continuous, 1.0 = individual grains
    offset: number, // 0-1, position to start from in buffer
    scatter: number, // 0-1, random variation offset position, 1 = max, 0 = none
    scan_rate: number, // 0-1, rate of playhead movement (1 = normal)
    window: number, // 0-1, sharpness of window. 0.5 = hann, 0.0 = fast attack, 1.0, all attack
    pitch_variation: number, // randomize pitch variation per grain
    probability: number, // 0-1 probability of grain occuring
    width: number, //0-1 stereo width (random pan position per grain)
    direction: boolean, // true = forward playback, false = reverse playback
}
class Granular {
    private c: AudioContext;
    private f: BiquadFilterNode;
    private o: GainNode;
    private b: AudioBuffer;
    private fs = 0;
    private running = false;
    private settings: GranularSettings;
    private timer = 0;
    private t = 0; // scheduler time
    private scan_pos = 0;
    private pos = 0;
    constructor(audio_ctx: AudioContext, buffer: AudioBuffer, settings: GranularSettings) {
        this.c = audio_ctx;
        this.f = createBiquadFilter(audio_ctx, "highpass", 75, 1.0, 0.0);
        this.o = createGain(audio_ctx, 1.0);
        this.f.connect(this.o);
        this.settings = settings;
        this.b = settings.direction ? buffer : ReverseAudioBuffer(buffer);
        this.fs = audio_ctx.sampleRate;
        this.setNewSettings(settings);
    }
    public connect(node: AudioNode): AudioNode {
        return this.o.connect(node);
    }

    public stop() {
        this.running = false;
    }

    public setNewSettings(settings: GranularSettings) {
        // validate settings
        this.settings.window = clamp(settings.window, 0, 1);
        this.settings.offset = clamp(settings.offset, 0, 1) * this.b.duration;
        this.pos = this.settings.offset;
        this.settings.scatter = clamp(settings.scatter, 0, 1);
        this.settings.pitch = clamp(settings.pitch, -24, 24);
        this.settings.pitch_variation = clamp(settings.pitch_variation, 0, 2);
        this.settings.grain_rate_hz = clamp(settings.grain_rate_hz, 0.01, 50);
        this.settings.scan_rate = clamp(settings.scan_rate, 0, 4);
        this.settings.overlap = clamp(settings.overlap, 0.1, 1.0);
        this.settings.width = clamp(settings.width, 0, 1);
        this.settings.probability = clamp(settings.probability, 0, 1);
        this.settings.direction = settings.direction;
    }

    public GetSettings(): GranularSettings {
        return this.settings;
    }

    public SetNewBuffer(buffer: AudioBuffer, forward: boolean) {
        this.b = forward ? buffer : ReverseAudioBuffer(buffer);
    }

    public setOutputGain(gain_dB: number) {
        RampToValue(this.o.gain, 0, db2mag(clamp(gain_dB, -100, 24)), 0.01);
    }

    public setFilter(type: BiquadFilterType, fc: number, q: number, gain: number) {
        this.f.type = type;
        RampToValue(this.f.frequency, 0, fc, 0.01);
        RampToValue(this.f.Q, 0, q, 0.01);
        RampToValue(this.f.gain, 0, gain, 0.01);
    }

    private scheduleGrains(tla: number, prng: Function) {
        const c_t = this.c.currentTime;
        const rate = (1 / this.settings.grain_rate_hz) * this.settings.overlap;
        const scan_increment = this.settings.scan_rate * rate;
        while (this.t < c_t + tla) {
            const prob = prng();
            this.pos = this.settings.offset + this.scan_pos;
            this.pos = this.pos % this.b.duration;
            this.scan_pos += scan_increment;
            if (prob < this.settings.probability) {
                this.triggerGrain(this.t, this.settings.grain_rate_hz, this.pos, this.settings.scatter, this.settings.pitch, this.settings.pitch_variation, this.settings.window, this.settings.width);
            }
            this.t += rate;
        }
    }

    public getPlayheadPosition(): number {
        return this.pos / this.b.duration;
    }

    public play(prng: Function) {
        this.t = this.c.currentTime;
        const tla = 1.0; // 1 second look ahead
        if (!this.running) {
            this.running = true;
            this.scheduleGrains(tla, prng);
            this.timer = setInterval(() => { this.scheduleGrains(tla, prng) }, tla * 1000.0);
        } else {
            this.running = false;
            clearInterval(this.timer);
        }
    }

    public triggerGrain(at_time: number, rate_hz: number, offset: number, scatter: number, pitch_interval: number, pitch_variation: number, window_tilt: number, width: number) {
        offset += scatter * (Math.random() - 0.5); // add scattering
        offset = clamp(offset, 0, this.b.duration); // prevent it from exceeding safe values
        const playback_rate = Math.pow(2.0, pitch_interval / 12.0) + (2 * Math.random() - 1) * pitch_variation;
        const pan = width * (2 * Math.random() - 1);
        rate_hz = Math.max(rate_hz, 0.001);
        const period = 1 / rate_hz;
        const source = createBufferSource(this.c, this.b, playback_rate, true);

        // create window
        const window_len = Math.floor(period * this.fs);
        let hann_buffer = createAudioBuffer(1, window_len, this.fs);
        hann_buffer.copyToChannel(TiltedHannWindow(window_len, window_tilt), 0, 0);
        const window_source = createBufferSource(this.c, hann_buffer, 1.0, false);

        // gain for windowing
        const vca = createGain(this.c, 0.0);
        window_source.connect(vca.gain);

        // stereo spread
        const panner = createStereoPanner(this.c, pan);
        source.connect(vca).connect(panner).connect(this.f);

        source.start(at_time, offset);
        window_source.start(at_time)
        source.stop(at_time + period + 0.5);
        window_source.stop(at_time + period + 0.5);
        setTimeout(() => {
            vca.disconnect();
            source.disconnect();
            window_source.disconnect();
            panner.disconnect();
        }, ((at_time - this.c.currentTime) + period + 1) * 1000);
    }
}

export default Granular
