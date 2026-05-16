'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import AddUserModal from '@/components/admin/AddUserModal';
import EditUserModal from '@/components/admin/EditUserModal';
import Avatar from '@/components/ui/Avatar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import SpeakerStatusPill from '@/components/ui/SpeakerStatusPill';
import StatCard from '@/components/ui/StatCard';
import StatusPill from '@/components/ui/StatusPill';
import type { ProjectStatus } from '@/lib/mock';
import { deleteProject, updateProject, type DeleteProjectResult, type ProjectRow, type UpdateProjectResult } from '@/server/actions/projects';
import { createSpeaker, updateSpeaker, deleteSpeaker, setSpeakerOnline, type CreateSpeakerResult, type UpdateSpeakerResult } from '@/server/actions/speakers';
import { deleteUser, type ProjectUserRow } from '@/server/actions/users';
import type { SpeakerRow } from '@/server/actions/speakers';

const ROLE_BADGE: Record<string, string> = {
  authority: 'bg-red-500/15 text-red-400',
  officer: 'bg-blue-500/15 text-blue-400',
  general: 'bg-green-500/15 text-green-400',
};

const STATUSES: ProjectStatus[] = ['active', 'expiring', 'expired'];

const UPDATE_ERROR_KEY: Record<Extract<UpdateProjectResult, { ok: false }>['error'], string> = {
  name_required: 'nameRequired',
  name_taken: 'nameTaken',
  not_found: 'notFound',
};

const SPEAKER_ERROR_KEY: Record<Extract<CreateSpeakerResult, { ok: false }>['error'], string> = {
  required: 'required',
  ext_format: 'extFormat',
  ext_taken: 'extTaken',
  asterisk_missing: 'asteriskMissing',
  project_missing: 'projectMissing',
};

const UPDATE_SPEAKER_ERROR_KEY: Record<Extract<UpdateSpeakerResult, { ok: false }>['error'], string> = {
  required: 'required',
  ext_format: 'extFormat',
  ext_taken: 'extTaken',
  asterisk_missing: 'asteriskMissing',
  not_found: 'notFound',
};

type Tab = 'accounts' | 'speakers' | 'usage';

interface AsteriskOption {
  id: string;
  name: string;
  domain: string;
}

interface Props {
  project: ProjectRow;
  users: ProjectUserRow[];
  speakers: SpeakerRow[];
  asterisks: AsteriskOption[];
  suggestedExt: string;
}

export default function ProjectDetailClient({ project, users, speakers, asterisks, suggestedExt }: Props) {
  const t = useTranslations('adminProjectDetail');
  const tProjects = useTranslations('adminProjects');
  const tStatus = useTranslations('projectStatus');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tab, setTab] = useState<Tab>('accounts');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<ProjectUserRow | null>(null);
  const [deletingUser, setDeletingUser] = useState<ProjectUserRow | null>(null);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(null);
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendError, setSuspendError] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editError, setEditError] = useState<string | null>(null);

  // Add speaker modal state
  const [showAddSpeaker, setShowAddSpeaker] = useState(false);
  const [speakerName, setSpeakerName] = useState('');
  const [speakerExt, setSpeakerExt] = useState('');
  const [speakerArea, setSpeakerArea] = useState('');
  const [speakerAsteriskId, setSpeakerAsteriskId] = useState('');
  const [speakerError, setSpeakerError] = useState<string | null>(null);

  // Edit speaker modal state
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerRow | null>(null);
  const [editSpeakerName, setEditSpeakerName] = useState('');
  const [editSpeakerExt, setEditSpeakerExt] = useState('');
  const [editSpeakerArea, setEditSpeakerArea] = useState('');
  const [editSpeakerAsteriskId, setEditSpeakerAsteriskId] = useState('');
  const [editSpeakerError, setEditSpeakerError] = useState<string | null>(null);

  // Delete speaker dialog state
  const [deletingSpeaker, setDeletingSpeaker] = useState<SpeakerRow | null>(null);
  const [deleteSpeakerError, setDeleteSpeakerError] = useState<string | null>(null);

  function togglePassword(id: string) {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEdit() {
    setEditName(project.name);
    setEditStatus(project.status);
    setEditError(null);
    setShowEdit(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    const trimmed = editName.trim();
    startTransition(async () => {
      const result = await updateProject({ id: project.id, name: trimmed, status: editStatus });
      if (!result.ok) {
        setEditError(tProjects(`errors.${UPDATE_ERROR_KEY[result.error]}`, { name: trimmed }));
        return;
      }
      setShowEdit(false);
      router.refresh();
    });
  }

  const isSuspended = project.status === 'expired';

  function openSuspendToggle() {
    setSuspendError(null);
    setShowSuspend(true);
  }

  function handleSuspendToggleConfirm() {
    const nextStatus: ProjectStatus = isSuspended ? 'active' : 'expired';
    setSuspendError(null);
    startTransition(async () => {
      const result = await updateProject({ id: project.id, name: project.name, status: nextStatus });
      if (!result.ok) {
        setSuspendError(tProjects(`errors.${UPDATE_ERROR_KEY[result.error]}`, { name: project.name }));
        return;
      }
      setShowSuspend(false);
      router.refresh();
    });
  }

  function openDeleteUser(user: ProjectUserRow) {
    setDeleteUserError(null);
    setDeletingUser(user);
  }

  function handleDeleteUserConfirm() {
    const user = deletingUser;
    if (!user) return;
    setDeleteUserError(null);
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (!result.ok) {
        setDeleteUserError(t(`accountsTab.deleteErrors.${result.error === 'not_found' ? 'notFound' : 'generic'}`));
        return;
      }
      setDeletingUser(null);
      router.refresh();
    });
  }

  function openDeleteProject() {
    setDeleteProjectError(null);
    setShowDeleteProject(true);
  }

  function handleDeleteProjectConfirm() {
    setDeleteProjectError(null);
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (!result.ok) {
        setDeleteProjectError(
          t(`deleteProject.errors.${result.error === 'not_found' ? 'notFound' : 'generic'}`)
        );
        return;
      }
      setShowDeleteProject(false);
      router.push('/admin/projects');
    });
  }

  function openAddSpeaker() {
    setSpeakerName('');
    setSpeakerExt('');
    setSpeakerArea('');
    setSpeakerAsteriskId(asterisks[0]?.id ?? '');
    setSpeakerError(null);
    setShowAddSpeaker(true);
  }

  function handleAddSpeakerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSpeakerError(null);
    startTransition(async () => {
      const result = await createSpeaker({
        projectId: project.id,
        name: speakerName,
        ext: speakerExt,
        area: speakerArea,
        asteriskId: speakerAsteriskId,
      });
      if (!result.ok) {
        const params: Record<string, string> = {};
        if (result.error === 'ext_taken') params.ext = speakerExt.trim();
        setSpeakerError(t(`addSpeakerModal.errors.${SPEAKER_ERROR_KEY[result.error]}`, params));
        return;
      }
      setShowAddSpeaker(false);
      router.refresh();
    });
  }

  function openEditSpeaker(s: SpeakerRow) {
    setEditingSpeaker(s);
    setEditSpeakerName(s.name);
    setEditSpeakerExt(s.ext);
    setEditSpeakerArea(s.area);
    setEditSpeakerAsteriskId(s.asteriskId);
    setEditSpeakerError(null);
  }

  function handleEditSpeakerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSpeaker) return;
    setEditSpeakerError(null);
    startTransition(async () => {
      const result = await updateSpeaker({
        id: editingSpeaker.id,
        name: editSpeakerName,
        ext: editSpeakerExt,
        area: editSpeakerArea,
        asteriskId: editSpeakerAsteriskId,
      });
      if (!result.ok) {
        const params: Record<string, string> = {};
        if (result.error === 'ext_taken') params.ext = editSpeakerExt.trim();
        setEditSpeakerError(t(`editSpeakerModal.errors.${UPDATE_SPEAKER_ERROR_KEY[result.error]}`, params));
        return;
      }
      setEditingSpeaker(null);
      router.refresh();
    });
  }

  function openDeleteSpeaker(s: SpeakerRow) {
    setDeleteSpeakerError(null);
    setDeletingSpeaker(s);
  }

  function handleDeleteSpeakerConfirm() {
    const target = deletingSpeaker;
    if (!target) return;
    setDeleteSpeakerError(null);
    startTransition(async () => {
      const result = await deleteSpeaker(target.id);
      if (!result.ok) {
        setDeleteSpeakerError(t(`speakersTab.deleteErrors.${result.error === 'not_found' ? 'notFound' : 'generic'}`));
        return;
      }
      setDeletingSpeaker(null);
      router.refresh();
    });
  }

  function handleToggleOnline(s: SpeakerRow) {
    startTransition(async () => {
      await setSpeakerOnline(s.id, !s.online);
      router.refresh();
    });
  }

  const generalUsers = users.filter(u => u.role === 'general').length;

  const infoCards = [
    { label: t('stats.users'), value: `${users.length}`, hint: t('stats.generalUsers', { count: generalUsers }) },
    { label: t('stats.speakers'), value: `${speakers.length}`, hint: t('stats.idle', { count: speakers.filter(s => s.status === 'idle').length }) },
    { label: t('stats.storage'), value: '2.1 GB', hint: t('stats.lastUsed') },
  ];

  return (
    <>
      <Link href="/admin/projects" className="text-sm text-slate-400 hover:text-white">{t('back')}</Link>

      <div className="flex items-start justify-between gap-3 mt-3 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <StatusPill status={project.status} />
          </div>
          <div className="text-sm text-slate-400 mt-1">{t('infoLine', { id: project.id })}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openEdit}
            disabled={pending}
            className="px-3 py-2 border border-slate-600 hover:bg-slate-700 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {t('edit')}
          </button>
          <button
            onClick={openSuspendToggle}
            disabled={pending}
            className={`px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${
              isSuspended
                ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
            }`}
          >
            {isSuspended ? t('unsuspend') : t('suspend')}
          </button>
          <button
            onClick={openDeleteProject}
            disabled={pending}
            className="px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {t('deleteProject.button')}
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {infoCards.map(c => (
          <StatCard key={c.label} variant="admin" label={c.label} value={c.value} hint={c.hint} />
        ))}
      </section>

      <div className="flex border-b border-white/10 mb-4">
        {(['accounts', 'speakers', 'usage'] as const).map(tabId => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === tabId ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {t(`tabs.${tabId}`)}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">{t('accountsTab.title')}</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              {t('accountsTab.addUser')}
            </button>
          </div>
          <div className="space-y-2">
            {users.length === 0 ? (
              <div className="admin-card text-slate-400">{t('accountsTab.empty')}</div>
            ) : users.map(u => {
              const revealed = revealedPasswords.has(u.id);
              return (
                <div key={u.id} className="admin-card flex items-center gap-4 flex-wrap">
                  <Avatar name={u.name} tone="slate" size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{u.name}</div>
                    <div className="text-xs text-slate-400">@{u.username}</div>
                    {u.role === 'general' && (
                      <div className="text-xs text-blue-400 mt-1">{t('accountsTab.responsibleFor', { count: u.assignedSpeakerIds.length })}</div>
                    )}
                    {u.credentials && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-mono">{t('accountsTab.sipExt', { ext: u.credentials.ext })}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono">{revealed ? u.credentials.password : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => togglePassword(u.id)}
                          className="text-slate-500 hover:text-slate-300"
                          title={revealed ? t('accountsTab.passwordHide') : t('accountsTab.passwordShow')}
                        >
                          {revealed ? '🙈' : '👁'}
                        </button>
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_BADGE[u.role] || 'bg-slate-500/15 text-slate-400'}`}>{tRoles(`${u.role}.name`)}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingUser(u)}
                      disabled={pending}
                      title={t('accountsTab.editUser')}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-60"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteUser(u)}
                      disabled={pending}
                      title={t('accountsTab.deleteUser')}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded disabled:opacity-60"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'speakers' && (
        <section className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">{t('speakersTab.title')}</h2>
            <button
              onClick={openAddSpeaker}
              disabled={asterisks.length === 0}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-60"
              title={asterisks.length === 0 ? t('speakersTab.noAsteriskHint') : undefined}
            >
              {t('speakersTab.addSpeaker')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {speakers.map(s => {
              const assignedTo = users.filter(u => u.role === 'general' && u.assignedSpeakerIds.includes(s.id));
              return (
                <div key={s.id} className="admin-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{s.name}</div>
                      <div className="text-xs text-slate-400">Ext. {s.ext} · {s.area}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <SpeakerStatusPill status={s.status} />
                      <button
                        type="button"
                        role="switch"
                        aria-checked={s.online}
                        onClick={() => handleToggleOnline(s)}
                        disabled={pending}
                        title={s.online ? t('speakersTab.toggleOnline.goOffline') : t('speakersTab.toggleOnline.goOnline')}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-60 ${
                          s.online ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            s.online ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                        <span className="sr-only">{t('speakersTab.toggleOnline.label')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditSpeaker(s)}
                        disabled={pending}
                        title={t('speakersTab.editSpeaker')}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-60"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteSpeaker(s)}
                        disabled={pending}
                        title={t('speakersTab.deleteSpeaker')}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded disabled:opacity-60"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className={`text-xs ${assignedTo.length === 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                    {assignedTo.length === 0
                      ? t('speakersTab.notAssigned')
                      : t('speakersTab.assignedTo', { names: assignedTo.map(u => u.name).join(', ') })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'usage' && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">{t('usageTab.monthlyAnnouncements')}</div>
            <div className="text-3xl font-bold text-white mt-2">142</div>
            <div className="text-xs text-slate-500 mt-1">{t('usageTab.monthlyHint')}</div>
          </div>
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">{t('usageTab.totalTime')}</div>
            <div className="text-3xl font-bold text-white mt-2">3 h 25 m</div>
            <div className="text-xs text-slate-500 mt-1">{t('usageTab.averageHint')}</div>
          </div>
          <div className="admin-card">
            <div className="text-xs text-slate-400 uppercase tracking-wider">{t('usageTab.spaceUsed')}</div>
            <div className="text-3xl font-bold text-white mt-2">2.1 GB</div>
            <div className="text-xs text-slate-500 mt-1">{t('usageTab.spaceHint')}</div>
          </div>
        </section>
      )}

      <AddUserModal
        open={showAddUser}
        projectId={project.id}
        asterisks={asterisks}
        speakers={speakers}
        suggestedExt={suggestedExt}
        onClose={() => setShowAddUser(false)}
      />

      <EditUserModal
        open={editingUser !== null}
        user={editingUser}
        asterisks={asterisks}
        speakers={speakers}
        onClose={() => setEditingUser(null)}
      />

      <ConfirmDialog
        open={deletingUser !== null}
        tone="danger"
        icon="🗑"
        title={t('accountsTab.deleteModal.title')}
        subtitle={deletingUser ? `${deletingUser.name} · @${deletingUser.username}` : undefined}
        warning={t('accountsTab.deleteModal.warning')}
        error={deleteUserError}
        confirmLabel={t('accountsTab.deleteModal.confirm')}
        pending={pending}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDeleteUserConfirm}
      />

      <ConfirmDialog
        open={showSuspend}
        tone={isSuspended ? 'primary' : 'warning'}
        icon={isSuspended ? '✓' : '⏸'}
        title={t(isSuspended ? 'suspendModal.unsuspendTitle' : 'suspendModal.suspendTitle')}
        subtitle={`${project.name} · ${t('infoLine', { id: project.id })}`}
        body={t(isSuspended ? 'suspendModal.unsuspendBody' : 'suspendModal.suspendBody')}
        warning={isSuspended ? undefined : t('suspendModal.suspendWarning')}
        error={suspendError}
        confirmLabel={t(isSuspended ? 'suspendModal.unsuspendConfirm' : 'suspendModal.suspendConfirm')}
        pending={pending}
        onCancel={() => setShowSuspend(false)}
        onConfirm={handleSuspendToggleConfirm}
      />

      <ConfirmDialog
        open={deletingSpeaker !== null}
        tone="danger"
        icon="🗑"
        title={t('speakersTab.deleteModal.title')}
        subtitle={deletingSpeaker ? `${deletingSpeaker.name} · Ext. ${deletingSpeaker.ext}` : undefined}
        warning={t('speakersTab.deleteModal.warning')}
        error={deleteSpeakerError}
        confirmLabel={t('speakersTab.deleteModal.confirm')}
        pending={pending}
        onCancel={() => setDeletingSpeaker(null)}
        onConfirm={handleDeleteSpeakerConfirm}
      />

      <ConfirmDialog
        open={showDeleteProject}
        tone="danger"
        icon="🗑"
        title={t('deleteProject.title')}
        subtitle={`${project.name} · ${t('infoLine', { id: project.id })}`}
        body={t('deleteProject.body', {
          users: users.length,
          speakers: speakers.length,
        })}
        warning={t('deleteProject.warning')}
        error={deleteProjectError}
        confirmLabel={t('deleteProject.confirm')}
        pending={pending}
        onCancel={() => setShowDeleteProject(false)}
        onConfirm={handleDeleteProjectConfirm}
      />

      <Modal open={showEdit} onClose={() => setShowEdit(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{t('editModal.title')}</h3>
              <p className="text-sm text-slate-500">{t('editModal.subtitle')}</p>
            </div>
            <button onClick={() => setShowEdit(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <form className="space-y-3" onSubmit={handleEditSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('editModal.name')}</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('editModal.status')}</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {STATUSES.map(s => <option key={s} value={s}>{tStatus(s)}</option>)}
              </select>
            </div>
            {editError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
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

      <Modal open={showAddSpeaker} onClose={() => setShowAddSpeaker(false)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{t('addSpeakerModal.title')}</h3>
              <p className="text-sm text-slate-500">{t('addSpeakerModal.subtitle')}</p>
            </div>
            <button onClick={() => setShowAddSpeaker(false)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <form className="space-y-3" onSubmit={handleAddSpeakerSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.name')}</label>
              <input
                type="text"
                value={speakerName}
                onChange={e => setSpeakerName(e.target.value)}
                placeholder={t('addSpeakerModal.namePlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.ext')}</label>
                <input
                  type="text"
                  value={speakerExt}
                  onChange={e => setSpeakerExt(e.target.value)}
                  placeholder="1001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.area')}</label>
                <input
                  type="text"
                  value={speakerArea}
                  onChange={e => setSpeakerArea(e.target.value)}
                  placeholder={t('addSpeakerModal.areaPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.asterisk')}</label>
              <select
                value={speakerAsteriskId}
                onChange={e => setSpeakerAsteriskId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="" disabled>{t('addSpeakerModal.asteriskPlaceholder')}</option>
                {asterisks.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.domain}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">{t('addSpeakerModal.asteriskHint')}</p>
            </div>
            {speakerError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{speakerError}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSpeaker(false)}
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
                {t('addSpeakerModal.submit')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal open={editingSpeaker !== null} onClose={() => setEditingSpeaker(null)} variant="admin" size="md">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{t('editSpeakerModal.title')}</h3>
              <p className="text-sm text-slate-500">
                {editingSpeaker ? t('editSpeakerModal.subtitle', { name: editingSpeaker.name }) : ''}
              </p>
            </div>
            <button onClick={() => setEditingSpeaker(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
          <form className="space-y-3" onSubmit={handleEditSpeakerSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.name')}</label>
              <input
                type="text"
                value={editSpeakerName}
                onChange={e => setEditSpeakerName(e.target.value)}
                placeholder={t('addSpeakerModal.namePlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.ext')}</label>
                <input
                  type="text"
                  value={editSpeakerExt}
                  onChange={e => setEditSpeakerExt(e.target.value)}
                  placeholder="1001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.area')}</label>
                <input
                  type="text"
                  value={editSpeakerArea}
                  onChange={e => setEditSpeakerArea(e.target.value)}
                  placeholder={t('addSpeakerModal.areaPlaceholder')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t('addSpeakerModal.asterisk')}</label>
              <select
                value={editSpeakerAsteriskId}
                onChange={e => setEditSpeakerAsteriskId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="" disabled>{t('addSpeakerModal.asteriskPlaceholder')}</option>
                {asterisks.map(a => (
                  <option key={a.id} value={a.id}>{a.name} — {a.domain}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">{t('addSpeakerModal.asteriskHint')}</p>
            </div>
            {editSpeakerError && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editSpeakerError}</div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingSpeaker(null)}
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
    </>
  );
}
