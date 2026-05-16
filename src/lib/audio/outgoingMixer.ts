"use client";

export type PlayMode = "mic" | "mp3" | "mp3-then-mic";

export type MixerPhase = "mp3" | "mic";

export interface OutgoingMixerInit {
  mp3Url?: string;
  playMode: PlayMode;
  /** Fires when the active outbound source changes — useful for UI status. */
  onPhase?: (phase: MixerPhase) => void;
}

const MP3_GAIN = 0.5;

export class OutgoingMixer {
  private ctx: AudioContext;
  private dest: MediaStreamAudioDestinationNode;
  private micStream: MediaStream | null = null;
  private micGain: GainNode;
  private mp3El: HTMLAudioElement | null = null;
  private mp3Gain: GainNode;

  constructor() {
    this.ctx = new AudioContext();
    this.dest = this.ctx.createMediaStreamDestination();
    this.micGain = this.ctx.createGain();
    this.micGain.connect(this.dest);
    this.mp3Gain = this.ctx.createGain();
    this.mp3Gain.connect(this.dest);
  }

  get stream(): MediaStream {
    return this.dest.stream;
  }

  async start({ mp3Url, playMode, onPhase }: OutgoingMixerInit): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (playMode === "mic") {
      await this.attachMic(1);
      onPhase?.("mic");
      return;
    }
    if (!mp3Url) throw new Error(`mp3Url required for playMode: ${playMode}`);

    if (playMode === "mp3") {
      this.attachMp3(mp3Url, MP3_GAIN);
      this.mp3El!.addEventListener("playing", () => onPhase?.("mp3"), {
        once: true,
      });
      await this.mp3El!.play();
      return;
    }

    await this.attachMic(0);
    this.attachMp3(mp3Url, MP3_GAIN);
    this.mp3El!.addEventListener("playing", () => onPhase?.("mp3"), {
      once: true,
    });
    this.mp3El!.addEventListener(
      "ended",
      () => {
        this.mp3Gain.gain.value = 0;
        this.micGain.gain.value = 1;
        onPhase?.("mic");
      },
      { once: true },
    );
    await this.mp3El!.play();
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

  private async attachMic(gain: number): Promise<void> {
    if (this.micStream) {
      this.micGain.gain.value = gain;
      return;
    }
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src = this.ctx.createMediaStreamSource(this.micStream);
    src.connect(this.micGain);
    this.micGain.gain.value = gain;
  }

  private attachMp3(url: string, gain: number): void {
    if (this.mp3El) {
      this.mp3El.src = url;
      this.mp3Gain.gain.value = gain;
      return;
    }
    const el = new Audio(url);
    el.crossOrigin = "anonymous";
    const src = this.ctx.createMediaElementSource(el);
    src.connect(this.mp3Gain);
    this.mp3Gain.gain.value = gain;
    this.mp3El = el;
  }
}
