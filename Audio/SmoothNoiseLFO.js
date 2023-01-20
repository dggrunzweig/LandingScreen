class SmoothNoiseLFO {
    constructor(audio_context, rate_hz) {
        this.context = audio_context;
        this.rate_time = 1 / rate_hz;
        this.timerID;
        this.scheduler_look_ahead_time = 5 * this.rate_time; // seconds
        this.timer_id_lookahead = this.rate_time * 1000; // milliseconds
        this.min_val = -1;
        this.max_val = 1;
        this.next_value = 0;
        this.next_time = 0;
        this.output = audio_context.createConstantSource();
        this.output.start();
        this.running = false;
    }

    setRate(rate_hz) {
        this.stop();
        this.output.offset.cancelAndHoldAtTime(this.context.currentTime);
        this.rate_time = 1 / rate_hz;
        this.scheduler_look_ahead_time = 5 * this.rate_time; // seconds
        this.timer_id_lookahead = this.rate_time * 1000; // milliseconds
        this.start();
    }

    setRange(min_val, max_val) {
        this.min_val = min_val;
        this.max_val = max_val;
        this.next_value = this.min_val;
    }

    step() {
        this.next_time += (this.rate_time);
        const range = (this.max_val - this.min_val);
        this.next_value = range * Math.random() + this.min_val;
    }

    run() {
        let current_time = this.context.currentTime;
        while (this.next_time < current_time + this.scheduler_look_ahead_time) {
            this.output.offset.linearRampToValueAtTime(this.next_value, this.next_time);
            this.step();
        }
    }

    start() {
        if (!this.running)
        {
            this.output.offset.cancelAndHoldAtTime(this.context.currentTime);
            this.output.offset.setValueAtTime(this.min_val, this.context.currentTime);
            this.running = true;
            this.next_time = this.context.currentTime
            clearTimeout(this.timerID);
            this.step();
            // need to wrap calls that require this in a function 
            // more details at the bottom of this page
            // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
            this.timerID = setInterval(() => {this.run()}, this.timer_id_lookahead);
        }
    }

    stop() {
        this.running = false;
        this.output.offset.cancelAndHoldAtTime(this.context.currentTime);
        clearTimeout(this.timerID);
    }

    connect(node_param) {
        this.output.connect(node_param);
        node_param.setValueAtTime(0, this.context.currentTime + 0.01);
    }
}

export default SmoothNoiseLFO;