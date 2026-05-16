import { getGeneralHomeData } from '@/server/actions/general';
import GeneralHomeClient from './GeneralHomeClient';

export default async function GeneralHomePage() {
  const data = await getGeneralHomeData();
  return <GeneralHomeClient data={data} />;
}
