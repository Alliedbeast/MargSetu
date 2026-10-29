import {
  getShipments,
  type ApiShipment,
} from '../api';


/* ============================================================
   TYPES
============================================================ */

export type ShipmentPriority =
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

export type ShipmentRisk =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';

export type OperationalShipment = {
  id: string;

  cargo: string;

  priority: ShipmentPriority;

  origin: string;

  destination: string;

  vehicleId: string;

  eta: string;

  currentEta: string;

  currentRoute: string;

  status: string;

  operationalStatus: string;

  risk: ShipmentRisk;

  riskScore: number;

  affected: boolean;

  impactReason: string;
};


export type DynamicCorridor = {
  id: string;

  name: string;

  route: string;

  risk:
    | ShipmentRisk
    | string;

  score: number;

  probability: number;

  riskScore: number;

  incidentCount: number;
};


/* ============================================================
   LOCAL STORAGE
============================================================ */

const STORAGE_KEY =
  'margSetuOperationalShipments';


/* ============================================================
   HELPERS
============================================================ */

function normalizePriority(
  value: string,
): ShipmentPriority {
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


function normalizeRisk(
  value: string,
): ShipmentRisk {
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


function mapShipment(
  shipment: ApiShipment,
): OperationalShipment {
  return {
    id:
      shipment.id,

    cargo:
      shipment.cargo,

    priority:
      normalizePriority(
        shipment.priority,
      ),

    origin:
      shipment.origin,

    destination:
      shipment.destination,

    vehicleId:
      shipment.vehicleId,

    eta:
      shipment.eta,

    currentEta:
      shipment.current_eta ||
      shipment.eta,

    currentRoute:
      shipment.current_route ||
      `${shipment.origin} → ${shipment.destination}`,

    status:
      shipment.status,

    operationalStatus:
      shipment.operational_status,

    risk:
      normalizeRisk(
        shipment.risk,
      ),

    riskScore:
      Number(
        shipment.risk_score ||
        0,
      ),

    affected:
      Boolean(
        shipment.affected,
      ),

    impactReason:
      shipment.impact_reason ||
      '',
  };
}


/* ============================================================
   LOCAL STORE
============================================================ */

function readLocalShipments():
  OperationalShipment[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    return JSON.parse(
      raw,
    ) as OperationalShipment[];
  } catch {
    return [];
  }
}


function writeLocalShipments(
  shipments: OperationalShipment[],
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        shipments,
      ),
    );
  } catch {
    /*
     * Local storage is a convenience cache.
     * Failure should never break the application.
     */
  }
}


/* ============================================================
   LIVE API
============================================================ */

export async function fetchOperationalShipments(): Promise<
  OperationalShipment[]
> {
  const result =
    await getShipments();

  const mapped =
    (result.items || []).map(
      mapShipment,
    );

  writeLocalShipments(
    mapped,
  );

  return mapped;
}


/* ============================================================
   COMPATIBILITY FUNCTION
============================================================ */

export function getOperationalShipments(): OperationalShipment[] {
  return readLocalShipments();
}


/* ============================================================
   ASYNC REFRESH
============================================================ */

export async function refreshOperationalShipments(): Promise<
  OperationalShipment[]
> {
  return fetchOperationalShipments();
}


/* ============================================================
   SINGLE SHIPMENT
============================================================ */

export function getOperationalShipment(
  id: string,
): OperationalShipment | null {
  const shipments =
    readLocalShipments();

  return (
    shipments.find(
      (
        shipment,
      ) =>
        shipment.id === id,
    ) || null
  );
}


/* ============================================================
   SAVE ONE SHIPMENT
============================================================ */

export function saveOperationalShipment(
  shipment: OperationalShipment,
) {
  const shipments =
    readLocalShipments();

  const existingIndex =
    shipments.findIndex(
      (
        item,
      ) =>
        item.id ===
        shipment.id,
    );

  if (
    existingIndex >=
    0
  ) {
    shipments[
      existingIndex
    ] = shipment;
  } else {
    shipments.push(
      shipment,
    );
  }

  writeLocalShipments(
    shipments,
  );
}


/* ============================================================
   DYNAMIC CORRIDOR HELPERS
============================================================ */

export function getDynamicCorridorForShipment(
  shipment: OperationalShipment,
): DynamicCorridor {
  return {
    id:
      shipment.id,

    name:
      `${shipment.origin} → ${shipment.destination}`,

    route:
      shipment.currentRoute,

    risk:
      shipment.risk,

    score:
      Math.max(
        0,
        100 -
          shipment.riskScore,
      ),

    probability:
      Math.min(
        99,
        shipment.riskScore,
      ),

    /*
     * IMPORTANT:
     * The old shipmentStore sorted by `riskScore`.
     *
     * We now explicitly define it on DynamicCorridor,
     * removing the TS2339 error.
     */
    riskScore:
      shipment.riskScore,

    incidentCount:
      shipment.affected
        ? 1
        : 0,
  };
}


/* ============================================================
   SORT BY RISK
============================================================ */

export function sortCorridorsByRisk(
  corridors: DynamicCorridor[],
) {
  return [
    ...corridors,
  ].sort(
    (
      a,
      b,
    ) =>
      b.riskScore -
      a.riskScore,
  );
}


/* ============================================================
   INITIAL CACHE
============================================================ */

if (
  readLocalShipments()
    .length === 0
) {
  /*
   * No hard-coded shipment data is inserted here.
   *
   * FastAPI is the source of truth.
   * The cache will populate after the first
   * successful API fetch.
   */
}