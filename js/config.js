// ─── K-Mall PWA Configuration ───────────────────────────────────────────────
// Replace SHEET_API_URL with your deployed Google Apps Script Web App URL
window.KMALL_CONFIG = {
  SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbwiLzlwwAj62sFMAR8PdC_VxFqmuT5WkMshMXgbc7Rt-xA_HxuE-CqiqP3sarIsUc0fYQ/exec',
  APP_NAME: 'K-Mall Manager',
  MALL_NAME: 'K-Mall, Jodhpur',
  COMPANY: 'Khalsa Builders and Associates',
  MALL_OPEN: '10:30',
  MALL_CLOSE: '23:00',
  CHECKIN_GRACE_MINS: 15,
  HVAC_MIN: 22,
  HVAC_MAX: 24,
  VERSION: '1.0.0',
};

window.ROLES = {
  super_admin:    { label: 'Super Admin',                color: '#2C1654', reportsTo: null },
  project_head:   { label: 'Project Head',               color: '#4A1942', reportsTo: 'super_admin' },
  mall_manager:   { label: 'Mall Manager',               color: '#6B2E61', reportsTo: 'project_head' },
  mep_manager:    { label: 'MEP / Electrical Manager',   color: '#1565C0', reportsTo: 'project_head' },
  elv_manager:    { label: 'ELV Manager',                color: '#00695C', reportsTo: 'project_head' },
  finance_manager:{ label: 'Finance Manager',            color: '#2E7D32', reportsTo: 'project_head' },
  legal_head:     { label: 'Legal Head',                 color: '#4527A0', reportsTo: 'project_head' },
  security_head:  { label: 'Security & HK Head',         color: '#BF360C', reportsTo: 'mall_manager' },
  parking_manager:{ label: 'Parking Manager',            color: '#E65100', reportsTo: 'mall_manager' },
  store_keeper:   { label: 'Store / Stock Keeper',       color: '#6D4C41', reportsTo: 'mall_manager' },
};

// Roles that can assign tasks
window.CAN_ASSIGN = ['super_admin', 'project_head'];

// Roles with access to petty cash approval
window.CAN_APPROVE_EXPENSE = ['super_admin', 'project_head', 'finance_manager'];

// Role-specific SOP checklists (from K-Mall SOP document)
window.CHECKLISTS = {
  project_head: [
    { id:'ph1', task:'Review morning briefing report from Mall Manager', freq:'daily' },
    { id:'ph2', task:'Check pending escalations from department heads', freq:'daily' },
    { id:'ph3', task:'Review Incident / Non-compliance Register (last 24 hrs)', freq:'daily' },
    { id:'ph4', task:'Review mall walkthrough summary / CCTV report', freq:'daily' },
    { id:'ph5', task:'Approve contractor work permits for the day', freq:'daily' },
    { id:'ph6', task:'Review energy dashboard — consumption vs budget', freq:'daily' },
    { id:'ph7', task:'Weekly expenditure review with Finance Manager', freq:'weekly' },
    { id:'ph8', task:'Monthly technical audit with MEP / ELV managers', freq:'monthly' },
    { id:'ph9', task:'Quarterly compliance review — statutory documents', freq:'quarterly' },
  ],
  mall_manager: [
    { id:'mm1', task:'Morning walkthrough — common areas, corridors, lifts, washrooms', freq:'daily' },
    { id:'mm2', task:'Verify all stores opened on time + staff attendance', freq:'daily' },
    { id:'mm3', task:"Review previous night's incident log from Security", freq:'daily' },
    { id:'mm4', task:'Check HVAC temperature — all zones 22–24°C', freq:'daily' },
    { id:'mm5', task:'Confirm service lifts operational, goods-entry log reviewed', freq:'daily' },
    { id:'mm6', task:'Spot-check fire exit corridors — clear of obstructions', freq:'daily' },
    { id:'mm7', task:'Inspect waste disposal — bins cleared, segregation compliant', freq:'daily' },
    { id:'mm8', task:'Midday walkthrough — store facades, common areas', freq:'daily' },
    { id:'mm9', task:'Evening walkthrough before closing (10:30 pm)', freq:'daily' },
    { id:'mm10', task:'Ensure all stores shut by 11 pm and mall secured', freq:'daily' },
    { id:'mm11', task:'Submit daily report to Project Head', freq:'daily' },
    { id:'mm12', task:'Monthly non-compliance / penalty register review', freq:'monthly' },
  ],
  mep_manager: [
    { id:'mep1', task:'Check HVAC panel — all zones, setpoints 22–24°C', freq:'daily' },
    { id:'mep2', task:'Inspect HT/LT panels — no tripping, alarms, overloads', freq:'daily' },
    { id:'mep3', task:'Verify DG set — fuel level, battery, auto-start readiness', freq:'daily' },
    { id:'mep4', task:'Check all passenger & service lifts / escalators', freq:'daily' },
    { id:'mep5', task:'Monitor energy meters — identify high-consumption stores', freq:'daily' },
    { id:'mep6', task:'Inspect plumbing — no leaks, no blocked drains in washrooms', freq:'daily' },
    { id:'mep7', task:'Check UPS / invertors for critical systems', freq:'daily' },
    { id:'mep8', task:'Log all breakdown calls and resolution status', freq:'daily' },
    { id:'mep9', task:'Fire hydrant / sprinkler system pressure check', freq:'weekly' },
    { id:'mep10', task:'Preventive maintenance on AHUs, DGs, MEP assets', freq:'monthly' },
    { id:'mep11', task:'Fill utility meter readings (1st of month)', freq:'monthly' },
    { id:'mep12', task:'Energy audit report to Project Head', freq:'monthly' },
  ],
  elv_manager: [
    { id:'elv1', task:'CCTV console — all cameras live, recording, no offline units', freq:'daily' },
    { id:'elv2', task:'Verify access control system operational', freq:'daily' },
    { id:'elv3', task:'Test Music & PA system — volume, clarity all zones', freq:'daily' },
    { id:'elv4', task:'BMS dashboard — equipment alerts, alarms, sensor readings', freq:'daily' },
    { id:'elv5', task:'Review CCTV exception report with Security Head', freq:'daily' },
    { id:'elv6', task:'Fire alarm panel check — no faults, all zones healthy', freq:'daily' },
    { id:'elv7', task:'Network uptime — Wi-Fi, POS network, CCTV NVR', freq:'daily' },
    { id:'elv8', task:'Weekly spot-check of critical camera zones', freq:'weekly' },
    { id:'elv9', task:'Monthly CCTV footage archival verification', freq:'monthly' },
    { id:'elv10', task:'Full ELV system audit to Project Head', freq:'quarterly' },
  ],
  security_head: [
    { id:'sh1', task:'Guard deployment — all posts manned at shift start', freq:'daily' },
    { id:'sh2', task:'Check duty roster — no coverage gaps', freq:'daily' },
    { id:'sh3', task:'Enforce staff entry via service entry only', freq:'daily' },
    { id:'sh4', task:'Verify contractor / vendor credentials before entry', freq:'daily' },
    { id:'sh5', task:'Inspect all fire exits — unobstructed, lit', freq:'daily' },
    { id:'sh6', task:'Review overnight CCTV report with ELV Manager', freq:'daily' },
    { id:'sh7', task:'Housekeeping sweep — corridors, food court, atrium', freq:'daily' },
    { id:'sh8', task:'Washroom inspection every 2 hours', freq:'daily' },
    { id:'sh9', task:'Evening security briefing before closing', freq:'daily' },
    { id:'sh10', task:'Submit security & housekeeping report to Mall Manager', freq:'daily' },
    { id:'sh11', task:'Fire drill conduct and documentation', freq:'quarterly' },
  ],
  parking_manager: [
    { id:'pm1', task:'Check boom barriers — operational', freq:'daily' },
    { id:'pm2', task:'Verify CCTV of all parking zones with ELV Manager', freq:'daily' },
    { id:'pm3', task:'Deploy attendants at all entry / exit points', freq:'daily' },
    { id:'pm4', task:'Staff parking zones — no customer vehicles', freq:'daily' },
    { id:'pm5', task:'Monitor large vehicle entry — enforce off-hours rule', freq:'daily' },
    { id:'pm6', task:'Midday traffic flow check', freq:'daily' },
    { id:'pm7', task:'Nightly inspection — no unlocked vehicles, all lights on', freq:'daily' },
    { id:'pm8', task:'Weekly parking capacity & report to Project Head', freq:'weekly' },
  ],
  finance_manager: [
    { id:'fm1', task:'Check bank receipts — rent / CAM / utility received vs expected', freq:'daily' },
    { id:'fm2', task:'Follow up on overdue amounts (> 7 days)', freq:'daily' },
    { id:'fm3', task:'Log incoming payments in ledger', freq:'daily' },
    { id:'fm4', task:'Process approved vendor invoices', freq:'daily' },
    { id:'fm5', task:'Raise monthly rent / CAM / utility invoices', freq:'monthly' },
    { id:'fm6', task:'Monthly P&L prep and review with Project Head', freq:'monthly' },
    { id:'fm7', task:'CAM actual vs budget reconciliation', freq:'monthly' },
  ],
  legal_head: [
    { id:'lh1', task:'Review compliance alerts / regulatory updates', freq:'daily' },
    { id:'lh2', task:'Flag upcoming certificate renewals (90 days advance)', freq:'daily' },
    { id:'lh3', task:'Coordinate with Finance on defaulting tenants (> 30 days)', freq:'weekly' },
    { id:'lh4', task:'Quarterly compliance audit — all statutory docs valid', freq:'quarterly' },
  ],
  store_keeper: [
    { id:'sk1', task:'Stock inventory check — opening count', freq:'daily' },
    { id:'sk2', task:'Receive and verify incoming goods', freq:'daily' },
    { id:'sk3', task:'Update stock register', freq:'daily' },
    { id:'sk4', task:'Report low-stock items to Mall Manager', freq:'daily' },
    { id:'sk5', task:'Weekly stock reconciliation report', freq:'weekly' },
  ],
};

window.EXPENSE_CATEGORIES = [
  'Housekeeping Supplies','Maintenance & Repair','Pest Control',
  'Security Equipment','Electrical / MEP','Stationery & Office',
  'Contractor Payments','Utilities','Staff Welfare','Events & Promotions','Miscellaneous'
];

window.INCIDENT_CATEGORIES = [
  'Fire / Smoke','Medical Emergency','Theft / Shoplifting','Security Breach',
  'Equipment Breakdown','HVAC Failure','Power Outage','Lift Breakdown',
  'Plumbing Emergency','Store Non-Compliance','CCTV / ELV Fault',
  'Parking Incident','Vehicle Accident','Pest Infestation','Property Damage','Other'
];

window.MALL_ZONES = [
  'Main Entrance / Lobby','Ground Floor','First Floor','Second Floor',
  'Food Court','Atrium','Washrooms (Ground)','Washrooms (Upper)',
  'Parking — Ground','Parking — Basement','Service Corridors',
  'Fire Staircases','Lift Lobbies','Back-of-House','Control Room','Loading Bay'
];

window.VIOLATION_CATEGORIES = [
  'Lift Usage','Staff Entry / Exit','Property Damage','AC & Temperature',
  'Smoking Policy','Operational Timings','Deliveries & Goods','Waste Management',
  'Store Facade','Staff Parking','Fire Safety','Common Area Use',
  'Pest Control','Electrical Load','Contractor Work','Other'
];
