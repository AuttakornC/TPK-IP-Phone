'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import Modal from '@/components/ui/Modal';
import {
  createAsterisk,
  deleteAsterisk,
  updateAsterisk,
  type AsteriskRow,
  type SaveAsteriskResult,
} from '@/server/actions/asterisks';

const SAVE_ERROR_KEY: Record<Extract<SaveAsteriskResult, { ok: false }>['error'], string> = {
  name_required: 'nameRequired',
  domain_required: 'domainRequired',
  domain_taken: 'domainTaken',
};

interface Props {
  asterisks: AsteriskRow[];
}

export default function AsterisksClient({ asterisks }: Props) {
  const t = useTranslations('adminAsterisks');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AsteriskRow | null>(null);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName('');
    setDomain('');
    setActive(true);
    setError(null);
    setShowModal(true);
  }

  function openEdit(a: AsteriskRow) {
    setEditing(a);
    setName(a.name);
    setDomain(a.domain);
    setActive(a.active);
    setError(null);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = editing
        ? await updateAsterisk({ id: editing.id, name, domain, active })
        : await createAsterisk({ name, domain, active });
      if (!result.ok) {
        setError(t(`errors.${SAVE_ERROR_KEY[result.error]}`));
        return;
      }
      setShowModal(false);
      router.refresh();
    });
  }

  function handleDelete(a: AsteriskRow) {
    const total = a.speakerCount + a.userAsteriskCount;
    if (total > 0) {
      alert(t('deleteBlocked', { count: total }));
      return;
    }
    if (!confirm(t('deleteConfirm', { name: a.name }))) return;
    startTransition(async () => {
      const result = await deleteAsterisk(a.id);
      if (!result.ok) {
        alert(t('deleteBlocked', { count: result.speakerCount + result.userCount }));
        return;
      }
      router.refresh();
    });
  }

  const filtered = asterisks.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.domain.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-slate-400 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          {t('addAsterisk')}
        </button>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="px-3 py-2 rounded-lg text-sm w-72"
        />
      </div>

      <section className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">{t('table.name')}</th>
              <th className="px-3 py-2 font-semibold">{t('table.domain')}</th>
              <th className="px-3 py-2 font-semibold">{t('table.speakers')}</th>
              <th className="px-3 py-2 font-semibold">{t('table.status')}</th>
              <th className="px-3 py-2 font-semibold">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">{t('table.empty')}</td>
              </tr>
            ) : filtered.map(a => {
              const inUse = a.speakerCount + a.userAsteriskCount;
              return (
                <tr key={a.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="px-3 py-3 font-medium text-white">{a.name}</td>
                  <td className="px-3 py-3 font-mono text-slate-300">{a.domain}</td>
                  <td className="px-3 py-3 text-slate-300">{t('speakerCount', { count: inUse })}</td>
                  <td className="px-3 py-3">
                    {a.active ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">{tCommon('active')}</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30">{tCommon('suspended')}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded">✎</button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Modal open={showModal} onClose={() => setShowModal(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{editing ? t('modal.editTitle') : t('modal.title')}</h3>
              <p className="text-sm text-slate-500">{t('modal.subtitle')}</p>
            </div>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('modal.name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('modal.namePlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('modal.domain')}</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="sip.example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                required
              />
              <p className="text-xs text-slate-500 mt-1">{t('modal.domainHint')}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
              {t('modal.active')}
            </label>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                {editing ? tCommon('save') : t('modal.submit')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
