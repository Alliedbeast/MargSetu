export type Role =
  | 'Admin'
  | 'State Officer'
  | 'District Officer'
  | 'Field Officer'
  | 'Driver';

export type RiskLevel =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';

export type PageKey =
  | 'dashboard'
  | 'map'
  | 'risk'
  | 'routes'
  | 'shipments'
  | 'vehicles'
  | 'incidents'
  | 'alerts'
  | 'reports';

export interface User {
  username: string;

  displayName: string;

  role: Role;
}

export interface RiskCard {
  label: string;

  value: string;

  tone:
    | 'green'
    | 'yellow'
    | 'orange'
    | 'red';
}

export interface Vehicle {
  id: string;

  driver: string;

  status:
    | 'Moving'
    | 'Idle'
    | 'Offline';

  type: string;

  route: string;

  lat: number;

  lng: number;

  eta: string;

  load: string;
}

export interface Shipment {
  id: string;

  cargo: string;

  priority:
    | 'Critical'
    | 'High'
    | 'Medium'
    | 'Low';

  origin: string;

  destination: string;

  eta: string;

  status: string;

  risk: RiskLevel;

  vehicleId: string;
}

export interface Incident {
  id: string;

  type: string;

  location: string;

  severity: RiskLevel;

  status:
    | 'Open'
    | 'Verified'
    | 'Resolved';

  reportedBy: string;

  time: string;

  description: string;

  lat: number;

  lng: number;
}

export interface AlertItem {
  id: string;

  severity: RiskLevel;

  title: string;

  detail: string;

  time: string;

  action?: string;
}

export interface RouteOption {
  id: string;

  name: string;

  distance: number;

  eta: string;

  risk: RiskLevel;

  riskScore: number;

  recommendation: string;
}