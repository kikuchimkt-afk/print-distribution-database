'use client';

import dynamic from 'next/dynamic';

const ManualClient = dynamic(() => import('@/components/ManualClient'), { ssr: false });

export default function ManualPage() {
  return <ManualClient />;
}
