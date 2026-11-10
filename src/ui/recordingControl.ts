const MAX_RECORDING_MS = 30_000;

/** UI and browser recording lifecycle for a mirrored game canvas. */
export class RecordingControl {
    public readonly element: HTMLDivElement;

    private readonly canvas: HTMLCanvasElement | null;
    private readonly button: HTMLButtonElement;
    private readonly status: HTMLSpanElement;
    private recorder: MediaRecorder | null = null;
    private recordingStream: MediaStream | null = null;
    private recordingChunks: Blob[] = [];
    private recordingTimer: number | null = null;
    private recordingStartedAt = 0;
    private recordingCanvas: HTMLCanvasElement | null = null;
    private recordingAnimationFrame: number | null = null;

    constructor(canvas: HTMLCanvasElement | null) {
        this.canvas = canvas;

        const row = document.createElement("div");
        Object.assign(row.style, {
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "7px 9px",
            border: "2px solid #111",
            borderRadius: "4px",
            background: "rgba(238, 246, 255, 0.96)",
        } satisfies Partial<CSSStyleDeclaration>);

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Record (30s max)";
        button.setAttribute("aria-label", "Start game recording, maximum 30 seconds");
        Object.assign(button.style, {
            flex: "1",
            padding: "7px 9px",
            border: "2px solid #111",
            borderRadius: "4px",
            background: "#e84b4b",
            color: "#fff",
            font: "inherit",
            cursor: "pointer",
            touchAction: "manipulation",
        } satisfies Partial<CSSStyleDeclaration>);
        button.addEventListener("click", this.toggleRecording);

        const status = document.createElement("span");
        status.textContent = "00:30";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.style.whiteSpace = "nowrap";

        row.append(button, status);
        this.element = row;
        this.button = button;
        this.status = status;
    }

    private readonly toggleRecording = (): void => {
        if (this.recorder) {
            if (this.recorder.state === "recording") this.recorder.stop();
            return;
        }

        if (!this.canvas || typeof this.canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
            this.setStatus("Not supported");
            return;
        }

        try {
            const recordingCanvas = document.createElement("canvas");
            recordingCanvas.width = this.canvas.width;
            recordingCanvas.height = this.canvas.height;
            const context = recordingCanvas.getContext("2d");
            if (!context) {
                this.setStatus("Recording failed");
                return;
            }

            this.recordingCanvas = recordingCanvas;
            this.drawFrame(context);
            const stream = recordingCanvas.captureStream(30);
            const mimeType = this.getSupportedMimeType();
            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            this.recordingStream = stream;
            this.recordingChunks = [];
            this.recorder = recorder;
            this.recordingStartedAt = performance.now();
            this.setStatus("REC 00:30");
            this.button.textContent = "Stop recording";
            this.button.style.background = "#8b1e1e";

            recorder.addEventListener("dataavailable", event => {
                if (event.data.size > 0) this.recordingChunks.push(event.data);
            });
            recorder.addEventListener("stop", this.finishRecording, { once: true });
            recorder.addEventListener("error", () => {
                recorder.removeEventListener("stop", this.finishRecording);
                this.setStatus("Recording failed");
                this.resetRecorder();
            }, { once: true });
            recorder.start(1000);
            this.recordingTimer = window.setInterval(this.updateRecordingTime, 100);
        } catch {
            this.setStatus("Recording failed");
            this.resetRecorder();
        }
    };

    private getSupportedMimeType(): string | undefined {
        return [
            "video/mp4;codecs=avc1.42E01E",
            "video/mp4",
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
        ].find(type => MediaRecorder.isTypeSupported(type));
    }

    private drawFrame(context: CanvasRenderingContext2D): void {
        const target = this.recordingCanvas;
        const source = this.canvas;
        if (!target || !source) return;

        if (target.width !== source.width || target.height !== source.height) {
            target.width = source.width;
            target.height = source.height;
        }
        context.setTransform(-1, 0, 0, 1, target.width, 0);
        context.drawImage(source, 0, 0, target.width, target.height);
        this.recordingAnimationFrame = window.requestAnimationFrame(() => this.drawFrame(context));
    }

    private readonly updateRecordingTime = (): void => {
        const elapsed = performance.now() - this.recordingStartedAt;
        const remainingSeconds = Math.max(0, Math.ceil((MAX_RECORDING_MS - elapsed) / 1000));
        this.setStatus(`REC ${this.formatTime(remainingSeconds)}`);
        if (elapsed >= MAX_RECORDING_MS && this.recorder?.state === "recording") {
            this.recorder.stop();
        }
    };

    private readonly finishRecording = (): void => {
        const recorder = this.recorder;
        const chunks = this.recordingChunks;
        this.resetRecorder();

        if (chunks.length > 0 && recorder) {
            const mimeType = recorder.mimeType || chunks[0].type || "video/webm";
            const extension = mimeType.includes("mp4") ? "mp4" : "webm";
            const video = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(video);
            const link = document.createElement("a");
            link.href = url;
            link.download = `game-recording.${extension}`;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            this.setStatus("Saved");
        } else {
            this.setStatus("No video captured");
        }
    };

    private resetRecorder(): void {
        if (this.recordingTimer !== null) {
            window.clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }
        this.recordingStream?.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
        if (this.recordingAnimationFrame !== null) {
            window.cancelAnimationFrame(this.recordingAnimationFrame);
            this.recordingAnimationFrame = null;
        }
        this.recordingCanvas = null;
        this.recorder = null;
        this.recordingChunks = [];
        this.button.textContent = "Record (30s max)";
        this.button.style.background = "#e84b4b";
    }

    private setStatus(text: string): void {
        this.status.textContent = text;
    }

    private formatTime(seconds: number): string {
        return `00:${seconds.toString().padStart(2, "0")}`;
    }

    public dispose(): void {
        this.button.removeEventListener("click", this.toggleRecording);
        if (this.recorder?.state === "recording") this.recorder.stop();
        this.element.remove();
    }
}
