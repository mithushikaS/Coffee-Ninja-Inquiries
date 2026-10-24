const { z } = require('zod');
const { STATUSES } = require('../inquiryRules');

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v) => /^\+?[\d\s\-()]{7,20}$/.test(v);

const createSchema = z.object({
  customerName: z.string().trim()
    .min(1, 'Customer name is required.')
    .max(100, 'Customer name must be 100 characters or fewer.'),
  contact: z.string().trim()
    .min(1, 'Contact is required.')
    .max(200, 'Contact must be 200 characters or fewer.')
    .refine((v) => isEmail(v) || isPhone(v), 'Enter a valid email address or phone number.'),
  subject: z.string().trim()
    .min(1, 'Subject is required.')
    .max(150, 'Subject must be 150 characters or fewer.'),
  description: z.string().trim()
    .min(1, 'Description is required.')
    .max(2000, 'Description must be 2000 characters or fewer.'),
});

const statusSchema = z.object({
  status: z.enum(STATUSES),
  version: z.number().int().positive(),
});

// Version-agnostic: one message per field, taken from zod's issues.
function fieldErrors(zodError) {
  const out = {};
  for (const issue of zodError.issues) {
    const key = issue.path[0] ?? '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

module.exports = { createSchema, statusSchema, fieldErrors };