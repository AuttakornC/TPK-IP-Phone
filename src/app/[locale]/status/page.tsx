'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import AppHeader from '@/components/AppHeader';
import DemoRibbon from '@/components/ui/DemoRibbon';
import StatusContent from '@/components/app/StatusContent';
import { getCurrentRole, getCurrentUser } from '@/lib/role';

export default function StatusPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = getCurrentRole();
    if (role === 'admin') {
      router.replace('/admin/status');
      return;
    }
    setProjectId(getCurrentUser()?.projectId ?? null);
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <DemoRibbon />
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <StatusContent projectId={projectId} />
      </main>
    </div>
  );
}
