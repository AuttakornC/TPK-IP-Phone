import { listMyBroadcastHistory } from '@/server/actions/general';
import GeneralHistoryClient from './GeneralHistoryClient';

export default async function GeneralHistoryPage() {
  const entries = await listMyBroadcastHistory();
  return <GeneralHistoryClient entries={entries} />;
}
