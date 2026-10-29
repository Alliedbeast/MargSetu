import {
  loadFieldIncidents,
  type FieldIncident,
  type IncidentSeverity,
  type IncidentType,
} from './incidentStore';

export type DynamicRiskLevel =
  | 'Low'
  | 'Moderate'
  | 'High'
  | 'Critical';

export type DynamicCorridor = {
  id: string;
  name: string;
  route: string;

  baseRisk: number;
  risk: DynamicRiskLevel;

  score: number;
  probability: number;

  rainfall: number;
  landslide: number;
  flood: number;
  historical: number;
  fieldReports: number;

  vehicles: number;
  shipments: number;

  incidentCount: number;
  criticalIncidentCount: number;

  action: string;

  top: string;
  left: string;
  width: string;
  rotate: string;
};

type CorridorBase = Omit<
  DynamicCorridor,
  | 'risk'
  | 'score'
  | 'probability'
  | 'fieldReports'
  | 'incidentCount'
  | 'criticalIncidentCount'
  | 'action'
>;

const BASE_CORRIDORS: CorridorBase[] = [
  {
    id: 'R-104',
    name: 'R-104',
    route: 'Guwahati → Tawang',
    baseRisk: 82,
    rainfall: 72,
    landslide: 82,
    flood: 21,
    historical: 74,
    vehicles: 6,
    shipments: 3,
    top: '34%',
    left: '17%',
    width: '54%',
    rotate: '10deg',
  },
  {
    id: 'R-54',
    name: 'R-54',
    route: 'Aizawl → Lunglei',
    baseRisk: 68,
    rainfall: 64,
    landslide: 77,
    flood: 36,
    historical: 69,
    vehicles: 8,
    shipments: 5,
    top: '55%',
    left: '16%',
    width: '48%',
    rotate: '-11deg',
  },
  {
    id: 'R-211',
    name: 'R-211',
    route: 'Shillong → Silchar',
    baseRisk: 42,
    rainfall: 51,
    landslide: 38,
    flood: 47,
    historical: 44,
    vehicles: 5,
    shipments: 7,
    top: '70%',
    left: '13%',
    width: '58%',
    rotate: '4deg',
  },
  {
    id: 'R-318',
    name: 'R-318',
    route: 'Dimapur → Kohima',
    baseRisk: 16,
    rainfall: 28,
    landslide: 22,
    flood: 14,
    historical: 21,
    vehicles: 11,
    shipments: 12,
    top: '31%',
    left: '35%',
    width: '42%',
    rotate: '-21deg',
  },
];

function severityWeight(
  severity: IncidentSeverity,
) {
  switch (severity) {
    case 'Critical':
      return 18;

    case 'High':
      return 12;

    case 'Moderate':
      return 7;

    default:
      return 4;
  }
}

function incidentTypeMultiplier(
  type: IncidentType,
) {
  switch (type) {
    case 'Landslide / Debris':
      return 1.35;

    case 'Road Damage':
      return 1.15;

    case 'Bridge Issue':
      return 1.2;

    case 'Flooding':
      return 1.1;

    case 'Heavy Rainfall':
      return 0.9;

    case 'Traffic Blockage':
      return 0.7;

    default:
      return 0.55;
  }
}

function corridorIncidentMultiplier(
  corridorId: string,
  incident: FieldIncident,
) {
  /*
   * This is a prototype impact-propagation rule.
   *
   * Once actual road geometry + incident coordinates
   * are connected to PostGIS, this should become
   * a real spatial intersection calculation.
   */

  if (
    corridorId === 'R-104' &&
    (
      incident.type ===
        'Landslide / Debris' ||
      incident.type ===
        'Road Damage' ||
      incident.type ===
        'Bridge Issue'
    )
  ) {
    return 1.25;
  }

  if (
    corridorId === 'R-54' &&
    (
      incident.type ===
        'Landslide / Debris' ||
      incident.type ===
        'Heavy Rainfall' ||
      incident.type ===
        'Bridge Issue'
    )
  ) {
    return 1.15;
  }

  if (
    corridorId === 'R-211' &&
    (
      incident.type ===
        'Flooding' ||
      incident.type ===
        'Heavy Rainfall' ||
      incident.type ===
        'Traffic Blockage'
    )
  ) {
    return 1.2;
  }

  if (
    corridorId === 'R-318' &&
    incident.type ===
      'Bridge Issue'
  ) {
    return 1.1;
  }

  return 0.35;
}

function getRiskLevel(
  score: number,
): DynamicRiskLevel {
  if (score >= 76) {
    return 'Critical';
  }

  if (score >= 56) {
    return 'High';
  }

  if (score >= 31) {
    return 'Moderate';
  }

  return 'Low';
}

function getAction(
  level: DynamicRiskLevel,
) {
  switch (level) {
    case 'Critical':
      return 'Reroute critical shipments';

    case 'High':
      return 'Monitor and prepare reroute';

    case 'Moderate':
      return 'Continue enhanced monitoring';

    default:
      return 'Route remains accessible';
  }
}

export function calculateDynamicCorridors(
  incidents: FieldIncident[] = loadFieldIncidents(),
): DynamicCorridor[] {
  return BASE_CORRIDORS.map(
    (base) => {
      let riskIncrease = 0;

      let affectedIncidentCount = 0;

      let criticalIncidentCount = 0;

      incidents.forEach(
        (incident) => {
          const baseImpact =
            severityWeight(
              incident.severity,
            );

          const typeFactor =
            incidentTypeMultiplier(
              incident.type,
            );

          const corridorFactor =
            corridorIncidentMultiplier(
              base.id,
              incident,
            );

          const impact =
            baseImpact *
            typeFactor *
            corridorFactor;

          riskIncrease += impact;

          if (
            corridorFactor > 0.5
          ) {
            affectedIncidentCount += 1;
          }

          if (
            corridorFactor > 0.5 &&
            (
              incident.severity ===
                'Critical' ||
              incident.severity ===
                'High'
            )
          ) {
            criticalIncidentCount +=
              1;
          }
        },
      );

      const dynamicRisk = Math.min(
        98,
        Math.round(
          base.baseRisk +
            riskIncrease,
        ),
      );

      const level =
        getRiskLevel(
          dynamicRisk,
        );

      const accessibilityScore =
        Math.max(
          2,
          100 - dynamicRisk,
        );

      const probability =
        Math.min(
          99,
          Math.round(
            dynamicRisk * 0.92,
          ),
        );

      const dynamicFieldReports =
        Math.min(
          100,
          Math.round(
            base.baseRisk * 0.55 +
              affectedIncidentCount *
                14,
          ),
        );

      const extraVehicles =
        criticalIncidentCount *
        2;

      const extraShipments =
        criticalIncidentCount;

      return {
        ...base,

        risk: level,

        score:
          accessibilityScore,

        probability,

        fieldReports:
          dynamicFieldReports,

        vehicles:
          base.vehicles +
          extraVehicles,

        shipments:
          base.shipments +
          extraShipments,

        incidentCount:
          affectedIncidentCount,

        criticalIncidentCount,

        action:
          getAction(level),
      };
    },
  );
}

export function getIncidentImpactSummary(
  incidents: FieldIncident[] = loadFieldIncidents(),
) {
  const corridors =
    calculateDynamicCorridors(
      incidents,
    );

  const criticalCorridors =
    corridors.filter(
      (corridor) =>
        corridor.risk ===
        'Critical',
    );

  const highRiskCorridors =
    corridors.filter(
      (corridor) =>
        corridor.risk ===
          'High' ||
        corridor.risk ===
          'Critical',
    );

  const affectedVehicles =
    highRiskCorridors.reduce(
      (total, corridor) =>
        total +
        corridor.vehicles,
      0,
    );

  const affectedShipments =
    highRiskCorridors.reduce(
      (total, corridor) =>
        total +
        corridor.shipments,
      0,
    );

  return {
    corridors,

    criticalCorridors:
      criticalCorridors.length,

    highRiskCorridors:
      highRiskCorridors.length,

    affectedVehicles,

    affectedShipments,

    totalIncidents:
      incidents.length,

    criticalIncidents:
      incidents.filter(
        (incident) =>
          incident.severity ===
          'Critical',
      ).length,
  };
}