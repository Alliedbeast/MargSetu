import type { AlertItem, Incident, RouteOption, Shipment, Vehicle } from '../types';

export const vehicles: Vehicle[] = [
  { id: 'VH-104', driver: 'Anil Bora', status: 'Moving', type: '6T Medical Van', route: 'Guwahati → Tawang', lat: 26.1445, lng: 91.7362, eta: '08:40', load: 'Critical medicine' },
  { id: 'VH-112', driver: 'Pema Norbu', status: 'Moving', type: '10T Supply Truck', route: 'Tezpur → Bomdila', lat: 26.6338, lng: 92.7934, eta: '11:20', load: 'Food supplies' },
  { id: 'VH-118', driver: 'Rakesh Das', status: 'Idle', type: '4T Utility Truck', route: 'Shillong → Aizawl', lat: 25.5788, lng: 91.8933, eta: '13:45', load: 'Construction' },
  { id: 'VH-121', driver: 'Mohan Singh', status: 'Moving', type: '8T Medical Van', route: 'Silchar → Imphal', lat: 24.817, lng: 92.7973, eta: '09:55', load: 'Vaccines' },
  { id: 'VH-131', driver: 'Tashi Wangchuk', status: 'Offline', type: '5T Supply Truck', route: 'Nagaon → Mokokchung', lat: 26.45, lng: 93.72, eta: '--', load: 'Food supplies' }
];

export const shipments: Shipment[] = [
  { id: 'SHP-A102', cargo: 'Critical medicine', priority: 'Critical', origin: 'Guwahati', destination: 'Tawang', eta: '08:40', status: 'Reroute pending', risk: 'High', vehicleId: 'VH-104' },
  { id: 'SHP-B221', cargo: 'Vaccines', priority: 'Critical', origin: 'Silchar', destination: 'Imphal', eta: '09:55', status: 'On track', risk: 'Moderate', vehicleId: 'VH-121' },
  { id: 'SHP-C410', cargo: 'Food supplies', priority: 'High', origin: 'Tezpur', destination: 'Bomdila', eta: '11:20', status: 'Weather watch', risk: 'Moderate', vehicleId: 'VH-112' },
  { id: 'SHP-D090', cargo: 'Construction material', priority: 'Low', origin: 'Shillong', destination: 'Aizawl', eta: '13:45', status: 'Delayed', risk: 'High', vehicleId: 'VH-118' },
  { id: 'SHP-E512', cargo: 'Food supplies', priority: 'Medium', origin: 'Nagaon', destination: 'Mokokchung', eta: '--', status: 'Signal lost', risk: 'High', vehicleId: 'VH-131' }
];

export const incidents: Incident[] = [
  { id: 'INC-001', type: 'Landslide / debris', location: 'NH-13 · Sela approach', severity: 'High', status: 'Verified', reportedBy: 'Field Unit Tawang-04', time: '8 min ago', description: 'Partial carriageway obstruction reported with fresh debris.', lat: 27.58, lng: 92.62 },
  { id: 'INC-002', type: 'Flash flood', location: 'Aizawl–Lunglei corridor', severity: 'Critical', status: 'Open', reportedBy: 'District Control · Mizoram', time: '19 min ago', description: 'Water level rising across low-lying road segment.', lat: 23.73, lng: 92.72 },
  { id: 'INC-003', type: 'Road damage', location: 'NH-37 · Jorhat sector', severity: 'Moderate', status: 'Open', reportedBy: 'Field Unit Jorhat-02', time: '41 min ago', description: 'Shoulder collapse reducing usable lane width.', lat: 26.75, lng: 94.20 },
  { id: 'INC-004', type: 'Heavy rain', location: 'Bomdila sector', severity: 'Moderate', status: 'Resolved', reportedBy: 'District Control · West Kameng', time: '1 hr ago', description: 'Visibility improved and route reopened.', lat: 27.26, lng: 92.41 }
];

export const alerts: AlertItem[] = [
  { id: 'AL-01', severity: 'Critical', title: 'NH corridor blocked', detail: '3 critical shipments require rerouting.', time: '8 min ago', action: 'Open route plan' },
  { id: 'AL-02', severity: 'High', title: 'Heavy rainfall predicted', detail: '3 corridors at elevated landslide risk.', time: '16 min ago', action: 'View risk layer' },
  { id: 'AL-03', severity: 'Moderate', title: 'Vehicle VH-118 delayed', detail: 'ETA +48 min due to road damage.', time: '27 min ago' },
  { id: 'AL-04', severity: 'Moderate', title: 'GPS signal lost', detail: 'VH-131 has not synced for 22 min.', time: '31 min ago', action: 'Review vehicle' }
];

export const routes: RouteOption[] = [
  { id: 'A', name: 'Route A · Direct', distance: 210, eta: '5h 10m', risk: 'High', riskScore: 82, recommendation: 'Shortest distance, but passes through an active landslide-risk corridor.' },
  { id: 'B', name: 'Route B · Safer', distance: 235, eta: '5h 45m', risk: 'Low', riskScore: 26, recommendation: 'Recommended for critical medicine; +25 km for materially lower disruption risk.' },
  { id: 'C', name: 'Route C · Contingency', distance: 220, eta: '6h 20m', risk: 'Moderate', riskScore: 51, recommendation: 'Balanced option when the safer corridor is capacity constrained.' }
];

export const riskHistory = [
  { day: 'Mon', risk: 31 }, { day: 'Tue', risk: 34 }, { day: 'Wed', risk: 41 }, { day: 'Thu', risk: 38 }, { day: 'Fri', risk: 49 }, { day: 'Sat', risk: 57 }, { day: 'Sun', risk: 44 }
];
