import {
  createIncident,
  getIncidents,
  type ApiIncident,
  type CreateIncidentPayload,
} from '../api';


/* ============================================================
   TYPES
============================================================ */

export type IncidentSeverity =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';


export type IncidentType =
  | 'Landslide / Debris'
  | 'Flooding'
  | 'Road Damage'
  | 'Bridge Issue'
  | 'Heavy Rainfall'
  | 'Traffic Blockage'
  | 'Other';


export type IncidentSyncStatus =
  | 'Pending Sync'
  | 'Synced';


export type FieldIncident = {
  id: string;

  type: IncidentType;

  severity: IncidentSeverity;

  title: string;

  description: string;

  latitude: number | null;

  longitude: number | null;

  accuracy: number | null;

  locationLabel: string;

  photoDataUrl: string | null;

  photoName: string | null;

  timestamp: string;

  officerName: string;

  deviceId: string;

  aiClassification: IncidentType;

  aiConfidence: number;

  syncStatus: IncidentSyncStatus;
};


/* ============================================================
   STORAGE
============================================================ */

const STORAGE_KEY =
  'margSetuFieldIncidents';


/* ============================================================
   NORMALIZATION
============================================================ */

function normalizeIncidentType(
  value: string | undefined,
): IncidentType {
  const allowed: IncidentType[] = [
    'Landslide / Debris',
    'Flooding',
    'Road Damage',
    'Bridge Issue',
    'Heavy Rainfall',
    'Traffic Blockage',
    'Other',
  ];

  if (
    value &&
    allowed.includes(
      value as IncidentType,
    )
  ) {
    return value as IncidentType;
  }

  return 'Other';
}


function normalizeSeverity(
  value: string | undefined,
): IncidentSeverity {
  const allowed: IncidentSeverity[] = [
    'Low',
    'Moderate',
    'High',
    'Critical',
  ];

  if (
    value &&
    allowed.includes(
      value as IncidentSeverity,
    )
  ) {
    return value as IncidentSeverity;
  }

  return 'Moderate';
}


function normalizeSyncStatus(
  value: string | undefined,
): IncidentSyncStatus {
  return value ===
    'Pending Sync'
    ? 'Pending Sync'
    : 'Synced';
}


/* ============================================================
   LOCAL STORAGE
============================================================ */

function readIncidents(): FieldIncident[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(
        raw,
      );

    if (
      !Array.isArray(
        parsed,
      )
    ) {
      return [];
    }

    return parsed as FieldIncident[];
  } catch {
    return [];
  }
}


function writeIncidents(
  incidents: FieldIncident[],
): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        incidents,
      ),
    );
  } catch {
    /*
     * Local cache failure should not
     * break Marg Setu.
     */
  }
}


/* ============================================================
   API → LOCAL MODEL
============================================================ */

function apiIncidentToFieldIncident(
  incident: ApiIncident,
): FieldIncident {
  const type =
    normalizeIncidentType(
      incident.incident_type,
    );

  return {
    id:
      incident.id,

    type,

    severity:
      normalizeSeverity(
        incident.severity,
      ),

    title:
      incident.incident_type ||
      'Field Incident',

    description:
      incident.description ||
      '',

    latitude:
      incident.lat ??
      null,

    longitude:
      incident.lng ??
      null,

    /*
     * Explicitly convert undefined → null.
     */
    accuracy:
      incident.accuracy ??
      null,

    locationLabel:
      incident.location ||
      'Unknown location',

    /*
     * This frontend store does not receive
     * image bytes from the backend.
     */
    photoDataUrl:
      null,

    /*
     * Explicitly convert undefined → null.
     */
    photoName:
      incident.photo_name ??
      null,

    timestamp:
      incident.created_at ||
      new Date().toISOString(),

    officerName:
      incident.reported_by ||
      'Unknown officer',

    /*
     * Explicitly convert undefined → fallback.
     */
    deviceId:
      incident.device_id ||
      'UNKNOWN',

    aiClassification:
      normalizeIncidentType(
        incident.ai_classification ||
          incident.incident_type,
      ),

    aiConfidence:
      incident.ai_confidence ??
      0,

    syncStatus:
      normalizeSyncStatus(
        incident.sync_status,
      ),
  };
}


/* ============================================================
   LOCAL MERGE
============================================================ */

function mergeUniqueIncidents(
  incidents: FieldIncident[],
): FieldIncident[] {
  const unique =
    new Map<
      string,
      FieldIncident
    >();

  for (
    const incident of incidents
  ) {
    if (
      !incident ||
      !incident.id
    ) {
      continue;
    }

    unique.set(
      incident.id,
      incident,
    );
  }

  return Array.from(
    unique.values(),
  ).sort(
    (
      a,
      b,
    ) =>
      new Date(
        b.timestamp,
      ).getTime() -
      new Date(
        a.timestamp,
      ).getTime(),
  );
}


/* ============================================================
   LOCAL READ — SYNCHRONOUS
   IMPORTANT:
   Older alertStore/riskStore expect this to be synchronous.
============================================================ */

export function loadFieldIncidents(): FieldIncident[] {
  return readIncidents();
}


/*
 * Compatibility aliases for old code.
 */
export function getLocalIncidents(): FieldIncident[] {
  return readIncidents();
}


export function getFieldIncidents(): FieldIncident[] {
  return readIncidents();
}


export function fetchCachedFieldIncidents(): FieldIncident[] {
  return readIncidents();
}


/* ============================================================
   SERVER REFRESH — ASYNCHRONOUS
============================================================ */

export async function refreshFieldIncidents(): Promise<
  FieldIncident[]
> {
  try {
    const response =
      await getIncidents();

    /*
     * getIncidents() returns an array with
     * .items attached for compatibility.
     *
     * Do NOT use Array.isArray(response) here.
     * response.items is the canonical API collection.
     */
    const apiItems:
      ApiIncident[] =
      response.items || [];

    const serverIncidents =
      apiItems.map(
        (
          incident,
        ) =>
          apiIncidentToFieldIncident(
            incident,
          ),
      );

    const localIncidents =
      readIncidents();

    const merged =
      mergeUniqueIncidents([
        ...serverIncidents,
        ...localIncidents,
      ]);

    const limited =
      merged.slice(
        0,
        50,
      );

    writeIncidents(
      limited,
    );

    return limited;
  } catch {
    return readIncidents();
  }
}


/*
 * Explicit async aliases for code that wants
 * to wait for a server refresh.
 */
export const loadFieldIncidentsFromServer =
  refreshFieldIncidents;


export const syncIncidentsFromServer =
  refreshFieldIncidents;


/* ============================================================
   LOCAL SAVE
============================================================ */

export function saveLocalIncident(
  incident: FieldIncident,
): FieldIncident[] {
  const existing =
    readIncidents();

  const merged =
    mergeUniqueIncidents([
      incident,
      ...existing,
    ]);

  const limited =
    merged.slice(
      0,
      50,
    );

  writeIncidents(
    limited,
  );

  return limited;
}


/* ============================================================
   LOCAL DELETE
============================================================ */

export function deleteLocalIncident(
  id: string,
): FieldIncident[] {
  const remaining =
    readIncidents().filter(
      (
        incident,
      ) =>
        incident.id !== id,
    );

  writeIncidents(
    remaining,
  );

  return remaining;
}


/* ============================================================
   BUILD INCIDENT
============================================================ */

export function buildFieldIncident(
  input: {
    type: IncidentType;

    severity: IncidentSeverity;

    title?: string;

    description: string;

    latitude?: number | null;

    longitude?: number | null;

    accuracy?: number | null;

    locationLabel?: string;

    photoDataUrl?: string | null;

    photoName?: string | null;

    officerName?: string;

    deviceId?: string;

    aiClassification?: IncidentType;

    aiConfidence?: number;
  },
): FieldIncident {
  return {
    id:
      `local-${crypto.randomUUID()}`,

    type:
      input.type,

    severity:
      input.severity,

    title:
      input.title ||
      input.type,

    description:
      input.description,

    latitude:
      input.latitude ??
      null,

    longitude:
      input.longitude ??
      null,

    accuracy:
      input.accuracy ??
      null,

    locationLabel:
      input.locationLabel ||
      'Unknown location',

    photoDataUrl:
      input.photoDataUrl ??
      null,

    photoName:
      input.photoName ??
      null,

    timestamp:
      new Date().toISOString(),

    officerName:
      input.officerName ||
      'Unknown officer',

    deviceId:
      input.deviceId ||
      'UNKNOWN',

    aiClassification:
      input.aiClassification ||
      input.type,

    aiConfidence:
      input.aiConfidence ??
      0.95,

    syncStatus:
      'Pending Sync',
  };
}


/* ============================================================
   LOCAL ADD
============================================================ */

export function addLocalIncident(
  input: Parameters<
    typeof buildFieldIncident
  >[0],
): FieldIncident {
  const incident =
    buildFieldIncident(
      input,
    );

  saveLocalIncident(
    incident,
  );

  return incident;
}


/* ============================================================
   API PAYLOAD
============================================================ */

export function toIncidentPayload(
  incident: FieldIncident,
): CreateIncidentPayload {
  return {
    incident_type:
      incident.type,

    severity:
      incident.severity,

    description:
      incident.description,

    location:
      incident.locationLabel,

    lat:
      incident.latitude,

    lng:
      incident.longitude,

    accuracy:
      incident.accuracy,

    reported_by:
      incident.officerName,

    device_id:
      incident.deviceId,

    photo_name:
      incident.photoName,

    ai_classification:
      incident.aiClassification,

    ai_confidence:
      incident.aiConfidence,

    sync_status:
      incident.syncStatus ===
      'Pending Sync'
        ? 'pending'
        : 'synced',
  };
}


/* ============================================================
   API SUBMISSION
============================================================ */

export async function submitIncident(
  incident: FieldIncident,
): Promise<FieldIncident> {
  try {
    const response =
      await createIncident(
        toIncidentPayload(
          incident,
        ),
      );

    const saved =
      apiIncidentToFieldIncident(
        response,
      );

    const remaining =
      readIncidents().filter(
        (
          item,
        ) =>
          item.id !==
          incident.id,
      );

    const merged =
      mergeUniqueIncidents([
        saved,
        ...remaining,
      ]);

    writeIncidents(
      merged.slice(
        0,
        50,
      ),
    );

    window.dispatchEvent(
      new CustomEvent(
        'margSetu:incident-created',
        {
          detail:
            saved,
        },
      ),
    );

    return saved;
  } catch (
    error
  ) {
    /*
     * Preserve failed submissions locally.
     */
    saveLocalIncident(
      {
        ...incident,

        syncStatus:
          'Pending Sync',
      },
    );

    throw error;
  }
}


/* ============================================================
   SYNC PENDING
============================================================ */

export async function syncPendingIncidents(): Promise<{
  synced: number;

  pending: number;

  incidents: FieldIncident[];
}> {
  const local =
    readIncidents();

  const pending =
    local.filter(
      (
        incident,
      ) =>
        incident.syncStatus ===
        'Pending Sync',
    );

  if (
    pending.length ===
    0
  ) {
    return {
      synced:
        0,

      pending:
        0,

      incidents:
        local,
    };
  }

  let synced =
    0;

  for (
    const incident of pending
  ) {
    try {
      await submitIncident(
        incident,
      );

      synced +=
        1;
    } catch {
      /*
       * submitIncident already keeps
       * the record pending locally.
       */
    }
  }

  const finalIncidents =
    readIncidents();

  window.dispatchEvent(
    new CustomEvent(
      'margSetu:incidents-synced',
      {
        detail:
          finalIncidents,
      },
    ),
  );

  return {
    synced,

    pending:
      finalIncidents.filter(
        (
          incident,
        ) =>
          incident.syncStatus ===
          'Pending Sync',
      ).length,

    incidents:
      finalIncidents,
  };
}


/* ============================================================
   API CONVERSION
============================================================ */

export function fromApiIncident(
  incident: ApiIncident,
): FieldIncident {
  return apiIncidentToFieldIncident(
    incident,
  );
}


/* ============================================================
   NETWORK RETURN
============================================================ */

if (
  typeof window !==
  'undefined'
) {
  window.addEventListener(
    'online',
    () => {
      void syncPendingIncidents();
    },
  );
}