import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Sidebar,
} from './components/Sidebar';

import {
  Topbar,
  OfflineBanner,
} from './components/Topbar';

import {
  LoginPage,
} from './pages/LoginPage';

import {
  DashboardPage,
} from './pages/DashboardPage';

import {
  MapPage,
} from './pages/MapPage';

import {
  RiskPage,
} from './pages/RiskPage';

import {
  RoutesPage,
} from './pages/RoutesPage';

import {
  ShipmentsPage,
} from './pages/ShipmentsPage';

import {
  VehiclesPage,
} from './pages/VehiclesPage';

import {
  IncidentsPage,
} from './pages/IncidentsPage';

import {
  AlertsPage,
} from './pages/AlertsPage';

import {
  ReportsPage,
} from './pages/ReportsPage';

import {
  getAlerts,
  getApprovedRoutes,
  getDashboard,
  getIncidents,
  getRiskCorridors,
  getShipments,
  getVehicles,
} from './api';

import type {
  PageKey,
  Role,
  User,
} from './types';


/* ============================================================
   LOGIN USER TYPE
============================================================ */

type LoginPageUser = {
  username: string;

  displayName: string;

  role: string;
};


/* ============================================================
   ROLE NORMALIZATION
============================================================ */

function normalizeRole(
  role: string,
): Role {

  const allowed: Role[] = [
    'Admin',
    'State Officer',
    'District Officer',
    'Field Officer',
    'Driver',
  ];


  if (
    allowed.includes(
      role as Role,
    )
  ) {
    return role as Role;
  }


  return 'Admin';
}


/* ============================================================
   DISPLAY NAME NORMALIZATION
 *
 * This deliberately overrides old cached "Ananya Sharma"
 * sessions for the admin account.
============================================================ */

function normalizeDisplayName(
  username:
    | string
    | undefined,

  displayName:
    | string
    | undefined,
): string {

  if (
    username ===
    'admin'
  ) {
    return 'Off By One';
  }


  return (
    displayName ||
    'Marg Setu User'
  );
}


/* ============================================================
   SESSION LOADER
============================================================ */

function loadSession() {

  try {

    const rawUser =
      localStorage.getItem(
        'margSetuUser',
      );


    const token =
      localStorage.getItem(
        'margSetuToken',
      ) || '';


    if (
      !rawUser ||
      !token
    ) {

      return {
        user:
          null,

        token:
          '',
      };
    }


    const parsed =
      JSON.parse(
        rawUser,
      ) as {
        username?: string;

        displayName?: string;

        role?: string;
      };


    if (
      !parsed.username
    ) {

      return {
        user:
          null,

        token:
          '',
      };
    }


    const user: User = {

      username:
        parsed.username,

      displayName:
        normalizeDisplayName(
          parsed.username,
          parsed.displayName,
        ),

      role:
        normalizeRole(
          parsed.role ||
          'Admin',
        ),
    };


    /*
     * Rewrite the cached user immediately.
     *
     * This removes an old "Ananya Sharma" value
     * without requiring the user to manually clear
     * browser storage.
     */

    localStorage.setItem(
      'margSetuUser',
      JSON.stringify(
        user,
      ),
    );


    return {
      user,

      token,
    };

  } catch {

    return {
      user:
        null,

      token:
        '',
    };
  }
}


/* ============================================================
   APP
============================================================ */

export default function App() {

  const session =
    loadSession();


  const [
    user,
    setUser,
  ] = useState<
    User | null
  >(
    session.user,
  );


  const [
    token,
    setToken,
  ] = useState(
    session.token,
  );


  const [
    active,
    setActive,
  ] = useState<PageKey>(
    'dashboard',
  );


  const [
    offline,
    setOffline,
  ] = useState(
    !navigator.onLine,
  );


  const [
    backendAvailable,
    setBackendAvailable,
  ] = useState(
    true,
  );


  const [
    syncVersion,
    setSyncVersion,
  ] = useState(
    0,
  );


  const [
    lastSync,
    setLastSync,
  ] = useState<
    string | null
  >(null);


/* ============================================================
   LOGIN
============================================================ */

  const handleLogin =
    useCallback(
      (
        nextUser:
          LoginPageUser,

        nextToken:
          string,
      ) => {

        const normalizedUser:
          User = {

          username:
            nextUser.username,

          displayName:
            normalizeDisplayName(
              nextUser.username,
              nextUser.displayName,
            ),

          role:
            normalizeRole(
              nextUser.role,
            ),
        };


        setUser(
          normalizedUser,
        );


        setToken(
          nextToken,
        );


        localStorage.setItem(
          'margSetuUser',

          JSON.stringify(
            normalizedUser,
          ),
        );


        localStorage.setItem(
          'margSetuToken',

          nextToken,
        );


        sessionStorage.removeItem(
          'margSetuLiveSignature',
        );


        setOffline(
          !navigator.onLine,
        );


        setBackendAvailable(
          true,
        );


        setActive(
          'dashboard',
        );

      },

      [],
    );


/* ============================================================
   LOGOUT
============================================================ */

  const logout =
    useCallback(
      () => {

        /*
         * Clear React authentication state first.
         *
         * This immediately causes App() to render LoginPage.
         */

        setUser(
          null,
        );


        setToken(
          '',
        );


        setActive(
          'dashboard',
        );


        setBackendAvailable(
          true,
        );


        setLastSync(
          null,
        );


        /*
         * Remove persisted authentication.
         */

        try {

          localStorage.removeItem(
            'margSetuUser',
          );

          localStorage.removeItem(
            'margSetuToken',
          );

        } catch {
          // Ignore storage failures.
        }


        /*
         * Remove live application session data.
         */

        try {

          sessionStorage.removeItem(
            'margSetuLiveSignature',
          );

          sessionStorage.removeItem(
            'margSetuSession',
          );

        } catch {
          // Ignore storage failures.
        }


        /*
         * Notify other components.
         */

        window.dispatchEvent(
          new CustomEvent(
            'margSetu:logged-out',
          ),
        );

      },
      [],
    );


/* ============================================================
   NETWORK STATUS
============================================================ */

  useEffect(() => {

    const handleOnline =
      () => {

        setOffline(
          false,
        );

        setBackendAvailable(
          true,
        );
      };


    const handleOffline =
      () => {

        setOffline(
          true,
        );
      };


    window.addEventListener(
      'online',
      handleOnline,
    );


    window.addEventListener(
      'offline',
      handleOffline,
    );


    return () => {

      window.removeEventListener(
        'online',
        handleOnline,
      );


      window.removeEventListener(
        'offline',
        handleOffline,
      );
    };

  }, []);


/* ============================================================
   EXTERNAL LOGOUT EVENT
 *
 * This is a second safety path.
 *
 * If any component dispatches:
 *
 *   margSetu:logged-out
 *
 * App will always return to LoginPage.
============================================================ */

  useEffect(() => {

    const handleExternalLogout =
      () => {

        setUser(
          null,
        );

        setToken(
          '',
        );

        setActive(
          'dashboard',
        );

        setLastSync(
          null,
        );

        try {

          localStorage.removeItem(
            'margSetuUser',
          );

          localStorage.removeItem(
            'margSetuToken',
          );

          sessionStorage.removeItem(
            'margSetuLiveSignature',
          );

        } catch {
          // Ignore storage failures.
        }
      };


    window.addEventListener(
      'margSetu:logged-out',
      handleExternalLogout,
    );


    return () => {

      window.removeEventListener(
        'margSetu:logged-out',
        handleExternalLogout,
      );
    };

  }, []);


/* ============================================================
   BACKEND SYNCHRONIZATION
============================================================ */

  const syncBackend =
    useCallback(
      async () => {

        if (
          !navigator.onLine ||
          !user ||
          !token
        ) {
          return;
        }


        try {

          const [
            dashboard,
            alerts,
            shipments,
            vehicles,
            incidents,
            approvedRoutes,
            riskCorridors,
          ] =
            await Promise.all([
              getDashboard(),
              getAlerts(),
              getShipments(),
              getVehicles(),
              getIncidents(),
              getApprovedRoutes(),
              getRiskCorridors(),
            ]);


          const snapshot = {

            dashboard,

            alerts,

            shipments,

            vehicles,

            incidents,

            approvedRoutes,

            riskCorridors,
          };


          const signature =
            JSON.stringify(
              snapshot,
            );


          const previous =
            sessionStorage.getItem(
              'margSetuLiveSignature',
            );


          if (
            previous ===
            null
          ) {

            sessionStorage.setItem(
              'margSetuLiveSignature',
              signature,
            );

          } else if (
            previous !==
            signature
          ) {

            sessionStorage.setItem(
              'margSetuLiveSignature',
              signature,
            );


            setSyncVersion(
              value =>
                value + 1,
            );


            window.dispatchEvent(
              new CustomEvent(
                'margSetu:data-updated',
                {
                  detail:
                    snapshot,
                },
              ),
            );
          }


          setBackendAvailable(
            true,
          );


          setOffline(
            false,
          );


          setLastSync(
            new Date().toISOString(),
          );

        } catch (
          error
        ) {

          const message =
            error instanceof Error
              ? error.message
              : '';


          if (
            message ===
              'Authentication required' ||
            message ===
              'Invalid authorization header' ||
            message ===
              'Invalid or expired token'
          ) {

            logout();

            return;
          }


          setBackendAvailable(
            false,
          );
        }
      },
      [
        user,
        token,
        logout,
      ],
    );


/* ============================================================
   STARTUP SYNC
============================================================ */

  useEffect(() => {

    if (
      !user ||
      !token
    ) {
      return;
    }


    void syncBackend();

  }, [
    user,
    token,
    syncBackend,
  ]);


/* ============================================================
   GLOBAL NAVIGATION
============================================================ */

  useEffect(() => {

    const handleNavigation =
      (
        event: Event,
      ) => {

        const custom =
          event as CustomEvent<{
            page?:
              PageKey;
          }>;


        const page =
          custom.detail?.page;


        if (
          page
        ) {
          setActive(
            page,
          );
        }
      };


    window.addEventListener(
      'margSetu:navigate',
      handleNavigation,
    );


    return () => {

      window.removeEventListener(
        'margSetu:navigate',
        handleNavigation,
      );
    };

  }, []);


/* ============================================================
   LOGIN SCREEN
============================================================ */

  if (
    !user ||
    !token
  ) {

    return (
      <LoginPage
        onLogin={
          handleLogin
        }
      />
    );
  }


/* ============================================================
   NAVIGATION
============================================================ */

  const navigate = (
    page:
      PageKey,
  ) => {

    setActive(
      page,
    );
  };


/* ============================================================
   PAGE
============================================================ */

  let page:
    | JSX.Element
    | null =
    null;


  switch (
    active
  ) {

    case 'map':

      page = (
        <MapPage
          key={
            `map-${syncVersion}`
          }
        />
      );

      break;


    case 'risk':

      page = (
        <RiskPage
          key={
            `risk-${syncVersion}`
          }
        />
      );

      break;


    case 'routes':

      page = (
        <RoutesPage
          key={
            `routes-${syncVersion}`
          }
        />
      );

      break;


    case 'shipments':

      page = (
        <ShipmentsPage
          key={
            `shipments-${syncVersion}`
          }
        />
      );

      break;


    case 'vehicles':

      page = (
        <VehiclesPage
          key={
            `vehicles-${syncVersion}`
          }
        />
      );

      break;


    case 'incidents':

      page = (
        <IncidentsPage
          key={
            `incidents-${syncVersion}`
          }
        />
      );

      break;


    case 'alerts':

      page = (
        <AlertsPage
          key={
            `alerts-${syncVersion}`
          }
        />
      );

      break;


    case 'reports':

      page = (
        <ReportsPage
          key={
            `reports-${syncVersion}`
          }
        />
      );

      break;


    default:

      page = (
        <DashboardPage
          key={
            `dashboard-${syncVersion}`
          }

          onNavigate={
            navigate
          }
        />
      );

      break;
  }


/* ============================================================
   APPLICATION SHELL
============================================================ */

  return (
    <div className="app-shell">

      <Sidebar
        active={
          active
        }

        setActive={
          setActive
        }

        user={
          user
        }

        onLogout={
          logout
        }
      />


      <main className="main-content">

        <Topbar
          page={
            active
          }

          user={
            user
          }
        />


        <OfflineBanner
          offline={
            offline ||
            !backendAvailable
          }
        />


        <div
          style={{
            display:
              'flex',

            justifyContent:
              'flex-end',

            alignItems:
              'center',

            gap:
              10,

            padding:
              '5px 22px',

            fontSize:
              11,

            color:
              '#6b7280',

            background:
              '#ffffff',

            borderBottom:
              '1px solid #f3f4f6',
          }}
        >

          <span>

            <span
              style={{
                display:
                  'inline-block',

                width:
                  7,

                height:
                  7,

                marginRight:
                  5,

                borderRadius:
                  '999px',

                background:
                  backendAvailable &&
                  !offline
                    ? '#16a34a'
                    : '#dc2626',
              }}
            />

            {
              backendAvailable &&
              !offline
                ? 'FastAPI connected'
                : 'Backend unavailable'
            }

          </span>


          {lastSync && (

            <span>

              Last sync:{' '}

              {
                new Date(
                  lastSync,
                ).toLocaleTimeString()
              }

            </span>

          )}


          <span>
            Refresh: event-driven
          </span>

        </div>


        <div className="content-wrap">

          {
            page
          }

        </div>

      </main>

    </div>
  );
}