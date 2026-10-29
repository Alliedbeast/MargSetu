import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  Loader2,
  Navigation,
  Package,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  approveRoute,
  getShipments,
  recommendRoute,
  type ApiRouteOption,
  type ApiShipment,
} from '../api';

import {
  RiskBadge,
} from '../components/Badge';

import {
  SectionTitle,
} from '../components/SectionTitle';


/* ============================================================
   TYPES
============================================================ */

type CargoPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

type RouteRisk =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';


/* ============================================================
   PAGE
============================================================ */

export function RoutesPage() {
  const [
    shipments,
    setShipments,
  ] = useState<ApiShipment[]>(
    [],
  );

  const [
    selectedShipmentId,
    setSelectedShipmentId,
  ] = useState<
    string
  >('');

  const [
    routeOptions,
    setRouteOptions,
  ] = useState<
    ApiRouteOption[]
  >([]);

  const [
    recommendedId,
    setRecommendedId,
  ] = useState<
    string
  >('');

  const [
    selectedRouteId,
    setSelectedRouteId,
  ] = useState<
    string
  >('');

  const [
    loadingShipments,
    setLoadingShipments,
  ] = useState(
    true,
  );

  const [
    loadingRoutes,
    setLoadingRoutes,
  ] = useState(
    false,
  );

  const [
    approving,
    setApproving,
  ] = useState(
    false,
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

  const [
    message,
    setMessage,
  ] = useState(
    '',
  );


  /* ==========================================================
     LOAD SHIPMENTS
  ========================================================== */

  const loadShipments =
    useCallback(
      async (
        showLoader = true,
      ) => {
        if (
          showLoader
        ) {
          setLoadingShipments(
            true,
          );
        } else {
          setRefreshing(
            true,
          );
        }

        setError('');

        try {
          const result =
            await getShipments();

          const items =
            result.items ||
            [];

          setShipments(
            items,
          );

          /*
           * Automatically focus on the most important
           * affected shipment.
           *
           * Priority:
           * 1. Critical priority
           * 2. Critical risk
           * 3. Affected shipment
           * 4. First shipment
           */

          const best =
            [...items].sort(
              (
                a,
                b,
              ) => {
                const score = (
                  shipment: ApiShipment,
                ) => {
                  let value =
                    0;

                  if (
                    shipment.priority ===
                    'Critical'
                  ) {
                    value +=
                      1000;
                  }

                  if (
                    shipment.risk ===
                    'Critical'
                  ) {
                    value +=
                      900;
                  } else if (
                    shipment.risk ===
                    'High'
                  ) {
                    value +=
                      700;
                  }

                  if (
                    shipment.affected
                  ) {
                    value +=
                      500;
                  }

                  value +=
                    shipment.risk_score ||
                    0;

                  return value;
                };

                return (
                  score(b) -
                  score(a)
                );
              },
            )[0];

          if (
            best &&
            !items.some(
              (
                item,
              ) =>
                item.id ===
                selectedShipmentId,
            )
          ) {
            setSelectedShipmentId(
              best.id,
            );
          }
        } catch (
          err
        ) {
          const text =
            err instanceof Error
              ? err.message
              : 'Unable to load shipments.';

          setError(
            text,
          );
        } finally {
          setLoadingShipments(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        selectedShipmentId,
      ],
    );


  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadShipments();
  }, [
    loadShipments,
  ]);


  /* ==========================================================
     LIVE REFRESH
  ========================================================== */

  useEffect(() => {
    const refresh =
      () => {
        void loadShipments(
          false,
        );

        /*
         * Previous route options may be stale
         * after a new incident or reroute.
         */
        setRouteOptions(
          [],
        );

        setSelectedRouteId(
          '',
        );

        setRecommendedId(
          '',
        );
      };

    window.addEventListener(
      'margSetu:incident-created',
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

    window.addEventListener(
      'margSetu:data-updated',
      refresh,
    );

    return () => {
      window.removeEventListener(
        'margSetu:incident-created',
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

      window.removeEventListener(
        'margSetu:data-updated',
        refresh,
      );
    };
  }, [
    loadShipments,
  ]);


  /* ==========================================================
     SELECTED SHIPMENT
  ========================================================== */

  const selectedShipment =
    useMemo(
      () =>
        shipments.find(
          (
            shipment,
          ) =>
            shipment.id ===
            selectedShipmentId,
        ) ||
        shipments[0] ||
        null,
      [
        shipments,
        selectedShipmentId,
      ],
    );


  /* ==========================================================
     KEEP SELECTED ID ALIGNED
  ========================================================== */

  useEffect(() => {
    if (
      selectedShipment &&
      selectedShipment.id !==
        selectedShipmentId
    ) {
      setSelectedShipmentId(
        selectedShipment.id,
      );
    }
  }, [
    selectedShipment,
    selectedShipmentId,
  ]);


  /* ==========================================================
     CONVERT PRIORITY
  ========================================================== */

  function getPriority(
    shipment: ApiShipment,
  ): CargoPriority {
    if (
      shipment.priority ===
        'Critical' ||
      shipment.priority ===
        'High' ||
      shipment.priority ===
        'Medium' ||
      shipment.priority ===
        'Low'
    ) {
      return shipment.priority;
    }

    return 'Medium';
  }


  /* ==========================================================
     GENERATE ROUTES
  ========================================================== */

  async function generateRoutes() {
    if (
      !selectedShipment
    ) {
      setError(
        'Please select a shipment first.',
      );

      return;
    }

    setLoadingRoutes(
      true,
    );

    setError('');
    setMessage('');

    setRouteOptions(
      [],
    );

    setRecommendedId(
      '',
    );

    setSelectedRouteId(
      '',
    );

    try {
      const result =
        await recommendRoute({
          shipment_id:
            selectedShipment.id,

          origin:
            selectedShipment.origin,

          destination:
            selectedShipment.destination,

          cargo_priority:
            getPriority(
              selectedShipment,
            ),
        });

      const options =
        result.options ||
        [];

      setRouteOptions(
        options,
      );

      setRecommendedId(
        result.recommended?.id ||
          options[0]?.id ||
          '',
      );

      setSelectedRouteId(
        result.recommended?.id ||
          options[0]?.id ||
          '',
      );

      setMessage(
        `Generated ${options.length} risk-adjusted route alternatives for ${selectedShipment.id}.`,
      );
    } catch (
      err
    ) {
      const text =
        err instanceof Error
          ? err.message
          : 'Unable to generate route alternatives.';

      setError(
        text,
      );
    } finally {
      setLoadingRoutes(
        false,
      );
    }
  }


  /* ==========================================================
     APPROVE ROUTE
  ========================================================== */

  async function handleApprove() {
    if (
      !selectedShipment
    ) {
      setError(
        'No shipment selected.',
      );

      return;
    }

    const selectedRoute =
      routeOptions.find(
        (
          route,
        ) =>
          route.id ===
          selectedRouteId,
      );

    if (
      !selectedRoute
    ) {
      setError(
        'Select a route before approving.',
      );

      return;
    }

    setApproving(
      true,
    );

    setError('');
    setMessage('');

    try {
      const result =
        await approveRoute({
          shipment_id:
            selectedShipment.id,

          route_id:
            selectedRoute.id,

          route_name:
            selectedRoute.name,

          origin:
            selectedShipment.origin,

          destination:
            selectedShipment.destination,

          old_eta:
            selectedShipment.current_eta ||
            selectedShipment.eta,

          new_eta:
            selectedRoute.eta,

          distance_km:
            selectedRoute.distance_km,

          risk:
            selectedRoute.risk,

          risk_score:
            selectedRoute.risk_score,
        });

      setMessage(
        `Route approved for ${selectedShipment.id}: ${result.route_name}.`,
      );

      window.dispatchEvent(
        new CustomEvent(
          'margSetu:route-approved',
          {
            detail:
              result,
          },
        ),
      );

      /*
       * Re-fetch shipments so the approved
       * route is immediately reflected in
       * this page.
       */

      await loadShipments(
        false,
      );
    } catch (
      err
    ) {
      const text =
        err instanceof Error
          ? err.message
          : 'Unable to approve route.';

      setError(
        text,
      );
    } finally {
      setApproving(
        false,
      );
    }
  }


  /* ==========================================================
     LOADING
  ========================================================== */

  if (
    loadingShipments
  ) {
    return (
      <div className="page-stack">
        <section
          className="panel"
          style={{
            minHeight:
              340,
            display:
              'flex',
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
            Loading operational shipments...
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
            RISK-AWARE ROUTING
          </span>

          <h2>
            Smart Rerouting Decision Engine
          </h2>

          <p>
            Select a shipment, generate alternatives,
            compare risk-adjusted options and approve
            the route that best protects critical cargo.
          </p>
        </div>

        <div className="hero-health">
          <div className="health-ring">
            {
              shipments.filter(
                (
                  shipment,
                ) =>
                  shipment.affected,
              ).length
            }
          </div>

          <div>
            <strong>
              Affected shipments
            </strong>

            <span>
              Live FastAPI state
            </span>
          </div>
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
            Routing API error
          </strong>

          <div
            style={{
              marginTop:
                4,
              fontSize:
                13,
            }}
          >
            {error}
          </div>
        </section>
      )}


      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div className="success-message">
          <CheckCircle2
            size={17}
          />

          {message}
        </div>
      )}


      {/* ======================================================
          SHIPMENT SELECTOR
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Shipment selection"
          subtitle="The most exposed shipment is selected automatically after live data loads."
        />

        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              'minmax(280px, 1fr) auto',
            gap:
              10,
            alignItems:
              'end',
          }}
        >
          <label>
            Shipment

            <select
              value={
                selectedShipment?.id ||
                ''
              }
              onChange={(
                event,
              ) => {
                setSelectedShipmentId(
                  event.target
                    .value,
                );

                setRouteOptions(
                  [],
                );

                setSelectedRouteId(
                  '',
                );

                setRecommendedId(
                  '',
                );

                setMessage(
                  '',
                );
              }}
              style={{
                display:
                  'block',
                width:
                  '100%',
                marginTop:
                  6,
                padding:
                  '11px 12px',
                border:
                  '1px solid #e5e7eb',
                borderRadius:
                  10,
                background:
                  '#ffffff',
              }}
            >
              {shipments.map(
                (
                  shipment,
                ) => (
                  <option
                    key={
                      shipment.id
                    }
                    value={
                      shipment.id
                    }
                  >
                    {
                      shipment.id
                    }{' '}
                    ·{' '}
                    {
                      shipment.cargo
                    }{' '}
                    ·{' '}
                    {
                      shipment.priority
                    }{' '}
                    ·{' '}
                    {
                      shipment.risk
                    }
                  </option>
                ),
              )}
            </select>
          </label>

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
                size={15}
                className="spin"
              />
            ) : (
              <RefreshCw
                size={15}
              />
            )}

            Refresh shipments
          </button>
        </div>

        {selectedShipment && (
          <div
            style={{
              marginTop:
                15,
              display:
                'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap:
                8,
            }}
          >
            <div className="mini-stat">
              <span>
                Priority
              </span>

              <strong>
                {
                  selectedShipment.priority
                }
              </strong>
            </div>

            <div className="mini-stat">
              <span>
                Risk
              </span>

              <strong>
                {
                  selectedShipment.risk
                }
              </strong>
            </div>

            <div className="mini-stat">
              <span>
                Risk score
              </span>

              <strong>
                {
                  selectedShipment.risk_score
                }
              </strong>
            </div>

            <div className="mini-stat">
              <span>
                Current ETA
              </span>

              <strong>
                {
                  selectedShipment.current_eta ||
                  selectedShipment.eta
                }
              </strong>
            </div>

            <div className="mini-stat">
              <span>
                Status
              </span>

              <strong>
                {
                  selectedShipment.status
                }
              </strong>
            </div>
          </div>
        )}
      </section>


      {/* ======================================================
          IMPACT WARNING
      ====================================================== */}

      {selectedShipment &&
        selectedShipment.affected && (
          <section
            className="panel"
            style={{
              border:
                '1px solid #fed7aa',
              background:
                '#fffaf5',
            }}
          >
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'flex-start',
                gap:
                  10,
              }}
            >
              <ShieldAlert
                size={21}
                style={{
                  color:
                    '#ea580c',
                  flexShrink:
                    0,
                }}
              />

              <div>
                <strong>
                  Active shipment impact detected
                </strong>

                <p
                  className="muted"
                  style={{
                    margin:
                      '5px 0 0',
                  }}
                >
                  {
                    selectedShipment.impact_reason
                  }
                </p>
              </div>
            </div>
          </section>
        )}


      {/* ======================================================
          ROUTE GENERATION
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Route alternatives"
          subtitle="FastAPI evaluates route risk, distance and cargo priority together."
          action={
            <button
              className="primary-button"
              onClick={
                generateRoutes
              }
              disabled={
                loadingRoutes ||
                !selectedShipment
              }
            >
              {loadingRoutes ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <GitBranch
                  size={16}
                />
              )}

              Generate alternatives
            </button>
          }
        />

        {routeOptions.length ===
        0 ? (
          <div
            style={{
              minHeight:
                220,
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              textAlign:
                'center',
              padding:
                25,
            }}
          >
            <div>
              <Navigation
                size={36}
                style={{
                  color:
                    '#f97316',
                  marginBottom:
                    8,
                }}
              />

              <h3>
                Ready to calculate
              </h3>

              <p className="muted">
                Generate route alternatives
                for the selected shipment.
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(270px, 1fr))',
              gap:
                12,
            }}
          >
            {routeOptions.map(
              (
                route,
              ) => {
                const recommended =
                  route.id ===
                  recommendedId;

                const selected =
                  route.id ===
                  selectedRouteId;

                return (
                  <button
                    key={
                      route.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedRouteId(
                        route.id,
                      )
                    }
                    style={{
                      position:
                        'relative',
                      textAlign:
                        'left',
                      padding:
                        16,
                      borderRadius:
                        14,
                      border:
                        selected
                          ? '2px solid #f97316'
                          : '1px solid #e5e7eb',
                      background:
                        '#ffffff',
                      cursor:
                        'pointer',
                    }}
                  >
                    {recommended && (
                      <span
                        className="pill"
                        style={{
                          position:
                            'absolute',
                          top:
                            10,
                          right:
                            10,
                        }}
                      >
                        Recommended
                      </span>
                    )}

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap:
                          8,
                        marginBottom:
                          8,
                      }}
                    >
                      <div className="shipment-icon">
                        <RouteIcon />
                      </div>

                      <strong>
                        {
                          route.name
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        gap:
                          8,
                        alignItems:
                          'center',
                        marginBottom:
                          10,
                      }}
                    >
                      <RiskBadge
                        level={
                          route.risk as RouteRisk
                        }
                      />

                      {selected && (
                        <CheckCircle2
                          size={17}
                          style={{
                            color:
                              '#f97316',
                          }}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        display:
                          'grid',
                        gridTemplateColumns:
                          '1fr 1fr 1fr',
                        gap:
                          6,
                      }}
                    >
                      <div className="mini-stat">
                        <span>
                          Distance
                        </span>

                        <strong>
                          {
                            route.distance_km
                          }{' '}
                          km
                        </strong>
                      </div>

                      <div className="mini-stat">
                        <span>
                          ETA
                        </span>

                        <strong>
                          {
                            route.eta
                          }
                        </strong>
                      </div>

                      <div className="mini-stat">
                        <span>
                          Risk
                        </span>

                        <strong>
                          {
                            route.risk_score
                          }
                        </strong>
                      </div>
                    </div>

                    <p
                      className="muted"
                      style={{
                        marginTop:
                          10,
                      }}
                    >
                      {
                        route.reason
                      }
                    </p>

                    <div
                      style={{
                        display:
                          'flex',
                        gap:
                          5,
                        flexWrap:
                          'wrap',
                        marginTop:
                          9,
                      }}
                    >
                      {
                        route.checkpoints.map(
                          (
                            checkpoint,
                          ) => (
                            <span
                              key={
                                checkpoint
                              }
                              className="chip"
                            >
                              {
                                checkpoint
                              }
                            </span>
                          ),
                        )
                      }
                    </div>
                  </button>
                );
              },
            )}
          </div>
        )}
      </section>


      {/* ======================================================
          DECISION
      ====================================================== */}

      {selectedRouteId &&
        selectedShipment && (
          <section className="panel">
            <SectionTitle
              title="Route approval"
              subtitle="Approval is recorded against the authenticated operator."
            />

            {(() => {
              const selectedRoute =
                routeOptions.find(
                  (
                    route,
                  ) =>
                    route.id ===
                    selectedRouteId,
                );

              if (
                !selectedRoute
              ) {
                return null;
              }

              return (
                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap:
                      18,
                    alignItems:
                      'center',
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap:
                        12,
                    }}
                  >
                    <div className="shipment-icon">
                      <ShieldCheck
                        size={22}
                      />
                    </div>

                    <div>
                      <strong>
                        {
                          selectedRoute.name
                        }
                      </strong>

                      <div className="muted">
                        {
                          selectedShipment.origin
                        }{' '}
                        →
                        {' '}
                        {
                          selectedShipment.destination
                        }

                        {' · '}

                        New ETA:{' '}
                        {
                          selectedRoute.eta
                        }
                      </div>
                    </div>
                  </div>

                  <button
                    className="primary-button"
                    onClick={
                      handleApprove
                    }
                    disabled={
                      approving
                    }
                  >
                    {approving ? (
                      <Loader2
                        size={16}
                        className="spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={16}
                      />
                    )}

                    {approving
                      ? 'Approving...'
                      : 'Approve route'}
                  </button>
                </div>
              );
            })()}
          </section>
        )}


      {/* ======================================================
          OPERATIONAL LOOP
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Decision chain"
          subtitle="From live disruption to operator-approved route"
        />

        <div className="flow-strip">
          <div>
            <Package />

            <strong>
              Shipment
            </strong>

            <span>
              Priority + current risk
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <ShieldAlert />

            <strong>
              Risk
            </strong>

            <span>
              Corridor exposure
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <GitBranch />

            <strong>
              Alternatives
            </strong>

            <span>
              Risk-adjusted options
            </span>
          </div>

          <div className="flow-arrow">
            →
          </div>

          <div>
            <CheckCircle2 />

            <strong>
              Approval
            </strong>

            <span>
              Operator decision
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}


/* ============================================================
   SMALL ROUTE ICON
============================================================ */

function RouteIcon() {
  return (
    <GitBranch
      size={18}
    />
  );
}