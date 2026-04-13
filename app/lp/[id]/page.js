'use client';

import dynamic from 'next/dynamic';

const StudentLP = dynamic(() => import('@/components/StudentLP'), { ssr: false });

export default function StudentLPPage() {
  return <StudentLP />;
}
