'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { validateInquiry, LIMITS } from '@/lib/validate';

const EMPTY = { customerName: '', contact: '', subject: '', description: '' };

const ICONS = {
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7.5 8.5 6 8.5-6" /></>),
  tag: (<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.3" /></>),
  doc: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  send: (<><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></>),
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

export default function InquiryForm({ onCreated }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null); // { message, existingId? }
  const [saving, setSaving] = useState(false);

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined })); // clear as they fix it
  }

  function validateField(name) {
    const msg = validateInquiry(values)[name];
    setErrors((e) => ({ ...e, [name]: msg }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setFormError(null);

    const found = validateInquiry(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }

    setSaving(true);
    try {
      const { inquiry } = await api.createInquiry({
        customerName: values.customerName.trim(),
        contact: values.contact.trim(),
        subject: values.subject.trim(),
        description: values.description.trim(),
      });
      onCreated(inquiry);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && err.details?.fields) {
        setErrors(err.details.fields);
        document.getElementById(Object.keys(err.details.fields)[0])?.focus();
      } else if (err.code === 'DUPLICATE_INQUIRY') {
        setFormError({ message: err.message, existingId: err.details?.existingId });
      } else {
        setFormError({ message: err.message });
      }
      setSaving(false);
    }
  }

  const field = (name, label, { icon, placeholder, multiline = false, wide = false }) => {
    const invalid = Boolean(errors[name]);
    const shared = {
      id: name,
      value: values[name],
      disabled: saving,
      placeholder,
      'aria-required': 'true',
      'aria-invalid': invalid ? 'true' : 'false',
      'aria-describedby': invalid ? `${name}-error` : undefined,
      onChange: (e) => setField(name, e.target.value),
      onBlur: () => validateField(name),
    };

    return (
      <div className={`ni-field${wide ? ' ni-span' : ''}`}>
        <label htmlFor={name} className="ni-label">{label}</label>
        <div className={`ni-control${multiline ? ' is-multiline' : ''}${invalid ? ' is-invalid' : ''}`}>
          <Icon name={icon} />
          {multiline ? (
            <textarea rows={6} {...shared}
              maxLength={LIMITS[name] + 200 /* soft: let validation explain instead of silently cutting */} />
          ) : (
            <input type="text" autoComplete="off" {...shared} />
          )}
        </div>
        {multiline && (
          <span className="ni-count" aria-hidden="true">
            {values[name].length} / {LIMITS[name]}
          </span>
        )}
        {invalid && <span id={`${name}-error`} className="ni-error">{errors[name]}</span>}
      </div>
    );
  };

  return (
    <form className="ni-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="ni-alert" role="alert">
          {formError.message}{' '}
          {formError.existingId && (
            <Link href={`/inquiries/${formError.existingId}`}>View the existing inquiry</Link>
          )}
        </div>
      )}

      <div className="ni-grid">
        {field('customerName', 'Customer name', { icon: 'user', placeholder: 'Customer’s full name' })}
        {field('contact', 'Contact (email or phone)', { icon: 'mail', placeholder: 'Email or phone number' })}
        {field('subject', 'Subject', { icon: 'tag', placeholder: 'What is the inquiry about?', wide: true })}
        {field('description', 'Description', {
          icon: 'doc', placeholder: 'What did the customer ask or need?', multiline: true, wide: true,
        })}
      </div>

      <div className="ni-actions">
        <Link href="/" className="ni-cancel">Cancel</Link>
        <button type="submit" className="ni-save" disabled={saving}>
          <span>{saving ? 'Saving…' : 'Save inquiry'}</span>
          {!saving && <Icon name="send" />}
        </button>
      </div>
    </form>
  );
}