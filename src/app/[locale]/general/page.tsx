import { getGeneralHomeData, listMyMp3Library } from '@/server/actions/general';
import GeneralHomeClient from './GeneralHomeClient';

export default async function GeneralHomePage() {
  const [data, mp3Library] = await Promise.all([
    getGeneralHomeData(),
    listMyMp3Library(),
  ]);
  return <GeneralHomeClient data={data} initialMp3Library={mp3Library} />;
}
