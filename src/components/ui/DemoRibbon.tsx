'use client';

import { useTranslations } from 'next-intl';

export default function DemoRibbon() {
  const t = useTranslations('common');
  return <div className="demo-ribbon">{t('demoRibbon')}</div>;
}
