'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import Modal from '@/components/ui/Modal';
import StatusPill from '@/components/ui/StatusPill';
import type { ProjectStatus } from '@/lib/mock';
import { createProject, type ProjectRow } from '@/server/actions/projects';

const STATUSES: ProjectStatus[] = ['active', 'expiring', 'expired'];

const ERROR_KEY = {
  name_required: 'nameRequired',
  name_taken: 'nameTaken',
  sip_server_required: 'sipServerRequired',
  sip_server_missing: 'sipServerMissing',
} as const;

interface SipServerOption {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

interface Props {
  projects: ProjectRow[];
  predictedNextId: string;
  sipServers: SipServerOption[];
}

export default function ProjectsClient({ projects, predictedNextId, sipServers }: Props) {
  const t = useTranslations('adminProjects');
  const tStatus = useTranslations('projectStatus');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [sipServerId, setSipServerId] = useState<string>(sipServers[0]?.id ?? '');
  const [broadcastPrefix, setBroadcastPrefix] = useState('');
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setName('');
    setStatus('active');
    setSipServerId(sipServers[0]?.id ?? '');
    setBroadcastPrefix('');
    setError(null);
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('errors.nameRequired'));
      return;
    }
    if (!sipServerId) {
      setError(t('errors.sipServerRequired'));
      return;
    }
    startTransition(async () => {
      const result = await createProject({
        name: trimmed,
        status,
        sipServerId,
        broadcastPrefix: broadcastPrefix.trim(),
      });
      if (!result.ok) {
        const key = ERROR_KEY[result.error];
        setError(t(`errors.${key}`, { name: trimmed }));
        return;
      }
      setShowModal(false);
      router.refresh();
    });
  }

  const filtered = projects.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || p.status === filterStatus)
  );

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
          {t('addProject')}
        </button>
      </div>

      <div className="admin-card mb-4 flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="px-3 py-2 rounded-lg text-sm w-72"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
        >
          <option value="">{t('allStatuses')}</option>
          {STATUSES.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
        </select>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Link
            key={p.id}
            href={`/admin/projects/${p.id}`}
            className="admin-card hover:border-blue-500 transition block"
            style={{ textDecoration: 'none' }}
          >
            <div className="mb-3">
              <div className="font-bold text-white truncate" style={{ fontSize: 17 }}>{p.name}</div>
              <div className="text-xs text-slate-500 font-mono">id: {p.id}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-900 rounded-lg p-2">
                <div className="text-xs text-slate-500">{t('stats.users')}</div>
                <div className="text-lg font-bold text-white">{p.userCount}</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-2">
                <div className="text-xs text-slate-500">{t('stats.speakers')}</div>
                <div className="text-lg font-bold text-white">{p.speakerCount}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <StatusPill status={p.status} />
            </div>
          </Link>
        ))}
      </section>

      <Modal open={showModal} onClose={() => setShowModal(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{t('modal.title')}</h3>
              <p className="text-sm text-slate-500">{t('modal.subtitle')}</p>
            </div>
            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1">✕</button>
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
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('modal.status')}</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {STATUSES.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('modal.sipServer')}</label>
              <select
                value={sipServerId}
                onChange={e => setSipServerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="" disabled>{t('modal.sipServerPlaceholder')}</option>
                {sipServers.map(a => (
                  <option key={a.id} value={a.id} disabled={!a.active}>
                    {a.name} — {a.domain}{!a.active ? ` (${tCommon('suspended')})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">{t('modal.sipServerHint')}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('modal.broadcastPrefix')}</label>
              <input
                type="text"
                value={broadcastPrefix}
                onChange={e => setBroadcastPrefix(e.target.value)}
                placeholder="99"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                maxLength={20}
              />
              <p className="text-xs text-slate-500 mt-1">{t('modal.broadcastPrefixHint')}</p>
            </div>
            <div className="text-xs text-slate-500">
              {t('modal.idPreview', { id: predictedNextId })}
            </div>
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
                {t('modal.submit')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
