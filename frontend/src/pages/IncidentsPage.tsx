import {
  Camera,
  CheckCircle2,
  CloudOff,
  FileUp,
  Loader2,
  MapPin,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import {
  createIncident,
  getIncidents,
  type ApiIncident,
} from '../api';

import { RiskBadge } from '../components/Badge';

import { SectionTitle } from '../components/SectionTitle';

/* ============================================================
   TYPES
============================================================ */

type IncidentType =
  | 'Landslide / Debris'
  | 'Flooding'
  | 'Road Damage'
  | 'Bridge Issue'
  | 'Heavy Rainfall'
  | 'Traffic Blockage'
  | 'Other';

type IncidentSeverity =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';

type QueuedIncident = {
  client_id: string;

  incident_type: IncidentType;

  severity: IncidentSeverity;

  description: string;

  location: string;

  lat: number | null;

  lng: number | null;

  accuracy: number | null;

  reported_by: string;

  device_id: string;

  photo_name: string | null;

  ai_classification: IncidentType;

  ai_confidence: number;

  created_at: string;
};

/* ============================================================
   CONSTANTS
============================================================ */

const QUEUE_KEY =
  'margSetuIncidentQueueV2';

const DEVICE_KEY =
  'margSetuDeviceId';

const USER_KEY =
  'margSetuUser';

/* ============================================================
   HELPERS
============================================================ */

function getDeviceId() {
  try {
    const existing =
      localStorage.getItem(
        DEVICE_KEY,
      );

    if (existing) {
      return existing;
    }

    const id =
      `field-device-${crypto.randomUUID()}`;

    localStorage.setItem(
      DEVICE_KEY,
      id,
    );

    return id;
  } catch {
    return 'field-device-browser';
  }
}

function getOfficerName() {
  try {
    const raw =
      localStorage.getItem(
        USER_KEY,
      );

    if (!raw) {
      return 'Unknown officer';
    }

    const user =
      JSON.parse(
        raw,
      ) as {
        displayName?: string;
        username?: string;
      };

    return (
      user.displayName ||
      user.username ||
      'Unknown officer'
    );
  } catch {
    return 'Unknown officer';
  }
}

function readQueue(): QueuedIncident[] {
  try {
    const raw =
      localStorage.getItem(
        QUEUE_KEY,
      );

    if (!raw) {
      return [];
    }

    return JSON.parse(
      raw,
    ) as QueuedIncident[];
  } catch {
    return [];
  }
}

function writeQueue(
  items: QueuedIncident[],
) {
  localStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(
      items,
    ),
  );
}

function classifyIncident(
  type: IncidentType,
): IncidentType {
  return type;
}

/* ============================================================
   PAGE
============================================================ */

export function IncidentsPage() {
  const [
    incidentType,
    setIncidentType,
  ] = useState<IncidentType>(
    'Landslide / Debris',
  );

  const [
    severity,
    setSeverity,
  ] = useState<IncidentSeverity>(
    'High',
  );

  const [
    location,
    setLocation,
  ] = useState(
    '',
  );

  const [
    description,
    setDescription,
  ] = useState(
    '',
  );

  const [
    latitude,
    setLatitude,
  ] = useState<number | null>(
    null,
  );

  const [
    longitude,
    setLongitude,
  ] = useState<number | null>(
    null,
  );

  const [
    accuracy,
    setAccuracy,
  ] = useState<number | null>(
    null,
  );

  const [
    photoName,
    setPhotoName,
  ] = useState<string | null>(
    null,
  );

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState<string | null>(
    null,
  );

  const [
    incidents,
    setIncidents,
  ] = useState<ApiIncident[]>(
    [],
  );

  const [
    offline,
    setOffline,
  ] = useState(
    () =>
      !navigator.onLine,
  );

  const [
    queued,
    setQueued,
  ] = useState(
    () =>
      readQueue().length,
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(
    false,
  );

  const [
    syncing,
    setSyncing,
  ] = useState(
    false,
  );

  const [
    locating,
    setLocating,
  ] = useState(
    false,
  );

  const [
    loadingIncidents,
    setLoadingIncidents,
  ] = useState(
    true,
  );

  const [
    message,
    setMessage,
  ] = useState(
    '',
  );

  const [
    error,
    setError,
  ] = useState(
    '',
  );

  const photoInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  /* ==========================================================
     LOAD LIVE INCIDENTS
  ========================================================== */

  const loadIncidents =
    useCallback(
      async () => {
        setLoadingIncidents(
          true,
        );

        try {
          const result =
            await getIncidents();

          setIncidents(
            result,
          );
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'Unable to load incidents.';

          setError(
            errorMessage,
          );
        } finally {
          setLoadingIncidents(
            false,
          );
        }
      },
      [],
    );

  /* ==========================================================
     SYNC OFFLINE QUEUE
  ========================================================== */

  const syncQueue =
    useCallback(
      async () => {
        if (
          !navigator.onLine ||
          syncing
        ) {
          return;
        }

        const currentQueue =
          readQueue();

        if (
          currentQueue.length ===
          0
        ) {
          setQueued(0);
          return;
        }

        setSyncing(true);
        setError('');

        const remaining: QueuedIncident[] =
          [];

        let syncedCount = 0;

        for (
          const item of currentQueue
        ) {
          try {
            await createIncident({
              incident_type:
                item.incident_type,

              severity:
                item.severity,

              description:
                item.description,

              location:
                item.location,

              lat:
                item.lat,

              lng:
                item.lng,

              accuracy:
                item.accuracy,

              reported_by:
                item.reported_by,

              device_id:
                item.device_id,

              photo_name:
                item.photo_name,

              ai_classification:
                item.ai_classification,

              ai_confidence:
                item.ai_confidence,

              sync_status:
                'synced',
            });

            syncedCount +=
              1;
          } catch {
            remaining.push(
              item,
            );
          }
        }

        writeQueue(
          remaining,
        );

        setQueued(
          remaining.length,
        );

        setSyncing(false);

        if (
          syncedCount > 0
        ) {
          setMessage(
            `${syncedCount} queued incident${
              syncedCount === 1
                ? ''
                : 's'
            } synced successfully.`,
          );

          window.dispatchEvent(
            new CustomEvent(
              'margSetu:incidents-synced',
            ),
          );

          await loadIncidents();
        }

        if (
          remaining.length >
          0
        ) {
          setError(
            `${remaining.length} queued incident${
              remaining.length === 1
                ? ''
                : 's'
            } could not be synced yet.`,
          );
        }
      },
      [
        loadIncidents,
        syncing,
      ],
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadIncidents();

    const online =
      () => {
        setOffline(false);

        void syncQueue();
      };

    const offlineEvent =
      () => {
        setOffline(true);
      };

    window.addEventListener(
      'online',
      online,
    );

    window.addEventListener(
      'offline',
      offlineEvent,
    );

    return () => {
      window.removeEventListener(
        'online',
        online,
      );

      window.removeEventListener(
        'offline',
        offlineEvent,
      );
    };
  }, [
    loadIncidents,
    syncQueue,
  ]);

  /* ==========================================================
     PHOTO
  ========================================================== */

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoName(
      file.name,
    );

    const reader =
      new FileReader();

    reader.onload =
      () => {
        setPhotoPreview(
          typeof reader.result ===
            'string'
            ? reader.result
            : null,
        );
      };

    reader.readAsDataURL(
      file,
    );
  }

  /* ==========================================================
     GPS
  ========================================================== */

  function captureGPS() {
    if (
      !navigator.geolocation
    ) {
      setError(
        'Geolocation is not supported by this browser.',
      );

      return;
    }

    setLocating(true);
    setError('');
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      (
        position,
      ) => {
        setLatitude(
          position.coords
            .latitude,
        );

        setLongitude(
          position.coords
            .longitude,
        );

        setAccuracy(
          position.coords
            .accuracy,
        );

        setLocation(
          `${position.coords.latitude.toFixed(
            6,
          )}, ${position.coords.longitude.toFixed(
            6,
          )}`,
        );

        setLocating(false);

        setMessage(
          'GPS coordinates captured successfully.',
        );
      },
      (
        geoError,
      ) => {
        setLocating(false);

        setError(
          geoError.message ||
            'Unable to capture GPS location.',
        );
      },
      {
        enableHighAccuracy:
          true,

        timeout:
          15000,

        maximumAge:
          30000,
      },
    );
  }

  /* ==========================================================
     SUBMIT
  ========================================================== */

  async function submitIncident(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage('');
    setError('');

    if (
      !description.trim()
    ) {
      setError(
        'Please enter an incident description.',
      );

      return;
    }

    const officer =
      getOfficerName();

    const deviceId =
      getDeviceId();

    const classification =
      classifyIncident(
        incidentType,
      );

    const payload: QueuedIncident =
      {
        client_id:
          crypto.randomUUID(),

        incident_type:
          incidentType,

        severity,

        description:
          description.trim(),

        location:
          location.trim() ||
          'Unknown location',

        lat:
          latitude,

        lng:
          longitude,

        accuracy,

        reported_by:
          officer,

        device_id:
          deviceId,

        photo_name:
          photoName,

        ai_classification:
          classification,

        ai_confidence:
          0.95,

        created_at:
          new Date().toISOString(),
      };

    setSubmitting(true);

    try {
      if (
        offline ||
        !navigator.onLine
      ) {
        const nextQueue =
          [
            ...readQueue(),
            payload,
          ];

        writeQueue(
          nextQueue,
        );

        setQueued(
          nextQueue.length,
        );

        setMessage(
          'Incident stored locally. It will sync automatically when connectivity returns.',
        );
      } else {
        await createIncident({
          incident_type:
            payload.incident_type,

          severity:
            payload.severity,

          description:
            payload.description,

          location:
            payload.location,

          lat:
            payload.lat,

          lng:
            payload.lng,

          accuracy:
            payload.accuracy,

          reported_by:
            payload.reported_by,

          device_id:
            payload.device_id,

          photo_name:
            payload.photo_name,

          ai_classification:
            payload.ai_classification,

          ai_confidence:
            payload.ai_confidence,

          sync_status:
            'synced',
        });

        setMessage(
          'Incident submitted successfully to Marg Setu.',
        );

        window.dispatchEvent(
          new CustomEvent(
            'margSetu:incident-created',
          ),
        );
      }

      setDescription(
        '',
      );

      setPhotoName(
        null,
      );

      setPhotoPreview(
        null,
      );

      if (
        photoInputRef.current
      ) {
        photoInputRef.current.value =
          '';
      }

      await loadIncidents();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Unable to submit the incident.';

      /*
       * If the server cannot be reached, preserve
       * the incident locally rather than losing it.
       */

      const nextQueue =
        [
          ...readQueue(),
          payload,
        ];

      writeQueue(
        nextQueue,
      );

      setQueued(
        nextQueue.length,
      );

      setError(
        `${errorMessage} The incident has been stored locally for retry.`,
      );
    } finally {
      setSubmitting(
        false,
      );
    }
  }

  /* ==========================================================
     SEVERITY COUNTS
  ========================================================== */

  const criticalCount =
    incidents.filter(
      (
        incident,
      ) =>
        incident.severity ===
        'Critical',
    ).length;

  const highCount =
    incidents.filter(
      (
        incident,
      ) =>
        incident.severity ===
        'High',
    ).length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="page-stack">
      {/* ======================================================
          OFFLINE STATUS
      ====================================================== */}

      <div className="offline-demo">
        <div>
          {offline ? (
            <CloudOff
              size={20}
            />
          ) : (
            <CheckCircle2
              size={20}
            />
          )}

          <strong>
            Offline-first field workflow
          </strong>

          <span>
            {offline
              ? 'You are currently offline. New reports will be queued.'
              : 'You are online. Reports are sent directly to FastAPI.'}
          </span>
        </div>

        <div className="queue-count">
          {queued}

          <span>
            queued
          </span>
        </div>
      </div>

      {/* ======================================================
          PAGE GRID
      ====================================================== */}

      <div className="dashboard-grid two-grid">
        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <section className="panel">
          <SectionTitle
            title="Submit field incident"
            subtitle="GPS + timestamp + officer identity + evidence"
          />

          <form
            className="incident-form"
            onSubmit={
              submitIncident
            }
          >
            <label>
              Incident type

              <select
                value={
                  incidentType
                }
                onChange={(
                  event,
                ) =>
                  setIncidentType(
                    event.target
                      .value as IncidentType,
                  )
                }
              >
                <option value="Landslide / Debris">
                  Landslide / Debris
                </option>

                <option value="Flooding">
                  Flooding
                </option>

                <option value="Road Damage">
                  Road Damage
                </option>

                <option value="Bridge Issue">
                  Bridge Issue
                </option>

                <option value="Heavy Rainfall">
                  Heavy Rainfall
                </option>

                <option value="Traffic Blockage">
                  Traffic Blockage
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </label>

            <label>
              Severity

              <select
                value={
                  severity
                }
                onChange={(
                  event,
                ) =>
                  setSeverity(
                    event.target
                      .value as IncidentSeverity,
                  )
                }
              >
                <option value="Low">
                  Low
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>
              </select>
            </label>

            <label>
              Location

              <input
                value={
                  location
                }
                onChange={(
                  event,
                ) =>
                  setLocation(
                    event.target
                      .value,
                  )
                }
                placeholder="Road / village / GPS location"
              />
            </label>

            <label>
              Description

              <textarea
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target
                      .value,
                  )
                }
                placeholder="Describe the observed road condition..."
                rows={5}
              />
            </label>

            {/* ================================================
                EVIDENCE
            ================================================= */}

            <div className="upload-row">
              <button
                type="button"
                className="upload-card"
                onClick={() =>
                  photoInputRef.current?.click()
                }
              >
                <Camera
                  size={20}
                />

                <span>
                  {photoName ||
                    'Attach photo'}
                </span>
              </button>

              <button
                type="button"
                className="upload-card"
                onClick={
                  captureGPS
                }
                disabled={
                  locating
                }
              >
                {locating ? (
                  <Loader2
                    size={20}
                    className="spin"
                  />
                ) : (
                  <MapPin
                    size={20}
                  />
                )}

                <span>
                  {latitude !==
                    null &&
                  longitude !==
                    null
                    ? `${latitude.toFixed(
                        4,
                      )}, ${longitude.toFixed(
                        4,
                      )}`
                    : 'Capture GPS'}
                </span>
              </button>

              <button
                type="button"
                className="upload-card"
                onClick={() =>
                  setMessage(
                    'Evidence metadata is included with this field report.',
                  )
                }
              >
                <FileUp
                  size={20}
                />

                <span>
                  Add evidence
                </span>
              </button>
            </div>

            <input
              ref={
                photoInputRef
              }
              type="file"
              accept="image/*"
              onChange={
                handlePhotoChange
              }
              style={{
                display:
                  'none',
              }}
            />

            {/* ================================================
                GPS DETAILS
            ================================================= */}

            {latitude !==
              null &&
              longitude !==
                null && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    background:
                      '#f0fdf4',
                    border:
                      '1px solid #bbf7d0',
                    fontSize: 12,
                  }}
                >
                  <strong>
                    GPS captured
                  </strong>

                  <div className="muted">
                    Lat:{' '}
                    {
                      latitude
                    }

                    {' · '}

                    Lng:{' '}
                    {
                      longitude
                    }

                    {accuracy !==
                      null && (
                      <>
                        {' · '}
                        ±
                        {Math.round(
                          accuracy,
                        )}
                        m
                      </>
                    )}
                  </div>
                </div>
              )}

            {/* ================================================
                PHOTO PREVIEW
            ================================================= */}

            {photoPreview && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border:
                    '1px solid #e5e7eb',
                }}
              >
                <img
                  src={
                    photoPreview
                  }
                  alt="Incident evidence preview"
                  style={{
                    width:
                      '100%',
                    maxHeight:
                      220,
                    objectFit:
                      'cover',
                    borderRadius:
                      8,
                  }}
                />
              </div>
            )}

            {/* ================================================
                MESSAGE
            ================================================= */}

            {message && (
              <div className="success-message">
                <ShieldCheck
                  size={17}
                />

                {message}
              </div>
            )}

            {/* ================================================
                ERROR
            ================================================= */}

            {error && (
              <div
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background:
                    '#fef2f2',
                  border:
                    '1px solid #fecaca',
                  color:
                    '#991b1b',
                  fontSize: 13,
                }}
              >
                <strong>
                  Incident submission issue
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

            {/* ================================================
                SUBMIT
            ================================================= */}

            <button
              className="primary-button full"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <Loader2
                  size={16}
                  className="spin"
                />
              ) : (
                <Send
                  size={16}
                />
              )}

              {submitting
                ? 'Submitting...'
                : offline
                  ? 'Queue incident'
                  : 'Submit incident'}
            </button>
          </form>
        </section>

        {/* ====================================================
            LIVE INCIDENT INTELLIGENCE
        ================================================= */}

        <section className="panel">
          <SectionTitle
            title="Recent incident intelligence"
            subtitle="Live FastAPI field reports with human verification"
            action={
              <button
                className="secondary-button"
                onClick={() =>
                  void loadIncidents()
                }
                disabled={
                  loadingIncidents
                }
              >
                {loadingIncidents ? (
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

          {/* ==================================================
              SUMMARY
          ================================================== */}

          <div
            style={{
              display:
                'grid',
              gridTemplateColumns:
                'repeat(3, 1fr)',
              gap: 8,
              marginBottom:
                14,
            }}
          >
            <div className="mini-stat">
              <span>
                Total
              </span>

              <strong>
                {
                  incidents.length
                }
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
                Critical
              </span>

              <strong>
                {
                  criticalCount
                }
              </strong>
            </div>
          </div>

          {/* ==================================================
              LIST
          ================================================== */}

          {loadingIncidents ? (
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
                gap: 8,
              }}
            >
              <Loader2
                size={20}
                className="spin"
              />

              <span className="muted">
                Loading incidents...
              </span>
            </div>
          ) : incidents.length ===
            0 ? (
            <div
              style={{
                padding:
                  30,
                textAlign:
                  'center',
              }}
            >
              <ShieldAlert
                size={30}
                style={{
                  opacity:
                    0.35,
                }}
              />

              <div
                style={{
                  marginTop:
                    8,
                }}
              >
                <strong>
                  No field incidents yet
                </strong>
              </div>

              <div className="muted">
                Submit the first field
                report from the form.
              </div>
            </div>
          ) : (
            <div className="incident-list">
              {incidents.map(
                (
                  incident,
                ) => (
                  <div
                    className="incident-row"
                    key={
                      incident.id
                    }
                  >
                    <div
                      className={`incident-marker ${incident.severity.toLowerCase()}`}
                    />

                    <div className="grow">
                      <div className="incident-title">
                        <strong>
                          {
                            incident.incident_type
                          }
                        </strong>

                        <RiskBadge
                          level={
                            incident.severity
                          }
                        />
                      </div>

                      <div className="muted">
                        {
                          incident.location
                        }
                      </div>

                      <div className="tiny">
                        {
                          incident.reported_by
                        }

                        {' · '}

                        {
                          incident.created_at
                        }
                      </div>

                      <p>
                        {
                          incident.description
                        }
                      </p>

                      {incident.lat !==
                        null &&
                        incident.lng !==
                          null && (
                          <div className="tiny">
                            GPS:{' '}
                            {
                              incident.lat
                            }
                            ,{' '}
                            {
                              incident.lng
                            }
                          </div>
                        )}
                    </div>

                    <span
                      className={`status-pill ${incident.status.toLowerCase()}`}
                    >
                      {
                        incident.status
                      }
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}