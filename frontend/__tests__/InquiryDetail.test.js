import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InquiryDetail from '@/components/InquiryDetail';
import { api, ApiError } from '@/lib/api';

// Fake only the network layer. Keep the real ApiError class.
jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return { ...actual, api: { getInquiry: jest.fn(), changeStatus: jest.fn() } };
});

const ID = '2d2e1e3a-abad-4aec-9786-932119e88747';

function makeInquiry(overrides = {}) {
  return {
    id: ID,
    customerName: 'Nimal Perera',
    contact: 'nimal@example.com',
    subject: 'Wrong order delivered',
    description: 'Received a latte instead of a cappuccino.',
    status: 'New',
    version: 1,
    createdBy: 1,
    createdByName: 'Alice (Staff)',
    createdAt: '2026-10-22T02:29:28.017Z',
    updatedAt: '2026-10-22T02:29:28.017Z',
    allowedNext: ['In Progress'],
    ...overrides,
  };
}

beforeEach(() => {
  jest.resetAllMocks();
});

test('offers only the valid next action for the current status', async () => {
  api.getInquiry.mockResolvedValue({ inquiry: makeInquiry() });
  render(<InquiryDetail id={ID} />);

  expect(await screen.findByRole('button', { name: 'Start work' })).toBeInTheDocument();
  // New -> Resolved is not allowed, so that button must not exist.
  expect(screen.queryByRole('button', { name: 'Mark as resolved' })).not.toBeInTheDocument();
});

test('a stale update shows the banner and swaps in the latest version', async () => {
  const user = userEvent.setup();
  api.getInquiry.mockResolvedValue({ inquiry: makeInquiry() }); // this tab thinks: New, version 1

  // Meanwhile "another tab" already moved it to In Progress (version 2).
  const latest = makeInquiry({ status: 'In Progress', version: 2, allowedNext: ['Resolved'] });
  api.changeStatus.mockRejectedValue(
    new ApiError(409, 'STALE_VERSION', 'This inquiry was updated elsewhere.', { current: latest })
  );

  render(<InquiryDetail id={ID} />);
  await user.click(await screen.findByRole('button', { name: 'Start work' }));

  // The request carried the version this tab last saw.
  expect(api.changeStatus).toHaveBeenCalledWith(ID, 'In Progress', 1);

  // The user is told their change was NOT applied.
  expect(await screen.findByRole('alert')).toHaveTextContent(/updated elsewhere/i);
  expect(screen.getByRole('alert')).toHaveTextContent(/not applied/i);

  // The page now shows the latest state and the buttons that are valid for it.
  expect(screen.getByText('In Progress')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Mark as resolved' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start work' })).not.toBeInTheDocument();
});

test('an inquiry that is missing or not accessible shows a clear message with no retry', async () => {
  api.getInquiry.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Inquiry not found.'));
  render(<InquiryDetail id={ID} />);

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Inquiry not found. It may not exist, or you may not have access to it.'
  );
  expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
});