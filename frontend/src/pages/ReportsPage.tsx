import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Route,
  ShieldAlert,
  Truck,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  getAlerts,
  getApprovedRoutes,
  getDashboard,
  getIncidents,
  getShipments,
  type ApiAlert,
  type ApiApprovedReroute,
  type ApiIncident,
  type ApiShipment,
  type DashboardSummary,
} from '../api';

import { RiskBadge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';


/* ============================================================
   TYPES
============================================================ */

type Severity =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';


/* ============================================================
   HELPERS
============================================================ */

function severityValue(
  value: string,
): Severity {
  if (
    value === 'Critical' ||
    value === 'High' ||
    value === 'Moderate' ||
    value === 'Low'
  ) {
    return value;
  }

  return 'Moderate';
}


function createCsv(
  rows: string[][],
) {
  return rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${value
              .replaceAll(
                '"',
                '""',
              )
              .replaceAll(
                '\n',
                ' ',

              )}"`,
        )
        .join(','),
    )
    .join('\n');
}


function downloadTextFile(
  filename: string,
  content: string,
) {
  const blob =
    new Blob(
      [content],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      'a',
    );

  anchor.href =
    url;

  anchor.download =
    filename;

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}


/* ============================================================
   PAGE
============================================================ */

export function ReportsPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState<
    DashboardSummary | null
  >(null);

  const [
    incidents,
    setIncidents,
  ] = useState<
    ApiIncident[]
  >([]);

  const [
    alerts,
    setAlerts,
  ] = useState<
    ApiAlert[]
  >([]);

  const [
    shipments,
    setShipments,
  ] = useState<
    ApiShipment[]
  >([]);

  const [
    approvedRoutes,
    setApprovedRoutes,
  ] = useState<
    ApiApprovedReroute[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState(
    '',
  );


  /* ==========================================================
     LOAD REPORT DATA
  ========================================================== */

  const loadReports =
    useCallback(
      async (
        showLoader = true,
      ) => {
        if (
          showLoader
        ) {
          setLoading(
            true,
          );
        } else {
          setRefreshing(
            true,
          );
        }

        setError(
          '',
        );

        try {
          const [
            dashboardResult,
            incidentResult,
            alertResult,
            shipmentResult,
            routeResult,
          ] =
            await Promise.all([
              getDashboard(),
              getIncidents(),
              getAlerts(),
              getShipments(),
              getApprovedRoutes(),
            ]);

          setDashboard(
            dashboardResult,
          );

          setIncidents(
            incidentResult || [],
          );

          setAlerts(
            alertResult.items ||
              [],
          );

          setShipments(
            shipmentResult.items ||
              [],
          );

          setApprovedRoutes(
            routeResult.items ||
              [],
          );
        } catch (
          err
        ) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load analytics data.';

          setError(
            message,
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );


  /* ==========================================================
     INITIAL LOAD + LIVE EVENTS
  ========================================================== */

  useEffect(() => {
    void loadReports();

    const refresh =
      () => {
        void loadReports(
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
    loadReports,
  ]);


  /* ==========================================================
     SAFE DASHBOARD
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


  /* ==========================================================
     INCIDENT BREAKDOWN
  ========================================================== */

  const incidentBreakdown =
    useMemo(() => {
      const values: Record<
        Severity,
        number
      > = {
        Low: 0,
        Moderate: 0,
        High: 0,
        Critical: 0,
      };

      for (
        const incident of incidents
      ) {
        values[
          severityValue(
            incident.severity,
          )
        ] += 1;
      }

      return [
        {
          name: 'Low',
          value: values.Low,
        },
        {
          name: 'Moderate',
          value:
            values.Moderate,
        },
        {
          name: 'High',
          value: values.High,
        },
        {
          name: 'Critical',
          value:
            values.Critical,
        },
      ];
    }, [
      incidents,
    ]);


  /* ==========================================================
     SHIPMENT BREAKDOWN
  ========================================================== */

  const shipmentBreakdown =
    useMemo(() => {
      const affected =
        shipments.filter(
          (
            shipment,
          ) =>
            shipment.affected,
        ).length;

      const safe =
        Math.max(
          0,
          shipments.length -
            affected,
        );

      return [
        {
          name: 'Affected',
          value: affected,
        },
        {
          name: 'Monitoring',
          value: safe,
        },
      ];
    }, [
      shipments,
    ]);


  /* ==========================================================
     PRIORITY BREAKDOWN
  ========================================================== */

  const priorityBreakdown =
    useMemo(() => {
      return [
        {
          priority: 'Critical',
          value:
            shipments.filter(
              (
                shipment,
              ) =>
                shipment.priority ===
                'Critical',
            ).length,
        },

        {
          priority: 'High',
          value:
            shipments.filter(
              (
                shipment,
              ) =>
                shipment.priority ===
                'High',
            ).length,
        },

        {
          priority: 'Medium',
          value:
            shipments.filter(
              (
                shipment,
              ) =>
                shipment.priority ===
                'Medium',
            ).length,
        },

        {
          priority: 'Low',
          value:
            shipments.filter(
              (
                shipment,
              ) =>
                shipment.priority ===
                'Low',
            ).length,
        },
      ];
    }, [
      shipments,
    ]);


  /* ==========================================================
     REROUTE RATE
  ========================================================== */

  const reroutedCount =
    shipments.filter(
      (
        shipment,
      ) =>
        shipment.status ===
          'Rerouted' ||
        shipment.operational_status ===
          'Rerouted',
    ).length;

  const rerouteRate =
    shipments.length === 0
      ? 0
      : Math.round(
          (reroutedCount /
            shipments.length) *
            100,
        );


  /* ==========================================================
     REPORT EXPORT
  ========================================================== */

  function exportReport() {
    const rows = [
      [
        'Shipment ID',
        'Cargo',
        'Priority',
        'Origin',
        'Destination',
        'Risk',
        'Risk Score',
        'Status',
        'Operational Status',
        'Current Route',
        'Current ETA',
      ],

      ...shipments.map(
        (
          shipment,
        ) => [
          shipment.id,
          shipment.cargo,
          shipment.priority,
          shipment.origin,
          shipment.destination,
          shipment.risk,
          String(
            shipment.risk_score,
          ),
          shipment.status,
          shipment.operational_status,
          shipment.current_route,
          shipment.current_eta,
        ],
      ),
    ];

    downloadTextFile(
      `marg-setu-report-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      createCsv(
        rows,
      ),
    );
  }


  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loading
  ) {
    return (
      <div className="page-stack">
        <section
          className="panel"
          style={{
            minHeight:
              360,
            display:
              'flex',
            justifyContent:
              'center',
            alignItems:
              'center',
            gap: 10,
          }}
        >
          <Loader2
            size={22}
            className="spin"
          />

          <span className="muted">
            Loading Marg Setu analytics...
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
          HEADER
      ====================================================== */}

      <section className="hero-strip">
        <div>
          <span className="pill">
            OPERATIONAL ANALYTICS
          </span>

          <h2>
            Marg Setu Situation Report
          </h2>

          <p>
            Consolidated view of field incidents,
            corridor exposure, shipment impact,
            alerts and approved reroutes.
          </p>
        </div>

        <div
          style={{
            display:
              'flex',
            gap: 8,
            flexWrap:
              'wrap',
          }}
        >
          <button
            className="secondary-button"
            onClick={() =>
              void loadReports(
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

          <button
            className="primary-button"
            onClick={
              exportReport
            }
          >
            <Download
              size={15}
            />

            Export CSV
          </button>
        </div>
      </section>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <section
          className="panel"
          style={{
            border:
              '1px solid #fecaca',
            background:
              '#fef2f2',
            color:
              '#991b1b',
          }}
        >
          <strong>
            Analytics API error
          </strong>

          <div
            style={{
              marginTop: 4,
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
              void loadReports()
            }
          >
            Retry
          </button>
        </section>
      )}


      {/* ======================================================
          KPI
      ====================================================== */}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon teal">
            <ShieldAlert />
          </div>

          <div>
            <div className="kpi-label">
              Field incidents
            </div>

            <div className="kpi-value">
              {
                live.field_incidents
              }
            </div>

            <div className="tiny">
              Live from FastAPI
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red">
            <AlertTriangle />
          </div>

          <div>
            <div className="kpi-label">
              High-risk corridors
            </div>

            <div className="kpi-value">
              {
                live.high_risk_corridors
              }
            </div>

            <div className="tiny">
              {
                live.critical_corridors
              }{' '}
              critical
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple">
            <Truck />
          </div>

          <div>
            <div className="kpi-label">
              Affected vehicles
            </div>

            <div className="kpi-value">
              {
                live.affected_vehicles
              }
            </div>

            <div className="tiny">
              Of{' '}
              {
                live.active_vehicles
              }{' '}
              active
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon yellow">
            <FileText />
          </div>

          <div>
            <div className="kpi-label">
              Affected shipments
            </div>

            <div className="kpi-value">
              {
                live.affected_shipments
              }
            </div>

            <div className="tiny">
              Of{' '}
              {
                live.active_shipments
              }{' '}
              active
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <Route />
          </div>

          <div>
            <div className="kpi-label">
              Reroute rate
            </div>

            <div className="kpi-value">
              {
                rerouteRate
              }%
            </div>

            <div className="tiny">
              {
                approvedRoutes.length
              }{' '}
              approved routes
            </div>
          </div>
        </div>
      </div>


      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="dashboard-grid two-grid">
        {/* INCIDENTS */}

        <section className="panel">
          <SectionTitle
            title="Incident severity"
            subtitle="Live field reports by severity"
          />

          <div
            style={{
              height:
                300,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={
                  incidentBreakdown
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={
                    false
                  }
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                />

                <Tooltip />

                <Bar
                  dataKey="value"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                >
                  {incidentBreakdown.map(
                    (
                      entry,
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          entry.name ===
                          'Critical'
                            ? '#dc2626'
                            : entry.name ===
                                'High'
                              ? '#ea580c'
                              : entry.name ===
                                  'Moderate'
                                ? '#eab308'
                                : '#22c55e'
                        }
                      />
                    ),
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>


        {/* SHIPMENTS */}

        <section className="panel">
          <SectionTitle
            title="Shipment exposure"
            subtitle="Current affected vs monitoring state"
          />

          <div
            style={{
              height:
                300,
              position:
                'relative',
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={
                    shipmentBreakdown
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={
                    95
                  }
                  innerRadius={
                    55
                  }
                  paddingAngle={
                    3
                  }
                >
                  {shipmentBreakdown.map(
                    (
                      entry,
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          entry.name ===
                          'Affected'
                            ? '#f97316'
                            : '#d1d5db'
                        }
                      />
                    ),
                  )}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div
              style={{
                position:
                  'absolute',
                top: '50%',
                left: '50%',
                transform:
                  'translate(-50%, -50%)',
                textAlign:
                  'center',
              }}
            >
              <strong
                style={{
                  fontSize:
                    28,
                }}
              >
                {
                  live.active_shipments
                }
              </strong>

              <div className="tiny">
                shipments
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* ======================================================
          PRIORITY DISTRIBUTION
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Cargo priority distribution"
          subtitle="Current active shipment portfolio"
        />

        <div
          style={{
            height:
              280,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={
                priorityBreakdown
              }
              layout="vertical"
              margin={{
                left: 30,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={
                  false
                }
              />

              <XAxis
                type="number"
                allowDecimals={
                  false
              }
              />

              <YAxis
                type="category"
                dataKey="priority"
              />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#f97316"
                radius={[
                  0,
                  6,
                  6,
                  0,
                ]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>


      {/* ======================================================
          APPROVED REROUTES
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Approved reroutes"
          subtitle="Operator-approved route decisions recorded by FastAPI"
        />

        {approvedRoutes.length ===
        0 ? (
          <div
            style={{
              padding:
                30,
              textAlign:
                'center',
            }}
          >
            <Route
              size={30}
              style={{
                opacity:
                  0.35,
              }}
            />

            <div
              style={{
                marginTop:
                  8,
              }}
            >
              <strong>
                No approved reroutes yet
              </strong>
            </div>

            <div className="muted">
              Approved Smart Rerouting decisions
              will appear here.
            </div>
          </div>
        ) : (
          <div className="table-list">
            {approvedRoutes.map(
              (
                route,
              ) => (
                <div
                  className="shipment-row"
                  key={`${route.shipment_id}-${route.route_id}`}
                >
                  <div className="shipment-icon">
                    <CheckCircle2
                      size={18}
                    />
                  </div>

                  <div className="grow">
                    <strong>
                      {
                        route.shipment_id
                      }
                    </strong>

                    <span className="tiny-spacer">
                      {
                        route.route_name
                      }
                    </span>

                    <div className="muted">
                      {
                        route.origin
                      }{' '}
                      →
                      {' '}
                      {
                        route.destination
                      }
                    </div>

                    <div className="tiny">
                      Approved by{' '}
                      {
                        route.approved_by
                      }

                      {' · '}

                      {
                        route.approved_at
                      }
                    </div>
                  </div>

                  <div className="align-right">
                    <RiskBadge
                      level={
                        severityValue(
                          route.risk,
                        )
                      }
                    />

                    <div className="tiny">
                      {
                        route.new_eta
                      }
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>


      {/* ======================================================
          LIVE ALERTS
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Current alert intelligence"
          subtitle="Risk-engine and field-report alerts"
        />

        {alerts.length ===
        0 ? (
          <div
            className="muted"
            style={{
              padding:
                20,
              textAlign:
                'center',
            }}
          >
            No current alerts.
          </div>
        ) : (
          <div className="alert-list">
            {alerts
              .slice(
                0,
                8,
              )
              .map(
                (
                  alert,
                ) => (
                  <div
                    className="alert-row"
                    key={
                      alert.id
                    }
                    style={{
                      cursor:
                        'default',
                    }}
                  >
                    <div
                      className={`severity-dot ${alert.severity.toLowerCase()}`}
                    />

                    <div className="grow">
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

                      <div className="tiny">
                        <Clock3
                          size={11}
                        />

                        {' '}

                        {
                          alert.time
                        }
                      </div>
                    </div>

                    <RiskBadge
                      level={
                        severityValue(
                          alert.severity,
                        )
                      }
                    />
                  </div>
                ),
              )}
          </div>
        )}
      </section>


      {/* ======================================================
          DEMO SUMMARY
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="SIH demonstration summary"
          subtitle="Operational chain visible to evaluators"
        />

        <div
          className="flow-strip"
        >
          <div>
            <ShieldAlert />

            <strong>
              Observe
            </strong>

            <span>
              {live.field_incidents}{' '}
              field reports
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <AlertTriangle />

            <strong>
              Assess
            </strong>

            <span>
              {live.high_risk_corridors}{' '}
              high-risk corridors
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <Route />

            <strong>
              Reroute
            </strong>

            <span>
              {
                approvedRoutes.length
              }{' '}
              approved decisions
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <Truck />

            <strong>
              Monitor
            </strong>

            <span>
              {
                live.affected_shipments
              }{' '}
              affected shipments
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}