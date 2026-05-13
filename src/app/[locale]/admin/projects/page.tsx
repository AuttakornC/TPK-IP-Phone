import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { listProjects, nextProjectId } from '@/server/actions/projects';
import ProjectsClient from './ProjectsClient';

export default async function AdminProjectsPage() {
  await requireAdmin();
  const [projects, predictedNextId] = await Promise.all([
    listProjects(),
    nextProjectId(),
  ]);
  return (
    <AdminShell>
      <ProjectsClient projects={projects} predictedNextId={predictedNextId} />
    </AdminShell>
  );
}
