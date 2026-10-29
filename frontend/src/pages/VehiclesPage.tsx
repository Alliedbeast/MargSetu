import {
  Gauge,
  Loader2,
  MapPinned,
  Radio,
  RefreshCw,
  Truck,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getVehicles,
  type ApiVehicle,
} from '../api';

import { SectionTitle } from '../components/SectionTitle';

/* ============================================================
   HELPERS
============================================================ */

function normaliseStatus(
  status: string,
) {
  const value =
    status.trim().toLowerCase();

  if (
    value === 'moving'
  ) {
    return 'Moving';
  }

  if (
    value === 'warning'
  ) {
    return 'Warning';
  }

  if (
    value === 'delayed'
  ) {
    return 'Delayed';
  }

  if (
    value === 'offline'
  ) {
    return 'Offline';
  }

  if (
    value === 'idle'
  ) {
    return 'Idle';
  }

  return status || 'Unknown';
}

/* ============================================================
   PAGE
============================================================ */

export function VehiclesPage() {
  const [
    vehicles,
    setVehicles,
  ] = useState<ApiVehicle[]>([]);

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
     LOAD VEHICLES
  ========================================================== */

  const loadVehicles =
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
            await getVehicles();

          setVehicles(
            result.items || [],
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load vehicle fleet.';

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
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadVehicles();

    const refresh =
      () => {
        void loadVehicles(
          false,
        );
      };

    window.addEventListener(
      'margSetu:route-approved',
      refresh,
    );

    window.addEventListener(
      'margSetu:incident-created',
      refresh,
    );

    window.addEventListener(
      'margSetu:incident-updated',
      refresh,
    );

    return () => {
      window.removeEventListener(
        'margSetu:route-approved',
        refresh,
      );

      window.removeEventListener(
        'margSetu:incident-created',
        refresh,
      );

      window.removeEventListener(
        'margSetu:incident-updated',
        refresh,
      );
    };
  }, [
    loadVehicles,
  ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const movingCount =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            normaliseStatus(
              vehicle.status,
            ) === 'Moving',
        ).length,
      [vehicles],
    );

  const warningCount =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            normaliseStatus(
              vehicle.status,
            ) === 'Warning',
        ).length,
      [vehicles],
    );

  const delayedCount =
    useMemo(
      () =>
        vehicles.filter(
          (vehicle) =>
            normaliseStatus(
              vehicle.status,
            ) === 'Delayed',
        ).length,
      [vehicles],
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="page-stack">
      {/* ======================================================
          KPI
      ====================================================== */}

      <div className="kpi-grid small-kpis">
        <div className="kpi-card">
          <div className="kpi-icon teal">
            <Truck />
          </div>

          <div>
            <div className="kpi-label">
              Fleet active
            </div>

            <div className="kpi-value">
              {vehicles.length}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green">
            <Radio />
          </div>

          <div>
            <div className="kpi-label">
              Moving
            </div>

            <div className="kpi-value">
              {movingCount}
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon yellow">
            <Gauge />
          </div>

          <div>
            <div className="kpi-label">
              Requiring attention
            </div>

            <div className="kpi-value">
              {warningCount +
                delayedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FLEET
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Live vehicle fleet"
          subtitle="FastAPI fleet status and route context"
          action={
            <button
              className="secondary-button"
              onClick={() =>
                void loadVehicles(
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

        {/* ====================================================
            ERROR
        ==================================================== */}

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
              Vehicle API error
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
                void loadVehicles()
              }
            >
              Retry
            </button>
          </div>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

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
              Loading live vehicle fleet...
            </span>
          </div>
        ) : (
          <div className="vehicle-grid">
            {vehicles.map(
              (vehicle) => {
                const status =
                  normaliseStatus(
                    vehicle.status,
                  );

                const attentionRequired =
                  status ===
                    'Warning' ||
                  status ===
                    'Delayed';

                return (
                  <article
                    className="vehicle-card"
                    key={
                      vehicle.id
                    }
                  >
                    {/* =========================================
                        HEADER
                    ========================================= */}

                    <div className="vehicle-top">
                      <div className="vehicle-icon">
                        <Truck
                          size={20}
                        />
                      </div>

                      <div>
                        <strong>
                          {vehicle.id}
                        </strong>

                        <span>
                          {
                            vehicle.driver
                          }
                        </span>
                      </div>

                      <span
                        className={`status-pill ${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* =========================================
                        ROUTE
                    ========================================= */}

                    <div className="vehicle-route">
                      <MapPinned
                        size={15}
                      />

                      <span>
                        {
                          vehicle.origin
                        }

                        {' → '}

                        {
                          vehicle.destination
                        }
                      </span>
                    </div>

                    {/* =========================================
                        STATUS MESSAGE
                    ========================================= */}

                    {attentionRequired && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: 9,
                          borderRadius: 9,
                          background:
                            '#fff7ed',
                          border:
                            '1px solid #fed7aa',
                          fontSize: 12,
                        }}
                      >
                        <strong>
                          Operational attention
                        </strong>

                        <div className="muted">
                          Vehicle status is{' '}
                          {
                            status.toLowerCase()
                          }{' '}
                          and should be monitored.
                        </div>
                      </div>
                    )}

                    {/* =========================================
                        FOOTER
                    ========================================= */}

                    <div className="vehicle-bottom">
                      <span>
                        Fleet telemetry
                      </span>

                      <strong>
                        ETA{' '}
                        {vehicle.eta ||
                          '--'}
                      </strong>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}