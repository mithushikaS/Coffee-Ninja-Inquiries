const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^\+?[\d\s\-()]{7,20}$/.test(v);

export const LIMITS = { customerName: 100, contact: 200, subject: 150, description: 2000 };

// Mirrors backend/src/validation/inquiries.js. The server remains the authority.
export function validateInquiry(values) {
  const errors = {};
  const v = {
    customerName: values.customerName.trim(),
    contact: values.contact.trim(),
    subject: values.subject.trim(),
    description: values.description.trim(),
  };

  if (!v.customerName) errors.customerName = 'Customer name is required.';
  else if (v.customerName.length > LIMITS.customerName)
    errors.customerName = `Customer name must be ${LIMITS.customerName} characters or fewer.`;

  if (!v.contact) errors.contact = 'Contact is required.';
  else if (v.contact.length > LIMITS.contact)
    errors.contact = `Contact must be ${LIMITS.contact} characters or fewer.`;
  else if (!isEmail(v.contact) && !isPhone(v.contact))
    errors.contact = 'Enter a valid email address or phone number.';

  if (!v.subject) errors.subject = 'Subject is required.';
  else if (v.subject.length > LIMITS.subject)
    errors.subject = `Subject must be ${LIMITS.subject} characters or fewer.`;

  if (!v.description) errors.description = 'Description is required.';
  else if (v.description.length > LIMITS.description)
    errors.description = `Description must be ${LIMITS.description} characters or fewer.`;

  return errors;
}