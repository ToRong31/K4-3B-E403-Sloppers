export const ROLE_HOME = Object.freeze({
  leader: '/labs',
  member: '/labs',
  coach: '/coach',
});

export function canAccess(role, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return Boolean(role);
  return allowedRoles.includes(role);
}

