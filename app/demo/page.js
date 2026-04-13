'use client';

import dynamic from 'next/dynamic';

const DemoClient = dynamic(() => import('@/components/DemoClient'), { ssr: false });

export default function DemoPage() {
  return <DemoClient />;
}
