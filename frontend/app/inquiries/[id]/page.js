'use client';
import '../../dash.css';
import './detail.css';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import DashShell from '@/components/DashShell';
import InquiryDetail from '@/components/InquiryDetail';
import { script } from '@/lib/fonts';

// The only component that reads the URL, so it is the one wrapped in <Suspense>
function InquiryFromRoute() {
  const { id } = useParams();
  return <InquiryDetail id={id} tagClass={script.className} />;
}

export default function InquiryPage() {
  return (
    <RequireAuth>
      <DashShell>
        <Suspense fallback={<p className="status" role="status">Loading inquiry…</p>}>
          <InquiryFromRoute />
        </Suspense>
      </DashShell>
    </RequireAuth>
  );
}