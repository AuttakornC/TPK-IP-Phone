import { TIER_LABEL, type TierId } from '@/lib/mock';

interface Props {
  tier: TierId;
}

export default function TierBadge({ tier }: Props) {
  return <span className={`tier-badge ${tier}`}>{TIER_LABEL[tier].name}</span>;
}
