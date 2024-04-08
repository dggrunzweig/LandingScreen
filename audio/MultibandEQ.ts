import { RampToValue, createGain, linearRampToValueAtTime } from "./Utilities";
import { createBiquadFilter } from "./Utilities";
import { Pane } from 'tweakpane';

class MultibandEQ {
    public i: GainNode;
    private o: GainNode;
    private f: BiquadFilterNode[];
    constructor(audio_ctx: AudioContext, center_f: number[], gain_db: number[], q: number[], pane: Pane | undefined = undefined) {
        this.f = new Array<BiquadFilterNode>();
        this.i = createGain(audio_ctx, 1.0);
        this.o = createGain(audio_ctx, 1.0);
        center_f.forEach((val, i) => {
            const fc = val;
            const gain = gain_db[i];
            const res = q[i];
            let type = <BiquadFilterType>"peaking";
            if (i == 0) type = "lowshelf";
            if (i == center_f.length - 1) type = <BiquadFilterType>"highshelf";
            this.f.push(createBiquadFilter(audio_ctx, type, fc, res, gain));
            // connect
            if (i > 0) this.f[i - 1].connect(this.f[i]);
        });
        this.i.connect(this.f[0]);
        this.f[this.f.length - 1].connect(this.o);

        // create tweak pane 
        if (import.meta.env.DEV && pane != undefined) {
            let PARAMS: any = {
                bypass: false
            };

            // Tweak Pane params
            const eq_folder = pane.addFolder({
                title: 'EQ',
                expanded: false
            });

            center_f.forEach((val, i) => {
                const fc = val;
                const gain = gain_db[i];
                const res = q[i];
                const f_name = "fc_" + i;
                const g_name = "g_" + i;
                const q_name = "q_" + i;
                PARAMS[f_name] = fc;
                PARAMS[g_name] = gain;
                PARAMS[q_name] = res;
                eq_folder.addBinding(PARAMS, f_name, { min: 20, max: 18000 }).on('change', (ev) => {
                    RampToValue(this.f[i].frequency, 0, ev.value, 0.01);
                });
                eq_folder.addBinding(PARAMS, g_name, { min: -24, max: 24 }).on('change', (ev) => {
                    RampToValue(this.f[i].gain, 0, ev.value, 0.01);
                });
                eq_folder.addBinding(PARAMS, q_name, { min: 0.1, max: 10 }).on('change', (ev) => {
                    RampToValue(this.f[i].Q, 0, ev.value, 0.01);
                });
            });

            eq_folder.addBinding(PARAMS, 'bypass').on('change', (ev) => {
                this.f.forEach((filter, i) => {
                    if (ev.value)
                        RampToValue(filter.gain, 0, 0, 0.01);
                    else
                        RampToValue(filter.gain, 0, PARAMS["g_" + i], 0.01);
                });
            });
        }
    }
    public connect(node: AudioNode): AudioNode {
        return this.o.connect(node);
    }
}

export default MultibandEQ