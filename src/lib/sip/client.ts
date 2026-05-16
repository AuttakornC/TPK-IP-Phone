"use client";

import JsSIP from "jssip";
import type { RTCSession, EndEvent } from "jssip/lib/RTCSession";
import type { IncomingRTCSessionEvent, UnRegisteredEvent } from "jssip/lib/UA";
import {
  type SipCallHandle,
  type SipCallState,
  type SipCallTarget,
  type SipConfig,
  type SipEvents,
  SipError,
} from "./types";

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

interface TrackedSession {
  handle: SipCallHandle;
  session: RTCSession;
}

/**
 * Thin wrapper around `JsSIP.UA` that exposes a small, broadcast-shaped API:
 *   1. `connect()` to register with the user's assigned Asterisk.
 *   2. `call([targets])` to dial one or more speaker extensions in parallel,
 *      sharing a single microphone capture so the user broadcasts to all
 *      selected speakers at once.
 *   3. `hangupAll()` and `disconnect()` to tear it all down.
 *
 * Designed for one-way "user-to-speakers" announcement, not full-duplex
 * conversations — incoming INVITEs are auto-rejected.
 */
export class SipClient {
  private ua: JsSIP.UA | null = null;
  private localStream: MediaStream | null = null;
  private sessions = new Map<string, TrackedSession>();
  private connected = false;

  constructor(
    private readonly config: SipConfig,
    private readonly events: SipEvents = {},
  ) {
    if (!config.wssUrl || !config.uri || !config.password || !config.realm) {
      throw new SipError(
        "invalid_config",
        "Missing wssUrl, uri, password, or realm",
      );
    }
  }

  /** Open the WebSocket, build the UA, register. Resolves after registration. */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      let socket: JsSIP.WebSocketInterface;
      try {
        socket = new JsSIP.WebSocketInterface(this.config.wssUrl);
      } catch (err) {
        reject(
          new SipError(
            "transport",
            `Cannot open WSS: ${this.config.wssUrl}`,
            err,
          ),
        );
        return;
      }

      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: this.config.uri,
        password: this.config.password,
        register: true,
      });

      ua.on("registered", () => {
        this.connected = true;
        this.events.onRegistered?.();
        resolve();
      });
      ua.on("registrationFailed", (e: UnRegisteredEvent) => {
        const err = new SipError(
          "registration",
          `Registration failed: ${e.cause}`,
          e,
        );
        this.events.onError?.(err);
        reject(err);
      });
      ua.on("disconnected", () => {
        this.connected = false;
      });
      ua.on("newRTCSession", (e: IncomingRTCSessionEvent) => {
        // We don't accept incoming calls in broadcast mode.
        if (e.session.direction === "incoming") e.session.terminate();
      });

      this.ua = ua;
      ua.start();
    });
  }

  /** Capture the user's mic once, then INVITE every target in parallel. */
  async call(targets: SipCallTarget[]): Promise<SipCallHandle[]> {
    if (!this.ua || !this.connected) {
      throw new SipError(
        "not_connected",
        "connect() must complete before calling",
      );
    }
    if (targets.length === 0) return [];

    if (!this.localStream) {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (err) {
        const code =
          (err as DOMException)?.name === "NotAllowedError"
            ? "mic_denied"
            : "mic_unavailable";
        throw new SipError(
          code,
          "Microphone access was denied or unavailable",
          err,
        );
      }
    }

    return targets.map((target) => this.dial(target, this.localStream!));
  }

  private dial(target: SipCallTarget, stream: MediaStream): SipCallHandle {
    const targetUri = `sip:${target.ext}@${this.config.realm}`;
    const session = this.ua!.call(targetUri, {
      mediaConstraints: { audio: true, video: false },
      mediaStream: stream,
      rtcOfferConstraints: {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      },
      pcConfig: {
        iceServers: STUN_SERVERS,
      },
    });

    const handle: SipCallHandle = {
      id: target.id,
      target,
      state: "connecting",
      hangup: () => {
        try {
          session.terminate();
        } catch {
          /* already torn down */
        }
      },
    };
    this.sessions.set(target.id, { handle, session });

    const transition = (state: SipCallState, cause?: string) => {
      handle.state = state;
      handle.cause = cause;
      this.events.onCallStateChange?.(handle);
    };

    session.on("progress", () => transition("ringing"));
    session.on("confirmed", () => transition("answered"));
    session.on("ended", (e: EndEvent) => {
      this.sessions.delete(target.id);
      transition("ended", e.cause);
    });
    session.on("failed", (e: EndEvent) => {
      this.sessions.delete(target.id);
      transition("failed", e.cause);
    });

    return handle;
  }

  /** Terminate every active session but keep the UA registered. */
  hangupAll(): void {
    for (const { session } of this.sessions.values()) {
      try {
        session.terminate();
      } catch {
        /* ignore */
      }
    }
    this.sessions.clear();
  }

  /** Tear down everything: sessions, mic capture, UA, socket. */
  disconnect(): void {
    this.hangupAll();
    if (this.localStream) {
      for (const t of this.localStream.getTracks()) t.stop();
      this.localStream = null;
    }
    if (this.ua) {
      try {
        this.ua.stop();
      } catch {
        /* ignore */
      }
      this.ua = null;
    }
    this.connected = false;
  }

  /** Snapshot of currently tracked call handles (read-only). */
  activeCalls(): SipCallHandle[] {
    return Array.from(this.sessions.values(), (v) => v.handle);
  }
}
