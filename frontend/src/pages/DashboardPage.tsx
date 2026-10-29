import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock3,
  CloudRain,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { CommandMap } from '../components/CommandMap';
import { KpiCard } from '../components/KpiCard';
import { RiskBadge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';

import {
  getAlerts,
  getDashboard,
  getShipments,
  type ApiAlert,
  type ApiShipment,
  type DashboardSummary,
} from '../api';

/* ============================================================
   EXISTING VISUAL TREND DATA

   This is only the historical chart decoration.
   Current operational KPIs come from FastAPI.
============================================================ */

const riskHistory = [
  {
    day: 'Mon',
    risk: 31,
  },
  {
    day: 'Tue',
    risk: 38,
  },
  {
    day: 'Wed',
    risk: 44,
  },
  {
    day: 'Thu',
    risk: 52,
  },
  {
    day: 'Fri',
    risk: 47,
  },
  {
    day: 'Sat',
    risk: 63,
  },
  {
    day: 'Sun',
    risk: 59,
  },
];

/* ============================================================
   PAGE
============================================================ */

export function DashboardPage({
  onNavigate,
}: {
  onNavigate: (
    key:
      | 'map'
      | 'routes'
      | 'shipments'
      | 'alerts',
  ) => void;
}) {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardSummary | null>(
    null,
  );

  const [
    alerts,
    setAlerts,
  ] = useState<ApiAlert[]>([]);

  const [
    shipments,
    setShipments,
  ] = useState<ApiShipment[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  /* ==========================================================
     LOAD LIVE DASHBOARD
  ========================================================== */

  const loadDashboard =
    useCallback(
      async (
        showLoader = true,
      ) => {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError('');

        try {
          const [
            dashboardResult,
            alertsResult,
            shipmentsResult,
          ] = await Promise.all([
            getDashboard(),
            getAlerts(),
            getShipments(),
          ]);

          setDashboard(
            dashboardResult,
          );

          setAlerts(
            alertsResult.items || [],
          );

          setShipments(
            shipmentsResult.items || [],
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load dashboard data.';

          setError(
            message,
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  /* ==========================================================
     INITIAL LOAD + LIVE EVENTS
  ========================================================== */

  useEffect(() => {
    void loadDashboard();

    const refresh =
      () => {
        void loadDashboard(
          false,
        );
      };

    window.addEventListener(
      'margSetu:incident-created',
      refresh,
    );

    window.addEventListener(
      'margSetu:incident-updated',
      refresh,
    );

    window.addEventListener(
      'margSetu:incidents-synced',
      refresh,
    );

    window.addEventListener(
      'margSetu:route-approved',
      refresh,
    );

    return () => {
      window.removeEventListener(
        'margSetu:incident-created',
        refresh,
      );

      window.removeEventListener(
        'margSetu:incident-updated',
        refresh,
      );

      window.removeEventListener(
        'margSetu:incidents-synced',
        refresh,
      );

      window.removeEventListener(
        'margSetu:route-approved',
        refresh,
      );
    };
  }, [
    loadDashboard,
  ]);

  /* ==========================================================
     SAFE VALUES
  ========================================================== */

  const live =
    dashboard || {
      accessibility_percent: 0,
      high_risk_corridors: 0,
      critical_corridors: 0,
      active_vehicles: 0,
      active_shipments: 0,
      critical_alerts: 0,
      field_incidents: 0,
      affected_vehicles: 0,
      affected_shipments: 0,
    };

  const topAlerts =
    alerts.slice(
      0,
      5,
    );

  const criticalShipments =
    useMemo(
      () =>
        shipments
          .filter(
            (shipment) =>
              shipment.priority ===
                'Critical' ||
              shipment.risk ===
                'High' ||
              shipment.risk ===
                'Critical',
          )
          .slice(
            0,
            4,
          ),
      [shipments],
    );

  const shipmentRiskPressure =
    Math.min(
      100,
      live.affected_shipments *
        8,
    );

  const vehicleRiskPressure =
    Math.min(
      100,
      live.affected_vehicles *
        2,
    );

  const incidentPressure =
    Math.min(
      100,
      live.field_incidents *
        15,
    );

  const corridorPressure =
    Math.min(
      100,
      live.critical_corridors *
        25,
    );

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="page-stack">
        <section
          className="panel"
          style={{
            minHeight: 360,
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            gap: 10,
          }}
        >
          <Loader2
            size={22}
            className="spin"
          />

          <span className="muted">
            Loading Marg Setu intelligence...
          </span>
        </section>
      </div>
    );
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="page-stack">
      {/* ======================================================
          API ERROR
      ====================================================== */}

      {error && (
        <section
          className="panel"
          style={{
            border:
              '1px solid #fecaca',
            background:
              '#fef2f2',
            color: '#991b1b',
          }}
        >
          <strong>
            Dashboard API error
          </strong>

          <div
            style={{
              marginTop: 5,
              fontSize: 13,
            }}
          >
            {error}
          </div>

          <button
            className="secondary-button"
            style={{
              marginTop: 10,
            }}
            onClick={() =>
              void loadDashboard()
            }
          >
            Retry
          </button>
        </section>
      )}

      {/* ======================================================
          HERO
      ====================================================== */}

      <div className="hero-strip">
        <div>
          <span className="pill">
            LIVE INTELLIGENCE
          </span>

          <h2>
            Marg Setu Logistics Intelligence Command Center
          </h2>

          <p>
            Predict disruption risk, understand logistics
            impact, and recommend safer routes before
            critical deliveries are delayed.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 10,
            }}
          >
            <span
              className="tiny"
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 5,
              }}
            >
              <MapPin
                size={13}
              />

              North Eastern Region
            </span>

            <span
              className="tiny"
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 5,
              }}
            >
              <ShieldCheck
                size={13}
              />

              Dynamic risk engine
            </span>

            <span
              className="tiny"
              style={{
                display:
                  'inline-flex',
                alignItems:
                  'center',
                gap: 5,
              }}
            >
              <AlertTriangle
                size={13}
              />

              {live.field_incidents}{' '}
              field reports
            </span>
          </div>
        </div>

        <div className="hero-health">
          <div className="health-ring">
            {live.accessibility_percent}%
          </div>

          <div>
            <strong>
              Network accessibility
            </strong>

            <span>
              {live.high_risk_corridors}{' '}
              high-risk corridors
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          COMMAND ACTIONS
      ====================================================== */}

      <section
        className="panel"
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          padding:
            '14px 18px',
        }}
      >
        <div>
          <strong>
            Operational command
          </strong>

          <div className="muted">
            Monitor, reroute and investigate the current
            logistics network.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="secondary-button"
            onClick={() =>
              onNavigate(
                'map',
              )
            }
          >
            <MapPin
              size={15}
            />

            GIS Command Map
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onNavigate(
                'routes',
              )
            }
          >
            <Route
              size={15}
            />

            Smart Rerouting
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              onNavigate(
                'alerts',
              )
            }
          >
            <Zap
              size={15}
            />

            Alerts
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              void loadDashboard(
                false,
              )
            }
            disabled={
              refreshing
            }
          >
            {refreshing ? (
              <Loader2
                size={15}
                className="spin"
              />
            ) : (
              <RefreshCw
                size={15}
              />
            )}

            Refresh
          </button>
        </div>
      </section>

      {/* ======================================================
          LIVE KPI
      ====================================================== */}

      <div className="kpi-grid">
        <KpiCard
          icon={
            <Route size={20} />
          }
          label="Accessible corridors"
          value={`${live.accessibility_percent}%`}
          helper={
            live.high_risk_corridors >
            0
              ? `${live.high_risk_corridors} need attention`
              : 'Across monitored routes'
          }
        />

        <KpiCard
          icon={
            <AlertTriangle
              size={20}
            />
          }
          label="High-risk corridors"
          value={`${live.high_risk_corridors}`}
          helper={`${live.critical_corridors} critical`}
          tone="red"
        />

        <KpiCard
          icon={
            <Truck size={20} />
          }
          label="Active vehicles"
          value={`${live.active_vehicles}`}
          helper={`${live.affected_vehicles} potentially affected`}
          tone="teal"
        />

        <KpiCard
          icon={
            <Boxes size={20} />
          }
          label="Active shipments"
          value={`${live.active_shipments}`}
          helper={`${live.affected_shipments} potentially affected`}
          tone="purple"
        />

        <KpiCard
          icon={
            <Zap size={20} />
          }
          label="Critical alerts"
          value={`${live.critical_alerts}`}
          helper={`${live.field_incidents} field incidents`}
          tone="yellow"
        />
      </div>

      {/* ======================================================
          MAP + ALERTS
      ====================================================== */}

      <div className="dashboard-grid main-grid">
        <section className="panel large-panel">
          <SectionTitle
            title="NER accessibility overview"
            subtitle="Field reports automatically influence corridor risk"
            action={
              <button
                className="secondary-button"
                onClick={() =>
                  onNavigate(
                    'map',
                  )
                }
              >
                Open GIS view

                <ArrowUpRight
                  size={14}
                />
              </button>
            }
          />

          <CommandMap
            compact
            onOpenMap={() =>
              onNavigate(
                'map',
              )
            }
          />
        </section>

        <section className="panel">
          <SectionTitle
            title="Live operational alerts"
            subtitle="System + field intelligence"
          />

          <div className="alert-list">
            {topAlerts.length ===
            0 ? (
              <div
                className="muted"
                style={{
                  padding: 18,
                  textAlign:
                    'center',
                }}
              >
                No active alerts.
              </div>
            ) : (
              topAlerts.map(
                (alert) => (
                  <button
                    key={
                      alert.id
                    }
                    className="alert-row"
                    onClick={() =>
                      onNavigate(
                        alert.action ===
                          'routes'
                          ? 'routes'
                          : 'alerts',
                      )
                    }
                  >
                    <div
                      className={`severity-dot ${alert.severity.toLowerCase()}`}
                    />

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div className="alert-title">
                        {
                          alert.title
                        }
                      </div>

                      <div className="muted">
                        {
                          alert.detail
                        }
                      </div>

                      <div
                        className="tiny"
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 5,
                          marginTop: 3,
                        }}
                      >
                        <Clock3
                          size={11}
                        />

                        {
                          alert.time
                        }
                      </div>
                    </div>

                    <span className="chevron">
                      ›
                    </span>
                  </button>
                ),
              )
            )}
          </div>

          <button
            className="text-button"
            onClick={() =>
              onNavigate(
                'alerts',
              )
            }
          >
            View all alerts →
          </button>
        </section>
      </div>

      {/* ======================================================
          RISK TREND + LIVE INTELLIGENCE
      ====================================================== */}

      <div className="dashboard-grid two-grid">
        <section className="panel">
          <SectionTitle
            title="Accessibility risk trend"
            subtitle="7-day regional risk index"
          />

          <div className="chart-wrap">
            <ResponsiveContainer
              width="100%"
              height={240}
            >
              <AreaChart
                data={
                  riskHistory
                }
              >
                <defs>
                  <linearGradient
                    id="riskFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#f97316"
                      stopOpacity={
                        0.35
                      }
                    />

                    <stop
                      offset="100%"
                      stopColor="#f97316"
                      stopOpacity={
                        0.02
                      }
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="day"
                  stroke="#8a8f98"
                />

                <YAxis
                  domain={[
                    0,
                    100,
                  ]}
                  stroke="#8a8f98"
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#f97316"
                  strokeWidth={
                    3
                  }
                  fill="url(#riskFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <SectionTitle
            title="Current risk intelligence"
            subtitle="Signals driving road accessibility"
          />

          <RiskSignal
            label="Field incident pressure"
            value={
              incidentPressure
            }
          />

          <RiskSignal
            label="Critical corridor exposure"
            value={
              corridorPressure
            }
          />

          <RiskSignal
            label="Shipment impact"
            value={
              shipmentRiskPressure
            }
          />

          <RiskSignal
            label="Vehicle exposure"
            value={
              vehicleRiskPressure
            }
          />

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 11,
              background:
                '#fff7ed',
              border:
                '1px solid #fed7aa',
            }}
          >
            <strong>
              Controller recommendation
            </strong>

            <div className="muted">
              {live.critical_corridors >
              0
                ? 'Review critical corridors and reroute essential cargo.'
                : live.high_risk_corridors >
                  0
                  ? 'Monitor high-risk corridors and prepare alternate routes.'
                  : 'Continue monitoring the regional network.'}
            </div>
          </div>
        </section>
      </div>

      {/* ======================================================
          CRITICAL SHIPMENTS
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Critical shipments"
          subtitle="Priority cargo currently at risk"
          action={
            <button
              className="secondary-button"
              onClick={() =>
                onNavigate(
                  'shipments',
                )
              }
            >
              Open monitor

              <ArrowUpRight
                size={14}
              />
            </button>
          }
        />

        <div className="table-list">
          {criticalShipments.length ===
          0 ? (
            <div
              className="muted"
              style={{
                padding: 18,
                textAlign:
                  'center',
              }}
            >
              No critical or high-risk shipments.
            </div>
          ) : (
            criticalShipments.map(
              (shipment) => (
                <div
                  className="shipment-row"
                  key={
                    shipment.id
                  }
                >
                  <div className="shipment-icon">
                    <Boxes
                      size={18}
                    />
                  </div>

                  <div className="grow">
                    <strong>
                      {
                        shipment.id
                      }
                    </strong>

                    <span className="tiny-spacer">
                      {
                        shipment.cargo
                      }
                    </span>

                    <div className="muted">
                      {
                        shipment.origin
                      }{' '}
                      →
                      {' '}
                      {
                        shipment.destination
                      }
                    </div>

                    {shipment.affected && (
                      <div
                        className="tiny"
                        style={{
                          marginTop: 4,
                        }}
                      >
                        {
                          shipment.impact_reason
                        }
                      </div>
                    )}
                  </div>

                  <div className="align-right">
                    <RiskBadge
                      level={
                        shipment.risk as
                          | 'Low'
                          | 'Moderate'
                          | 'High'
                          | 'Critical'
                      }
                    />

                    <div
                      className="tiny"
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'flex-end',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <Clock3
                        size={12}
                      />

                      {
                        shipment.current_eta ||
                        shipment.eta
                      }
                    </div>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </section>

      {/* ======================================================
          OPERATING LOOP
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Marg Setu intelligence loop"
          subtitle="Every field signal becomes an operational decision"
        />

        <div className="flow-strip">
          <div>
            <CheckCircle2 />
            <strong>
              Observe
            </strong>
            <span>
              Weather · GPS · field reports
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <CloudRain />
            <strong>
              Predict
            </strong>
            <span>
              Road disruption risk
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <Route />
            <strong>
              Decide
            </strong>
            <span>
              Risk-adjusted route
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <Truck />
            <strong>
              Track
            </strong>
            <span>
              Vehicle + shipment impact
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   RISK SIGNAL
============================================================ */

function RiskSignal({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue =
    Math.min(
      100,
      Math.max(
        0,
        value,
      ),
    );

  const color =
    safeValue >= 75
      ? '#dc2626'
      : safeValue >= 50
        ? '#f97316'
        : '#eab308';

  return (
    <div
      style={{
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 10,
          marginBottom: 5,
        }}
      >
        <span className="muted">
          {label}
        </span>

        <strong>
          {safeValue}
        </strong>
      </div>

      <div
        style={{
          height: 8,
          background:
            '#e5e7eb',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: '100%',
            background:
              color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}