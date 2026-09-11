const cleanText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const languageSuffix = (language) =>
  String(language || "")
    .trim()
    .toLowerCase() === "mn"
    ? "mn"
    : "en";

export const resolveCompanyDisplayName = (
  company,
  language,
  fallback = "Mine Manager AI"
) => {
  const suffix = languageSuffix(language);
  return (
    cleanText(company?.[`company_name_${suffix}`]) ||
    cleanText(company?.company_name) ||
    fallback
  );
};

export const resolveMineDisplayName = (
  mine,
  language,
  fallback = "Mining Operation"
) => {
  const suffix = languageSuffix(language);
  return (
    cleanText(mine?.[`mine_name_${suffix}`]) ||
    cleanText(mine?.mine_name) ||
    fallback
  );
};
