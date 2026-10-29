import {
  Activity,
  AlertTriangle,
  CloudRain,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  calculateRisk,
  createIncident,
  getRiskCorridors,
  type RiskScorePayload,
  type RiskScoreResponse,
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

type RiskCorridor = {
  id: string;

  name: string;

  route: string;

  risk: string;

  score: number;

  probability: number;

  incident_count: number;
};


/* ============================================================
   DEFAULT SIMULATOR
============================================================ */

const DEFAULT_FACTORS: RiskScorePayload = {
  rainfall: 65,

  landslide: 70,

  flood: 35,

  historical: 65,

  field_reports: 40,

  traffic: 25,
};


/* ============================================================
   SIH DEMO FACTORS
============================================================ */

const DEMO_FACTORS: RiskScorePayload = {
  rainfall: 94,

  landslide: 90,

  flood: 78,

  historical: 76,

  field_reports: 70,

  traffic: 42,
};


/* ============================================================
   HELPERS
============================================================ */

function toRiskLevel(
  value: string,
):
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical' {
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


/* ============================================================
   PAGE
============================================================ */

export function RiskPage() {
  const [
    corridors,
    setCorridors,
  ] = useState<
    RiskCorridor[]
  >([]);

  const [
    factors,
    setFactors,
  ] = useState<RiskScorePayload>(
    DEFAULT_FACTORS,
  );

  const [
    simulation,
    setSimulation,
  ] = useState<
    RiskScoreResponse | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    calculating,
    setCalculating,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    demoRunning,
    setDemoRunning,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');


  /* ==========================================================
     LOAD LIVE CORRIDOR RISK
  ========================================================== */

  const loadCorridors =
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

        setError('');

        try {
          const result =
            await getRiskCorridors();

          setCorridors(
            result.items ||
              [],
          );
        } catch (
          err
        ) {
          const text =
            err instanceof Error
              ? err.message
              : 'Unable to load corridor risk.';

          setError(
            text,
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
    void loadCorridors();

    const refresh =
      () => {
        void loadCorridors(
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
    };
  }, [
    loadCorridors,
  ]);


  /* ==========================================================
     UPDATE FACTOR
  ========================================================== */

  function updateFactor(
    key: keyof RiskScorePayload,
    value: number,
  ) {
    setFactors(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );

    setSimulation(
      null,
    );
  }


  /* ==========================================================
     RUN RISK SIMULATION
  ========================================================== */

  async function runSimulation() {
    setCalculating(
      true,
    );

    setError('');
    setMessage('');

    try {
      const result =
        await calculateRisk(
          factors,
        );

      setSimulation(
        result,
      );

      setMessage(
        'Risk assessment calculated by the FastAPI risk engine.',
      );
    } catch (
      err
    ) {
      const text =
        err instanceof Error
          ? err.message
          : 'Unable to calculate risk.';

      setError(
        text,
      );
    } finally {
      setCalculating(
        false,
      );
    }
  }


  /* ==========================================================
     ONE-CLICK SIH DEMO
  ========================================================== */

  async function runSihDemo() {
    if (
      demoRunning
    ) {
      return;
    }

    setDemoRunning(
      true,
    );

    setError('');
    setMessage('');

    try {
      /*
       * --------------------------------------------------------
       * EVENT 1
       *
       * Heavy rainfall near the Aizawl/Lunglei corridor.
       * --------------------------------------------------------
       */

      await createIncident({
        incident_type:
          'Heavy Rainfall',

        severity:
          'High',

        description:
          'SIMULATED SIH DEMO: Heavy rainfall is increasing road accessibility risk across the monitored corridor.',

        location:
          'Aizawl–Lunglei corridor',

        lat:
          23.7271,

        lng:
          92.7176,

        accuracy:
          25,

        reported_by:
          'SIH Demo Simulator',

        device_id:
          'DEMO-SCENARIO-01',

        photo_name:
          null,

        ai_classification:
          'Heavy Rainfall',

        ai_confidence:
          0.99,

        sync_status:
          'synced',
      });


      /*
       * --------------------------------------------------------
       * EVENT 2
       *
       * Landslide near the Guwahati/Tawang corridor.
       * This creates a strong visible rerouting story.
       * --------------------------------------------------------
       */

      await createIncident({
        incident_type:
          'Landslide / Debris',

        severity:
          'Critical',

        description:
          'SIMULATED SIH DEMO: Landslide debris has blocked one lane near the Sela approach and requires route reassessment.',

        location:
          'Sela approach / Tawang corridor',

        lat:
          27.4170,

        lng:
          92.6200,

        accuracy:
          25,

        reported_by:
          'SIH Demo Simulator',

        device_id:
          'DEMO-SCENARIO-01',

        photo_name:
          null,

        ai_classification:
          'Landslide / Debris',

        ai_confidence:
          0.99,

        sync_status:
          'synced',
      });


      /*
       * --------------------------------------------------------
       * UPDATE THE CLIENT-SIDE RISK SIMULATOR
       * --------------------------------------------------------
       */

      setFactors(
        DEMO_FACTORS,
      );

      const result =
        await calculateRisk(
          DEMO_FACTORS,
        );

      setSimulation(
        result,
      );


      /*
       * --------------------------------------------------------
       * TELL EVERY LIVE PAGE TO REFRESH
       * --------------------------------------------------------
       */

      window.dispatchEvent(
        new CustomEvent(
          'margSetu:incident-created',
        ),
      );

      window.dispatchEvent(
        new CustomEvent(
          'margSetu:data-updated',
        ),
      );


      await loadCorridors(
        false,
      );


      setMessage(
        'SIH demo scenario activated: simulated heavy rainfall + critical landslide. Dashboard, Alerts, Shipments and GIS will update automatically.',
      );
    } catch (
      err
    ) {
      const text =
        err instanceof Error
          ? err.message
          : 'Unable to start the SIH demo scenario.';

      setError(
        text,
      );
    } finally {
      setDemoRunning(
        false,
      );
    }
  }


  /* ==========================================================
     SCENARIO PRESETS
  ========================================================== */

  function applyHeavyRainScenario() {
    setFactors({
      rainfall: 92,
      landslide: 86,
      flood: 78,
      historical: 72,
      field_reports: 55,
      traffic: 38,
    });

    setSimulation(
      null,
    );

    setMessage(
      'Heavy-rain scenario loaded. Run assessment to calculate the updated risk.',
    );
  }


  function applyClearScenario() {
    setFactors({
      rainfall: 18,
      landslide: 15,
      flood: 12,
      historical: 40,
      field_reports: 8,
      traffic: 20,
    });

    setSimulation(
      null,
    );

    setMessage(
      'Lower-disruption scenario loaded.',
    );
  }


  function resetScenario() {
    setFactors(
      DEFAULT_FACTORS,
    );

    setSimulation(
      null,
    );

    setMessage(
      'Simulator reset. Existing submitted incidents remain in the backend because they are operational records.',
    );
  }


  /* ==========================================================
     AGGREGATES
  ========================================================== */

  const criticalCount =
    useMemo(
      () =>
        corridors.filter(
          (
            corridor,
          ) =>
            corridor.risk ===
            'Critical',
        ).length,
      [
        corridors,
      ],
    );

  const highCount =
    useMemo(
      () =>
        corridors.filter(
          (
            corridor,
          ) =>
            corridor.risk ===
            'High',
        ).length,
      [
        corridors,
      ],
    );


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
            Loading live risk intelligence...
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
          HERO
      ====================================================== */}

      <section className="hero-strip">
        <div>
          <span className="pill">
            PREDICTIVE RISK ENGINE
          </span>

          <h2>
            Road accessibility risk intelligence
          </h2>

          <p>
            Combine rainfall, landslide,
            flooding, historical exposure,
            field reports and traffic signals
            to estimate disruption risk.
          </p>
        </div>

        <div className="hero-health">
          <div className="health-ring">
            {
              corridors.length
            }
          </div>

          <div>
            <strong>
              Monitored corridors
            </strong>

            <span>
              {criticalCount} critical ·{' '}
              {highCount} high
            </span>
          </div>
        </div>
      </section>


      {/* ======================================================
          SIH DEMO CONTROL
      ====================================================== */}

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
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: 16,
            flexWrap:
              'wrap',
          }}
        >
          <div>
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap: 8,
              }}
            >
              <ShieldAlert
                size={20}
                style={{
                  color:
                    '#ea580c',
                }}
              />

              <strong>
                SIH demonstration scenario
              </strong>

              <span
                className="pill"
              >
                DEMO / SIMULATED
              </span>
            </div>

            <p
              className="muted"
              style={{
                margin:
                  '6px 0 0',
              }}
            >
              Creates a controlled heavy-rainfall event
              and a critical landslide event so the complete
              Marg Setu decision chain can be demonstrated.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={
              runSihDemo
            }
            disabled={
              demoRunning
            }
          >
            {demoRunning ? (
              <Loader2
                size={16}
                className="spin"
              />
            ) : (
              <CloudRain
                size={16}
              />
            )}

            {demoRunning
              ? 'Running scenario...'
              : 'Run SIH demo scenario'}
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
            Risk API error
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

          <button
            className="secondary-button"
            style={{
              marginTop:
                10,
            }}
            onClick={() =>
              void loadCorridors()
            }
          >
            Retry
          </button>
        </section>
      )}


      {/* ======================================================
          LIVE CORRIDORS
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Live corridor risk"
          subtitle="Calculated from the current FastAPI incident and risk state."
          action={
            <button
              className="secondary-button"
              onClick={() =>
                void loadCorridors(
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
          }
        />

        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(230px, 1fr))',
            gap:
              12,
          }}
        >
          {corridors.map(
            (
              corridor,
            ) => (
              <article
                key={
                  corridor.id
                }
                className="panel"
                style={{
                  margin:
                    0,
                  padding:
                    15,
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    gap:
                      8,
                    alignItems:
                      'center',
                  }}
                >
                  <strong>
                    {
                      corridor.name
                    }
                  </strong>

                  <RiskBadge
                    level={toRiskLevel(
                      corridor.risk,
                    )}
                  />
                </div>

                <div
                  className="muted"
                  style={{
                    marginTop:
                      6,
                  }}
                >
                  {
                    corridor.route
                  }
                </div>

                <div
                  style={{
                    marginTop:
                      15,
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      marginBottom:
                        5,
                    }}
                  >
                    <span className="tiny">
                      Accessibility
                    </span>

                    <strong>
                      {
                        corridor.score
                      }
                      /100
                    </strong>
                  </div>

                  <div
                    style={{
                      height:
                        8,
                      background:
                        '#e5e7eb',
                      borderRadius:
                        999,
                      overflow:
                        'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(
                            100,
                            corridor.score,
                          ),
                        )}%`,
                        height:
                          '100%',
                        background:
                          corridor.risk ===
                          'Critical'
                            ? '#dc2626'
                            : corridor.risk ===
                                'High'
                              ? '#f97316'
                              : corridor.risk ===
                                  'Moderate'
                                ? '#eab308'
                                : '#22c55e',
                        borderRadius:
                          999,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap:
                      8,
                    marginTop:
                      14,
                  }}
                >
                  <div className="mini-stat">
                    <span>
                      Disruption
                    </span>

                    <strong>
                      {
                        corridor.probability
                      }%
                    </strong>
                  </div>

                  <div className="mini-stat">
                    <span>
                      Incidents
                    </span>

                    <strong>
                      {
                        corridor.incident_count
                      }
                    </strong>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      </section>


      {/* ======================================================
          SIMULATOR
      ====================================================== */}

      <section className="panel">
        <SectionTitle
          title="Risk scenario simulator"
          subtitle="Test how different hazard signals affect the prototype risk model."
        />

        <div
          style={{
            display:
              'flex',
            gap:
              8,
            flexWrap:
              'wrap',
            marginBottom:
              18,
          }}
        >
          <button
            className="secondary-button"
            onClick={
              applyHeavyRainScenario
            }
          >
            <CloudRain
              size={15}
            />

            Heavy rainfall scenario
          </button>

          <button
            className="secondary-button"
            onClick={
              applyClearScenario
            }
          >
            <TrendingDown
              size={15}
            />

            Lower-risk scenario
          </button>

          <button
            className="secondary-button"
            onClick={
              resetScenario
            }
          >
            Reset
          </button>
        </div>


        <div className="dashboard-grid two-grid">
          {/* ==================================================
              CONTROLS
          ================================================== */}

          <div>
            <div
              style={{
                display:
                  'flex',
                alignItems:
                  'center',
                gap:
                  8,
                marginBottom:
                  12,
              }}
            >
              <SlidersHorizontal
                size={18}
              />

              <strong>
                Risk factors
              </strong>
            </div>

            <RiskSlider
              label="Rainfall"
              value={
                factors.rainfall
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'rainfall',
                  value,
                )
              }
            />

            <RiskSlider
              label="Landslide"
              value={
                factors.landslide
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'landslide',
                  value,
                )
              }
            />

            <RiskSlider
              label="Flooding"
              value={
                factors.flood
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'flood',
                  value,
                )
              }
            />

            <RiskSlider
              label="Historical exposure"
              value={
                factors.historical
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'historical',
                  value,
                )
              }
            />

            <RiskSlider
              label="Field reports"
              value={
                factors.field_reports
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'field_reports',
                  value,
                )
              }
            />

            <RiskSlider
              label="Traffic"
              value={
                factors.traffic
              }
              onChange={(
                value,
              ) =>
                updateFactor(
                  'traffic',
                  value,
                )
              }
            />

            <button
              className="primary-button full"
              style={{
                marginTop:
                  12,
              }}
              onClick={
                runSimulation
              }
              disabled={
                calculating
              }
            >
              {calculating ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Activity
                  size={16}
                />
              )}

              Calculate risk
            </button>
          </div>


          {/* ==================================================
              RESULT
          ================================================== */}

          <div
            style={{
              minHeight:
                320,
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
              padding:
                20,
              borderRadius:
                14,
              background:
                '#fff7ed',
              border:
                '1px solid #fed7aa',
            }}
          >
            {!simulation ? (
              <div
                style={{
                  textAlign:
                    'center',
                  maxWidth:
                    330,
                }}
              >
                <ShieldAlert
                  size={42}
                  style={{
                    color:
                      '#f97316',
                  }}
                />

                <h3>
                  Ready for assessment
                </h3>

                <p className="muted">
                  Adjust the hazard signals
                  and run the FastAPI risk
                  engine.
                </p>
              </div>
            ) : (
              <div
                style={{
                  width:
                    '100%',
                  textAlign:
                    'center',
                }}
              >
                <div className="tiny">
                  FASTAPI RISK ENGINE RESULT
                </div>

                <div
                  style={{
                    fontSize:
                      52,
                    fontWeight:
                      800,
                    marginTop:
                      8,
                  }}
                >
                  {
                    simulation.disruption_score
                  }
                </div>

                <div
                  style={{
                    fontSize:
                      13,
                    color:
                      '#6b7280',
                  }}
                >
                  disruption score
                </div>

                <div
                  style={{
                    marginTop:
                      12,
                  }}
                >
                  <RiskBadge
                    level={
                      simulation.risk
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop:
                      18,
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap:
                      8,
                  }}
                >
                  <div className="mini-stat">
                    <span>
                      Accessibility
                    </span>

                    <strong>
                      {
                        simulation.accessibility_score
                      }
                    </strong>
                  </div>

                  <div className="mini-stat">
                    <span>
                      Disruption
                    </span>

                    <strong>
                      {
                        simulation.disruption_score
                      }
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop:
                      16,
                    textAlign:
                      'left',
                    padding:
                      12,
                    borderRadius:
                      10,
                    background:
                      '#ffffff',
                  }}
                >
                  <strong>
                    Model explanation
                  </strong>

                  <p
                    className="muted"
                    style={{
                      marginTop:
                        5,
                    }}
                  >
                    {
                      simulation.explanation
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div
            className="success-message"
            style={{
              marginTop:
                14,
            }}
          >
            <TrendingUp
              size={17}
            />

            {message}
          </div>
        )}
      </section>
    </div>
  );
}


/* ============================================================
   SLIDER
============================================================ */

function RiskSlider({
  label,
  value,
  onChange,
}: {
  label: string;

  value: number;

  onChange: (
    value: number,
  ) => void;
}) {
  return (
    <div
      style={{
        marginTop:
          13,
      }}
    >
      <div
        style={{
          display:
            'flex',
          justifyContent:
            'space-between',
          marginBottom:
            6,
        }}
      >
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            Number(
              event.target
                .value,
            ),
          )
        }
        style={{
          width:
            '100%',
        }}
      />
    </div>
  );
}