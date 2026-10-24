'use client';

import './login.css';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Caveat } from 'next/font/google';
import { useAuth } from '@/context/AuthContext';

const script = Caveat({ subsets: ['latin'], weight: ['600'], display: 'swap' });

// Demo only: remove DEMO_* and the "cn-chips" block before using this app for real.
const DEMO_PASSWORD = 'Password123!';
const DEMO_ACCOUNTS = [
  { name: 'Alice', role: 'staff', email: 'alice@coffeeninja.test' },
  { name: 'Bob', role: 'staff', email: 'bob@coffeeninja.test' },
  { name: 'Maya', role: 'manager', email: 'maya@coffeeninja.test' },
];

const STAGES = [
  { title: 'New', icon: 'bolt', gold: true, text: 'Recorded with who asked, how to reach them, and what it is about.' },
  { title: 'In progress', icon: 'clock', text: 'Someone is handling it, so nobody has to guess.' },
  { title: 'Resolved', icon: 'check', text: 'Closed out, and can be reopened if the customer follows up.' },
];

const ICONS = {
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7.5 8.5 6 8.5-6" /></>),
  lock: (<><rect x="5" y="11" width="14" height="9.5" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 7.5A16 16 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.6-1" /></>),
  arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  bolt: (<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6l1-8Z" />),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  check: (<><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8 5.2-5.6" /></>),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill={name === 'bolt' ? 'currentColor' : 'none'} stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

function CupMark({ filled = false }) {
  return (
    <svg className={`cn-cup${filled ? ' is-filled' : ''}`} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path className="steam" d="M17 4c-2.4 2.4 2.4 4.2 0 7.4M24 2c-2.4 2.4 2.4 4.2 0 7.4M31 4c-2.4 2.4 2.4 4.2 0 7.4" />
      <path className="body" d="M7 19h30v7a13 13 0 0 1-13 13h-4A13 13 0 0 1 7 26v-7Z" />
      <path className="handle" d="M37 22h1.5a5.5 5.5 0 0 1 0 11H35" />
    </svg>
  );
}

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

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  function fill(account) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setError('');
    passwordRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="cn">
      <aside className="cn-hero">
        <div className="cn-logo">
          <CupMark />
          <span className="cn-logo-text">
            <strong>Coffee Ninja</strong>
            <span>Inquiries</span>
          </span>
        </div>

        <div className="cn-hero-mid">
          <p className="cn-headline">
            <span>Every inquiry has</span>
            <span>an owner and a</span>
            <span className="cn-gold">next step.</span>
          </p>
          <p className="cn-lede">
            Record what customers ask, see who is handling it, and know what happened last.
          </p>

          <ol className="cn-stages">
            {STAGES.map((s) => (
              <li key={s.title} className="cn-stage">
                <span className={`cn-stage-icon${s.gold ? ' is-gold' : ''}`}><Icon name={s.icon} /></span>
                <span className="cn-stage-copy">
                  <strong>{s.title}</strong>
                  <span>{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className={`cn-tagline ${script.className}`}>
          <span>Better conversations.</span>
          <span>Happier customers.</span>
          <svg className="cn-swoosh" viewBox="0 0 160 14" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
            <path d="M2 10C40 2 100 2 158 7" />
          </svg>
        </p>
      </aside>

      <main className="cn-panel">
        <Leaves className="cn-leaves cn-leaves-top" />
        <Leaves className="cn-leaves cn-leaves-bottom" />

        <div className="cn-card">
          <div className="cn-emblem"><CupMark filled /></div>
          <h1 className="cn-title">Sign in</h1>
          <p className="cn-sub">Use your staff account to open the inquiry workspace.</p>

          {error && <div className="cn-alert" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="cn-field">
              <label htmlFor="email">Email</label>
              <div className="cn-shell">
                <Icon name="mail" />
                <input id="email" type="email" placeholder="Enter your email address"
                       autoComplete="username" value={email}
                       onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
              </div>
            </div>

            <div className="cn-field">
              <div className="cn-field-head">
                <label htmlFor="password">Password</label>
                <button type="button" className="cn-link" aria-pressed={showPassword}
                        onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="cn-shell">
                <Icon name="lock" />
                <input id="password" ref={passwordRef} type={showPassword ? 'text' : 'password'}
                       placeholder="Enter your password" autoComplete="current-password"
                       value={password} onChange={(e) => setPassword(e.target.value)}
                       disabled={submitting} />
                {/* Mouse shortcut only. The "Show/Hide" button above is the accessible control. */}
                <span className="cn-eye" aria-hidden="true" onClick={() => setShowPassword((s) => !s)}>
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} />
                </span>
              </div>
            </div>

            <button type="submit" className="cn-submit" disabled={submitting}>
              <span>{submitting ? 'Signing in…' : 'Sign in'}</span>
              {!submitting && <Icon name="arrow" />}
            </button>
          </form>

          <div className="cn-divider"><span>or use a demo account</span></div>

          <div className="cn-chips">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" className="cn-chip"
                      onClick={() => fill(a)} disabled={submitting}>
                <Icon name="user" />
                <span className="cn-chip-copy">
                  <strong>{a.name}</strong>
                  <small>{a.role}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}