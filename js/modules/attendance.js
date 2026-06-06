// ─── Attendance Module ────────────────────────────────────────────────────────
Router.register('attendance', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('attendance');
  const isAdmin = Auth.can('view_all');
  const today = Utils.today();

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div><div class="topbar-title">Attendance</div><div class="topbar-role">${today}</div></div>
    ${isAdmin ? `<button class="icon-btn" onclick="Router.go('attendance-report')">📊</button>` : '<div style="width:40px"></div>'}
  </div>
  <div class="scroll-area" id="att-view"><div class="loading-spinner"></div></div>`;

  const attView = document.getElementById('att-view');

  try {
    const res = await API.getTodayAttendance();
    const records = res.records || [];
    const myRecord = records.find(r => r.userId === user.id);

    if (isAdmin) {
      renderAdminAttendance(attView, records, user);
    } else {
      renderMyAttendance(attView, myRecord, user);
    }
  } catch(e) {
    attView.innerHTML = `<div class="error-banner">Failed to load attendance data.</div>`;
    renderMyAttendance(attView, null, user);
  }
});

function renderMyAttendance(container, record, user) {
  const today = Utils.today();
  const hasIn = !!record?.checkInTime;
  const hasOut = !!record?.checkOutTime;

  container.innerHTML = `
  <div class="att-card">
    <div class="att-card-header">
      <div>
        <div class="att-day">${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
        <div class="att-clock" id="live-clock">${Utils.fmtTime(new Date().toISOString())}</div>
      </div>
      ${record ? Utils.badge(record.status) : ''}
    </div>
    <div class="att-times-row">
      <div class="att-time-box">
        <div>🟢</div><div class="att-time-lbl">Check In</div>
        <div class="att-time-val" id="ci-display">${record?.checkInTime ? Utils.fmtTime(record.checkInTime) : '--:--'}</div>
        ${record?.checkInLocation ? `<div class="att-gps">📍 GPS verified</div>` : ''}
      </div>
      <div class="att-divider"></div>
      <div class="att-time-box">
        <div>🔴</div><div class="att-time-lbl">Check Out</div>
        <div class="att-time-val" id="co-display">${record?.checkOutTime ? Utils.fmtTime(record.checkOutTime) : '--:--'}</div>
        ${record?.checkOutLocation ? `<div class="att-gps">📍 GPS verified</div>` : ''}
      </div>
    </div>
    <div id="att-action">
      ${!hasIn ? `<button class="btn btn-success w-full" id="ci-btn" onclick="doCheckIn('${user.id}','${user.name}','${user.role}')">👆 Check In</button>` :
        !hasOut ? `<button class="btn btn-error w-full" id="co-btn" onclick="doCheckOut('${record.id}')">🚪 Check Out</button>` :
        `<div class="success-banner">✓ Attendance complete for today</div>`}
    </div>
  </div>

  <div class="section-header"><h3>Recent History</h3></div>
  <div id="att-history"><div class="loading-spinner-sm"></div></div>`;

  // Live clock
  const clk = setInterval(() => {
    const el = document.getElementById('live-clock');
    if (!el) { clearInterval(clk); return; }
    el.textContent = Utils.fmtTime(new Date().toISOString());
  }, 30000);

  // Load history
  API.getAttendance({ userId: user.id, limit: 7 }).then(res => {
    const hist = document.getElementById('att-history');
    if (!hist) return;
    const records = res.records || [];
    if (!records.length) { hist.innerHTML = '<div class="empty-state">No history yet</div>'; return; }
    hist.innerHTML = records.map(r => `
    <div class="list-card">
      <div class="list-card-top">
        <div>
          <div class="list-card-title">${Utils.fmtDate(r.date)}</div>
          <div class="list-card-meta">${r.checkInTime ? Utils.fmtTime(r.checkInTime) : '—'} → ${r.checkOutTime ? Utils.fmtTime(r.checkOutTime) : '—'}</div>
        </div>
        ${Utils.badge(r.status)}
      </div>
    </div>`).join('');
  }).catch(() => {});
}

function renderAdminAttendance(container, records, user) {
  const present = records.filter(r => r.checkInTime);
  const late = records.filter(r => r.status === 'late');
  const absent = records.filter(r => !r.checkInTime);

  container.innerHTML = `
  <div class="dash-stats">
    <div class="stat-card"><div class="stat-icon bg-success">✅</div><div class="stat-val">${present.length}</div><div class="stat-lbl">Present</div></div>
    <div class="stat-card"><div class="stat-icon bg-warn">⏰</div><div class="stat-val">${late.length}</div><div class="stat-lbl">Late</div></div>
    <div class="stat-card"><div class="stat-icon bg-error">❌</div><div class="stat-val">${absent.length}</div><div class="stat-lbl">Absent</div></div>
  </div>
  <div class="section-header"><h3>All Staff — Today</h3></div>
  ${records.length === 0 ? '<div class="empty-state">No records yet for today</div>' :
    records.map(r => `
    <div class="list-card">
      <div class="list-card-top">
        <div class="user-info-row">
          <div class="user-avatar sm" style="background:${Utils.roleColor(r.userRole)}">${(r.userName||'?').charAt(0)}</div>
          <div>
            <div class="list-card-title">${r.userName}</div>
            <div class="list-card-meta">${Utils.roleLabel(r.userRole)}</div>
          </div>
        </div>
        ${Utils.badge(r.status || 'absent')}
      </div>
      <div class="att-detail-row">
        <span>🟢 ${r.checkInTime ? Utils.fmtTime(r.checkInTime) : 'Not in'}</span>
        <span>🔴 ${r.checkOutTime ? Utils.fmtTime(r.checkOutTime) : '—'}</span>
        ${r.checkInLocation ? '<span class="gps-tag">📍 GPS</span>' : ''}
      </div>
    </div>`).join('')}
  <div style="height:80px"></div>`;
}

window.doCheckIn = async (userId, userName, userRole) => {
  const btn = document.getElementById('ci-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Getting GPS…'; }
  const loc = await Utils.getGPS();
  const now = new Date().toISOString();
  const status = Utils.isLate(now) ? 'late' : 'present';
  try {
    const res = await API.checkIn({
      userId, userName, userRole,
      date: Utils.today(),
      checkInTime: now,
      checkInLocation: loc,
      status,
    });
    const ciDisplay = document.getElementById('ci-display');
    if (ciDisplay) ciDisplay.textContent = Utils.fmtTime(now);
    const action = document.getElementById('att-action');
    if (action) {
      action.innerHTML = `<button class="btn btn-error w-full" onclick="doCheckOut('${res.id||''}')">🚪 Check Out</button>`;
    }
    Utils.toast(status === 'late' ? '⚠️ Checked in — marked Late' : '✓ Checked in successfully');
  } catch(e) {
    Utils.toast('Check-in failed. Try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '👆 Check In'; }
  }
};

window.doCheckOut = async (recordId) => {
  const btn = document.getElementById('co-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Getting GPS…'; }
  const loc = await Utils.getGPS();
  const now = new Date().toISOString();
  try {
    await API.checkOut({ id: recordId, checkOutTime: now, checkOutLocation: loc });
    const coDisplay = document.getElementById('co-display');
    if (coDisplay) coDisplay.textContent = Utils.fmtTime(now);
    const action = document.getElementById('att-action');
    if (action) action.innerHTML = `<div class="success-banner">✓ Attendance complete for today</div>`;
    Utils.toast('✓ Checked out successfully');
  } catch(e) {
    Utils.toast('Check-out failed. Try again.', 'error');
    if (btn) { btn.disabled = false; btn.textContent = '🚪 Check Out'; }
  }
};
