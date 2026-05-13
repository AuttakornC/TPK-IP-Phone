import { notFound } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { getProject } from '@/server/actions/projects';
import { listProjectUsers, suggestNextExt } from '@/server/actions/users';
import { listProjectSpeakers } from '@/server/actions/speakers';
import { listAsterisks } from '@/server/actions/asterisks';
import ProjectDetailClient from './ProjectDetailClient';

export default async function AdminProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [users, speakers, asterisks, suggestedExt] = await Promise.all([
    listProjectUsers(id),
    listProjectSpeakers(id),
    listAsterisks(),
    suggestNextExt(),
  ]);

  return (
    <AdminShell>
      <ProjectDetailClient
        project={project}
        users={users}
        speakers={speakers}
        asterisks={asterisks.filter(a => a.active).map(a => ({ id: a.id, name: a.name, domain: a.domain }))}
        suggestedExt={suggestedExt}
      />
    </AdminShell>
  );
}
