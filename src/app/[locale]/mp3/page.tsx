'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import { type Mp3File } from '@/lib/mock';
import { addMp3, deleteMp3, formatBytes, listMp3, renameMp3, todayDate } from '@/lib/mp3Store';
import { getCurrentUser } from '@/lib/role';

export default function Mp3Page() {
  const t = useTranslations('mp3Page');
  const tCommon = useTranslations('common');
  const [drag, setDrag] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [files, setFiles] = useState<Mp3File[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getCurrentUser();
    const pid = u?.projectId ?? null;
    setProjectId(pid);
    setFiles(listMp3(pid));
  }, []);

  function refresh() {
    setFiles(listMp3(projectId));
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || !projectId) return;
    for (const f of Array.from(fileList)) {
      if (!f.name.toLowerCase().endsWith('.mp3')) continue;
      addMp3({
        name: f.name,
        size: formatBytes(f.size),
        duration: '—',
        uploaded: todayDate(),
        projectId,
      });
    }
    refresh();
  }

  function startEdit(name: string) {
    setEditing(name);
    setEditValue(name);
  }

  function commitEdit(oldName: string) {
    if (!projectId) return;
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== oldName) renameMp3(projectId, oldName, trimmed);
    setEditing(null);
    refresh();
  }

  function remove(name: string) {
    if (!projectId) return;
    if (!confirm(t('confirmDelete', { name }))) return;
    deleteMp3(projectId, name);
    refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500">{t('subtitle')}</p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
        />

        <div
          className={`dropzone ${drag ? 'dragover' : ''} bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-400 transition`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={e => { e.preventDefault(); setDrag(true); }}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="font-semibold text-slate-800">{t('dropzoneTitle')}</div>
          <div className="text-xs text-slate-500 mt-1">{t('dropzoneSub')}</div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="mt-4 px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-medium text-sm"
          >
            {t('selectFile')}
          </button>
        </div>

        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{t('uploaded')}</h2>
            <div className="text-xs text-slate-500">{t('fileCount', { count: files.length })}</div>
          </div>
          {files.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-400">{t('empty')}</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {files.map(f => (
                <li key={f.name} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50">
                  <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">▶</div>
                  <div className="flex-1 min-w-0">
                    {editing === f.name ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(f.name)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit(f.name);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm font-medium"
                      />
                    ) : (
                      <div className="font-medium text-slate-900 truncate">{f.name}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-0.5">{f.size} · {f.duration} · {t('uploadedAt', { date: f.uploaded })}</div>
                  </div>
                  <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50">{t('play')}</button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">{t('playOnSpeaker')}</button>
                  <button
                    onClick={() => startEdit(f.name)}
                    className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    title={tCommon('edit')}
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => remove(f.name)}
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
      </main>
    </div>
  );
}
