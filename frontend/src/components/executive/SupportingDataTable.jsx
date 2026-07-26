import React from "react";
import {
  FiAlertCircle,
  FiDatabase,
  FiDownload,
} from "react-icons/fi";

import "./SupportingDataTable.css";

function formatValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return Number.isInteger(numericValue)
    ? numericValue.toLocaleString()
    : numericValue.toLocaleString(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeRows(rows) {
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
      `Row ${index + 1}`,
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
  title = "Supporting Data",
  subtitle = "Evidence used in the KPI analysis",
  loading = false,
  emptyMessage = "Supporting data is not available for this KPI.",
  onExport,
}) {
  const normalizedRows = normalizeRows(rows);

  return (
    <section className="supporting-data" aria-label={title}>
      <div className="supporting-data-header">
        <div className="supporting-data-heading">
          <span className="supporting-data-heading-icon">
            <FiDatabase />
          </span>

          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
        </div>

        <div className="supporting-data-header-actions">
          {!loading && normalizedRows.length > 0 && (
            <span className="supporting-data-count">
              {normalizedRows.length} row
              {normalizedRows.length === 1 ? "" : "s"}
            </span>
          )}

          {onExport && (
            <button
              type="button"
              className="supporting-data-export"
              onClick={() => onExport(normalizedRows)}
            >
              <FiDownload />
              Export
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="supporting-data-table-wrap">
          <table className="supporting-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actual</th>
                <th>Plan</th>
                <th>Variance</th>
                <th>% of Plan</th>
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={`supporting-skeleton-${index}`}>
                  {Array.from({ length: 5 }).map((__, cellIndex) => (
                    <td key={`supporting-skeleton-${index}-${cellIndex}`}>
                      <span className="supporting-data-skeleton" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : normalizedRows.length === 0 ? (
        <div className="supporting-data-empty">
          <FiAlertCircle />

          <div>
            <strong>No supporting data available</strong>
            <p>{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="supporting-data-table-wrap">
          <table className="supporting-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Actual</th>
                <th>Plan</th>
                <th>Variance</th>
                <th>% of Plan</th>
              </tr>
            </thead>

            <tbody>
              {normalizedRows.map((row) => {
                const varianceClass = getVarianceClass(row.variance);
                const varianceValue = Number(row.variance);

                return (
                  <tr key={row.id}>
                    <td>
                      <span className="supporting-data-date">
                        {formatDate(row.date)}
                      </span>
                    </td>

                    <td>
                      <strong className="supporting-data-primary-value">
                        {formatValue(row.actual)}
                        {unit}
                      </strong>
                    </td>

                    <td>
                      <span className="supporting-data-secondary-value">
                        {formatValue(row.plan)}
                        {unit}
                      </span>
                    </td>

                    <td className={varianceClass}>
                      {varianceValue > 0 ? "+" : ""}
                      {formatValue(row.variance)}
                    </td>

                    <td>
                      <span
                        className={`supporting-data-attainment ${getVarianceClass(
                          Number(row.percentOfPlan) - 100
                        )}`}
                      >
                        {formatValue(row.percentOfPlan)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
