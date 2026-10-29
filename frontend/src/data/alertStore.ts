import {
  loadFieldIncidents,
  type FieldIncident,
} from './incidentStore';

import {
  calculateDynamicCorridors,
} from './riskStore';

export type OperationalAlert = {
  id: string;

  title: string;

  detail: string;

  severity:
    | 'Low'
    | 'Moderate'
    | 'High'
    | 'Critical';

  time: string;

  action:
    | 'routes'
    | 'alerts';

  source:
    | 'Field Officer'
    | 'Risk Engine'
    | 'System';

  isLive: boolean;
};

/* ============================================================
   SYSTEM ALERTS
   These are intentionally secondary to live intelligence.
============================================================ */

const SYSTEM_ALERTS: OperationalAlert[] = [
  {
    id: 'SYS-001',
    title: 'Heavy rainfall predicted',
    detail:
      'Regional rainfall conditions require enhanced corridor monitoring.',
    severity: 'Moderate',
    time: 'System',
    action: 'alerts',
    source: 'System',
    isLive: false,
  },

  {
    id: 'SYS-002',
    title: 'Vehicle ETA variance detected',
    detail:
      'Several vehicles are reporting longer-than-baseline travel times.',
    severity: 'High',
    time: 'System',
    action: 'routes',
    source: 'System',
    isLive: false,
  },

  {
    id: 'SYS-003',
    title: 'Critical medicine shipment at risk',
    detail:
      'A priority shipment requires corridor review.',
    severity: 'High',
    time: 'System',
    action: 'routes',
    source: 'System',
    isLive: false,
  },
];

/* ============================================================
   TIME
============================================================ */

function formatRelativeTime(
  timestamp: string,
) {
  const date =
    new Date(timestamp);

  const now =
    new Date();

  const difference =
    Math.max(
      0,
      now.getTime() -
        date.getTime(),
    );

  const minutes =
    Math.floor(
      difference / 60000,
    );

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(
    hours / 24,
  )}d ago`;
}

/* ============================================================
   FIELD INCIDENT → ALERT
============================================================ */

function createIncidentAlert(
  incident: FieldIncident,
): OperationalAlert {
  const routeAction =
    incident.severity ===
      'Critical' ||
    incident.severity ===
      'High';

  return {
    id:
      `LIVE-${incident.id}`,

    title:
      `LIVE: ${incident.type}`,

    detail:
      `${incident.severity} field report received at ${incident.locationLabel}. AI classification: ${incident.aiClassification} (${incident.aiConfidence}% confidence).`,

    severity:
      incident.severity,

    time:
      formatRelativeTime(
        incident.timestamp,
      ),

    action:
      routeAction
        ? 'routes'
        : 'alerts',

    source:
      'Field Officer',

    isLive: true,
  };
}

/* ============================================================
   RISK → ALERT
============================================================ */

function createRiskAlerts(): OperationalAlert[] {
  const corridors =
    calculateDynamicCorridors();

  return corridors
    .filter(
      (corridor) =>
        corridor.risk ===
          'Critical' ||
        corridor.risk ===
          'High',
    )
    .map(
      (corridor) => ({
        id:
          `LIVE-RISK-${corridor.id}`,

        title:
          `LIVE: ${corridor.id} ${corridor.risk} risk`,

        detail:
          `${corridor.route} has accessibility ${corridor.score}/100 with ${corridor.probability}% disruption probability. ${corridor.action}.`,

        severity:
          corridor.risk,

        time:
          'Live risk engine',

        action:
          'routes',

        source:
          'Risk Engine',

        isLive: true,
      }),
    );
}

/* ============================================================
   MAIN
============================================================ */

export function getOperationalAlerts(
  incidents: FieldIncident[] =
    loadFieldIncidents(),
): OperationalAlert[] {
  const incidentAlerts =
    incidents.map(
      createIncidentAlert,
    );

  const riskAlerts =
    createRiskAlerts();

  /*
   * IMPORTANT:
   * Live alerts are always placed first.
   */
  return [
    ...incidentAlerts.reverse(),
    ...riskAlerts,
    ...SYSTEM_ALERTS,
  ];
}

/* ============================================================
   SUMMARY
============================================================ */

export function getAlertSummary(
  incidents: FieldIncident[] =
    loadFieldIncidents(),
) {
  const alerts =
    getOperationalAlerts(
      incidents,
    );

  return {
    total:
      alerts.length,

    live:
      alerts.filter(
        (alert) =>
          alert.isLive,
      ).length,

    critical:
      alerts.filter(
        (alert) =>
          alert.severity ===
          'Critical',
      ).length,

    high:
      alerts.filter(
        (alert) =>
          alert.severity ===
          'High',
      ).length,

    field:
      alerts.filter(
        (alert) =>
          alert.source ===
          'Field Officer',
      ).length,

    riskEngine:
      alerts.filter(
        (alert) =>
          alert.source ===
          'Risk Engine',
      ).length,
  };
}