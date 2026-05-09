import type { Mp3File, Speaker } from '@/lib/mock';
import type { EmergencyPreset, PlayMode, TemplatePreset } from '@/lib/presetStore';

export type CallKind = 'single' | 'group' | 'emergency' | 'template' | 'mp3';

export interface CallState {
  kind: CallKind;
  speakers: Speaker[];
  emergency?: EmergencyPreset;
  template?: TemplatePreset;
  mp3?: Mp3File;
  /** When set on emergency/template, drives whether the mic opens after the MP3. */
  playMode?: PlayMode;
}

export const EMERGENCY_GLYPHS: Record<string, string> = {
  fire: '🔥',
  flood: '🌊',
  earthquake: '🌐',
  criminal: '⚠️',
  general: '🚨',
};

export const EMERGENCY_PALETTE: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', iconBg: 'bg-red-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', iconBg: 'bg-blue-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700', iconBg: 'bg-orange-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', iconBg: 'bg-amber-600' },
};
