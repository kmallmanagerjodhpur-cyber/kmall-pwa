// ─── Google Sheets API Wrapper ───────────────────────────────────────────────
// All reads and writes go through the Apps Script Web App URL.
// The Apps Script acts as a serverless REST API over Google Sheets.

window.API = (() => {
  const BASE = () => window.KMALL_CONFIG.SHEET_API_URL;

  async function call(action, payload = {}) {
    const url = BASE();
    if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') {
      console.warn('API not configured. Using demo mode.');
      return demoHandler(action, payload);
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error('API error:', err);
      throw err;
    }
  }

  // GET helper — for reads that use query params
  async function get(action, params = {}) {
    const url = BASE();
    if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') {
      return demoHandler(action, params);
    }
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${url}?${qs}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const login = (employeeId, password) => call('login', { employeeId, password });
  const getUsers = () => get('getUsers');
  const createUser = (user) => call('createUser', { user });
  const updateUser = (user) => call('updateUser', { user });

  // ── Attendance ────────────────────────────────────────────────────────────
  const checkIn = (record) => call('checkIn', { record });
  const checkOut = (record) => call('checkOut', { record });
  const getAttendance = (params) => get('getAttendance', params);
  const getTodayAttendance = () => get('getTodayAttendance');

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const getTasks = (params) => get('getTasks', params);
  const createTask = (task) => call('createTask', { task });
  const updateTask = (task) => call('updateTask', { task });
  const deleteTask = (id) => call('deleteTask', { id });

  // ── Daily Reports ─────────────────────────────────────────────────────────
  const getReports = (params) => get('getReports', params);
  const saveReport = (report) => call('saveReport', { report });
  const reviewReport = (id, note, status) => call('reviewReport', { id, note, status });

  // ── Checklists ────────────────────────────────────────────────────────────
  const getChecklist = (params) => get('getChecklist', params);
  const saveChecklist = (data) => call('saveChecklist', { data });

  // ── Expenses ──────────────────────────────────────────────────────────────
  const getExpenses = (params) => get('getExpenses', params);
  const addExpense = (expense) => call('addExpense', { expense });
  const updateExpense = (id, status, approvedBy) => call('updateExpense', { id, status, approvedBy });

  // ── Tenants ───────────────────────────────────────────────────────────────
  const getTenants = () => get('getTenants');
  const saveTenant = (tenant) => call('saveTenant', { tenant });
  const getViolations = (params) => get('getViolations', params);
  const addViolation = (v) => call('addViolation', { violation: v });
  const updateViolation = (id, status) => call('updateViolation', { id, status });
  const getComplaints = (params) => get('getComplaints', params);
  const addComplaint = (c) => call('addComplaint', { complaint: c });
  const updateComplaint = (id, status) => call('updateComplaint', { id, status });
  const getUtilityReadings = (params) => get('getUtilityReadings', params);
  const saveUtilityReading = (r) => call('saveUtilityReading', { reading: r });
  const approveUtilityReading = (id, status) => call('approveUtilityReading', { id, status });

  // ── Incidents ─────────────────────────────────────────────────────────────
  const getIncidents = (params) => get('getIncidents', params);
  const addIncident = (inc) => call('addIncident', { incident: inc });
  const updateIncident = (id, update) => call('updateIncident', { id, update });

  // ── Monitoring ────────────────────────────────────────────────────────────
  const getObservations = (params) => get('getObservations', params);
  const addObservation = (obs) => call('addObservation', { observation: obs });
  const updateObservation = (id, status) => call('updateObservation', { id, status });

  // ── Demo mode (no API configured) ────────────────────────────────────────
  function demoHandler(action) {
    const demoUsers = [
      { id:'u1', employeeId:'KM-ADMIN', name:'Super Admin', role:'super_admin', password:'admin@kmall', isActive:true },
      { id:'u2', employeeId:'KM-001', name:'Project Head', role:'project_head', password:'kmall@2026', isActive:true },
      { id:'u3', employeeId:'KM-002', name:'Mall Manager', role:'mall_manager', password:'kmall@2026', isActive:true },
      { id:'u4', employeeId:'KM-003', name:'MEP Manager', role:'mep_manager', password:'kmall@2026', isActive:true },
      { id:'u5', employeeId:'KM-004', name:'Security Head', role:'security_head', password:'kmall@2026', isActive:true },
    ];
    if (action === 'login') return Promise.resolve({ users: demoUsers });
    if (action === 'getUsers') return Promise.resolve({ users: demoUsers });
    if (action === 'getTodayAttendance') return Promise.resolve({ records: [] });
    if (action === 'getTasks') return Promise.resolve({ tasks: [] });
    if (action === 'getExpenses') return Promise.resolve({ expenses: [] });
    if (action === 'getIncidents') return Promise.resolve({ incidents: [] });
    if (action === 'getTenants') return Promise.resolve({ tenants: [] });
    if (action === 'getReports') return Promise.resolve({ reports: [] });
    if (action === 'getChecklist') return Promise.resolve({ data: null });
    if (action === 'getViolations') return Promise.resolve({ violations: [] });
    if (action === 'getComplaints') return Promise.resolve({ complaints: [] });
    if (action === 'getObservations') return Promise.resolve({ observations: [] });
    if (action === 'getUtilityReadings') return Promise.resolve({ readings: [] });
    // All write ops return success in demo mode
    return Promise.resolve({ success: true, id: 'demo_' + Date.now() });
  }

  return {
    login, getUsers, createUser, updateUser,
    checkIn, checkOut, getAttendance, getTodayAttendance,
    getTasks, createTask, updateTask, deleteTask,
    getReports, saveReport, reviewReport,
    getChecklist, saveChecklist,
    getExpenses, addExpense, updateExpense,
    getTenants, saveTenant,
    getViolations, addViolation, updateViolation,
    getComplaints, addComplaint, updateComplaint,
    getUtilityReadings, saveUtilityReading, approveUtilityReading,
    getIncidents, addIncident, updateIncident,
    getObservations, addObservation, updateObservation,
  };
})();
