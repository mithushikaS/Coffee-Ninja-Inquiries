'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function CupMark() {
  return (
    <svg className="ni-cup" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="steam" d="M17 4c-2.4 2.4 2.4 4.2 0 7.4M24 2c-2.4 2.4 2.4 4.2 0 7.4M31 4c-2.4 2.4 2.4 4.2 0 7.4" />
      <path className="body" d="M7 19h30v7a13 13 0 0 1-13 13h-4A13 13 0 0 1 7 26v-7Z" />
      <path className="handle" d="M37 22h1.5a5.5 5.5 0 0 1 0 11H35" />
    </svg>
  );
}

export default function NewInquiryHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="ni-header">
      <div className="ni-header-inner">
        <Link href="/" className="ni-brand" aria-label="Coffee Ninja inquiries home">
          <CupMark />
          <span>Coffee Ninja</span>
        </Link>

        <nav className="ni-nav" aria-label="Main">
          <Link href="/">Inquiries</Link>
          <Link href="/new" aria-current="page">New inquiry</Link>
        </nav>

        <div className="ni-user">
          <span className="ni-user-name">{user.name}</span>
          <button type="button" className="ni-signout" onClick={logout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}