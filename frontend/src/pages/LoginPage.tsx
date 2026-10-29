import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Map,
  ShieldCheck,
  UserRound,
  Wifi,
} from 'lucide-react';

import {
  useState,
  type FormEvent,
} from 'react';

import {
  login,
} from '../api';


/* ============================================================
   TYPES
============================================================ */

type LoginUser = {
  username: string;

  displayName: string;

  role: string;
};

type LoginPageProps = {
  onLogin: (
    user: LoginUser,
    token: string,
  ) => void;
};


/* ============================================================
   LOGIN PAGE
============================================================ */

export function LoginPage({
  onLogin,
}: LoginPageProps) {
  const [
    username,
    setUsername,
  ] = useState(
    'admin',
  );

  const [
    password,
    setPassword,
  ] = useState(
    'admin123',
  );

  const [
    loading,
    setLoading,
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
     SUBMIT
  ========================================================== */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    setLoading(
      true,
    );

    try {
      const result =
        await login(
          username.trim(),
          password,
        );

      /*
       * Store token BEFORE notifying App.tsx.
       */
      localStorage.setItem(
        'margSetuToken',
        result.access_token,
      );

      localStorage.setItem(
        'margSetuUser',
        JSON.stringify(
          result.user,
        ),
      );

      onLogin(
        result.user,
        result.access_token,
      );
    } catch (
      err
    ) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to sign in.';

      if (
        message ===
        'Invalid username or password'
      ) {
        setError(
          'Invalid username or password.',
        );
      } else {
        setError(
          'Unable to connect to the Marg Setu authentication service.',
        );
      }
    } finally {
      setLoading(
        false,
      );
    }
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      style={{
        minHeight:
          '100vh',

        display:
          'grid',

        gridTemplateColumns:
          'minmax(0, 1.15fr) minmax(390px, 0.85fr)',

        background:
          '#f7f9fc',
      }}
    >
      {/* ======================================================
          LEFT PRESENTATION PANEL
      ====================================================== */}

      <section
        style={{
          position:
            'relative',

          overflow:
            'hidden',

          display:
            'flex',

          flexDirection:
            'column',

          justifyContent:
            'space-between',

          padding:
            '42px 52px',

          background:
            'linear-gradient(145deg, #111827 0%, #172033 58%, #22150d 100%)',

          color:
            '#ffffff',
        }}
      >
        {/* Decorative shapes */}

        <div
          style={{
            position:
              'absolute',

            width:
              420,

            height:
              420,

            right:
              -170,

            top:
              -160,

            border:
              '70px solid rgba(249,115,22,0.10)',

            borderRadius:
              '50%',
          }}
        />

        <div
          style={{
            position:
              'absolute',

            width:
              300,

            height:
              300,

            left:
              -150,

            bottom:
              -120,

            border:
              '45px solid rgba(249,115,22,0.07)',

            borderRadius:
              '50%',
          }}
        />

        {/* Brand */}

        <div
          style={{
            position:
              'relative',

            zIndex:
              1,

            display:
              'flex',

            alignItems:
              'center',

            gap:
              12,
          }}
        >
          <div
            style={{
              width:
                48,

              height:
                48,

              display:
                'grid',

              placeItems:
                'center',

              borderRadius:
                14,

              background:
                'linear-gradient(135deg, #fb923c, #ea580c)',

              fontSize:
                21,

              fontWeight:
                800,

              boxShadow:
                '0 12px 28px rgba(249,115,22,0.25)',
            }}
          >
            M
          </div>

          <div>
            <div
              style={{
                fontSize:
                  20,

                fontWeight:
                  800,

                letterSpacing:
                  '-0.03em',
              }}
            >
              Marg Setu
            </div>

            <div
              style={{
                marginTop:
                  2,

                color:
                  'rgba(255,255,255,0.55)',

                fontSize:
                  10,

                letterSpacing:
                  '0.05em',
              }}
            >
              SIH26002 · NER LOGISTICS INTELLIGENCE
            </div>
          </div>
        </div>

        {/* Main message */}

        <div
          style={{
            position:
              'relative',

            zIndex:
              1,

            maxWidth:
              670,
          }}
        >
          <div
            style={{
              display:
                'inline-flex',

              alignItems:
                'center',

              gap:
                6,

              padding:
                '6px 10px',

              border:
                '1px solid rgba(249,115,22,0.3)',

              borderRadius:
                999,

              background:
                'rgba(249,115,22,0.10)',

              color:
                '#fdba74',

              fontSize:
                9,

              fontWeight:
                800,

              letterSpacing:
                '0.08em',
            }}
          >
            <ShieldCheck
              size={13}
            />

            SECURE LOGISTICS COMMAND
          </div>

          <h1
            style={{
              margin:
                '18px 0 12px',

              maxWidth:
                650,

              fontSize:
                'clamp(34px, 5vw, 58px)',

              lineHeight:
                1.02,

              letterSpacing:
                '-0.05em',
            }}
          >
            Predict disruption.
            <br />
            Protect deliveries.
            <br />
            <span
              style={{
                color:
                  '#fb923c',
              }}
            >
              Move safer.
            </span>
          </h1>

          <p
            style={{
              maxWidth:
                600,

              margin:
                0,

              color:
                'rgba(255,255,255,0.67)',

              fontSize:
                14,

              lineHeight:
                1.8,
            }}
          >
            Marg Setu combines field intelligence,
            accessibility risk, logistics impact,
            smart rerouting and live operational
            monitoring into one command platform for
            the North Eastern Region.
          </p>

          {/* Intelligence loop */}

          <div
            style={{
              display:
                'grid',

              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',

              gap:
                8,

              marginTop:
                30,
            }}
          >
            {[
              {
                icon:
                  <Map
                    size={15}
                  />,
                title:
                  'Observe',
                text:
                  'GIS + field data',
              },

              {
                icon:
                  <ShieldCheck
                    size={15}
                  />,
                title:
                  'Predict',
                text:
                  'Risk intelligence',
              },

              {
                icon:
                  <ArrowRight
                    size={15}
                  />,
                title:
                  'Decide',
                text:
                  'Safer alternatives',
              },

              {
                icon:
                  <CheckCircle2
                    size={15}
                  />,
                title:
                  'Track',
                text:
                  'Live logistics',
              },
            ].map(
              (
                item,
              ) => (
                <div
                  key={
                    item.title
                  }
                  style={{
                    padding:
                      12,

                    border:
                      '1px solid rgba(255,255,255,0.08)',

                    borderRadius:
                      12,

                    background:
                      'rgba(255,255,255,0.045)',
                  }}
                >
                  <div
                    style={{
                      color:
                        '#fb923c',
                    }}
                  >
                    {
                      item.icon
                    }
                  </div>

                  <strong
                    style={{
                      display:
                        'block',

                      marginTop:
                        8,

                      fontSize:
                        10,
                    }}
                  >
                    {
                      item.title
                    }
                  </strong>

                  <span
                    style={{
                      display:
                        'block',

                      marginTop:
                        3,

                      color:
                        'rgba(255,255,255,0.44)',

                      fontSize:
                        8,
                    }}
                  >
                    {
                      item.text
                    }
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Footer */}

        <div
          style={{
            position:
              'relative',

            zIndex:
              1,

            display:
              'flex',

            alignItems:
              'center',

            gap:
              7,

            color:
              'rgba(255,255,255,0.42)',

            fontSize:
              9,
          }}
        >
          <Wifi
            size={13}
          />

          Protected operational environment ·
          Demo authentication enabled
        </div>
      </section>


      {/* ======================================================
          LOGIN PANEL
      ====================================================== */}

      <section
        style={{
          display:
            'flex',

          alignItems:
            'center',

          justifyContent:
            'center',

          padding:
            30,

          background:
            '#ffffff',
        }}
      >
        <div
          style={{
            width:
              '100%',

            maxWidth:
              430,
          }}
        >
          {/* Header */}

          <div
            style={{
              marginBottom:
                28,
            }}
          >
            <div
              style={{
                width:
                  45,

                height:
                  45,

                display:
                  'grid',

                placeItems:
                  'center',

                borderRadius:
                  13,

                background:
                  '#fff7ed',

                color:
                  '#ea580c',

                marginBottom:
                  15,
              }}
            >
              <LockKeyhole
                size={21}
              />
            </div>

            <div
              style={{
                color:
                  '#ea580c',

                fontSize:
                  10,

                fontWeight:
                  800,

                letterSpacing:
                  '0.1em',

                textTransform:
                  'uppercase',
              }}
            >
              Secure access
            </div>

            <h2
              style={{
                margin:
                  '6px 0 7px',

                color:
                  '#172033',

                fontSize:
                  29,

                lineHeight:
                  1.1,

                letterSpacing:
                  '-0.035em',
              }}
            >
              Welcome to Marg Setu
            </h2>

            <p
              style={{
                margin:
                  0,

                color:
                  '#6b7280',

                fontSize:
                  12,

                lineHeight:
                  1.6,
              }}
            >
              Sign in to access the logistics
              intelligence command center.
            </p>
          </div>


          {/* Error */}

          {error && (
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'flex-start',

                gap:
                  8,

                padding:
                  '10px 12px',

                marginBottom:
                  14,

                border:
                  '1px solid #fecaca',

                borderRadius:
                  10,

                background:
                  '#fef2f2',

                color:
                  '#991b1b',

                fontSize:
                  11,

                lineHeight:
                  1.5,
              }}
            >
              <ShieldCheck
                size={15}
              />

              <span>
                {error}
              </span>
            </div>
          )}


          {/* Form */}

          <form
            onSubmit={
              handleSubmit
            }
            style={{
              display:
                'flex',

              flexDirection:
                'column',

              gap:
                14,
            }}
          >
            <label
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  6,

                color:
                  '#172033',

                fontSize:
                  11,

                fontWeight:
                  700,
              }}
            >
              Username

              <div
                style={{
                  position:
                    'relative',
                }}
              >
                <UserRound
                  size={17}
                  style={{
                    position:
                      'absolute',

                    left:
                      11,

                    top:
                      '50%',

                    transform:
                      'translateY(-50%)',

                    color:
                      '#94a3b8',
                  }}
                />

                <input
                  value={
                    username
                  }
                  onChange={(
                    event,
                  ) =>
                    setUsername(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="username"
                  placeholder="Enter username"
                  disabled={
                    loading
                  }
                  style={{
                    width:
                      '100%',

                    height:
                      44,

                    padding:
                      '0 12px 0 38px',

                    border:
                      '1px solid #e2e8f0',

                    borderRadius:
                      10,

                    background:
                      '#fff',

                    color:
                      '#172033',

                    fontSize:
                      12,

                    outline:
                      'none',
                  }}
                />
              </div>
            </label>


            <label
              style={{
                display:
                  'flex',

                flexDirection:
                  'column',

                gap:
                  6,

                color:
                  '#172033',

                fontSize:
                  11,

                fontWeight:
                  700,
              }}
            >
              Password

              <div
                style={{
                  position:
                    'relative',
                }}
              >
                <LockKeyhole
                  size={17}
                  style={{
                    position:
                      'absolute',

                    left:
                      11,

                    top:
                      '50%',

                    transform:
                      'translateY(-50%)',

                    color:
                      '#94a3b8',
                  }}
                />

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                  autoComplete="current-password"
                  placeholder="Enter password"
                  disabled={
                    loading
                  }
                  style={{
                    width:
                      '100%',

                    height:
                      44,

                    padding:
                      '0 12px 0 38px',

                    border:
                      '1px solid #e2e8f0',

                    borderRadius:
                      10,

                    background:
                      '#fff',

                    color:
                      '#172033',

                    fontSize:
                      12,

                    outline:
                      'none',
                  }}
                />
              </div>
            </label>


            <button
              type="submit"
              disabled={
                loading ||
                !username.trim() ||
                !password
              }
              className="primary-button full"
              style={{
                minHeight:
                  46,

                marginTop:
                  3,

                fontSize:
                  12,
              }}
            >
              {loading ? (
                <>
                  <span
                    className="spin"
                    style={{
                      width:
                        15,

                      height:
                        15,

                      border:
                        '2px solid rgba(255,255,255,0.4)',

                      borderTopColor:
                        '#fff',

                      borderRadius:
                        '50%',
                    }}
                  />

                  Signing in...
                </>
              ) : (
                <>
                  Sign in to Marg Setu

                  <ArrowRight
                    size={16}
                  />
                </>
              )}
            </button>
          </form>


          {/* Demo credentials */}

          <div
            style={{
              marginTop:
                20,

              padding:
                13,

              border:
                '1px solid #fed7aa',

              borderRadius:
                11,

              background:
                '#fffaf5',
            }}
          >
            <div
              style={{
                display:
                  'flex',

                alignItems:
                  'center',

                gap:
                  6,

                color:
                  '#9a3412',

                fontSize:
                  10,

                fontWeight:
                  800,
              }}
            >
              <CheckCircle2
                size={14}
              />

              SIH DEMO ACCESS
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
                  9,
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      '#9ca3af',

                    fontSize:
                      9,
                  }}
                >
                  Username
                </div>

                <strong
                  style={{
                    display:
                      'block',

                    marginTop:
                      2,

                    color:
                      '#172033',

                    fontSize:
                      11,
                  }}
                >
                  admin
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color:
                      '#9ca3af',

                    fontSize:
                      9,
                  }}
                >
                  Password
                </div>

                <strong
                  style={{
                    display:
                      'block',

                    marginTop:
                      2,

                    color:
                      '#172033',

                    fontSize:
                      11,
                  }}
                >
                  admin123
                </strong>
              </div>
            </div>
          </div>


          {/* Security note */}

          <div
            style={{
              display:
                'flex',

              alignItems:
                'flex-start',

              gap:
                7,

              marginTop:
                15,

              color:
                '#94a3b8',

              fontSize:
                9,

              lineHeight:
                1.5,
            }}
          >
            <ShieldCheck
              size={13}
              style={{
                flex:
                  '0 0 auto',

                marginTop:
                  1,
              }}
            />

            Authentication protects dashboard,
            incident, shipment, alert and route
            intelligence endpoints.
          </div>
        </div>
      </section>
    </div>
  );
}