import 'leaflet/dist/leaflet.css';

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
} from 'react-leaflet';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Truck,
} from 'lucide-react';

import {
  getApprovedRoutes,
  getIncidents,
  getVehicles,
  type ApiApprovedReroute,
  type ApiIncident,
  type ApiVehicle,
} from '../api';

/* ============================================================
   TYPES
============================================================ */

type CommandMapProps = {
  compact?: boolean;

  onOpenMap?: () => void;
};

/* ============================================================
   MAP
============================================================ */

const mapCenter: [
  number,
  number,
] = [
  25.9,
  92.5,
];

/* ============================================================
   COLORS
============================================================ */

function incidentColor(
  severity: string,
) {
  if (
    severity ===
    'Critical'
  ) {
    return '#dc2626';
  }

  if (
    severity ===
    'High'
  ) {
    return '#ea580c';
  }

  if (
    severity ===
    'Moderate'
  ) {
    return '#ca8a04';
  }

  return '#16a34a';
}

function routeColor(
  risk: string,
) {
  if (
    risk ===
    'Critical'
  ) {
    return '#dc2626';
  }

  if (
    risk ===
    'High'
  ) {
    return '#ea580c';
  }

  if (
    risk ===
    'Moderate'
  ) {
    return '#ca8a04';
  }

  return '#16a34a';
}

/* ============================================================
   COMPONENT
============================================================ */

export function CommandMap({
  compact = false,
  onOpenMap,
}: CommandMapProps) {
  const [
    incidents,
    setIncidents,
  ] = useState<
    ApiIncident[]
  >([]);

  const [
    vehicles,
    setVehicles,
  ] = useState<
    ApiVehicle[]
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
     LOAD
  ========================================================== */

  const loadMapData =
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
          const [
            incidentResult,
            vehicleResult,
            approvedResult,
          ] =
            await Promise.all([
              getIncidents(),
              getVehicles(),
              getApprovedRoutes(),
            ]);

          setIncidents(
            incidentResult || [],
          );

          setVehicles(
            vehicleResult.items ||
              [],
          );

          setApprovedRoutes(
            approvedResult.items ||
              [],
          );
        } catch (
          err
        ) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to load live GIS data.';

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
     INITIAL + LIVE REFRESH
  ========================================================== */

  useEffect(() => {
    void loadMapData();

    const refresh =
      () => {
        void loadMapData(
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

    const interval =
      window.setInterval(
        () => {
          void loadMapData(
            false,
          );
        },
        30000,
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

      window.clearInterval(
        interval,
      );
    };
  }, [
    loadMapData,
  ]);

  /* ==========================================================
     MAP
  ========================================================== */

  return (
    <div
      className={
        compact
          ? 'map-shell compact-map'
          : 'map-shell'
      }
      style={{
        position:
          'relative',
        width:
          '100%',
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={
          compact
            ? 6
            : 7
        }
        scrollWheelZoom={
          true
        }
        className="map"
        style={{
          width:
            '100%',
          height:
            compact
              ? 360
              : 620,
          borderRadius:
            12,
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ====================================================
            APPROVED ROUTES
        ==================================================== */}

        {approvedRoutes
          .filter(
            (
              route,
            ) =>
              Array.isArray(
                route.geometry,
              ) &&
              route
                .geometry
                .length >
                1,
          )
          .map(
            (
              route,
            ) => (
              <Polyline
                key={`approved-${route.shipment_id}-${route.route_id}`}
                positions={
                  route.geometry!
                }
                pathOptions={{
                  color:
                    routeColor(
                      route.risk,
                    ),
                  weight: 7,
                  opacity:
                    0.92,
                }}
              >
                <Popup>
                  <strong>
                    Approved route
                  </strong>

                  <br />

                  {
                    route.route_name
                  }

                  <br />

                  Shipment:{' '}
                  {
                    route.shipment_id
                  }

                  <br />

                  Risk:{' '}
                  {
                    route.risk
                  }

                  <br />

                  Risk score:{' '}
                  {
                    route.risk_score
                  }

                  <br />

                  ETA:{' '}
                  {
                    route.new_eta
                  }

                  <br />

                  Approved by:{' '}
                  {
                    route.approved_by
                  }
                </Popup>
              </Polyline>
            ),
          )}

        {/* ====================================================
            LIVE INCIDENTS
        ==================================================== */}

        {incidents
          .filter(
            (
              incident,
            ) =>
              incident.lat !==
                null &&
              incident.lng !==
                null,
          )
          .map(
            (
              incident,
            ) => (
              <CircleMarker
                key={
                  incident.id
                }
                center={[
                  incident.lat!,
                  incident.lng!,
                ]}
                radius={
                  compact
                    ? 7
                    : 9
                }
                pathOptions={{
                  color:
                    incidentColor(
                      incident.severity,
                    ),
                  fillColor:
                    incidentColor(
                      incident.severity,
                    ),
                  fillOpacity:
                    0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>
                    {
                      incident.incident_type
                    }
                  </strong>

                  <br />

                  {
                    incident.location
                  }

                  <br />

                  Severity:{' '}
                  {
                    incident.severity
                  }

                  <br />

                  Reported by:{' '}
                  {
                    incident.reported_by
                  }
                </Popup>
              </CircleMarker>
            ),
          )}

        {/* ====================================================
            LIVE VEHICLES
        ==================================================== */}

        {vehicles
          .filter(
            (
              vehicle,
            ) =>
              vehicle.status !==
              'Offline',
          )
          .filter(
            (
              vehicle,
            ) =>
              typeof vehicle.lat ===
                'number' &&
              typeof vehicle.lng ===
                'number',
          )
          .map(
            (
              vehicle,
            ) => (
              <CircleMarker
                key={
                  vehicle.id
                }
                center={[
                  vehicle.lat!,
                  vehicle.lng!,
                ]}
                radius={
                  compact
                    ? 6
                    : 8
                }
                pathOptions={{
                  color:
                    '#0f766e',
                  fillColor:
                    '#14b8a6',
                  fillOpacity:
                    1,
                  weight: 2,
                }}
              >
                <Popup>
                  <strong>
                    {vehicle.id}
                  </strong>

                  <br />

                  {
                    vehicle.route ||
                    `${vehicle.origin} → ${vehicle.destination}`
                  }

                  <br />

                  Status:{' '}
                  {
                    vehicle.status
                  }

                  <br />

                  Driver:{' '}
                  {
                    vehicle.driver
                  }

                  <br />

                  ETA:{' '}
                  {
                    vehicle.eta
                  }
                </Popup>
              </CircleMarker>
            ),
          )}
      </MapContainer>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading && (
        <div
          style={{
            position:
              'absolute',
            top: 12,
            left: 12,
            zIndex: 1000,
            display:
              'flex',
            alignItems:
              'center',
            gap: 7,
            padding:
              '8px 10px',
            background:
              'rgba(255,255,255,0.95)',
            borderRadius: 9,
            boxShadow:
              '0 2px 10px rgba(0,0,0,0.12)',
            fontSize: 12,
          }}
        >
          <Loader2
            size={14}
            className="spin"
          />

          Loading live GIS...
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            position:
              'absolute',
            top: 12,
            right: 12,
            zIndex: 1000,
            maxWidth: 320,
            padding:
              '10px 12px',
            background:
              '#fff7ed',
            border:
              '1px solid #fed7aa',
            borderRadius: 9,
            boxShadow:
              '0 2px 10px rgba(0,0,0,0.12)',
            fontSize: 12,
          }}
        >
          <strong>
            GIS data error
          </strong>

          <div
            style={{
              marginTop: 3,
            }}
          >
            {error}
          </div>
        </div>
      )}

      {/* ======================================================
          OVERLAY
      ====================================================== */}

      <div
        className="map-overlay"
        style={{
          display:
            'flex',
          gap: 6,
          flexWrap:
            'wrap',
          alignItems:
            'center',
        }}
      >
        <div className="map-chip">
          <span className="dot green" />
          Low
        </div>

        <div className="map-chip">
          <span className="dot yellow" />
          Moderate
        </div>

        <div className="map-chip">
          <span className="dot orange" />
          High
        </div>

        <div className="map-chip">
          <span className="dot red" />
          Critical
        </div>

        <div className="map-chip">
          <Truck
            size={12}
          />
          Vehicles
        </div>

        <div className="map-chip">
          <AlertTriangle
            size={12}
          />
          Incidents
        </div>

        <div className="map-chip">
          <CheckCircle2
            size={12}
          />
          Approved route
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadMapData(
              false,
            )
          }
          disabled={
            refreshing
          }
        >
          {refreshing ? (
            <Loader2
              size={14}
              className="spin"
            />
          ) : (
            <RefreshCw
              size={14}
            />
          )}

          Refresh
        </button>

        {compact &&
          onOpenMap && (
            <button
              className="secondary-button"
              onClick={
                onOpenMap
              }
            >
              Open full GIS view
            </button>
          )}
      </div>
    </div>
  );
}