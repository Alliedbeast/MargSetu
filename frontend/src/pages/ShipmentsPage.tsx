import {
  Boxes,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TriangleAlert,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { RiskBadge } from '../components/Badge';

import { SectionTitle } from '../components/SectionTitle';

import {
  getShipments,
  type ApiShipment,
} from '../api';

/* ============================================================
   TYPES
============================================================ */

type RiskLevel =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';

type Priority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

/* ============================================================
   HELPERS
============================================================ */

function normaliseRisk(
  value: string,
): RiskLevel {
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

function normalisePriority(
  value: string,
): Priority {
  if (
    value === 'Critical' ||
    value === 'High' ||
    value === 'Medium' ||
    value === 'Low'
  ) {
    return value;
  }

  return 'Medium';
}

/* ============================================================
   PAGE
============================================================ */

export function ShipmentsPage() {
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

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    riskFilter,
    setRiskFilter,
  ] = useState<
    'All' | RiskLevel
  >('All');

  const [
    priorityFilter,
    setPriorityFilter,
  ] = useState<
    'All' | Priority
  >('All');

  /* ==========================================================
     LOAD SHIPMENTS
  ========================================================== */

  const loadShipments =
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
            await getShipments();

          setShipments(
            result.items || [],
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load shipments.';

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
     INITIAL LOAD + LIVE ROUTE APPROVAL EVENT
  ========================================================== */

  useEffect(() => {
    void loadShipments();

    const handleRouteApproved =
      () => {
        void loadShipments(
          false,
        );
      };

    window.addEventListener(
      'margSetu:route-approved',
      handleRouteApproved,
    );

    return () => {
      window.removeEventListener(
        'margSetu:route-approved',
        handleRouteApproved,
      );
    };
  }, [
    loadShipments,
  ]);

  /* ==========================================================
     FILTERED DATA
  ========================================================== */

  const filteredShipments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return shipments.filter(
        (shipment) => {
          const matchesSearch =
            !query ||
            shipment.id
              .toLowerCase()
              .includes(query) ||
            shipment.cargo
              .toLowerCase()
              .includes(query) ||
            shipment.origin
              .toLowerCase()
              .includes(query) ||
            shipment.destination
              .toLowerCase()
              .includes(query) ||
            shipment.current_route
              .toLowerCase()
              .includes(query);

          const matchesRisk =
            riskFilter ===
              'All' ||
            normaliseRisk(
              shipment.risk,
            ) ===
              riskFilter;

          const matchesPriority =
            priorityFilter ===
              'All' ||
            normalisePriority(
              shipment.priority,
            ) ===
              priorityFilter;

          return (
            matchesSearch &&
            matchesRisk &&
            matchesPriority
          );
        },
      );
    }, [
      shipments,
      search,
      riskFilter,
      priorityFilter,
    ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const affectedShipments =
    shipments.filter(
      (shipment) =>
        shipment.affected,
    ).length;

  const criticalShipments =
    shipments.filter(
      (shipment) =>
        normalisePriority(
          shipment.priority,
        ) === 'Critical',
    ).length;

  const reroutedShipments =
    shipments.filter(
      (shipment) =>
        shipment.operational_status ===
          'Rerouted' ||
        shipment.status ===
          'Rerouted',
    ).length;

  const highRiskShipments =
    shipments.filter(
      (shipment) => {
        const risk =
          normaliseRisk(
            shipment.risk,
          );

        return (
          risk === 'High' ||
          risk === 'Critical'
        );
      },
    ).length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="page-stack">
      <section className="panel">
        <SectionTitle
          title="Shipment impact propagation"
          subtitle="Road disruption → vehicles → shipments → districts → essential supplies"
          action={
            <div
              className="button-row"
            >
              <button
                className="secondary-button"
                onClick={() =>
                  void loadShipments(
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
            </div>
          }
        />

        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div className="mini-stat">
            <span>
              Active shipments
            </span>

            <strong>
              {shipments.length}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Potentially affected
            </span>

            <strong>
              {affectedShipments}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              High / critical risk
            </span>

            <strong>
              {highRiskShipments}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Critical cargo
            </span>

            <strong>
              {criticalShipments}
            </strong>
          </div>

          <div className="mini-stat">
            <span>
              Rerouted
            </span>

            <strong>
              {reroutedShipments}
            </strong>
          </div>
        </div>

        {/* ======================================================
            IMPACT WATCH
        ====================================================== */}

        <div
          className="impact-callout"
        >
          <TriangleAlert
            size={20}
          />

          <div>
            <strong>
              Impact watch
            </strong>

            <span>
              {affectedShipments}{' '}
              shipments currently have
              active route or corridor
              exposure.
            </span>
          </div>

          <strong className="impact-number">
            {highRiskShipments}
            {' '}high-risk
          </strong>
        </div>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: '1 1 240px',
              minWidth: 200,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform:
                  'translateY(-50%)',
                opacity: 0.55,
              }}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search shipment, cargo, route..."
              style={{
                width: '100%',
                padding:
                  '10px 12px 10px 34px',
                border:
                  '1px solid #e5e7eb',
                borderRadius: 10,
                background:
                  '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Filter
              size={15}
              style={{
                opacity: 0.6,
              }}
            />

            <select
              value={
                riskFilter
              }
              onChange={(event) =>
                setRiskFilter(
                  event.target.value as
                    | 'All'
                    | RiskLevel,
                )
              }
              style={{
                padding:
                  '10px 12px',
                border:
                  '1px solid #e5e7eb',
                borderRadius: 10,
                background:
                  '#ffffff',
              }}
            >
              <option value="All">
                All risks
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

          <select
            value={
              priorityFilter
            }
            onChange={(event) =>
              setPriorityFilter(
                event.target.value as
                  | 'All'
                  | Priority,
              )
            }
            style={{
              padding:
                '10px 12px',
              border:
                '1px solid #e5e7eb',
              borderRadius: 10,
              background:
                '#ffffff',
            }}
          >
            <option value="All">
              All priorities
            </option>

            <option value="Critical">
              Critical
            </option>

            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
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
              Shipment API error
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
                void loadShipments()
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
              padding: 40,
              display: 'flex',
              justifyContent:
                'center',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Loader2
              size={20}
              className="spin"
            />

            <span className="muted">
              Loading live shipments...
            </span>
          </div>
        ) : (
          <div className="data-table">
            {/* TABLE HEADER */}

            <div className="table-head">
              <span>
                Shipment
              </span>

              <span>
                Cargo
              </span>

              <span>
                Corridor
              </span>

              <span>
                Priority
              </span>

              <span>
                ETA
              </span>

              <span>
                Risk
              </span>

              <span>
                Status
              </span>
            </div>

            {/* TABLE BODY */}

            {filteredShipments.length ===
            0 ? (
              <div
                style={{
                  padding: 36,
                  textAlign:
                    'center',
                }}
              >
                <Boxes
                  size={30}
                  style={{
                    opacity: 0.35,
                    marginBottom: 8,
                  }}
                />

                <div>
                  <strong>
                    No shipments found
                  </strong>
                </div>

                <div
                  className="muted"
                  style={{
                    marginTop: 4,
                  }}
                >
                  Try changing the
                  search or filters.
                </div>
              </div>
            ) : (
              filteredShipments.map(
                (shipment) => {
                  const risk =
                    normaliseRisk(
                      shipment.risk,
                    );

                  const priority =
                    normalisePriority(
                      shipment.priority,
                    );

                  const isRerouted =
                    shipment.operational_status ===
                      'Rerouted' ||
                    shipment.status ===
                      'Rerouted';

                  return (
                    <div
                      className="table-row"
                      key={
                        shipment.id
                      }
                    >
                      {/* SHIPMENT */}

                      <strong>
                        {shipment.id}
                      </strong>

                      {/* CARGO */}

                      <span
                        style={{
                          display:
                            'flex',
                          alignItems:
                            'center',
                          gap: 6,
                        }}
                      >
                        <Boxes
                          size={15}
                        />

                        {shipment.cargo}
                      </span>

                      {/* CORRIDOR */}

                      <span>
                        {
                          shipment.origin
                        }{' '}
                        →
                        {' '}
                        {
                          shipment.destination
                        }

                        {isRerouted && (
                          <div
                            className="tiny"
                            style={{
                              marginTop:
                                4,
                            }}
                          >
                            Live route:{' '}
                            {
                              shipment.current_route
                            }
                          </div>
                        )}
                      </span>

                      {/* PRIORITY */}

                      <strong
                        className={`priority-${priority.toLowerCase()}`}
                      >
                        {priority}
                      </strong>

                      {/* ETA */}

                      <span>
                        {
                          shipment.current_eta ||
                          shipment.eta
                        }
                      </span>

                      {/* RISK */}

                      <RiskBadge
                        level={risk}
                      />

                      {/* STATUS */}

                      <span
                        style={{
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          alignItems:
                            'flex-start',
                          gap: 3,
                        }}
                      >
                        <strong>
                          {
                            shipment.status
                          }
                        </strong>

                        <span className="tiny">
                          {
                            shipment.operational_status
                          }
                        </span>
                      </span>
                    </div>
                  );
                },
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}