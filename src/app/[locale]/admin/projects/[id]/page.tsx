import { notFound } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { getProject } from '@/server/actions/projects';
import { listProjectUsers, suggestNextExt } from '@/server/actions/users';
import { listProjectSpeakers } from '@/server/actions/speakers';
import { listSipServersForSelect } from '@/server/actions/sipServers';
import ProjectDetailClient from './ProjectDetailClient';

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [users, speakers, sipServers, suggestedExt] = await Promise.all([
    listProjectUsers(id),
    listProjectSpeakers(id),
    listSipServersForSelect(),
    suggestNextExt(),
  ]);

  return (
    <AdminShell>
      <ProjectDetailClient
        project={project}
        users={users}
        speakers={speakers}
        sipServers={sipServers.filter(a => a.active || a.id === project.sipServerId).map(a => ({ id: a.id, name: a.name, domain: a.domain }))}
        suggestedExt={suggestedExt}
      />
    </AdminShell>
  );
}
