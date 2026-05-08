import { type ProjectStatus } from '@/lib/mock';

const STATUS: Record<ProjectStatus, { text: string; cls: string }> = {
  active: { text: 'ใช้งาน', cls: 'bg-green-500/15 text-green-400' },
  expiring: { text: 'ใกล้หมดอายุ', cls: 'bg-amber-500/15 text-amber-400' },
  expired: { text: 'หมดอายุ', cls: 'bg-red-500/15 text-red-400' },
};

interface Props {
  status: ProjectStatus;
}

export default function StatusPill({ status }: Props) {
  const s = STATUS[status] || STATUS.active;
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full font-medium ${s.cls}`}>
      {s.text}
    </span>
  );
}
