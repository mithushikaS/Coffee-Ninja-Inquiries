'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" aria-label="Coffee Ninja inquiries home">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Coffee Ninja</span>
        </Link>
        <div className="user">
          <span className="user-name">{user.name}</span>
          <span className="role-tag">{user.role}</span>
          <button type="button" className="ghost" onClick={logout}>Sign out</button>
        </div>
      </div>
    </header>
  );
}