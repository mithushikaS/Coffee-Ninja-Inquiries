'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { script } from '@/lib/fonts';

const NAV = [
  { href: '/', label: 'Inquiries', icon: 'list' },
  { href: '/new', label: 'New inquiry', icon: 'plusCircle' },
];

const LEAVES = [
  [193, 24, 170], [188, 40, -15], [178, 66, 165], [172, 82, -10], [162, 108, 160],
  [156, 124, -5], [146, 150, 155], [140, 166, 0], [132, 194, 150], [126, 210, 5],
];

function Leaves() {
  return (
    <svg className="db-leaves" viewBox="0 0 220 260" fill="none" stroke="currentColor"
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

function CupMark() {
  return (
    <svg className="db-cup" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="steam" d="M17 4c-2.4 2.4 2.4 4.2 0 7.4M24 2c-2.4 2.4 2.4 4.2 0 7.4M31 4c-2.4 2.4 2.4 4.2 0 7.4" />
      <path className="body" d="M7 19h30v7a13 13 0 0 1-13 13h-4A13 13 0 0 1 7 26v-7Z" />
      <path className="handle" d="M37 22h1.5a5.5 5.5 0 0 1 0 11H35" />
    </svg>
  );
}

export default function DashShell({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || '/';
  const initial = user.name.trim().charAt(0).toUpperCase();

  const isActive = (href) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/inquiries') : pathname === href;

  return (
    <div className="db">
      <aside className="db-side">
        <Leaves />
        <nav className="db-nav" aria-label="Main">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <p className={`db-quote ${script.className}`} aria-hidden="true">
          Better questions<br />brew better stories
        </p>
      </aside>

      <div className="db-col">
        <header className="db-top">
          <Link href="/" className="db-brand" aria-label="Coffee Ninja inquiries home">
            <CupMark />
            <span>Coffee Ninja</span>
          </Link>
          <div className="db-user">
            <span className="db-avatar" aria-hidden="true">{initial}</span>
            <span className="db-user-name">{user.name}</span>
            <span className="db-role">{user.role}</span>
            <button type="button" className="db-signout" onClick={logout}>Sign out</button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}