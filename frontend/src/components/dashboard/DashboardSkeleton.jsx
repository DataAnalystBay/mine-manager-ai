import "./DashboardSkeleton.css";

function SkeletonBlock({ className = "" }) {
  return <div className={`dashboard-skeleton-block ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-loading-page"
      aria-label="Loading executive dashboard"
      aria-busy="true"
    >
      <section className="dashboard-loading-header">
        <div className="dashboard-loading-heading">
          <SkeletonBlock className="dashboard-loading-title" />
          <SkeletonBlock className="dashboard-loading-subtitle" />
          <SkeletonBlock className="dashboard-loading-scenario" />
        </div>

        <div className="dashboard-loading-controls">
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </section>

      <section className="dashboard-loading-config">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="dashboard-loading-config-item">
            <SkeletonBlock className="dashboard-loading-label" />
            <SkeletonBlock className="dashboard-loading-value" />
          </div>
        ))}
      </section>

      <section className="dashboard-loading-health">
        <div>
          <SkeletonBlock className="dashboard-loading-health-label" />
          <SkeletonBlock className="dashboard-loading-health-name" />
          <SkeletonBlock className="dashboard-loading-score" />
          <SkeletonBlock className="dashboard-loading-pill" />
        </div>

        <SkeletonBlock className="dashboard-loading-status" />

        <div>
          <SkeletonBlock className="dashboard-loading-chart-title" />
          <SkeletonBlock className="dashboard-loading-chart" />
        </div>
      </section>

      <section className="dashboard-loading-kpi-section">
        <div className="dashboard-loading-section-heading">
          <SkeletonBlock className="dashboard-loading-section-title" />
          <SkeletonBlock className="dashboard-loading-link" />
        </div>

        <div className="dashboard-loading-kpis">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="dashboard-loading-kpi-card">
              <SkeletonBlock className="dashboard-loading-icon" />
              <SkeletonBlock className="dashboard-loading-kpi-name" />
              <SkeletonBlock className="dashboard-loading-badge" />
              <SkeletonBlock className="dashboard-loading-kpi-value" />
              <SkeletonBlock className="dashboard-loading-trend" />
              <SkeletonBlock className="dashboard-loading-progress" />
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-loading-panels">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="dashboard-loading-panel">
            <SkeletonBlock className="dashboard-loading-panel-title" />
            <SkeletonBlock className="dashboard-loading-panel-line" />
            <SkeletonBlock className="dashboard-loading-panel-line short" />
            <SkeletonBlock className="dashboard-loading-panel-line" />
            <SkeletonBlock className="dashboard-loading-panel-line medium" />
          </div>
        ))}
      </section>
    </div>
  );
}

export default DashboardSkeleton;