function normalizeLanguage(language) {
  return String(language || "EN").trim().toUpperCase() === "MN"
    ? "MN"
    : "EN";
}

function parseDisplayValue(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const text = String(value || "").trim();
  const dateOnlyMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    return new Date(
      Number(dateOnlyMatch[1]),
      Number(dateOnlyMatch[2]) - 1,
      Number(dateOnlyMatch[3]),
    );
  }

  return new Date(value);
}

function validDisplayDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = parseDisplayValue(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mongolianDate(date) {
  return (
    `${date.getFullYear()} оны ` +
    `${date.getMonth() + 1}-р сарын ` +
    `${date.getDate()}`
  );
}

function twoDigits(value) {
  return String(value).padStart(2, "0");
}

export function formatDisplayDate(value, language, fallback = "—") {
  const date = validDisplayDate(value);

  if (!date) {
    return fallback;
  }

  if (normalizeLanguage(language) === "MN") {
    return mongolianDate(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDisplayTime(
  value,
  language,
  { seconds = false, fallback = "—" } = {},
) {
  const date = validDisplayDate(value);

  if (!date) {
    return fallback;
  }

  if (normalizeLanguage(language) === "MN") {
    const parts = [twoDigits(date.getHours()), twoDigits(date.getMinutes())];
    if (seconds) parts.push(twoDigits(date.getSeconds()));
    return parts.join(":");
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: true,
  }).format(date);
}

export function formatDisplayDateTime(
  value,
  language,
  { seconds = false, fallback = "—" } = {},
) {
  const date = validDisplayDate(value);

  if (!date) {
    return fallback;
  }

  return `${formatDisplayDate(date, language)}, ${formatDisplayTime(
    date,
    language,
    { seconds, fallback },
  )}`;
}
