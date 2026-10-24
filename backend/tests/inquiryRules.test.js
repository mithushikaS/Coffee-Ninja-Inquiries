const { canTransition, nextStatuses } = require('../src/inquiryRules');

describe('status transition rules', () => {
  test('allows the forward path and reopening', () => {
    expect(canTransition('New', 'In Progress')).toBe(true);
    expect(canTransition('In Progress', 'Resolved')).toBe(true);
    expect(canTransition('Resolved', 'In Progress')).toBe(true);
  });

  test('rejects skipping a step and going back to New', () => {
    expect(canTransition('New', 'Resolved')).toBe(false);
    expect(canTransition('In Progress', 'New')).toBe(false);
    expect(canTransition('Resolved', 'New')).toBe(false);
  });

  test('nextStatuses returns an empty list for unknown input', () => {
    expect(nextStatuses('Bogus')).toEqual([]);
  });
});