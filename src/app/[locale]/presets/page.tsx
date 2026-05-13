'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import EmergencyPresetEditor from '@/components/app/EmergencyPresetEditor';
import TemplatePresetEditor from '@/components/app/TemplatePresetEditor';
import { type Mp3File } from '@/lib/mock';
import { listMp3 } from '@/lib/mp3Store';
import {
  deleteEmergencyPreset,
  deleteTemplatePreset,
  listEmergencyPresets,
  listTemplatePresets,
  newPresetId,
  saveEmergencyPreset,
  saveTemplatePreset,
  type EmergencyPreset,
  type TemplatePreset,
} from '@/lib/presetStore';
import { getCurrentRole, getCurrentUser } from '@/lib/role';

type Tab = 'emergency' | 'template';

export default function PresetsPage() {
  const router = useRouter();
  const t = useTranslations('presetsPage');
  const tCommon = useTranslations('common');
  const [tab, setTab] = useState<Tab>('emergency');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyPreset[]>([]);
  const [templates, setTemplates] = useState<TemplatePreset[]>([]);
  const [mp3Library, setMp3Library] = useState<Mp3File[]>([]);
  const [editingEm, setEditingEm] = useState<EmergencyPreset | null>(null);
  const [editingTpl, setEditingTpl] = useState<TemplatePreset | null>(null);
  const [emOpen, setEmOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);

  useEffect(() => {
    const role = getCurrentRole();
    if (role === 'admin') { router.replace('/admin/dashboard'); return; }
    if (role === 'general') { router.replace('/general'); return; }
    const u = getCurrentUser();
    const pid = u?.projectId ?? null;
    setProjectId(pid);
    if (pid) {
      setEmergencies(listEmergencyPresets(pid));
      setTemplates(listTemplatePresets(pid));
      setMp3Library(listMp3(pid));
    }
  }, [router]);

  function openAddEmergency() { setEditingEm(null); setEmOpen(true); }
  function openEditEmergency(p: EmergencyPreset) { setEditingEm(p); setEmOpen(true); }
  function openAddTemplate() { setEditingTpl(null); setTplOpen(true); }
  function openEditTemplate(p: TemplatePreset) { setEditingTpl(p); setTplOpen(true); }

  function handleSaveEmergency(preset: EmergencyPreset) {
    if (!projectId) return;
    const next: EmergencyPreset = preset.id ? preset : { ...preset, id: newPresetId('em') };
    setEmergencies(saveEmergencyPreset(projectId, next));
    setEmOpen(false);
  }

  function handleDeleteEmergency(id: string, name: string) {
    if (!projectId) return;
    if (!confirm(t('confirmDelete', { name }))) return;
    setEmergencies(deleteEmergencyPreset(projectId, id));
  }

  function handleSaveTemplate(preset: TemplatePreset) {
    if (!projectId) return;
    const next: TemplatePreset = preset.id ? preset : { ...preset, id: newPresetId('tpl') };
    setTemplates(saveTemplatePreset(projectId, next));
    setTplOpen(false);
  }

  function handleDeleteTemplate(id: string, name: string) {
    if (!projectId) return;
    if (!confirm(t('confirmDelete', { name }))) return;
    setTemplates(deleteTemplatePreset(projectId, id));
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('emergency')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === 'emergency' ? 'border-red-600 text-red-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('tabs.emergency', { count: emergencies.length })}
          </button>
          <button
            onClick={() => setTab('template')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === 'template' ? 'border-blue-700 text-blue-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            {t('tabs.template', { count: templates.length })}
          </button>
        </div>

        {tab === 'emergency' && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">{t('emergencyHint')}</p>
              <button
                onClick={openAddEmergency}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
              >
                {t('addEmergency')}
              </button>
            </div>
            {emergencies.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">{t('emptyEmergency')}</div>
            ) : (
              <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {emergencies.map(p => (
                  <li key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center text-2xl">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        Ext. {p.ext} · {p.mp3Name ? t('mp3Set', { name: p.mp3Name }) : t('mp3DefaultTone')}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {p.playMode === 'mp3' ? t('modeMp3Only') : t('modeMp3ThenMic')}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditEmergency(p)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      {tCommon('edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteEmergency(p.id, p.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title={tCommon('delete')}
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'template' && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-600">{t('templateHint')}</p>
              <button
                onClick={openAddTemplate}
                className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold"
              >
                {t('addTemplate')}
              </button>
            </div>
            {templates.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500">{t('emptyTemplate')}</div>
            ) : (
              <ul className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {templates.map(p => (
                  <li key={p.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {p.duration} · {p.mp3Name ? t('mp3Set', { name: p.mp3Name }) : t('mp3NotSet')}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {p.playMode === 'mp3-then-mic' ? t('modeMp3ThenMic') : t('modeMp3Only')}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditTemplate(p)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      {tCommon('edit')}
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(p.id, p.name)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title={tCommon('delete')}
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <EmergencyPresetEditor
        open={emOpen}
        initial={editingEm}
        mp3Library={mp3Library}
        onCancel={() => setEmOpen(false)}
        onSave={handleSaveEmergency}
      />

      <TemplatePresetEditor
        open={tplOpen}
        initial={editingTpl}
        mp3Library={mp3Library}
        onCancel={() => setTplOpen(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
