import AdminShell from '@/components/AdminShell';
import StatusContent from '@/components/app/StatusContent';
import { requireAdmin } from '@/server/auth';

export default async function AdminStatusPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <StatusContent />
    </AdminShell>
  );
}
