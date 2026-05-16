// Public entry point for the SIP module.
//
// Usage:
//   import { SipClient, type SipConfig } from '@/lib/sip';
//   const client = new SipClient(config, { onCallStateChange, onError });
//   await client.connect();
//   const handles = await client.call([{ id: 'sp01', ext: '1001' }]);
//   // ...later
//   client.disconnect();

export { SipClient } from './client';
export {
  SipError,
  type SipConfig,
  type SipCallTarget,
  type SipCallState,
  type SipCallHandle,
  type SipCallOptions,
  type SipEvents,
  type SipErrorCode,
} from './types';
