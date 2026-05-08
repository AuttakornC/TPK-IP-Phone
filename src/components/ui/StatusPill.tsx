'use client';

import { useTranslations } from 'next-intl';
import { type ProjectStatus } from '@/lib/mock';

const STATUS_CLS: Record<ProjectStatus, string> = {
  active: 'bg-green-500/15 text-green-400',
  expiring: 'bg-amber-500/15 text-amber-400',
  expired: 'bg-red-500/15 text-red-400',
};

interface Props {
  status: ProjectStatus;
}

export default function StatusPill({ status }: Props) {
  const t = useTranslations('projectStatus');
  const cls = STATUS_CLS[status] || STATUS_CLS.active;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${cls}`}>
      {t(status)}
    </span>
  );
}
