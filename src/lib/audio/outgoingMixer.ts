"use client";

export type MixerMp3State = "idle" | "playing" | "paused" | "ended";

export interface OutgoingMixerEvents {
  onMp3StateChange?: (state: MixerMp3State) => void;
}

export const DEFAULT_MP3_GAIN = 0.5;

export class OutgoingMixer {
  private ctx: AudioContext;
  private dest: MediaStreamAudioDestinationNode;
  private micStream: MediaStream | null = null;
  private micGain: GainNode;
  private mp3El: HTMLAudioElement | null = null;
  private mp3Gain: GainNode;
  private events: OutgoingMixerEvents;

  constructor(events: OutgoingMixerEvents = {}) {
    this.ctx = new AudioContext();
    this.dest = this.ctx.createMediaStreamDestination();
    this.micGain = this.ctx.createGain();
    this.micGain.connect(this.dest);
    this.mp3Gain = this.ctx.createGain();
    this.mp3Gain.connect(this.dest);
    this.events = events;
  }

  get stream(): MediaStream {
    return this.dest.stream;
  }

  /** Open the mic at full gain. Call once after the call is answered. */
  async attachMic(): Promise<void> {
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.micStream) {
      this.micGain.gain.value = 1;
      return;
    }
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src = this.ctx.createMediaStreamSource(this.micStream);
    src.connect(this.micGain);
    this.micGain.gain.value = 1;
  }

  /**
   * Replace the MP3 source. Stops any current playback and resets to 0:00.
   * The new source is loaded but paused; call `playMp3()` to start.
   */
  loadMp3(url: string, gain: number = DEFAULT_MP3_GAIN): void {
    if (this.mp3El) {
      try {
        this.mp3El.pause();
      } catch {
        /* ignore */
      }
      this.mp3El.src = url;
      this.mp3El.currentTime = 0;
      this.mp3Gain.gain.value = gain;
      this.events.onMp3StateChange?.("idle");
      return;
    }
    const el = new Audio(url);
    el.crossOrigin = "anonymous";
    el.addEventListener("ended", () => this.events.onMp3StateChange?.("ended"));
    el.addEventListener("pause", () => {
      if (this.mp3El && !this.mp3El.ended) {
        this.events.onMp3StateChange?.("paused");
      }
    });
    el.addEventListener("playing", () => this.events.onMp3StateChange?.("playing"));
    const src = this.ctx.createMediaElementSource(el);
    src.connect(this.mp3Gain);
    this.mp3Gain.gain.value = gain;
    this.mp3El = el;
    this.events.onMp3StateChange?.("idle");
  }

  async playMp3(): Promise<void> {
    if (!this.mp3El) return;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    await this.mp3El.play();
  }

  pauseMp3(): void {
    if (!this.mp3El) return;
    this.mp3El.pause();
  }

  /** Rewind to 0:00 and pause. */
  resetMp3(): void {
    if (!this.mp3El) return;
    this.mp3El.pause();
    this.mp3El.currentTime = 0;
    this.events.onMp3StateChange?.("idle");
  }

  setMp3Gain(value: number): void {
    this.mp3Gain.gain.value = Math.max(0, Math.min(1, value));
  }

  setMicMuted(muted: boolean): void {
    this.micGain.gain.value = muted ? 0 : 1;
  }

  dispose(): void {
    if (this.mp3El) {
      try {
        this.mp3El.pause();
      } catch {
        /* ignore */
      }
      this.mp3El.src = "";
      this.mp3El = null;
    }
    if (this.micStream) {
      for (const t of this.micStream.getTracks()) t.stop();
      this.micStream = null;
    }
    if (this.ctx.state !== "closed") {
      void this.ctx.close();
    }
  }
}
