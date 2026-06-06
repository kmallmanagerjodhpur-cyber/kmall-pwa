// ═══════════════════════════════════════════════════════════════════════════════
// K-Mall Manager — Google Apps Script Backend
// Deploy as: Web App → Execute as: Me → Who has access: Anyone
// ═══════════════════════════════════════════════════════════════════════════════

function getSheetId() { return SpreadsheetApp.getActiveSpreadsheet().getId(); }

const SHEETS = {
  USERS:     'Users',
  ATTENDANCE:'Attendance',
  TASKS:     'Tasks',
  REPORTS:   'Reports',
  CHECKLISTS:'Checklists',
  EXPENSES:  'Expenses',
  TENANTS:   'Tenants',
  VIOLATIONS:'Violations',
  COMPLAINTS:'Complaints',
  UTILITY:   'UtilityReadings',
  INCIDENTS: 'Incidents',
  MONITORING:'Monitoring',
};

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try { return json(handleGet(e.parameter.action, e.parameter)); }
  catch(err) { return json({error: err.message}); }
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); }
  catch(err) { return json({error: 'Invalid JSON'}); }
  try { return json(handlePost(body.action, body)); }
  catch(err) { return json({error: err.message}); }
}

// ── GET Router ────────────────────────────────────────────────────────────────
function handleGet(action, p) {
  switch(action) {
    case 'login':        return { users: getRows(SHEETS.USERS) };
    case 'getUsers':     return { users: getRows(SHEETS.USERS) };
    case 'getTodayAttendance': return { records: queryRows(SHEETS.ATTENDANCE, { date: today() }) };
    case 'getAttendance':return { records: queryRows(SHEETS.ATTENDANCE, clean({ userId: p.userId, date: p.date }), p.limit) };
    case 'getTasks':     return { tasks: getTasksFiltered(p) };
    case 'getReports':   return { reports: queryRows(SHEETS.REPORTS, clean({ userId: p.userId, date: p.date, status: p.status })) };
    case 'getChecklist': return { data: (queryRows(SHEETS.CHECKLISTS, { userId: p.userId, date: p.date }) || [])[0] || null };
    case 'getExpenses':  return { expenses: getExpensesFiltered(p) };
    case 'getTenants':   return { tenants: getRows(SHEETS.TENANTS) };
    case 'getViolations':return { violations: queryRows(SHEETS.VIOLATIONS, clean({ tenantId: p.tenantId })) };
    case 'getComplaints':return { complaints: queryRows(SHEETS.COMPLAINTS, clean({ tenantId: p.tenantId })) };
    case 'getUtilityReadings': return { readings: queryRows(SHEETS.UTILITY, clean({ month: p.month })) };
    case 'getIncidents': return { incidents: getIncidentsFiltered(p) };
    case 'getObservations': return { observations: queryRows(SHEETS.MONITORING, clean({ date: p.date })) };
    default: return { error: 'Unknown action: ' + action };
  }
}

// ── POST Router ───────────────────────────────────────────────────────────────
function handlePost(action, b) {
  switch(action) {
    case 'login':        return { users: getRows(SHEETS.USERS) };
    case 'createUser':   return insertRow(SHEETS.USERS, b.user);
    case 'updateUser':   return updateRow(SHEETS.USERS, b.user);
    case 'checkIn':      return insertRow(SHEETS.ATTENDANCE, b.record);
    case 'checkOut':     return updateRow(SHEETS.ATTENDANCE, b.record);
    case 'createTask':   return insertRow(SHEETS.TASKS, b.task);
    case 'updateTask':   return updateRow(SHEETS.TASKS, b.task);
    case 'deleteTask':   return deleteRow(SHEETS.TASKS, b.id);
    case 'saveReport':   return upsertRow(SHEETS.REPORTS, b.report);
    case 'reviewReport': return updateRow(SHEETS.REPORTS, { id: b.id, reviewerNote: b.note, status: b.status, reviewedAt: now() });
    case 'saveChecklist':return upsertRow(SHEETS.CHECKLISTS, b.data);
    case 'addExpense':   return insertRow(SHEETS.EXPENSES, b.expense);
    case 'updateExpense':return updateRow(SHEETS.EXPENSES, { id: b.id, status: b.status, approvedBy: b.approvedBy, updatedAt: now() });
    case 'saveTenant':   return upsertRow(SHEETS.TENANTS, b.tenant);
    case 'addViolation': return insertRow(SHEETS.VIOLATIONS, b.violation);
    case 'updateViolation': return updateRow(SHEETS.VIOLATIONS, { id: b.id, status: b.status });
    case 'addComplaint': return insertRow(SHEETS.COMPLAINTS, b.complaint);
    case 'updateComplaint': return updateRow(SHEETS.COMPLAINTS, { id: b.id, status: b.status, resolvedAt: now() });
    case 'saveUtilityReading': return upsertRow(SHEETS.UTILITY, b.reading);
    case 'approveUtilityReading': return updateRow(SHEETS.UTILITY, { id: b.id, status: b.status, approvedAt: now() });
    case 'addIncident':  return insertRow(SHEETS.INCIDENTS, b.incident);
    case 'updateIncident': return updateRow(SHEETS.INCIDENTS, { id: b.id, ...b.update, updatedAt: now() });
    case 'addObservation': return insertRow(SHEETS.MONITORING, b.observation);
    case 'updateObservation': return updateRow(SHEETS.MONITORING, { id: b.id, status: b.status });
    default: return { error: 'Unknown action: ' + action };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Sheet Operations
// ══════════════════════════════════════════════════════════════════════════════

function getSheet(name) {
  const ss = SpreadsheetApp.openById(getSheetId());
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function getRows(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] === '' ? null : row[i]; });
    return obj;
  }).filter(r => r.id); // skip empty rows
}

function queryRows(sheetName, filters = {}, limit) {
  let rows = getRows(sheetName);
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      rows = rows.filter(r => String(r[k]||'').toLowerCase() === String(v).toLowerCase());
    }
  });
  return limit ? rows.slice(0, parseInt(limit)) : rows;
}

function insertRow(sheetName, data) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();

  if (allData.length === 0 || allData[0].every(c => c === '')) {
    // Write headers from data keys
    const headers = Object.keys(data);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, 1, headers.length).setValues([headers.map(h => data[h] === undefined ? '' : data[h])]);
  } else {
    const headers = allData[0];
    // Add any new headers
    const newKeys = Object.keys(data).filter(k => !headers.includes(k));
    if (newKeys.length) {
      const newHeaders = [...headers, ...newKeys];
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      headers.push(...newKeys);
    }
    const row = headers.map(h => data[h] === undefined ? '' : data[h]);
    sheet.appendRow(row);
  }

  return { success: true, id: data.id };
}

function updateRow(sheetName, data) {
  const sheet = getSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) return { error: 'Row not found' };

  const headers = allData[0];
  const idIdx = headers.indexOf('id');
  if (idIdx === -1) return { error: 'No id column' };

  const rowIdx = allData.findIndex((r, i) => i > 0 && String(r[idIdx]) === String(data.id));
  if (rowIdx === -1) return { error: 'Row not found: ' + data.id };

  Object.entries(data).forEach(([k, v]) => {
    const colIdx = headers.indexOf(k);
    if (colIdx !== -1 && v !== undefined) {
      sheet.getRange(rowIdx + 1, colIdx + 1).setValue(v);
    }
  });

  // Update updatedAt
  const updIdx = headers.indexOf('updatedAt');
  if (updIdx !== -1) sheet.getRange(rowIdx + 1, updIdx + 1).setValue(now());

  return { success: true };
}

function upsertRow(sheetName, data) {
  if (!data.id) return { error: 'No id provided' };
  const existing = queryRows(sheetName, { id: data.id });
  if (existing.length) return updateRow(sheetName, data);
  return insertRow(sheetName, data);
}

function deleteRow(sheetName, id) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const idIdx = data[0].indexOf('id');
  const rowIdx = data.findIndex((r, i) => i > 0 && String(r[idIdx]) === String(id));
  if (rowIdx === -1) return { error: 'Not found' };
  sheet.deleteRow(rowIdx + 1);
  return { success: true };
}

// ── Filtered Queries ──────────────────────────────────────────────────────────
function getTasksFiltered(p) {
  let rows = getRows(SHEETS.TASKS);
  if (p.assignedTo && p.assignedTo !== 'all') rows = rows.filter(r => r.assignedTo === p.assignedTo);
  if (p.status) rows = rows.filter(r => r.status === p.status);
  if (p.date) rows = rows.filter(r => r.dueDate === p.date || r.frequency !== 'once');
  if (p.overdue === 'true') rows = rows.filter(r => r.dueDate < today() && r.status !== 'done');
  return rows;
}

function getExpensesFiltered(p) {
  let rows = getRows(SHEETS.EXPENSES);
  if (p.status) rows = rows.filter(r => r.status === p.status);
  if (p.date) rows = rows.filter(r => r.date === p.date);
  if (p.week === 'true') {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    rows = rows.filter(r => r.date && new Date(r.date) >= weekAgo);
  }
  return rows.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
}

function getIncidentsFiltered(p) {
  let rows = getRows(SHEETS.INCIDENTS);
  if (p.date) rows = rows.filter(r => (r.dateTime||'').startsWith(p.date));
  if (p.status) {
    const statuses = p.status.split(',');
    rows = rows.filter(r => statuses.includes(r.status));
  }
  return rows.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().slice(0,10); }
function now() { return new Date().toISOString(); }
function clean(obj) { const r = {}; Object.entries(obj).forEach(([k,v]) => { if(v!==undefined&&v!==null&&v!=='') r[k]=v; }); return r; }

// ══════════════════════════════════════════════════════════════════════════════
// One-time Setup — Run this once to create all sheets with headers
// ══════════════════════════════════════════════════════════════════════════════
function setupSheets() {
  const HEADERS = {
    Users:           ['id','name','employeeId','email','phone','role','password','isActive','createdAt','updatedAt'],
    Attendance:      ['id','userId','userName','userRole','date','checkInTime','checkOutTime','checkInLocation','checkOutLocation','status','createdAt'],
    Tasks:           ['id','title','description','priority','frequency','dueDate','status','assignedTo','assignedToName','assignedBy','assignedByName','completedAt','createdAt','updatedAt'],
    Reports:         ['id','userId','userName','userRole','date','summary','tasksCompleted','issues','tomorrowPlan','status','submittedAt','reviewedBy','reviewerNote','reviewedAt','createdAt','updatedAt'],
    Checklists:      ['id','userId','userName','userRole','date','items','completionPct','submittedAt','createdAt','updatedAt'],
    Expenses:        ['id','submittedBy','submittedByName','submittedByRole','date','category','description','amount','note','status','approvedBy','createdAt','updatedAt'],
    Tenants:         ['id','storeName','unitNo','contactName','contactPhone','contactEmail','isActive','createdAt','updatedAt'],
    Violations:      ['id','tenantId','storeName','category','description','severity','penaltyAmount','status','reportedBy','reportedByName','createdAt','updatedAt'],
    Complaints:      ['id','tenantId','storeName','description','status','createdAt','resolvedAt'],
    UtilityReadings: ['id','month','electricity','dg','gas','water','notes','filledBy','filledByName','status','approvedBy','approvedAt','createdAt','updatedAt'],
    Incidents:       ['id','reportedBy','reportedByName','reportedByRole','dateTime','severity','category','zone','title','description','actionsTaken','injuriesReported','ambulanceCalled','policeInvolved','fireDepInvolved','status','resolvedBy','resolvedAt','createdAt','updatedAt'],
    Monitoring:      ['id','observedBy','observedByName','observedByRole','date','zone','category','store','description','severity','status','createdAt','updatedAt'],
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.entries(HEADERS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4A1942').setFontColor('#C8B46A');
    sheet.setFrozenRows(1);
  });

  // Create default Super Admin user
  const usersSheet = ss.getSheetByName('Users');
  usersSheet.appendRow(['admin_001','Super Admin','KM-ADMIN','infokmalljodhpur@gmail.com','+91 9799991000','super_admin','admin@kmall',true,new Date().toISOString(),new Date().toISOString()]);

  Logger.log('✅ All sheets created with headers. Default admin: KM-ADMIN / admin@kmall');
}
