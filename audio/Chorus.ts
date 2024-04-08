import LFO from "./LFO.ts";
import { CheckPRNG } from "./Utilities.ts";
import { createGain, db2mag, createStereoPanner, createBiquadFilter, MixToDB } from "./Utilities.ts"

class Chorus {
    public input: GainNode;
    private o: GainNode;
    private LFOs = new Array<LFO>();
    constructor(context: AudioContext, prng: Function | undefined, center_hz: number, rate: number, depth_hz: number, width: number, mix: number) {
        prng = CheckPRNG(prng);
        this.input = context.createGain();
        // output node
        this.o = context.createGain();

        const mix_lin = MixToDB(mix);

        const mix_gain_wet = createGain(context, 1 - mix_lin);

        // create lines
        const num_lines = 3;
        this.LFOs = [];
        for (let i = 0; i < num_lines; ++i) {
            const pan = width * (i * (2 / (num_lines - 1)) - 1);
            const depth_variation = prng() * 0.1 * depth_hz;
            const rate_variation = prng() * 0.1 * rate;
            this.LFOs.push(this.createChorusLoop(context, center_hz, depth_hz + depth_variation, rate + rate_variation, pan, this.input, mix_gain_wet, num_lines));
        }

        // through path
        const mix_gain_dry = createGain(context, mix_lin);

        mix_gain_wet.connect(this.o);
        this.input.connect(mix_gain_dry).connect(this.o);

    }
    createChorusLoop(ctx: AudioContext, center_hz: number, depth_hz: number, rate_hz: number, pan: number, input_node: AudioNode, output_node: AudioNode, num_lines: number): LFO {
        const delay = ctx.createDelay();
        delay.delayTime.value = 1 / center_hz;
        const low_pos = 1 / Math.max((center_hz - depth_hz / 2), 50);
        const high_pos = 1 / Math.min((center_hz + depth_hz / 2), 16000);
        const time_lfo = new LFO(ctx, rate_hz, low_pos, high_pos);
        time_lfo.connect(delay.delayTime);
        const panning = createStereoPanner(ctx, pan);
        const scaling_gain = createGain(ctx, db2mag(-6) * (num_lines - 1));
        const filter = createBiquadFilter(ctx, "highpass", 150, 1.0, 0.0);
        input_node.connect(delay).connect(filter).connect(panning).connect(scaling_gain).connect(output_node);
        return time_lfo;
    }
    connect(node: AudioNode) {
        this.o.connect(node);
    }
    start() {
        this.LFOs.forEach((lfo) => {
            lfo.start();
        })
    }
}

export default Chorus;