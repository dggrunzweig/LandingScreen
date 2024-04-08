// to download once it's finished, you can use some code like this
//      
//  if (recorder.GetBlobURL() != null) {
//     const link = document.createElement("a");
//     link.href = recorder.GetBlobURL();
//     link.download = "recording.webm";
//     link.innerHTML = "Click here to download the file";
//     document.body.appendChild(link);
//  }

import { RampToValue } from "./Utilities";
import * as Mp4Muxer from 'mp4-muxer';
class MP4Recorder {
    private started = false;
    private c: AudioContext;
    private fg: GainNode;
    private mr: any;
    private br = false; // flag to indicate blob is ready for download
    private b_url = "";
    private audio_track: MediaStreamTrack;
    private canvas: HTMLCanvasElement;
    private video_encoder: VideoEncoder;
    private audio_encoder: any;
    private frame_count = 0;
    private start_time = 0;
    private last_key_frame = 0;
    private timer = 0;
    private fps = 30;
    constructor(audio_ctx: AudioContext, canvas: HTMLCanvasElement, input_audio_node: AudioNode, fps = 30, hq = false) {
        // gain used for fade in and out of audio in recording
        this.c = audio_ctx;
        this.fps = fps;
        const fs = audio_ctx.sampleRate;
        this.fg = audio_ctx.createGain();
        this.fg.gain.setValueAtTime(0, 0);
        const msd = audio_ctx.createMediaStreamDestination();
        input_audio_node.connect(this.fg).connect(msd);
        this.audio_track = msd.stream.getAudioTracks()[0];
        this.canvas = canvas;
        // this.video_track = canvas.captureStream(30).getVideoTracks()[0]
        const min_dim = Math.min(canvas.width, canvas.height);
        let scale = 1;
        if (hq) {
            scale = 1080 / min_dim;
        } else {
            // low quality
            scale = 720 / min_dim;
        }
        const res = [scale * canvas.width, scale * canvas.height];

        // const res = [900, 900];
        this.mr = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            fastStart: 'in-memory',
            firstTimestampBehavior: 'offset',
            video: {
                codec: 'avc',
                width: res[0],
                height: res[1]
            },
            audio: {
                codec: 'aac',
                sampleRate: fs,
                numberOfChannels: 2
            },
        });

        this.video_encoder = new VideoEncoder({
            output: (chunk, meta) => this.mr.addVideoChunk(chunk, meta),
            error: e => console.error(e)
        });
        // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/codecs_parameter#iso_base_media_file_format_mp4_quicktime_and_3gp
        const vcodec = hq ? 'avc1.64003D' : 'avc1.42001f';
        this.video_encoder.configure({
            codec: vcodec,
            width: res[0],
            height: res[1],
            bitrate: 1e8
        });

        // @ts-ignore
        if (typeof AudioEncoder != undefined && typeof MediaStreamTrackProcessor != undefined) {
            // @ts-ignore
            this.audio_encoder = new AudioEncoder({
                output: (chunk: any, meta: any) => this.mr.addAudioChunk(chunk, meta),
                error: (e: Error) => console.error(e)
            });
            this.audio_encoder.configure({
                codec: 'mp4a.40.2',
                numberOfChannels: 2,
                sampleRate: fs,
                bitrate: 128000
            });

            // Create a MediaStreamTrackProcessor to get AudioData chunks from the audio track
            // @ts-ignore
            let trackProcessor = new MediaStreamTrackProcessor({ track: this.audio_track });
            const recorder = this;
            let consumer = new WritableStream({
                write(audioData) {
                    if (!recorder.started) return;
                    recorder.audio_encoder.encode(audioData);
                    audioData.close();
                }
            });
            trackProcessor.readable.pipeTo(consumer);
        }

    }

    private encodeVideoFrame() {
        let current_time = document.timeline.currentTime?.valueOf();
        const time = typeof current_time === "number" ? current_time : 0;
        let elapsedTime = time - this.start_time;

        // Ensure a video key frame at least every 10 seconds for good scrubbing
        let needsKeyFrame = elapsedTime - this.last_key_frame >= 10000;
        if (needsKeyFrame) this.last_key_frame = elapsedTime;

        let frame = new VideoFrame(this.canvas, {
            timestamp: this.frame_count * 1e6 / this.fps
        });
        this.video_encoder.encode(frame, { keyFrame: needsKeyFrame });
        frame.close();
        this.frame_count++;
    };

    public GetType(): String {
        return ".mp4";
    }

    public StartRecording(fade_in_time = 0.5): void {
        const time = document.timeline.currentTime?.valueOf();
        if (typeof time === "number")
            this.start_time = time ?? 0;
        this.last_key_frame = -Infinity;

        this.encodeVideoFrame();
        this.timer = setInterval(() => {
            this.encodeVideoFrame();
        }, 1000 / this.fps);
        RampToValue(this.fg.gain, 0, 1.0, fade_in_time / 2.5);
        this.started = true;
    }

    public StopRecording(fade_out_time = 0.2): void {
        RampToValue(this.fg.gain, 0, 0.0, fade_out_time / 2.5);
        setTimeout(() => {
            clearTimeout(this.timer);
            this.started = false;
            this.audio_track.stop();
            this.video_encoder.flush().then(() => {
                this.mr.finalize();
                this.b_url = URL.createObjectURL(new Blob([this.mr.target.buffer]))
                this.br = true;
            });
            // await this.audio_encoder.flush();
        }, 1.05 * fade_out_time * 1000);

    }

    public GetBlobURL(): string | undefined {
        if (this.br)
            return this.b_url;
        else
            return undefined;
    }
}

export default MP4Recorder;