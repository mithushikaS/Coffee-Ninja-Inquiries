const STATUSES = ['New', 'In Progress', 'Resolved'];

const TRANSITIONS = {
  'New': ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved': ['In Progress'],
};

function nextStatuses(from) {
  return TRANSITIONS[from] || [];
}

function canTransition(from, to) {
  return nextStatuses(from).includes(to);
}

module.exports = { STATUSES, canTransition, nextStatuses };