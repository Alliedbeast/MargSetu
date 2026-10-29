import {
  Bell,
  Check,
  Clock3,
  Filter,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAlerts,
  type ApiAlert,
} from '../api';

import { RiskBadge } from '../components/Badge';
import { SectionTitle } from '../components/SectionTitle';

/* ============================================================
   TYPES
============================================================ */

type AlertFilter =
  | 'All'
  | 'Critical'
  | 'High'
  | 'Moderate'
  | 'Low';

/* ============================================================
   HELPERS
============================================================ */

function normaliseSeverity(
  severity: string,
): 'Critical' | 'High' | 'Moderate' | 'Low' {
  if (
    severity === 'Critical' ||
    severity === 'High' ||
    severity === 'Moderate' ||
    severity === 'Low'
  ) {
    return severity;
  }

  return 'Moderate';
}

function getActionLabel(
  alert: ApiAlert,
): string {
  if (
    alert.action === 'routes'
  ) {
    return 'Open route plan';
  }

  if (
    alert.action === 'alerts'
  ) {
    return 'Review alert';
  }

  return '';
}

/* ============================================================
   PAGE
============================================================ */

export function AlertsPage() {
  const [
    alerts,
    setAlerts,
  ] = useState<ApiAlert[]>([]);

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

  const [
    filter,
    setFilter,
  ] = useState<AlertFilter>(
    'All',
  );

  /* ==========================================================
     LOAD LIVE ALERTS
  ========================================================== */

  const loadAlerts =
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
          const result =
            await getAlerts();

          setAlerts(
            result.items || [],
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load alerts.';

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
     INITIAL LOAD + LIVE REFRESH EVENTS
  ========================================================== */

  useEffect(() => {
    void loadAlerts();

    const refresh =
      () => {
        void loadAlerts(
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
    loadAlerts,
  ]);

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredAlerts =
    useMemo(() => {
      if (
        filter === 'All'
      ) {
        return alerts;
      }

      return alerts.filter(
        (alert) =>
          normaliseSeverity(
            alert.severity,
          ) === filter,
      );
    }, [
      alerts,
      filter,
    ]);

  /* ==========================================================
     SUMMARY COUNTS
  ========================================================== */

  const criticalCount =
    alerts.filter(
      (alert) =>
        normaliseSeverity(
          alert.severity,
        ) === 'Critical',
    ).length;

  const highCount =
    alerts.filter(
      (alert) =>
        normaliseSeverity(
          alert.severity,
        ) === 'High',
    ).length;

  const moderateCount =
    alerts.filter(
      (alert) =>
        normaliseSeverity(
          alert.severity,
        ) === 'Moderate',
    ).length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          title="Operational alert stream"
          subtitle="Live FastAPI risk and field intelligence"
          action={
            <button
              className="secondary-button"
              onClick={() =>
                void loadAlerts(
                  false,
                )
              }
              disabled={
                refreshing
              }
            >
              {refreshing ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <RefreshCw
                  size={16}
                />
              )}

              Refresh
            </button>
          }
        />

        {/* ======================================================
            SUMMARY
        ====================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className="mini-stat">
            <span>
              Live alerts
            </span>

            <strong>
              {alerts.length}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Critical
            </span>

            <strong>
              {criticalCount}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              High
            </span>

            <strong>
              {highCount}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Moderate
            </span>

            <strong>
              {moderateCount}
            </strong>
          </div>
        </div>

        {/* ======================================================
            FILTER
        ====================================================== */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <Filter
            size={16}
            style={{
              opacity: 0.55,
            }}
          />

          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as AlertFilter,
              )
            }
            style={{
              padding:
                '9px 12px',
              border:
                '1px solid #e5e7eb',
              borderRadius: 10,
              background:
                '#ffffff',
            }}
          >
            <option value="All">
              All alerts
            </option>

            <option value="Critical">
              Critical
            </option>

            <option value="High">
              High
            </option>

            <option value="Moderate">
              Moderate
            </option>

            <option value="Low">
              Low
            </option>
          </select>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              border:
                '1px solid #fecaca',
              background:
                '#fef2f2',
              color: '#991b1b',
            }}
          >
            <strong>
              Alert API error
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
                void loadAlerts()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div
            style={{
              minHeight: 220,
              display: 'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              gap: 10,
            }}
          >
            <Loader2
              size={20}
              className="spin"
            />

            <span className="muted">
              Loading live alerts...
            </span>
          </div>
        ) : (
          <div className="alert-stream">
            {filteredAlerts.length ===
            0 ? (
              <div
                style={{
                  padding: 36,
                  textAlign:
                    'center',
                }}
              >
                <Bell
                  size={30}
                  style={{
                    opacity: 0.35,
                    marginBottom: 8,
                  }}
                />

                <div>
                  <strong>
                    No alerts found
                  </strong>
                </div>

                <div
                  className="muted"
                  style={{
                    marginTop: 4,
                  }}
                >
                  No alerts match the
                  selected filter.
                </div>
              </div>
            ) : (
              filteredAlerts.map(
                (alert) => {
                  const severity =
                    normaliseSeverity(
                      alert.severity,
                    );

                  const actionLabel =
                    getActionLabel(
                      alert,
                    );

                  return (
                    <article
                      className={`stream-card ${severity.toLowerCase()}`}
                      key={
                        alert.id
                      }
                    >
                      <div className="stream-icon">
                        <Bell
                          size={19}
                        />
                      </div>

                      <div className="grow">
                        <div className="stream-heading">
                          <strong>
                            {alert.title}
                          </strong>

                          <RiskBadge
                            level={
                              severity
                            }
                          />
                        </div>

                        <p>
                          {
                            alert.detail
                          }
                        </p>

                        <div className="stream-meta">
                          <Clock3
                            size={13}
                          />

                          {
                            alert.time
                          }

                          <span
                            style={{
                              marginLeft: 8,
                            }}
                          >
                            •{' '}
                            {alert.source}
                          </span>
                        </div>
                      </div>

                      <div className="stream-actions">
                        {actionLabel && (
                          <button
                            className="secondary-button"
                            onClick={() => {
                              if (
                                alert.action ===
                                'routes'
                              ) {
                                window.dispatchEvent(
                                  new CustomEvent(
                                    'margSetu:navigate',
                                    {
                                      detail: {
                                        page: 'routes',
                                      },
                                    },
                                  ),
                                );
                              }
                            }}
                          >
                            {actionLabel}
                          </button>
                        )}

                        <button
                          className="icon-button"
                          title="Mark reviewed"
                          onClick={() => {
                            window.dispatchEvent(
                              new CustomEvent(
                                'margSetu:alert-reviewed',
                                {
                                  detail: {
                                    alertId:
                                      alert.id,
                                  },
                                },
                              ),
                            );
                          }}
                        >
                          <Check
                            size={17}
                          />
                        </button>
                      </div>
                    </article>
                  );
                },
              )
            )}
          </div>
        )}
      </section>

      {/* ======================================================
          POLICY PANEL
      ====================================================== */}

      <section className="panel alert-policy">
        <div>
          <ShieldAlert
            size={24}
          />

          <strong>
            Priority model
          </strong>

          <p>
            Critical medical cargo and
            emergency corridors receive
            stronger risk penalties and
            faster operator escalation.
          </p>
        </div>

        <div className="priority-bars">
          <span>
            <i className="red" />
            Critical · immediate
          </span>

          <span>
            <i className="orange" />
            High · action required
          </span>

          <span>
            <i className="yellow" />
            Moderate · monitor
          </span>

          <span>
            <i className="green" />
            Low · informational
          </span>
        </div>
      </section>
    </div>
  );
}