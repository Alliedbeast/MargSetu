const API_BASE =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api';

/* ============================================================
   TYPES
============================================================ */

export type LoginUser = {
  username: string;
  displayName: string;
  role: string;
};

export interface LoginResponse {
  access_token: string;
  user: LoginUser;
}

export interface ApiIncident {
  id: string;

  incident_type: string;

  severity:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical';

  description: string;

  location: string;

  lat: number | null;

  lng: number | null;

  accuracy?: number | null;

  reported_by: string;

  device_id?: string;

  photo_name?: string | null;

  ai_classification?: string | null;

  ai_confidence?: number | null;

  sync_status?: string;

  created_at: string;

  status: string;
}

export interface CreateIncidentPayload {
  incident_type: string;

  severity:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical';

  description: string;

  location: string;

  lat?: number | null;

  lng?: number | null;

  accuracy?: number | null;

  reported_by?: string;

  device_id?: string;

  photo_name?: string | null;

  ai_classification?: string | null;

  ai_confidence?: number | null;

  sync_status?: string;
}

export interface ApiRouteOption {
  id: string;

  name: string;

  distance_km: number;

  eta: string;

  risk:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical';

  risk_score: number;

  reason: string;

  checkpoints: string[];

  geometry?: [
    number,
    number,
  ][];
}

export interface RouteRecommendationPayload {
  shipment_id?: string | null;

  origin: string;

  destination: string;

  cargo_priority:
    | 'Critical'
    | 'High'
    | 'Medium'
    | 'Low';
}

export interface RouteRecommendationResponse {
  cargo_priority: string;

  origin: string;

  destination: string;

  shipment_id: string | null;

  recommended: ApiRouteOption;

  options: ApiRouteOption[];

  method: string;
}

export interface RouteApprovalPayload {
  shipment_id: string;

  route_id: string;

  route_name: string;

  origin: string;

  destination: string;

  old_eta: string;

  new_eta: string;

  distance_km: number;

  risk:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical'
    | string;

  risk_score: number;
}

export interface ApiApprovedReroute
  extends RouteApprovalPayload {
  approved_by: string;

  approved_at: string;

  geometry?: [
    number,
    number,
  ][];
}

/* ============================================================
   AUTH TOKEN
============================================================ */

const TOKEN_KEY =
  'margSetuToken';

function getAuthToken(): string {
  try {
    return (
      localStorage.getItem(
        TOKEN_KEY,
      ) || ''
    );
  } catch {
    return '';
  }
}

/* ============================================================
   GENERIC REQUEST
============================================================ */

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    getAuthToken();

  const headers =
    new Headers(
      options.headers || {},
    );

  const isFormData =
    options.body instanceof FormData;

  if (
    !isFormData &&
    !headers.has(
      'Content-Type',
    )
  ) {
    headers.set(
      'Content-Type',
      'application/json',
    );
  }

  if (
    token &&
    !headers.has(
      'Authorization',
    )
  ) {
    headers.set(
      'Authorization',
      `Bearer ${token}`,
    );
  }

  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        ...options,
        headers,
      },
    );

  if (!response.ok) {
    const body =
      await response
        .json()
        .catch(
          () => ({}),
        );

    const message =
      typeof body?.detail ===
      'string'
        ? body.detail
        : `Request failed with ${response.status}`;

    throw new Error(
      message,
    );
  }

  if (
    response.status ===
    204
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/* ============================================================
   LOGIN
============================================================ */

export function login(
  username: string,
  password: string,
) {
  return apiRequest<LoginResponse>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    },
  );
}

/* ============================================================
   INCIDENTS
============================================================ */

/*
 * Important compatibility type.
 *
 * New pages can use the result as an array:
 *
 *   const incidents = await getIncidents();
 *   incidents.map(...)
 *
 * The older incidentStore can also use:
 *
 *   response.items
 *
 * without producing a TypeScript error.
 */

export type ApiIncidentList =
  ApiIncident[] & {
    items: ApiIncident[];

    count: number;
  };

export async function createIncident(
  payload: CreateIncidentPayload,
) {
  return apiRequest<ApiIncident>(
    '/incidents',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function getIncidents(): Promise<ApiIncidentList> {
  const result =
    await apiRequest<{
      items: ApiIncident[];

      count: number;
    }>(
      '/incidents',
      {
        method: 'GET',
      },
    );

  const items =
    result.items || [];

  /*
   * Arrays can safely carry custom properties.
   *
   * This lets old and new frontend code use the same
   * API function without changing the backend contract.
   */
  return Object.assign(
    items,
    {
      items,
      count:
        result.count ??
        items.length,
    },
  );
}

/* ============================================================
   ROUTES
============================================================ */

export async function recommendRoute(
  payload: RouteRecommendationPayload,
) {
  return apiRequest<RouteRecommendationResponse>(
    '/routes/recommend',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function approveRoute(
  payload: RouteApprovalPayload,
) {
  const result =
    await apiRequest<ApiApprovedReroute>(
      '/routes/approve',
      {
        method: 'POST',
        body: JSON.stringify(
          payload,
        ),
      },
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

  return result;
}

export function getApprovedRoutes() {
  return apiRequest<{
    items: ApiApprovedReroute[];

    count: number;
  }>(
    '/routes/approved',
    {
      method: 'GET',
    },
  );
}

/* ============================================================
   DASHBOARD
============================================================ */

export interface DashboardSummary {
  accessibility_percent: number;

  high_risk_corridors: number;

  critical_corridors: number;

  active_vehicles: number;

  active_shipments: number;

  critical_alerts: number;

  field_incidents: number;

  affected_vehicles: number;

  affected_shipments: number;
}

export function getDashboard() {
  return apiRequest<DashboardSummary>(
    '/dashboard',
    {
      method: 'GET',
    },
  );
}

/* ============================================================
   SHIPMENTS
============================================================ */

export interface ApiShipment {
  id: string;

  cargo: string;

  priority:
    | 'Critical'
    | 'High'
    | 'Medium'
    | 'Low';

  origin: string;

  destination: string;

  vehicleId: string;

  eta: string;

  risk:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical'
    | string;

  status: string;

  affected: boolean;

  risk_score: number;

  operational_status: string;

  impact_reason: string;

  current_route: string;

  current_eta: string;

  route_geometry?:
    | [
        number,
        number,
      ][]
    | null;
}

export function getShipments() {
  return apiRequest<{
    items: ApiShipment[];

    count: number;
  }>(
    '/shipments',
    {
      method: 'GET',
    },
  );
}

/* ============================================================
   VEHICLES
============================================================ */

export interface ApiVehicle {
  id: string;

  status: string;

  driver: string;

  origin: string;

  destination: string;

  route?: string;

  eta: string;

  lat?: number;

  lng?: number;
}

export function getVehicles() {
  return apiRequest<{
    items: ApiVehicle[];

    count: number;
  }>(
    '/vehicles',
    {
      method: 'GET',
    },
  );
}

/* ============================================================
   ALERTS
============================================================ */

export interface ApiAlert {
  id: string;

  title: string;

  detail: string;

  severity:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical'
    | string;

  time: string;

  action:
    | 'routes'
    | 'alerts'
    | string;

  source: string;

  isLive: boolean;
}

export function getAlerts() {
  return apiRequest<{
    items: ApiAlert[];

    count: number;
  }>(
    '/alerts',
    {
      method: 'GET',
    },
  );
}

/* ============================================================
   RISK
============================================================ */

export interface RiskScorePayload {
  rainfall: number;

  landslide: number;

  flood: number;

  historical: number;

  field_reports: number;

  traffic: number;
}

export interface RiskScoreResponse {
  accessibility_score: number;

  disruption_score: number;

  risk:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical';

  factors: RiskScorePayload;

  explanation: string;
}

export function calculateRisk(
  payload: RiskScorePayload,
) {
  return apiRequest<RiskScoreResponse>(
    '/risk/score',
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

/* ============================================================
   RISK CORRIDORS
============================================================ */

export interface ApiRiskCorridor {
  id: string;

  name: string;

  route: string;

  risk:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical'
    | string;

  score: number;

  probability: number;

  incident_count: number;
}

export function getRiskCorridors() {
  return apiRequest<{
    items: ApiRiskCorridor[];

    generated_at: string;
  }>(
    '/risk/corridors',
    {
      method: 'GET',
    },
  );
}