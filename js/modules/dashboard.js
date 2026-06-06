// ─── Dashboard Module ─────────────────────────────────────────────────────────
Router.register('dashboard', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('dashboard');
  const isAdmin = ['super_admin','project_head'].includes(user.role);

  view.innerHTML = `
  <div class="topbar">
    <div class="topbar-left">
      <img src="assets/icon-192.png" class="topbar-logo">
      <div>
        <div class="topbar-greeting">Good ${greeting()}, ${user.name.split(' ')[0]}</div>
        <div class="topbar-role">${Utils.roleLabel(user.role)}</div>
      </div>
    </div>
    <button class="icon-btn" onclick="Router.go('notifications')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    </button>
  </div>
  <div class="date-bar">
    <span>📅 ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</span>
    <span class="mall-open-badge"><span class="dot-green"></span> Mall Open</span>
  </div>
  <div class="scroll-area" id="dash-content">
    <div class="loading-spinner"></div>
  </div>`;

  const content = document.getElementById('dash-content');

  try {
    const [attRes, taskRes, expRes, incRes] = await Promise.all([
      API.getTodayAttendance(),
      API.getTasks({ date: Utils.today(), assignedTo: isAdmin ? 'all' : user.id }),
      isAdmin ? API.getExpenses({ status: 'pending', date: Utils.today() }) : Promise.resolve({ expenses: [] }),
      isAdmin ? API.getIncidents({ status: 'open' }) : Promise.resolve({ incidents: [] }),
    ]);

    const attendance = attRes.records || [];
    const tasks = taskRes.tasks || [];
    const pendingExp = expRes.expenses || [];
    const openInc = incRes.incidents || [];

    const myAtt = attendance.find(a => a.userId === user.id);
    const presentCount = attendance.filter(a => a.checkInTime).length;

    content.innerHTML = isAdmin
      ? adminDash(user, attendance, tasks, pendingExp, openInc, presentCount)
      : staffDash(user, myAtt, tasks);
  } catch(e) {
    content.innerHTML = `<div class="error-banner">⚠️ Could not load data. Check your connection.</div>` + staffDash(user, null, []);
  }
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
}

function adminDash(user, attendance, tasks, pendingExp, openInc, presentCount) {
  const late = attendance.filter(a => a.status === 'late').length;
  const absent = attendance.filter(a => !a.checkInTime).length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate < Utils.today());

  return `
  <div class="dash-stats">
    <div class="stat-card clickable" onclick="Router.go('attendance')">
      <div class="stat-icon bg-success">👥</div>
      <div class="stat-val">${presentCount}</div>
      <div class="stat-lbl">Present Today</div>
    </div>
    <div class="stat-card clickable" onclick="Router.go('attendance')">
      <div class="stat-icon bg-error">❌</div>
      <div class="stat-val">${absent}</div>
      <div class="stat-lbl">Absent</div>
    </div>
    <div class="stat-card clickable" onclick="Router.go('tasks')">
      <div class="stat-icon bg-warn">⏰</div>
      <div class="stat-val">${overdueTasks.length}</div>
      <div class="stat-lbl">Overdue Tasks</div>
    </div>
    <div class="stat-card clickable" onclick="Router.go('incidents')">
      <div class="stat-icon bg-error">🚨</div>
      <div class="stat-val">${openInc.length}</div>
      <div class="stat-lbl">Open Incidents</div>
    </div>
  </div>

  ${pendingExp.length ? `
  <div class="section-header"><h3>Expense Approvals</h3><a onclick="Router.go('expenses')">View all →</a></div>
  <div class="alert-card warn">
    <span>💰 ${pendingExp.length} expense${pendingExp.length>1?'s':''} pending approval</span>
    <button class="btn-sm btn-primary" onclick="Router.go('expenses')">Review</button>
  </div>` : ''}

  ${openInc.length ? `
  <div class="section-header"><h3>Open Incidents</h3><a onclick="Router.go('incidents')">View all →</a></div>
  ${openInc.slice(0,2).map(i => `
  <div class="list-card incident-card sev-${i.severity}" onclick="Router.go('incident-detail',{id:'${i.id}'})">
    <div class="list-card-top">
      <span class="cat-tag">${i.category}</span>${Utils.badge(i.severity)}
    </div>
    <div class="list-card-title">${i.title}</div>
    <div class="list-card-meta">📍 ${i.zone} · ${Utils.fmtDateTime(i.createdAt)}</div>
  </div>`).join('')}` : ''}

  <div class="section-header"><h3>Today's Attendance</h3><a onclick="Router.go('attendance')">Full report →</a></div>
  <div class="att-grid">
    ${attendance.length === 0 ? '<div class="empty-state">No check-ins yet today</div>' :
      attendance.slice(0,6).map(a => `
      <div class="att-pill">
        <div class="att-avatar" style="background:${Utils.roleColor(a.userRole)}">${(a.userName||'?').charAt(0)}</div>
        <div>
          <div class="att-name">${a.userName}</div>
          <div class="att-time">${a.checkInTime ? Utils.fmtTime(a.checkInTime) : 'Not in'}</div>
        </div>
        ${Utils.badge(a.status || 'absent')}
      </div>`).join('')}
  </div>

  <div class="section-header"><h3>Task Overview</h3><a onclick="Router.go('tasks')">Manage →</a></div>
  ${taskOverview(tasks)}

  ${quickActions(user)}`;
}

function staffDash(user, att, tasks) {
  const myTasks = tasks.filter(t => t.assignedTo === user.id || !t.assignedTo);
  const pending = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const done = myTasks.filter(t => t.status === 'done');

  return `
  <div class="my-att-card">
    <div class="my-att-header">Today's Attendance</div>
    <div class="my-att-times">
      <div class="att-time-box">
        <div class="att-time-icon">🟢</div>
        <div class="att-time-lbl">Check In</div>
        <div class="att-time-val">${att?.checkInTime ? Utils.fmtTime(att.checkInTime) : '--:--'}</div>
      </div>
      <div class="att-divider"></div>
      <div class="att-time-box">
        <div class="att-time-icon">🔴</div>
        <div class="att-time-lbl">Check Out</div>
        <div class="att-time-val">${att?.checkOutTime ? Utils.fmtTime(att.checkOutTime) : '--:--'}</div>
      </div>
    </div>
    <button class="btn btn-primary w-full" onclick="Router.go('attendance')" style="margin-top:12px">
      ${!att?.checkInTime ? '👆 Mark Attendance' : !att?.checkOutTime ? '🚪 Check Out' : '✓ View Attendance'}
    </button>
  </div>

  <div class="section-header"><h3>My Tasks Today</h3><a onclick="Router.go('tasks')">All tasks →</a></div>
  <div class="task-summary">
    <div class="task-sum-box bg-warn"><div>${pending.length}</div><div>Pending</div></div>
    <div class="task-sum-box bg-success"><div>${done.length}</div><div>Done</div></div>
  </div>
  ${pending.slice(0,3).map(t => `
  <div class="list-card task-card priority-${t.priority||'medium'}" onclick="Router.go('task-detail',{id:'${t.id}'})">
    <div class="list-card-top"><span class="cat-tag">${t.priority||'medium'}</span>${Utils.badge(t.status)}</div>
    <div class="list-card-title">${t.title}</div>
    ${t.dueDate ? `<div class="list-card-meta">⏰ Due: ${Utils.fmtDate(t.dueDate)}</div>` : ''}
  </div>`).join('') || '<div class="empty-state">No pending tasks 🎉</div>'}

  ${quickActions(user)}`;
}

function taskOverview(tasks) {
  const byUser = {};
  tasks.forEach(t => {
    if (!byUser[t.assignedToName]) byUser[t.assignedToName] = { done:0, total:0 };
    byUser[t.assignedToName].total++;
    if (t.status === 'done') byUser[t.assignedToName].done++;
  });
  const entries = Object.entries(byUser).slice(0,5);
  if (!entries.length) return '<div class="empty-state">No tasks assigned today</div>';
  return `<div class="task-overview-list">
    ${entries.map(([name, s]) => `
    <div class="task-overview-row">
      <div class="task-overview-name">${name}</div>
      <div class="task-overview-bar">
        <div class="task-bar-fill" style="width:${s.total?Math.round(s.done/s.total*100):0}%"></div>
      </div>
      <div class="task-overview-count">${s.done}/${s.total}</div>
    </div>`).join('')}
  </div>`;
}

function quickActions(user) {
  const actions = [
    { icon:'👆', label:'Attendance', route:'attendance' },
    { icon:'✅', label:'Checklist', route:'checklist' },
    { icon:'📋', label:'EOD Report', route:'reports' },
    { icon:'🚨', label:'Incident', route:'incidents' },
  ];
  if (Auth.can('assign_tasks')) actions.push({ icon:'📌', label:'Assign Task', route:'tasks' });
  if (Auth.can('manage_tenants')) actions.push({ icon:'🏪', label:'Tenants', route:'tenants' });

  return `
  <div class="section-header"><h3>Quick Actions</h3></div>
  <div class="quick-grid">
    ${actions.map(a => `
    <button class="quick-btn" onclick="Router.go('${a.route}')">
      <span class="quick-icon">${a.icon}</span>
      <span class="quick-lbl">${a.label}</span>
    </button>`).join('')}
  </div>
  <div class="emergency-row">
    <span class="emergency-item">🔥 Fire: <b>101</b></span>
    <span class="emergency-item">🚔 Police: <b>100</b></span>
    <span class="emergency-item">🚑 Ambulance: <b>108</b></span>
  </div>
  <div style="height:80px"></div>`;
}
