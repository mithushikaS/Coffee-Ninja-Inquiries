'use client';
import './new-inquiry.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import NewInquiryHeader from '@/components/NewInquiryHeader';
import InquiryForm from '@/components/InquiryForm';

const ICONS = {
  back: <path d="m15 18-6-6 6-6" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  shield: (<><path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>),
  copy: (<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

const POINTS = [
  { icon: 'clock', title: 'Quick to log', text: 'Four fields, and it takes under a minute.' },
  { icon: 'shield', title: 'Private to you and managers', text: 'Other staff cannot see inquiries you record.' },
  { icon: 'copy', title: 'No duplicate open inquiries', text: 'The same contact and subject cannot be open twice.' },
];

const LEAVES = [
  [193, 24, 170], [188, 40, -15], [178, 66, 165], [172, 82, -10], [162, 108, 160],
  [156, 124, -5], [146, 150, 155], [140, 166, 0], [132, 194, 150], [126, 210, 5],
];

function Leaves({ className }) {
  return (
    <svg className={className} viewBox="0 0 220 260" fill="none" stroke="currentColor"
         strokeWidth="1.2" strokeLinecap="round" aria-hidden="true" focusable="false">
      <path d="M200 10C170 70 150 130 120 250" />
      {LEAVES.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <path d="M0 0C14-22 52-22 66 0C52 22 14 22 0 0Z" />
          <path d="M0 0H62" />
        </g>
      ))}
    </svg>
  );
}

export default function NewInquiryPage() {
  const router = useRouter();

  return (
    <RequireAuth>
      <div className="ni">
        <NewInquiryHeader />

        <main className="ni-main">
          <Leaves className="ni-leaves ni-leaves-tl" />
          <Leaves className="ni-leaves ni-leaves-br" />
          <div className="ni-photo" aria-hidden="true" />

          <section className="ni-intro">
            <Link href="/" className="ni-pill">
              <Icon name="back" />
              <span>Inquiries</span>
            </Link>
            <h1 className="ni-h1">New <span>Inquiry</span></h1>
            <p className="ni-lead">
              Record what a customer asked, how to reach them, and what it is about.
              It is saved under your name so you can follow it through to resolution.
            </p>

            <ul className="ni-points">
              {POINTS.map((p) => (
                <li key={p.title}>
                  <span className="ni-point-icon"><Icon name={p.icon} /></span>
                  <span className="ni-point-copy">
                    <strong>{p.title}</strong>
                    <span>{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ni-card" aria-labelledby="ni-card-title">
            <h2 id="ni-card-title" className="ni-card-title">New inquiry</h2>
            <p className="ni-card-sub">Record who asked, how to reach them, and what it is about.</p>
            <InquiryForm onCreated={() => router.push('/')} />
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}