import React from "react";

function SkeletonLine({ width = "100%", height = 12 }) {
  return (
    <div
      className="kpi-skeleton-line"
      style={{
        width,
        height,
      }}
    />
  );
}

export default function ExecutiveKpiSkeleton() {
  return (
    <div
      className="kpi-skeleton"
      aria-label="Loading executive KPI analysis"
      aria-busy="true"
    >
      <section className="kpi-skeleton-status">
        <div className="kpi-skeleton-icon" />

        <div className="kpi-skeleton-status-content">
          <div className="kpi-skeleton-status-topline">
            <SkeletonLine width="92px" height={10} />
            <SkeletonLine width="84px" height={26} />
          </div>

          <SkeletonLine width="55%" height={18} />
          <SkeletonLine width="78%" height={12} />

          <div className="kpi-skeleton-metadata">
            <SkeletonLine width="112px" height={11} />
            <SkeletonLine width="104px" height={11} />
            <SkeletonLine width="120px" height={11} />
          </div>
        </div>
      </section>

      <section className="kpi-skeleton-summary">
        {[1, 2, 3].map((item) => (
          <div key={item} className="kpi-skeleton-summary-card">
            <SkeletonLine width="44%" height={11} />
            <SkeletonLine width="64%" height={28} />
          </div>
        ))}
      </section>

      <section className="kpi-skeleton-chart-card">
        <div className="kpi-skeleton-chart-heading">
          <div>
            <SkeletonLine width="150px" height={16} />
            <SkeletonLine width="205px" height={10} />
          </div>

          <SkeletonLine width="68px" height={28} />
        </div>

        <div className="kpi-skeleton-chart-area">
          <SkeletonLine width="100%" height={2} />
          <SkeletonLine width="100%" height={2} />
          <SkeletonLine width="100%" height={2} />

          <div className="kpi-skeleton-chart-wave" />
        </div>

        <div className="kpi-skeleton-days">
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <div key={item}>
              <SkeletonLine width="62%" height={9} />
              <SkeletonLine width="78%" height={12} />
            </div>
          ))}
        </div>
      </section>

      <section className="kpi-skeleton-columns">
        {[1, 2].map((column) => (
          <div key={column} className="kpi-skeleton-list-card">
            <div className="kpi-skeleton-list-title">
              <div className="kpi-skeleton-small-icon" />
              <SkeletonLine width="145px" height={16} />
            </div>

            <div className="kpi-skeleton-list-items">
              <SkeletonLine width="92%" height={11} />
              <SkeletonLine width="81%" height={11} />
              <SkeletonLine width="88%" height={11} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}