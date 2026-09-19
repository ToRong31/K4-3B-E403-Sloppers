export const roles = Object.freeze(['leader', 'member', 'coach']);
export const invitationStatuses = Object.freeze(['pending', 'accepted', 'declined', 'expired']);
export const taskStatuses = Object.freeze(['todo', 'doing', 'blocked', 'done']);
export const assignmentStatuses = Object.freeze(['ready', 'clarify']);

export const realtimeEventTypes = Object.freeze([
  'group.created',
  'invitation.sent',
  'invitation.accepted',
  'invitation.declined',
  'profile.completed',
  'assignment_draft.created',
  'assignment_draft.overridden',
  'plan.approved',
  'task.updated',
  'help_request.created',
  'help_request.replied',
  'help_request.resolved',
  'chat.message_sent',
  'snapshot',
]);

export function isRealtimeEnvelope(value) {
  return Boolean(
    value &&
      typeof value.event_id === 'string' &&
      typeof value.type === 'string' &&
      realtimeEventTypes.includes(value.type) &&
      typeof value.scope_id === 'string' &&
      Number.isInteger(value.version) &&
      typeof value.occurred_at === 'string' &&
      ('payload' in value),
  );
}

