export type ApprovedReroute = {
  shipmentId: string;
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  oldEta: string;
  newEta: string;
  distance: number;
  risk: string;
  riskScore: number;
  approvedAt: string;
};

const STORAGE_KEY = 'margSetuApprovedReroute';

export function saveApprovedReroute(
  reroute: ApprovedReroute,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(reroute),
  );

  window.dispatchEvent(
    new CustomEvent('margSetu:reroute-approved', {
      detail: reroute,
    }),
  );
}

export function loadApprovedReroute(): ApprovedReroute | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved) as ApprovedReroute;
  } catch {
    return null;
  }
}

export function clearApprovedReroute() {
  localStorage.removeItem(STORAGE_KEY);

  window.dispatchEvent(
    new CustomEvent('margSetu:reroute-cleared'),
  );
}