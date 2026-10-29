import {
  AlertTriangle,
  Bell,
  Boxes,
  FileBarChart,
  Gauge,
  LogOut,
  Map,
  Route,
  ShieldAlert,
  Truck,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

import type {
  Dispatch,
  SetStateAction,
} from 'react';

import type {
  PageKey,
  Role,
  User,
} from '../types';


/* ============================================================
   PROPS
============================================================ */

type SidebarProps = {

  active:
    PageKey;

  setActive:
    Dispatch<
      SetStateAction<
        PageKey
      >
    >;

  user:
    User | null;

  onLogout:
    () => void;
};


/* ============================================================
   NAVIGATION TYPE
============================================================ */

type NavigationItem = {

  key:
    PageKey;

  label:
    string;

  icon:
    LucideIcon;

  roles?:
    Role[];
};


/* ============================================================
   NAVIGATION ITEMS
============================================================ */

const NAV_ITEMS:
  NavigationItem[] = [

  {
    key:
      'dashboard',

    label:
      'Command Center',

    icon:
      Gauge,
  },

  {
    key:
      'map',

    label:
      'GIS / Live Map',

    icon:
      Map,
  },

  {
    key:
      'risk',

    label:
      'Risk Intelligence',

    icon:
      ShieldAlert,
  },

  {
    key:
      'routes',

    label:
      'Smart Rerouting',

    icon:
      Route,
  },

  {
    key:
      'shipments',

    label:
      'Shipments',

    icon:
      Boxes,
  },

  {
    key:
      'vehicles',

    label:
      'Vehicle Fleet',

    icon:
      Truck,
  },

  {
    key:
      'incidents',

    label:
      'Field Incidents',

    icon:
      AlertTriangle,
  },

  {
    key:
      'alerts',

    label:
      'Alerts',

    icon:
      Bell,
  },

  {
    key:
      'reports',

    label:
      'Reports & Analytics',

    icon:
      FileBarChart,
  },
];


/* ============================================================
   SIDEBAR
============================================================ */

export function Sidebar({
  active,
  setActive,
  user,
  onLogout,
}: SidebarProps) {


  /* ==========================================================
     NAVIGATE
  ========================================================== */

  function navigate(
    page:
      PageKey,
  ) {

    setActive(
      page,
    );


    window.dispatchEvent(
      new CustomEvent(
        'margSetu:navigate',
        {
          detail: {
            page,
          },
        },
      ),
    );
  }


  /* ==========================================================
     LOGOUT
  ========================================================== */

  function handleLogout(
    event:
      React.MouseEvent<HTMLButtonElement>,
  ) {

    event.preventDefault();

    event.stopPropagation();


    /*
     * Clear authentication immediately.
     */

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

      sessionStorage.removeItem(
        'margSetuSession',
      );

    } catch {
      // Continue with React logout.
    }


    /*
     * Tell App to clear its React state.
     */

    onLogout();


    /*
     * Notify any other mounted listeners.
     */

    window.dispatchEvent(
      new CustomEvent(
        'margSetu:logged-out',
      ),
    );
  }


  /* ==========================================================
     USER NAME
  ========================================================== */

  const username =
    user?.username ||
    '';


  const displayName =
    username ===
      'admin'

      ? 'Off By One'

      : (
          user?.displayName ||
          'Marg Setu User'
        );


  /* ==========================================================
     INITIALS
  ========================================================== */

  const initials =
    displayName
      .split(' ')
      .filter(
        part =>
          part.trim()
            .length > 0,
      )
      .map(
        part =>
          part[0],
      )
      .join('')
      .slice(
        0,
        2,
      )
      .toUpperCase();


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <aside
      className="sidebar"
    >

      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="brand">

        <div className="brand-mark">
          M
        </div>

        <div>

          <strong>
            Marg Setu
          </strong>

          <span>
            NER logistics intelligence
          </span>

        </div>

      </div>


      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className="sidebar-nav"

        aria-label="Primary navigation"
      >

        {NAV_ITEMS.map(
          item => {

            if (
              item.roles &&
              user &&
              !item.roles.includes(
                user.role,
              )
            ) {
              return null;
            }


            const Icon =
              item.icon;


            const selected =
              active ===
              item.key;


            return (
              <button
                key={
                  item.key
                }

                type="button"

                className={
                  selected
                    ? 'nav-item active'
                    : 'nav-item'
                }

                onClick={() =>
                  navigate(
                    item.key,
                  )
                }

                aria-current={
                  selected
                    ? 'page'
                    : undefined
                }
              >

                <Icon
                  size={17}
                  strokeWidth={2}
                />


                <span>
                  {
                    item.label
                  }
                </span>

              </button>
            );
          },
        )}

      </nav>


      {/* ======================================================
          USER
      ====================================================== */}

      <div
        className="sidebar-bottom"
      >

        <div className="role-card">

          <div
            style={{
              width:
                34,

              height:
                34,

              minWidth:
                34,

              borderRadius:
                '50%',

              display:
                'flex',

              alignItems:
                'center',

              justifyContent:
                'center',

              background:
                'linear-gradient(135deg,#f97316,#ea580c)',

              color:
                '#ffffff',

              fontWeight:
                800,

              fontSize:
                12,
            }}
          >

            {
              initials
            }

          </div>


          <div
            style={{
              minWidth:
                0,

              flex:
                1,
            }}
          >

            <strong
              style={{
                display:
                  'block',

                overflow:
                  'hidden',

                textOverflow:
                  'ellipsis',

                whiteSpace:
                  'nowrap',
              }}
            >

              {
                displayName
              }

            </strong>


            <span>
              {
                user?.role ||
                'Not signed in'
              }
            </span>

          </div>


          <UserRound
            size={16}
            style={{
              opacity:
                0.55,
            }}
          />

        </div>


        {/* ====================================================
            SIGN OUT
        ==================================================== */}

        <button
          type="button"

          className="logout-button"

          onClick={
            handleLogout
          }

          aria-label="Sign out of Marg Setu"

          style={{
            width:
              '100%',

            display:
              'flex',

            alignItems:
              'center',

            justifyContent:
              'flex-start',

            gap:
              8,

            cursor:
              'pointer',
          }}
        >

          <LogOut
            size={15}
            strokeWidth={2}
          />


          <span>
            Sign out
          </span>

        </button>

      </div>

    </aside>
  );
}