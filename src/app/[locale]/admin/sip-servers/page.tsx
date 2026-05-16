import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { listSipServers } from '@/server/actions/sipServers';
import SipServersClient from './SipServersClient';

export default async function AdminSipServersPage() {
  await requireAdmin();
  const sipServers = await listSipServers();
  return (
    <AdminShell>
      <SipServersClient sipServers={sipServers} />
    </AdminShell>
  );
}
