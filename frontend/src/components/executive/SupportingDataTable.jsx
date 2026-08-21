import React from "react";
import {
  FiAlertCircle,
  FiDatabase,
  FiDownload,
} from "react-icons/fi";

import { useLanguage } from "../../context/LanguageContext";

import "./SupportingDataTable.css";


function translateTemplate(
  t,
  key,
  variables = {},
) {
  let text = t(key);

  Object.entries(variables).forEach(
    ([name, value]) => {
      text = String(text).replaceAll(
        `{${name}}`,
        String(value ?? ""),
      );
    },
  );

  return text;
}


function formatValue(value, locale) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return Number.isInteger(numericValue)
    ? numericValue.toLocaleString(locale)
    : numericValue.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}


function formatDate(dateValue, language) {
  if (!dateValue) {
    return "—";
  }

  const rawValue = String(dateValue).trim();

  const isoDateMatch = rawValue.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (
    language === "MN" &&
    isoDateMatch
  ) {
    const year = Number(
      isoDateMatch[1],
    );
    const month = Number(
      isoDateMatch[2],
    );
    const day = Number(
      isoDateMatch[3],
    );

    return (
      `${year} оны ${month}-р сарын ${day}`
    );
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return rawValue;
  }

  if (language === "MN") {
    return (
      `${date.getFullYear()} оны ` +
      `${date.getMonth() + 1}-р сарын ` +
      `${date.getDate()}`
    );
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}


function normalizeRows(rows, t) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row, index) => ({
    id:
      row?.id ??
      row?.date ??
      row?.report_date ??
      `supporting-row-${index}`,

    date:
      row?.date ??
      row?.report_date ??
      row?.label ??
      translateTemplate(
        t,
        "supportingDataTable.rowFallback",
        {
          number: index + 1,
        },
      ),

    actual:
      row?.actual ??
      row?.value ??
      row?.current_value ??
      null,

    plan:
      row?.plan ??
      row?.target ??
      null,

    variance:
      row?.variance ??
      row?.delta ??
      null,

    percentOfPlan:
      row?.percentOfPlan ??
      row?.percent_of_plan ??
      row?.plan_attainment ??
      null,
  }));
}


function getVarianceClass(value) {
  const numericValue = Number(value);

  if (numericValue > 0) {
    return "positive";
  }

  if (numericValue < 0) {
    return "negative";
  }

  return "neutral";
}


export default function SupportingDataTable({
  rows = [],
  unit = "",
  title,
  subtitle,
  loading = false,
  emptyMessage,
  onExport,
}) {
  const {
    language,
    t,
  } = useLanguage();

  const locale =
    language === "MN"
      ? "mn-MN"
      : "en-US";

  const displayTitle =
    title ||
    t(
      "supportingDataTable.defaultTitle",
    );

  const displaySubtitle =
    subtitle ||
    t(
      "supportingDataTable.defaultSubtitle",
    );

  const displayEmptyMessage =
    emptyMessage ||
    t(
      "supportingDataTable.defaultEmptyMessage",
    );

  const normalizedRows =
    normalizeRows(
      rows,
      t,
    );

  const renderTableHeader = () => (
    <thead>
      <tr>
        <th>
          {t(
            "supportingDataTable.date",
          )}
        </th>

        <th>
          {t(
            "supportingDataTable.actual",
          )}
        </th>

        <th>
          {t(
            "supportingDataTable.plan",
          )}
        </th>

        <th>
          {t(
            "supportingDataTable.variance",
          )}
        </th>

        <th>
          {t(
            "supportingDataTable.percentOfPlan",
          )}
        </th>
      </tr>
    </thead>
  );

  return (
    <section
      className="supporting-data"
      aria-label={displayTitle}
    >
      <div className="supporting-data-header">
        <div className="supporting-data-heading">
          <span className="supporting-data-heading-icon">
            <FiDatabase />
          </span>

          <div>
            <h3>
              {displayTitle}
            </h3>

            <p>
              {displaySubtitle}
            </p>
          </div>
        </div>

        <div className="supporting-data-header-actions">
          {!loading &&
            normalizedRows.length > 0 && (
              <span className="supporting-data-count">
                {translateTemplate(
                  t,
                  normalizedRows.length === 1
                    ? "supportingDataTable.rowCountSingle"
                    : "supportingDataTable.rowCountPlural",
                  {
                    count:
                      normalizedRows.length,
                  },
                )}
              </span>
            )}

          {onExport && (
            <button
              type="button"
              className="supporting-data-export"
              onClick={() =>
                onExport(
                  normalizedRows,
                )
              }
              aria-label={t(
                "supportingDataTable.exportAria",
              )}
            >
              <FiDownload />

              {t(
                "supportingDataTable.export",
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="supporting-data-table-wrap">
          <table
            className="supporting-data-table"
            aria-label={t(
              "supportingDataTable.loadingAria",
            )}
          >
            {renderTableHeader()}

            <tbody>
              {Array.from({
                length: 6,
              }).map(
                (_, index) => (
                  <tr
                    key={`supporting-skeleton-${index}`}
                  >
                    {Array.from({
                      length: 5,
                    }).map(
                      (
                        __,
                        cellIndex,
                      ) => (
                        <td
                          key={`supporting-skeleton-${index}-${cellIndex}`}
                        >
                          <span
                            className="supporting-data-skeleton"
                            aria-hidden="true"
                          />
                        </td>
                      ),
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      ) : normalizedRows.length === 0 ? (
        <div className="supporting-data-empty">
          <FiAlertCircle />

          <div>
            <strong>
              {t(
                "supportingDataTable.noData",
              )}
            </strong>

            <p>
              {displayEmptyMessage}
            </p>
          </div>
        </div>
      ) : (
        <div className="supporting-data-table-wrap">
          <table className="supporting-data-table">
            {renderTableHeader()}

            <tbody>
              {normalizedRows.map(
                (row) => {
                  const varianceClass =
                    getVarianceClass(
                      row.variance,
                    );

                  const varianceValue =
                    Number(
                      row.variance,
                    );

                  return (
                    <tr key={row.id}>
                      <td>
                        <span className="supporting-data-date">
                          {formatDate(
                            row.date,
                            language,
                          )}
                        </span>
                      </td>

                      <td>
                        <strong className="supporting-data-primary-value">
                          {formatValue(
                            row.actual,
                            locale,
                          )}
                          {unit}
                        </strong>
                      </td>

                      <td>
                        <span className="supporting-data-secondary-value">
                          {formatValue(
                            row.plan,
                            locale,
                          )}
                          {unit}
                        </span>
                      </td>

                      <td
                        className={
                          varianceClass
                        }
                      >
                        {varianceValue > 0
                          ? "+"
                          : ""}
                        {formatValue(
                          row.variance,
                          locale,
                        )}
                      </td>

                      <td>
                        <span
                          className={`supporting-data-attainment ${getVarianceClass(
                            Number(
                              row.percentOfPlan,
                            ) - 100,
                          )}`}
                        >
                          {formatValue(
                            row.percentOfPlan,
                            locale,
                          )}
                          %
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
