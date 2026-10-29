import {
  Bell,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';

import type {
  PageKey,
  User,
} from '../types';


/* ============================================================
   TITLES
============================================================ */

const titles: Record<
  PageKey,
  string
> = {
  dashboard:
    'Logistics Intelligence Command Center',

  map:
    'Accessibility Intelligence Map',

  risk:
    'Risk Intelligence & Prediction',

  routes:
    'Risk-Aware Smart Rerouting',

  shipments:
    'Shipment Impact Monitor',

  vehicles:
    'Live Vehicle Fleet',

  incidents:
    'Field Incident Intelligence',

  alerts:
    'Operational Alerts',

  reports:
    'Decision Analytics & Reports',
};


/* ============================================================
   TOPBAR
============================================================ */

export function Topbar({
  page,
  user,
}: {
  page: PageKey;

  user: User;
}) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">
          NORTH EASTERN REGION · GOVERNMENT LOGISTICS
        </div>

        <h1>
          {
            titles[
              page
            ]
          }
        </h1>
      </div>

      <div className="topbar-actions">
        <div className="connection-pill">
          <Wifi
            size={15}
          />

          Live data link
        </div>

        <button className="icon-button">
          <Search
            size={18}
          />
        </button>

        <button className="icon-button notification">
          <Bell
            size={18}
          />

          <span>
            4
          </span>
        </button>

        <div className="topbar-user">
          <div className="avatar">
            {user.displayName.slice(
              0,
              1,
            )}
          </div>

          <div>
            <strong>
              {
                user.displayName
              }
            </strong>

            <small>
              {user.role}
            </small>
          </div>
        </div>
      </div>
    </header>
  );
}


/* ============================================================
   OFFLINE BANNER
============================================================ */

export function OfflineBanner({
  offline,
}: {
  offline: boolean;
}) {
  if (!offline) {
    return null;
  }

  return (
    <div className="offline-banner">
      <WifiOff
        size={16}
      />

      Offline mode: incident submissions
      will be queued and synchronized when
      connectivity returns.
    </div>
  );
}