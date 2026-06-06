// ─── Incidents Module ─────────────────────────────────────────────────────────
Router.register('incidents', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('incidents');

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Incidents</div>
    <button class="btn-sm btn-error" onclick="Router.go('report-incident')">+ Report</button>
  </div>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="loadInc(this,'open')">Open</button>
    <button class="filter-btn" onclick="loadInc(this,'today')">Today</button>
    <button class="filter-btn" onclick="loadInc(this,'all')">All</button>
  </div>
  <div class="scroll-area" id="inc-list"><div class="loading-spinner"></div></div>`;

  await loadInc(null, 'open');
});

const SEV_COLORS = { critical:'#C62828', major:'#E65100', moderate:'#F9A825', minor:'#2E7D32' };

async function loadInc(btn, filter) {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const list = document.getElementById('inc-list');
  if (!list) return;
  try {
    const params = filter === 'open' ? { status: 'open,reported,in_progress,escalated' } :
      filter === 'today' ? { date: Utils.today() } : {};
    const res = await API.getIncidents(params);
    const incidents = res.incidents || [];
    if (!incidents.length) { list.innerHTML = `<div class="empty-state">${filter==='open'?'No open incidents 🎉':'No incidents found'}</div>`; return; }
    list.innerHTML = incidents.map(inc => `
    <div class="list-card incident-card" style="border-left-color:${SEV_COLORS[inc.severity]||'#ccc'}" onclick="Router.go('incident-detail',{id:'${inc.id}'})">
      <div class="list-card-top">
        <div>
          <span class="cat-tag">${inc.category}</span>
          ${Utils.badge(inc.severity)}
        </div>
        ${Utils.badge(inc.status)}
      </div>
      <div class="list-card-title">${inc.title}</div>
      <div class="list-card-meta">📍 ${inc.zone} · ${Utils.fmtDateTime(inc.createdAt)}</div>
      <div class="list-card-meta">👤 ${inc.reportedByName}</div>
      ${inc.status !== 'resolved' && inc.status !== 'closed' && Auth.can('view_all') ? `
      <div class="task-actions" onclick="event.stopPropagation()">
        ${inc.status === 'reported' ? `<button class="btn-sm btn-info" onclick="updateInc('${inc.id}','in_progress')">Start</button>` : ''}
        ${inc.status === 'in_progress' ? `<button class="btn-sm btn-success" onclick="updateInc('${inc.id}','resolved')">Resolve ✓</button>` : ''}
        ${['critical','major'].includes(inc.severity) && inc.status !== 'escalated' ? `<button class="btn-sm btn-error" onclick="updateInc('${inc.id}','escalated')">Escalate</button>` : ''}
      </div>` : ''}
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { list.innerHTML = '<div class="error-banner">Failed to load.</div>'; }
}

window.updateInc = async (id, status) => {
  try {
    const user = Auth.current();
    await API.updateIncident(id, { status, resolvedBy: status==='resolved'?user.id:undefined, resolvedAt: status==='resolved'?Utils.nowISO():undefined });
    Utils.toast(status==='resolved' ? '✓ Incident resolved' : '✓ Updated');
    loadInc(null, 'open');
  } catch { Utils.toast('Failed to update', 'error'); }
};

// ── Report Incident Form ──────────────────────────────────────────────────────
Router.register('report-incident', (view) => {
  const user = Auth.require(); if (!user) return;

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Report Incident</div>
    <div style="width:40px"></div>
  </div>
  <div class="scroll-area">
    <div class="form-body">
      <label class="form-lbl">Severity *</label>
      <div class="sev-row">
        <button class="sev-btn" data-sev="minor" onclick="pickSev(this)">Minor</button>
        <button class="sev-btn active" data-sev="moderate" onclick="pickSev(this)">Moderate</button>
        <button class="sev-btn" data-sev="major" onclick="pickSev(this)">Major</button>
        <button class="sev-btn" data-sev="critical" onclick="pickSev(this)">Critical</button>
      </div>
      <div id="crit-warn" style="display:none" class="alert-card error">
        ⚠️ CRITICAL — Notify Security Head + Mall Manager immediately!
      </div>
      <label class="form-lbl">Category *</label>
      <div class="chip-group scroll-x" id="inc-cat">
        ${window.INCIDENT_CATEGORIES.map(c=>`<button class="chip" onclick="selChip(this,'inc-cat')">${c}</button>`).join('')}
      </div>
      <label class="form-lbl">Zone / Location *</label>
      <div class="chip-group scroll-x" id="inc-zone">
        ${window.MALL_ZONES.map(z=>`<button class="chip" onclick="selChip(this,'inc-zone')">${z}</button>`).join('')}
      </div>
      <label class="form-lbl">Incident Title *</label>
      <input id="inc-title" class="form-input" placeholder="Brief title...">
      <label class="form-lbl">Description *</label>
      <textarea id="inc-desc" class="form-input" rows="5" placeholder="Who, what, when, where — be specific..."></textarea>
      <label class="form-lbl">Immediate Actions Taken</label>
      <textarea id="inc-actions" class="form-input" rows="3" placeholder="Steps taken so far..."></textarea>
      <label class="form-lbl">Emergency Services</label>
      <div class="toggle-list">
        ${[['injuries','🩺 Injuries Reported'],['ambulance','🚑 Ambulance Called (108)'],['police','🚔 Police Involved (100)'],['fire_dept','🔥 Fire Dept. Called (101)']].map(([id,lbl])=>`
        <div class="toggle-row">
          <span>${lbl}</span>
          <label class="toggle-switch"><input type="checkbox" id="t-${id}"><span class="toggle-thumb"></span></label>
        </div>`).join('')}
      </div>
      <div class="form-ts">⏰ ${new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true})}</div>
      <button class="btn btn-error w-full" onclick="submitInc()">🚨 Submit Incident Report</button>
      <div style="height:80px"></div>
    </div>
  </div>`;
});

window.pickSev = (btn) => {
  document.querySelectorAll('.sev-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const warn = document.getElementById('crit-warn');
  if (warn) warn.style.display = btn.dataset.sev === 'critical' ? 'flex' : 'none';
};

window.submitInc = async () => {
  const user = Auth.current();
  const severity = document.querySelector('.sev-btn.active')?.dataset.sev || 'moderate';
  const category = document.querySelector('#inc-cat .chip.active')?.textContent;
  const zone = document.querySelector('#inc-zone .chip.active')?.textContent;
  const title = document.getElementById('inc-title').value.trim();
  const desc = document.getElementById('inc-desc').value.trim();

  if (!category) { Utils.toast('Select a category', 'error'); return; }
  if (!zone) { Utils.toast('Select a zone', 'error'); return; }
  if (!title) { Utils.toast('Enter a title', 'error'); return; }
  if (!desc) { Utils.toast('Describe the incident', 'error'); return; }

  const btn = document.querySelector('.btn-error');
  btn.disabled = true; btn.textContent = 'Submitting…';

  try {
    await API.addIncident({
      id: Utils.uid(),
      reportedBy: user.id, reportedByName: user.name, reportedByRole: user.role,
      dateTime: Utils.nowISO(), severity, category, zone, title,
      description: desc,
      actionsTaken: document.getElementById('inc-actions').value.trim(),
      injuriesReported: document.getElementById('t-injuries')?.checked || false,
      ambulanceCalled: document.getElementById('t-ambulance')?.checked || false,
      policeInvolved: document.getElementById('t-police')?.checked || false,
      fireDepInvolved: document.getElementById('t-fire_dept')?.checked || false,
      status: 'reported', createdAt: Utils.nowISO(),
    });
    Utils.toast('✓ Incident reported');
    Router.go('incidents');
  } catch {
    Utils.toast('Failed to submit', 'error');
    btn.disabled = false; btn.textContent = '🚨 Submit Incident Report';
  }
};
