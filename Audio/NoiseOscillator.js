class NoiseOscillator {
    CreateNoiseSource(source) {
        // mono
        let channels = 1;

        // Create an empty two second stereo buffer at the
        // sample rate of the AudioContext
        const frameCount = this.context.sampleRate * 2.0;

        // create a buffer
        const buffer = new AudioBuffer({
            numberOfChannels: channels,
            length: frameCount,
            sampleRate: this.context.sampleRate,
            });

        // Fill the buffer with white noise;
        // just random values between -1.0 and 1.0
        for (let channel = 0; channel < channels; channel++) {
            // This gives us the actual array that contains the data
            const nowBuffering = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                    // Math.random() is in [0; 1.0]
                    // audio needs to be in [-1.0; 1.0]
                    nowBuffering[i] = Math.random() * 2 - 1;
            }
        }

        // Set the buffer in the AudioBufferSourceNode
        source.buffer = buffer;
    }

    constructor(audio_context) {
        this.context = audio_context;
        this.noise_buffer_source = audio_context.createBufferSource();
        this.low_pass_filter = audio_context.createBiquadFilter();

        // initialize LP filter
        this.low_pass_filter.type = "lowpass";
        this.low_pass_filter.frequency.setValueAtTime(audio_context.sampleRate / 2, audio_context.currentTime);

        
        // initialize noise buffer
        this.CreateNoiseSource(this.noise_buffer_source);
        this.noise_buffer_source.loop = true;
        
        this.output = audio_context.createGain();
        this.output.gain.value = 1.0;
        
        // signal chain
        this.noise_buffer_source.connect(this.low_pass_filter).connect(this.output);
    }

    setPlaybackRate(rate) {
        if (rate > 1) {
            rate = 1;
        }
        this.noise_buffer_source.playbackRate.setValueAtTime(rate, this.context.currentTime);
        this.low_pass_filter.frequency.setValueAtTime(rate * this.context.sampleRate / 2, this.context.currentTime);
    }

    setOutputGain(gain_dB) {
        this.output.gain.linearRampToValueAtTime(db2mag(gain_dB), this.context.currentTime + 0.01);
    }

    connect(node) {
        this.output.connect(node);
    }

    start() {
        this.noise_buffer_source.start();
    }

    stop() {
        this.noise_buffer_source.stop();
    }
}

export default NoiseOscillator;