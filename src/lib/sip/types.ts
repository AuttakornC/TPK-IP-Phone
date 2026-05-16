// Public types for the SIP module. Kept transport-agnostic so callers don't
// depend on JsSIP — the concrete client is the only place that imports `jssip`.

export interface SipConfig {
  /** Full WSS URL, e.g. `wss://sip.tpk-pa.local:8089/ws`. */
  wssUrl: string;
  /** Caller AOR, e.g. `sip:9003@sip.tpk-pa.local`. */
  uri: string;
  /** SIP digest password for the caller's ext. */
  password: string;
  /** SIP domain used to build target URIs, e.g. `sip.tpk-pa.local`. */
  realm: string;
}

export interface SipCallTarget {
  /** Stable id for tracking (typically the speaker's DB id). */
  id: string;
  /** SIP extension to dial, e.g. `1001`. */
  ext: string;
  /** Optional display name (only used in UI surfaces). */
  name?: string;
}

export type SipCallState =
  | 'connecting'  // INVITE sent, awaiting provisional/final
  | 'ringing'     // got 180 / 183
  | 'answered'    // 200 OK + ACK; media flowing
  | 'ended'       // BYE / dialog terminated normally
  | 'failed';     // request failed (4xx/5xx/6xx, transport error, etc.)

export interface SipCallHandle {
  id: string;
  target: SipCallTarget;
  state: SipCallState;
  /** Cause string when state === 'failed' or 'ended'. */
  cause?: string;
  hangup(): void;
}

export interface SipEvents {
  /** Called whenever any tracked call transitions to a new state. */
  onCallStateChange?(handle: SipCallHandle): void;
  /** Called for transport / registration / unrecoverable client errors. */
  onError?(err: SipError): void;
  /** Optional — fires once the UA has registered with the server. */
  onRegistered?(): void;
}

export type SipErrorCode =
  | 'transport'         // ws connection failed
  | 'registration'      // registration rejected by server
  | 'mic_denied'        // getUserMedia rejected
  | 'mic_unavailable'   // no microphone present
  | 'invalid_config'    // wssUrl / uri / password missing
  | 'not_connected'     // call() invoked before connect()
  | 'unknown';

export class SipError extends Error {
  code: SipErrorCode;
  constructor(code: SipErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'SipError';
    this.code = code;
    if (cause) (this as { cause?: unknown }).cause = cause;
  }
}
