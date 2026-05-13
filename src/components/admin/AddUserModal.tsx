'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import Modal from '@/components/ui/Modal';
import type { RoleId } from '@/lib/mock';
import { createUserWithAsterisk, type CreateUserResult } from '@/server/actions/users';

type AddableRole = Exclude<RoleId, 'admin'>;

interface AsteriskOption {
  id: string;
  name: string;
  domain: string;
}

interface SpeakerOption {
  id: string;
  name: string;
  ext: string;
}

interface Props {
  open: boolean;
  projectId: string;
  asterisks: AsteriskOption[];
  speakers: SpeakerOption[];
  suggestedExt: string;
  onClose: () => void;
}

const ERROR_KEY: Record<Extract<CreateUserResult, { ok: false }>['error'], string> = {
  required: 'required',
  username_format: 'usernameFormat',
  username_taken: 'usernameTaken',
  ext_format: 'extFormat',
  ext_taken: 'extTaken',
  asterisk_missing: 'asteriskMissing',
};

function generateSipPassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function AddUserModal({ open, projectId, asterisks, speakers, suggestedExt, onClose }: Props) {
  const t = useTranslations('addUserModal');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<AddableRole>('officer');
  const [asteriskId, setAsteriskId] = useState('');
  const [ext, setExt] = useState('');
  const [password, setPassword] = useState('');
  const [revealPassword, setRevealPassword] = useState(false);
  const [assignedSpeakers, setAssignedSpeakers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset + prefill whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setName('');
    setUsername('');
    setRole('officer');
    setAsteriskId(asterisks[0]?.id ?? '');
    setExt(suggestedExt);
    setPassword(generateSipPassword());
    setRevealPassword(false);
    setAssignedSpeakers([]);
    setError(null);
  }, [open, asterisks, suggestedExt]);

  function regeneratePassword() {
    setPassword(generateSipPassword());
    setRevealPassword(true);
  }

  function toggleSpeaker(id: string) {
    setAssignedSpeakers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanExt = ext.trim();
    const cleanPassword = password.trim();

    startTransition(async () => {
      const result = await createUserWithAsterisk({
        projectId,
        name: cleanName,
        username: cleanUsername,
        role,
        asteriskId,
        ext: cleanExt,
        password: cleanPassword,
        assignedSpeakerIds: role === 'headVillage' ? assignedSpeakers : [],
      });
      if (!result.ok) {
        const key = ERROR_KEY[result.error];
        const params: Record<string, string> = {};
        if (result.error === 'username_taken') params.username = cleanUsername;
        if (result.error === 'ext_taken') params.ext = cleanExt;
        setError(t(`errors.${key}`, params));
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} variant="admin" size="lg">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{t('title')}</h3>
            <p className="text-sm text-slate-500">{t('subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* User basics */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('section.user')}</legend>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('fields.namePlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="somchai"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.role')}</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as AddableRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="authority">{tRoles('authority.name')}</option>
                  <option value="officer">{tRoles('officer.name')}</option>
                  <option value="headVillage">{tRoles('headVillage.name')}</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* SIP credentials — admin only */}
          <fieldset className="space-y-3 border-t border-slate-200 pt-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('section.sip')}</legend>
            <p className="text-xs text-slate-500">{t('section.sipHint')}</p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.asterisk')}</label>
              <select
                value={asteriskId}
                onChange={e => setAsteriskId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="" disabled>{t('fields.asteriskPlaceholder')}</option>
                {asterisks.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.domain}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.ext')}</label>
                <input
                  type="text"
                  value={ext}
                  onChange={e => setExt(e.target.value)}
                  placeholder="9001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.password')}</label>
                <div className="flex gap-2">
                  <input
                    type={revealPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRevealPassword(v => !v)}
                    className="px-2 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-50"
                    title={revealPassword ? t('fields.passwordHide') : t('fields.passwordShow')}
                  >
                    {revealPassword ? '🙈' : '👁'}
                  </button>
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="px-2 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-50"
                    title={t('fields.passwordGenerate')}
                  >
                    ✨
                  </button>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Speaker assignments — head village only */}
          {role === 'headVillage' && speakers.length > 0 && (
            <fieldset className="space-y-2 border-t border-slate-200 pt-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('section.speakers')}</legend>
              <p className="text-xs text-slate-500">{t('section.speakersHint')}</p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {speakers.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-slate-700 px-2 py-1 rounded hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={assignedSpeakers.includes(s.id)}
                      onChange={() => toggleSpeaker(s.id)}
                    />
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto text-xs font-mono text-slate-400">{s.ext}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-60"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold disabled:opacity-60"
            >
              {t('submit')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
