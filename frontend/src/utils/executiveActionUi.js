const OPERATIONAL_EDITOR_ROLES = new Set([
  "administrator",
  "general manager",
  "mine manager",
  "superintendent",
]);


function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}


export function canCreateExecutiveAction(user) {
  return OPERATIONAL_EDITOR_ROLES.has(
    normalizeRole(user?.role)
  );
}


export function createManualExecutiveActionKey(
  operationalArea,
  reportDate
) {
  const area = String(operationalArea || "operations")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  const date = String(reportDate || "unknown_date")
    .trim()
    .replaceAll(" ", "_");

  const uniquePart = globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return `${area}_manual_${date}_${uniquePart}`;
}
