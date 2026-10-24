import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InquiryForm from '@/components/InquiryForm';
import { api, ApiError } from '@/lib/api';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { createInquiry: jest.fn() } };
});

beforeEach(() => {
  jest.resetAllMocks();
});

test('submitting an empty form shows field errors, focuses the first one, and sends nothing', async () => {
  const user = userEvent.setup();
  render(<InquiryForm onCreated={jest.fn()} />);

  await user.click(screen.getByRole('button', { name: 'Save inquiry' }));

  expect(screen.getByText('Customer name is required.')).toBeInTheDocument();
  expect(screen.getByText('Contact is required.')).toBeInTheDocument();
  expect(screen.getByText('Subject is required.')).toBeInTheDocument();
  expect(screen.getByText('Description is required.')).toBeInTheDocument();
  expect(screen.getByLabelText('Customer name')).toHaveFocus();
  expect(api.createInquiry).not.toHaveBeenCalled();
});

test('a duplicate inquiry shows the server message with a link to the existing one', async () => {
  const user = userEvent.setup();
  api.createInquiry.mockRejectedValue(
    new ApiError(
      409,
      'DUPLICATE_INQUIRY',
      'You already have an open inquiry with this contact and subject.',
      { existingId: 'abc-123' }
    )
  );
  const onCreated = jest.fn();
  render(<InquiryForm onCreated={onCreated} />);

  await user.type(screen.getByLabelText('Customer name'), 'Nimal Perera');
  await user.type(screen.getByLabelText('Contact (email or phone)'), 'nimal@example.com');
  await user.type(screen.getByLabelText('Subject'), 'Wrong order delivered');
  await user.type(screen.getByLabelText('Description'), 'Received a latte instead of a cappuccino.');
  await user.click(screen.getByRole('button', { name: 'Save inquiry' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/already have an open inquiry/i);
  expect(screen.getByRole('link', { name: 'View the existing inquiry' })).toHaveAttribute(
    'href',
    '/inquiries/abc-123'
  );
  expect(onCreated).not.toHaveBeenCalled();
  // The form re-enables so the user can fix things, and their input is kept.
  expect(screen.getByRole('button', { name: 'Save inquiry' })).toBeEnabled();
  expect(screen.getByLabelText('Subject')).toHaveValue('Wrong order delivered');
});