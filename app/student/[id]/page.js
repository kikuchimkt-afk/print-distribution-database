'use client';

import dynamic from 'next/dynamic';

const StudentClient = dynamic(() => import('@/components/StudentClient'), { ssr: false });

export default function StudentPage() {
  return <StudentClient />;
}
