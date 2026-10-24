'use client';
import './dash.css';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import DashShell from '@/components/DashShell';
import StatusBadge from '@/components/StatusBadge';
import Icon from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { script } from '@/lib/fonts';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In progress' },
  { value: 'Resolved', label: 'Resolved' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function InquiryList() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');           // debounced copy of search
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ loading: true, error: null, inquiries: null });

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request started
    setState((s) => ({ ...s, loading: true, error: null }));
    api.listInquiries({ status, q })
      .then(({ inquiries }) => { if (!cancelled) setState({ loading: false, error: null, inquiries }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [status, q, reloadKey]);

  const { loading, error, inquiries } = state;
  const filtersActive = Boolean(status || q);
  const isManager = user.role === 'manager';
  const initialLoad = inquiries === null && loading;

  // Summary numbers come from the rows currently shown
  const visible = inquiries ?? [];
  const total = visible.length;
  const countOf = (s) => visible.filter((i) => i.status === s).length;
  const share = (n) => (total ? `${Math.round((n / total) * 100)}% of matching` : 'None yet');
  const createdThisWeek = visible.filter((i) => Date.now() - new Date(i.createdAt).getTime() <= WEEK_MS).length;

  const cards = [
    { key: 'total', label: 'Matching inquiries', icon: 'chat', count: total,
      note: createdThisWeek ? `${createdThisWeek} created this week` : 'None created this week' },
    { key: 'new', label: 'New', icon: 'clock', count: countOf('New'), note: share(countOf('New')) },
    { key: 'progress', label: 'In progress', icon: 'ring', count: countOf('In Progress'), note: share(countOf('In Progress')) },
    { key: 'resolved', label: 'Resolved', icon: 'check', count: countOf('Resolved'), note: share(countOf('Resolved')) },
  ];

  function clearFilters() {
    setStatus('');
    setSearch('');
    setQ('');
  }

  let body;
  if (initialLoad) {
    body = <p className="status" role="status">Loading inquiries…</p>;
  } else if (error) {
    body = (
      <div className="alert" role="alert">
        Could not load inquiries. {error.message}{' '}
        <button className="secondary" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
      </div>
    );
  } else if (inquiries.length === 0 && filtersActive) {
    body = (
      <div className="empty">
        <p>No inquiries match these filters.</p>
        <button className="secondary" onClick={clearFilters}>Clear filters</button>
      </div>
    );
  } else if (inquiries.length === 0) {
    body = (
      <div className="empty">
        <p>No inquiries yet. Record the first one to start tracking it.</p>
        <Link href="/new" className="button">New inquiry</Link>
      </div>
    );
  } else {
    body = (
      <>
        <div className={`db-table-wrap${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
          <table className="db-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Updated</th>
                <th><span className="db-sr">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="db-subject">
                      <span className="db-subject-icon"><Icon name="box" /></span>
                      <div className="db-subject-text">
                        <strong>{i.subject}</strong>
                        <span>{i.description}</span>
                        {isManager && <em>Created by {i.createdByName}</em>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="db-customer">
                      <span className="db-cust-name"><Icon name="user" />{i.customerName}</span>
                      <span className="db-cust-contact">
                        <Icon name={i.contact.includes('@') ? 'mail' : 'phone'} />{i.contact}
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={i.status} /></td>
                  <td>
                    <span className="db-date">
                      <Icon name="calendar" />
                      {new Date(i.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </td>
                  <td className="db-cell-action">
                    <Link href={`/inquiries/${i.id}`} className="db-view" aria-label={`View ${i.subject}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="db-foot">
          Showing {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'}
          {inquiries.length === 200 ? ' (the 200 most recently updated)' : ''}
        </p>
      </>
    );
  }

  return (
    <DashShell>
      <section className="db-hero">
        <div className="db-hero-photo" aria-hidden="true" />
        <div className="db-hero-copy">
          <h1 className="db-h1">Inquiries</h1>
          <p className="db-sub">
            {isManager
              ? 'Every inquiry across the team, in one place.'
              : 'Track the inquiries you have recorded, from first contact to resolution.'}
          </p>
        </div>
        <p className={`db-tag ${script.className}`} aria-hidden="true">Good Coffee<br />Good People</p>
        <Link href="/new" className="db-new"><Icon name="plus" /><span>New inquiry</span></Link>
      </section>

      <div className="db-body">
        <div className="db-stats" role="group" aria-label="Inquiry summary">
          {cards.map((c) => (
            <div key={c.key} className={`db-stat db-stat-${c.key}`}>
              <span className="db-stat-icon"><Icon name={c.icon} /></span>
              <div className="db-stat-body">
                <span className="db-stat-label">{c.label}</span>
                <strong className="db-stat-count">{initialLoad ? '—' : c.count}</strong>
                <span className="db-stat-note">{initialLoad ? '\u00a0' : c.note}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="db-tools">
          <div className="db-search">
            <Icon name="search" />
            <input type="search" placeholder="Search name, contact, or subject…"
                   aria-label="Search inquiries" value={search}
                   onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="db-seg" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button key={f.value || 'all'} type="button" className="db-seg-btn"
                      aria-pressed={status === f.value} onClick={() => setStatus(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {body}
      </div>
    </DashShell>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <InquiryList />
    </RequireAuth>
  );
}