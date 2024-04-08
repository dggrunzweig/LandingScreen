import { createGain, linearRampToValueAtTime, RampToValue } from "./Utilities.ts";

class LFO {
    private c: AudioContext;
    private r: GainNode; // range control
    private os: ConstantSourceNode; // offset
    private o: GainNode; // output
    private l: OscillatorNode; // LFO Oscillator
    constructor(audio_context: AudioContext, rate_hz: number, min_val: number, max_val: number) {
        this.c = audio_context;
        // lfo
        this.l = audio_context.createOscillator();
        // gain used for lfo range
        this.r = audio_context.createGain();
        // constant source node used to create offset
        this.os = audio_context.createConstantSource();
        // output
        this.o = createGain(audio_context, 0.0);

        this.setRate(rate_hz);
        this.setRange(min_val, max_val);
        this.setShape("sine");

        this.l.connect(this.r).connect(this.o);
        this.os.connect(this.o);
    }

    setShape(shape: OscillatorType): void {
        this.l.type = shape;
    }

    setRate(rate_hz: number, smoothing_time = 0.01): void {
        RampToValue(this.l.frequency, 0, rate_hz, smoothing_time);
    }

    setRange(min_val: number, max_val: number): void {
        let range = max_val - min_val;
        let offset = range / 2 + min_val;
        this.r.gain.setValueAtTime(range / 2, this.c.currentTime + 0.01);
        this.os.offset.setValueAtTime(offset, this.c.currentTime + 0.01);
    }

    start(): void {
        this.os.start();
        this.l.start();
        RampToValue(this.o.gain, 0, 1.0, 0.01);
    }

    stop(): void {
        RampToValue(this.o.gain, 0, 0, 0.01);
        this.os.stop();
        this.l.stop();
    }

    connect(node_param: AudioParam): void {
        node_param.setValueAtTime(0, this.c.currentTime + 0.01);
        this.o.connect(node_param);
    }
}

export default LFO;