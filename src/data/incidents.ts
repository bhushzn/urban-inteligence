export type Severity = 'High' | 'Medium' | 'Low';

export interface Incident {
  id: string;
  type: string;
  icon: string;
  severity: Severity;
  timestamp: string;
  coordinates: [number, number];
  location: string;
  ward: string;
  color: 'red' | 'amber' | 'cyan';
  verified: boolean;
  thumbnailColor: string;
  bboxStyle: { top: string; left: string; width: string; height: string };
  mapOffset: { x: number; y: number };
}

export const incidents: Incident[] = [
  {
    id: 'inc-001',
    type: 'Pothole Detected',
    icon: '⚠️',
    severity: 'High',
    timestamp: '2 mins ago',
    coordinates: [23.8300, 77.7900],
    location: 'Bhopal, MP',
    ward: 'Ward 7',
    color: 'red',
    verified: false,
    thumbnailColor: '#1a0505',
    bboxStyle: { top: '22%', left: '28%', width: '44%', height: '40%' },
    mapOffset: { x: -30, y: 20 },
  },
  {
    id: 'inc-002',
    type: 'Unauthorized Dumping',
    icon: '🗑️',
    severity: 'High',
    timestamp: '5 mins ago',
    coordinates: [23.8412, 77.7654],
    location: 'Ayodhya Bypass',
    ward: 'Ward 12',
    color: 'red',
    verified: false,
    thumbnailColor: '#0f1a05',
    bboxStyle: { top: '30%', left: '18%', width: '60%', height: '45%' },
    mapOffset: { x: 40, y: -15 },
  },
  {
    id: 'inc-003',
    type: 'Waterlogging',
    icon: '💧',
    severity: 'Medium',
    timestamp: '11 mins ago',
    coordinates: [23.8190, 77.8010],
    location: 'New Market Road',
    ward: 'Ward 3',
    color: 'amber',
    verified: true,
    thumbnailColor: '#050e1a',
    bboxStyle: { top: '35%', left: '22%', width: '54%', height: '36%' },
    mapOffset: { x: -50, y: 35 },
  },
  {
    id: 'inc-004',
    type: 'Broken Streetlight',
    icon: '💡',
    severity: 'Medium',
    timestamp: '18 mins ago',
    coordinates: [23.8522, 77.7820],
    location: 'Arera Colony',
    ward: 'Ward 15',
    color: 'amber',
    verified: false,
    thumbnailColor: '#1a1505',
    bboxStyle: { top: '25%', left: '32%', width: '38%', height: '48%' },
    mapOffset: { x: 25, y: 45 },
  },
  {
    id: 'inc-005',
    type: 'Encroachment',
    icon: '🚧',
    severity: 'Low',
    timestamp: '32 mins ago',
    coordinates: [23.8088, 77.7730],
    location: 'Habibganj Naka',
    ward: 'Ward 5',
    color: 'amber',
    verified: true,
    thumbnailColor: '#0a0a1a',
    bboxStyle: { top: '18%', left: '20%', width: '50%', height: '52%' },
    mapOffset: { x: -20, y: -30 },
  },
  {
    id: 'inc-006',
    type: 'Pothole Detected',
    icon: '⚠️',
    severity: 'High',
    timestamp: '41 mins ago',
    coordinates: [23.8355, 77.7980],
    location: 'Roshanpura Sq.',
    ward: 'Ward 9',
    color: 'red',
    verified: false,
    thumbnailColor: '#1a0505',
    bboxStyle: { top: '28%', left: '15%', width: '58%', height: '42%' },
    mapOffset: { x: 55, y: -40 },
  },
  {
    id: 'inc-007',
    type: 'Stray Animal Hazard',
    icon: '🐄',
    severity: 'Low',
    timestamp: '1 hr ago',
    coordinates: [23.8270, 77.7600],
    location: 'MP Nagar Zone',
    ward: 'Ward 2',
    color: 'cyan',
    verified: true,
    thumbnailColor: '#041212',
    bboxStyle: { top: '20%', left: '25%', width: '48%', height: '55%' },
    mapOffset: { x: -45, y: 10 },
  },
  {
    id: 'inc-008',
    type: 'Illegal Hoarding',
    icon: '📋',
    severity: 'Low',
    timestamp: '1.5 hrs ago',
    coordinates: [23.8450, 77.7890],
    location: 'TT Nagar Circle',
    ward: 'Ward 18',
    color: 'cyan',
    verified: false,
    thumbnailColor: '#041a0a',
    bboxStyle: { top: '15%', left: '30%', width: '42%', height: '60%' },
    mapOffset: { x: 30, y: -50 },
  },
];

export const wardData = [
  { ward: 'W-3', count: 38 },
  { ward: 'W-7', count: 56 },
  { ward: 'W-9', count: 29 },
  { ward: 'W-12', count: 71 },
  { ward: 'W-15', count: 44 },
  { ward: 'W-18', count: 22 },
];

export const hazardTypes = [
  { type: 'Potholes', pct: 35, color: '#ef4444' },
  { type: 'Dumping', pct: 25, color: '#f97316' },
  { type: 'Waterlog', pct: 18, color: '#3b82f6' },
  { type: 'Lights', pct: 12, color: '#fbbf24' },
  { type: 'Others', pct: 10, color: '#8b5cf6' },
];
