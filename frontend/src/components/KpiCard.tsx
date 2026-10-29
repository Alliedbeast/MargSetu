import type { ReactNode } from 'react';

export function KpiCard({ icon, label, value, helper, tone = 'orange' }: { icon: ReactNode; label: string; value: string | number; helper: string; tone?: string }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${tone}`}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-helper">{helper}</div>
      </div>
    </div>
  );
}
