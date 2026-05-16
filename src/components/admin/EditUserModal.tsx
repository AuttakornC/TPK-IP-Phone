'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import Modal from '@/components/ui/Modal';
import type { RoleId } from '@/lib/mock';
import { updateUser, type ProjectUserRow, type UpdateUserResult } from '@/server/actions/users';

type EditableRole = Exclude<RoleId, 'admin'>;

interface SpeakerOption {
  id: string;
  name: string;
  ext: string;
}

interface Props {
  open: boolean;
  user: ProjectUserRow | null;
  speakers: SpeakerOption[];
  onClose: () => void;
}

const ERROR_KEY: Record<Extract<UpdateUserResult, { ok: false }>['error'], string> = {
  required: 'required',
  not_found: 'notFound',
  ext_format: 'extFormat',
  ext_taken: 'extTaken',
  login_password_short: 'loginPasswordShort',
};

function generateLoginPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function generateSipPassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export default function EditUserModal({ open, user, speakers, onClose }: Props) {
  const t = useTranslations('editUserModal');
  const tAdd = useTranslations('addUserModal');
  const tRoles = useTranslations('roles');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [role, setRole] = useState<EditableRole>('officer');
  const [ext, setExt] = useState('');
  const [password, setPassword] = useState('');
  const [revealPassword, setRevealPassword] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [revealLoginPassword, setRevealLoginPassword] = useState(false);
  const [assignedSpeakers, setAssignedSpeakers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name);
    setRole(user.role);
    setExt(user.credentials?.ext ?? '');
    setPassword(user.credentials?.password ?? '');
    setRevealPassword(false);
    setLoginPassword('');
    setRevealLoginPassword(false);
    setAssignedSpeakers(user.assignedSpeakerIds);
    setError(null);
  }, [open, user]);

  function regeneratePassword() {
    setPassword(generateSipPassword());
    setRevealPassword(true);
  }

  function regenerateLoginPassword() {
    setLoginPassword(generateLoginPassword());
    setRevealLoginPassword(true);
  }

  function toggleSpeaker(id: string) {
    setAssignedSpeakers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    const cleanName = name.trim();
    const cleanExt = ext.trim();
    const cleanPassword = password.trim();

    startTransition(async () => {
      const result = await updateUser({
        id: user.id,
        name: cleanName,
        role,
        ext: cleanExt,
        password: cleanPassword,
        loginPassword,
        assignedSpeakerIds: role === 'general' ? assignedSpeakers : [],
      });
      if (!result.ok) {
        const key = ERROR_KEY[result.error];
        const params: Record<string, string> = {};
        if (result.error === 'ext_taken') params.ext = cleanExt;
        setError(t(`errors.${key}`, params));
        return;
      }
      onClose();
      router.refresh();
    });
  }

  if (!user) return null;

  return (
    <Modal open={open} onClose={onClose} variant="admin" size="lg">
      <div className="p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">{t('title')}</h3>
            <p className="text-sm text-slate-500">{t('subtitle', { username: user.username })}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tAdd('section.user')}</legend>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{tAdd('fields.name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{tAdd('fields.username')}</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{tAdd('fields.role')}</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as EditableRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="authority">{tRoles('authority.name')}</option>
                  <option value="officer">{tRoles('officer.name')}</option>
                  <option value="general">{tRoles('general.name')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('fields.loginPassword')}</label>
              <div className="flex gap-2">
                <input
                  type={revealLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder={t('fields.loginPasswordPlaceholder')}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setRevealLoginPassword(v => !v)}
                  className="px-2 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-50"
                  title={revealLoginPassword ? tAdd('fields.passwordHide') : tAdd('fields.passwordShow')}
                >
                  {revealLoginPassword ? '🙈' : '👁'}
                </button>
                <button
                  type="button"
                  onClick={regenerateLoginPassword}
                  className="px-2 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-50"
                  title={tAdd('fields.loginPasswordGenerate')}
                >
                  ✨
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">{t('fields.loginPasswordHint')}</p>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border-t border-slate-200 pt-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tAdd('section.sip')}</legend>
            <p className="text-xs text-slate-500">{tAdd('section.sipHint')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{tAdd('fields.ext')}</label>
                <input
                  type="text"
                  value={ext}
                  onChange={e => setExt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{tAdd('fields.password')}</label>
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
                    title={revealPassword ? tAdd('fields.passwordHide') : tAdd('fields.passwordShow')}
                  >
                    {revealPassword ? '🙈' : '👁'}
                  </button>
                  <button
                    type="button"
                    onClick={regeneratePassword}
                    className="px-2 py-2 border border-slate-300 rounded-lg text-xs hover:bg-slate-50"
                    title={tAdd('fields.passwordGenerate')}
                  >
                    ✨
                  </button>
                </div>
              </div>
            </div>
          </fieldset>

          {role === 'general' && speakers.length > 0 && (
            <fieldset className="space-y-2 border-t border-slate-200 pt-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">{tAdd('section.speakers')}</legend>
              <p className="text-xs text-slate-500">{tAdd('section.speakersHint')}</p>
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
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
