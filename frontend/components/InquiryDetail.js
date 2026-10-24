'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

function actionLabel(from, to) {
  if (to === 'Resolved') return 'Mark as resolved';
  if (from === 'Resolved') return 'Reopen';
  return 'Start work';
}

function actionIcon(from, to) {
  if (to === 'Resolved') return 'check';
  if (from === 'Resolved') return 'refresh';
  return 'bolt';
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

// Labels are sentence case on purpose: the status badge is the only element that reads "In Progress".
const STEPS = [
  { key: 'New', label: 'New' },
  { key: 'In Progress', label: 'In progress' },
  { key: 'Resolved', label: 'Resolved' },
];

const HINTS = {
  New: 'Waiting for someone to start work.',
  'In Progress': 'Someone is working on this.',
  Resolved: 'Closed. It can be reopened if the customer follows up.',
};

function Crumbs({ current }) {
  return (
    <nav className="dt-crumbs" aria-label="Breadcrumb">
      <Link href="/"><Icon name="back" />Inquiries</Link>
      <span aria-current="page">{current}</span>
    </nav>
  );
}

export default function InquiryDetail({ id, tagClass = '' }) {
  const [state, setState] = useState({ loading: true, error: null, inquiry: null });
  const [saving, setSaving] = useState(null);   // the status currently being saved, or null
  const [notice, setNotice] = useState(null);   // { message } shown above the card
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.getInquiry(id)
      .then(({ inquiry }) => { if (!cancelled) setState({ loading: false, error: null, inquiry }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error })); });
    return () => { cancelled = true; };
  }, [id, reloadKey]);

  async function changeStatus(to) {
    if (saving) return;
    setNotice(null);
    setSaving(to);
    try {
      const { inquiry } = await api.changeStatus(id, to, state.inquiry.version);
      setState({ loading: false, error: null, inquiry });
    } catch (err) {
      const current = err.details?.current;
      if (err.code === 'STALE_VERSION' && current) {
        // Another tab or user changed it first. Show the latest and explain.
        setState({ loading: false, error: null, inquiry: current });
        setNotice({
          message: 'This inquiry was updated elsewhere, so your change was not applied. You are now seeing the latest version.',
        });
      } else if (err.code === 'INVALID_TRANSITION' && current) {
        setState({ loading: false, error: null, inquiry: current });
        setNotice({ message: `${err.message} The latest version is shown.` });
      } else if (err.status === 404) {
        setState({ loading: false, error: err, inquiry: null });
      } else {
        setNotice({ message: err.message }); // network failure, duplicate-on-reopen, etc.
      }
    } finally {
      setSaving(null);
    }
  }

  const { loading, error, inquiry } = state;

  if (!inquiry && loading) {
    return (
      <div className="dt">
        <div className="dt-body is-plain">
          <Crumbs current="Inquiry details" />
          <p className="status" role="status">Loading inquiry…</p>
        </div>
      </div>
    );
  }

  if (!inquiry && error) {
    let message = error.message;
    let retry = true;
    if (error.status === 404) {
      message = 'Inquiry not found. It may not exist, or you may not have access to it.';
      retry = false;
    } else if (error.code === 'INVALID_ID') {
      message = 'That link is not a valid inquiry address.';
      retry = false;
    }
    return (
      <div className="dt">
        <div className="dt-body is-plain">
          <Crumbs current="Inquiry details" />
          <div className="alert" role="alert">
            {message}{' '}
            {retry && (
              <button className="secondary" onClick={() => setReloadKey((k) => k + 1)}>Try again</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const stepIndex = STEPS.findIndex((s) => s.key === inquiry.status);
  const resolved = inquiry.status === 'Resolved';
  const contactIcon = inquiry.contact.includes('@') ? 'mail' : 'phone';

  const rows = [
    { icon: 'user', label: 'Customer', value: inquiry.customerName },
    { icon: contactIcon, label: 'Contact', value: inquiry.contact },
    { icon: 'user', label: 'Created by', value: inquiry.createdByName },
    { icon: 'calendar', label: 'Created', value: formatDate(inquiry.createdAt) },
    { icon: 'calendar', label: 'Last updated', value: formatDate(inquiry.updatedAt) },
  ];

  return (
    <div className="dt">
      <section className="dt-hero">
        <div className="dt-hero-photo" aria-hidden="true" />
        <p className={`dt-tag ${tagClass}`} aria-hidden="true">Good Coffee<br />Good People</p>
        <div className="dt-hero-copy">
          <Crumbs current="Inquiry details" />
          <h1 className="dt-h1">{inquiry.subject}</h1>
          <StatusBadge status={inquiry.status} />
          <p className="dt-sub">Recorded by {inquiry.createdByName} for {inquiry.customerName}.</p>
        </div>
      </section>

      <div className="dt-body">
        {notice && <div className="notice" role="alert">{notice.message}</div>}

        <div className="dt-card" aria-busy={loading}>
          <div className="dt-grid">
            <div className="dt-main">
              <section className="dt-panel">
                <header className="dt-panel-head">
                  <span className="dt-ico"><Icon name="chat" /></span>
                  <h2>Inquiry information</h2>
                </header>
                <dl className="dt-rows">
                  {rows.map((r) => (
                    <div className="dt-row" key={r.label}>
                      <dt><Icon name={r.icon} />{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="dt-panel">
                <header className="dt-panel-head">
                  <span className="dt-ico"><Icon name="doc" /></span>
                  <h2>Description</h2>
                </header>
                <p className="dt-desc">{inquiry.description}</p>
              </section>
            </div>

            <aside className="dt-side">
              <section className="dt-panel">
                <header className="dt-panel-head">
                  <span className="dt-ico"><Icon name="target" /></span>
                  <h2>Progress</h2>
                </header>
                <ol className="dt-steps" aria-label="Inquiry progress">
                  {STEPS.map((s, i) => {
                    const done = resolved || i < stepIndex;
                    const current = i === stepIndex;
                    return (
                      <li key={s.key}
                          className={done ? 'is-done' : current ? 'is-current' : ''}
                          aria-current={current ? 'step' : undefined}>
                        <span className="dt-step-dot">{done && <Icon name="check" />}</span>
                        <span>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>
                <p className="dt-hint">{HINTS[inquiry.status]}</p>
              </section>

              <section className="dt-panel">
                <header className="dt-panel-head">
                  <span className="dt-ico"><Icon name="bolt" /></span>
                  <h2>Quick actions</h2>
                </header>
                <div className="dt-actions">
                  {inquiry.allowedNext.map((next) => (
                    <button key={next} className="dt-btn" onClick={() => changeStatus(next)}
                            disabled={saving !== null}>
                      <Icon name={actionIcon(inquiry.status, next)} />
                      <span>{saving === next ? 'Saving…' : actionLabel(inquiry.status, next)}</span>
                    </button>
                  ))}
                  <button className="dt-btn dt-btn-ghost"
                          onClick={() => { setNotice(null); setReloadKey((k) => k + 1); }}
                          disabled={saving !== null || loading}>
                    <Icon name="refresh" />
                    <span>Refresh</span>
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}