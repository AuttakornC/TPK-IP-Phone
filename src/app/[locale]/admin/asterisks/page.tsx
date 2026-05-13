import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { listAsterisks } from '@/server/actions/asterisks';
import AsterisksClient from './AsterisksClient';

export default async function AdminAsterisksPage() {
  await requireAdmin();
  const asterisks = await listAsterisks();
  return (
    <AdminShell>
      <AsterisksClient asterisks={asterisks} />
    </AdminShell>
  );
}
