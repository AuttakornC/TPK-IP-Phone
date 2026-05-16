import AdminShell from '@/components/AdminShell';
import { requireAdmin } from '@/server/auth';
import { listProjects, nextProjectId } from '@/server/actions/projects';
import { listSipServersForSelect } from '@/server/actions/sipServers';
import ProjectsClient from './ProjectsClient';

export default async function AdminProjectsPage() {
  await requireAdmin();
  const [projects, predictedNextId, sipServers] = await Promise.all([
    listProjects(),
    nextProjectId(),
    listSipServersForSelect(),
  ]);
  return (
    <AdminShell>
      <ProjectsClient projects={projects} predictedNextId={predictedNextId} sipServers={sipServers} />
    </AdminShell>
  );
}
