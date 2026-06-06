// ─── Tenant Management Module ─────────────────────────────────────────────────
Router.register('tenants', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('tenants');

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Tenants</div>
    ${Auth.can('manage_tenants') ? `<button class="btn-sm btn-primary" onclick="Router.go('add-tenant')">+ Add</button>` : '<div style="width:40px"></div>'}
  </div>
  <div class="sub-tabs">
    <button class="sub-tab active" onclick="showTenantTab(this,'stores')">Stores</button>
    <button class="sub-tab" onclick="showTenantTab(this,'violations')">Violations</button>
    <button class="sub-tab" onclick="showTenantTab(this,'complaints')">Complaints</button>
    <button class="sub-tab" onclick="showTenantTab(this,'utilities')">Utilities</button>
  </div>
  <div class="scroll-area" id="tenant-content"><div class="loading-spinner"></div></div>`;

  loadStores();
});

window.showTenantTab = (btn, tab) => {
  document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const fns = { stores:loadStores, violations:loadViolations, complaints:loadComplaints, utilities:loadUtilities };
  if (fns[tab]) fns[tab]();
};

async function loadStores() {
  const c = document.getElementById('tenant-content'); if (!c) return;
  try {
    const res = await API.getTenants();
    const tenants = res.tenants || [];
    if (!tenants.length) { c.innerHTML = '<div class="empty-state">No stores added yet</div>'; return; }
    c.innerHTML = tenants.map(t => `
    <div class="list-card" onclick="Router.go('tenant-detail',{id:'${t.id}'})">
      <div class="list-card-top">
        <div>
          <div class="list-card-title">${t.storeName}</div>
          <div class="list-card-meta">Unit: ${t.unitNo} · ${t.contactName}</div>
        </div>
        ${Utils.badge(t.isActive ? 'active' : 'inactive')}
      </div>
      <div class="list-card-meta">📞 ${t.contactPhone||'—'}</div>
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { c.innerHTML = '<div class="error-banner">Failed to load.</div>'; }
}

async function loadViolations() {
  const c = document.getElementById('tenant-content'); if (!c) return;
  c.innerHTML = `
  <div class="section-header" style="padding:12px 14px 4px">
    <h3>SOP Violations</h3>
    <button class="btn-sm btn-primary" onclick="Router.go('add-violation')">+ Log</button>
  </div>
  <div id="viol-list"><div class="loading-spinner"></div></div>`;
  try {
    const res = await API.getViolations({});
    const violations = res.violations || [];
    const list = document.getElementById('viol-list');
    if (!violations.length) { list.innerHTML = '<div class="empty-state">No violations logged</div>'; return; }
    list.innerHTML = violations.map(v => `
    <div class="list-card">
      <div class="list-card-top">
        <div>
          <div class="list-card-title">${v.storeName}</div>
          <div class="list-card-meta">${v.category} · ${Utils.fmtDate(v.createdAt)}</div>
        </div>
        ${Utils.badge(v.severity||'moderate')}
      </div>
      <div class="list-card-meta">${v.description}</div>
      ${v.penaltyAmount ? `<div class="penalty-tag">Penalty: ${Utils.fmtCurrency(v.penaltyAmount)}</div>` : ''}
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { document.getElementById('viol-list').innerHTML = '<div class="error-banner">Failed.</div>'; }
}

async function loadComplaints() {
  const c = document.getElementById('tenant-content'); if (!c) return;
  c.innerHTML = `
  <div class="section-header" style="padding:12px 14px 4px">
    <h3>Tenant Complaints</h3>
    <button class="btn-sm btn-primary" onclick="Router.go('add-complaint')">+ Log</button>
  </div>
  <div id="comp-list"><div class="loading-spinner"></div></div>`;
  try {
    const res = await API.getComplaints({});
    const complaints = res.complaints || [];
    const list = document.getElementById('comp-list');
    if (!complaints.length) { list.innerHTML = '<div class="empty-state">No complaints</div>'; return; }
    list.innerHTML = complaints.map(comp => `
    <div class="list-card">
      <div class="list-card-top">
        <div>
          <div class="list-card-title">${comp.storeName}</div>
          <div class="list-card-meta">${Utils.fmtDate(comp.createdAt)}</div>
        </div>
        ${Utils.badge(comp.status||'open')}
      </div>
      <div class="list-card-meta">${comp.description}</div>
      ${comp.status === 'open' && Auth.can('manage_tenants') ? `
      <button class="btn-sm btn-success" style="margin-top:8px" onclick="resolveComp('${comp.id}')">Mark Resolved</button>` : ''}
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { document.getElementById('comp-list').innerHTML = '<div class="error-banner">Failed.</div>'; }
}

window.resolveComp = async (id) => {
  try {
    await API.updateComplaint(id, 'resolved');
    Utils.toast('✓ Complaint resolved');
    loadComplaints();
  } catch { Utils.toast('Failed', 'error'); }
};

async function loadUtilities() {
  const c = document.getElementById('tenant-content'); if (!c) return;
  const user = Auth.current();
  const canFill = user?.role === 'mep_manager' || Auth.can('view_all');
  const canApprove = Auth.can('approve_utility');
  const prevMonth = Utils.prevMonth();

  c.innerHTML = `
  <div class="section-header" style="padding:12px 14px 4px">
    <h3>Utility Meter Readings</h3>
    ${canFill ? `<button class="btn-sm btn-primary" onclick="Router.go('utility-reading')">+ Fill</button>` : ''}
  </div>
  <div class="info-banner">📋 Monthly readings for <b>${prevMonth}</b> — due 1st of each month by MEP Manager</div>
  <div id="util-list"><div class="loading-spinner"></div></div>`;

  try {
    const res = await API.getUtilityReadings({ month: prevMonth });
    const readings = res.readings || [];
    const list = document.getElementById('util-list');
    if (!readings.length) { list.innerHTML = '<div class="empty-state">No readings for this month yet</div>'; return; }
    list.innerHTML = readings.map(r => `
    <div class="list-card">
      <div class="list-card-top">
        <span class="list-card-title">Readings — ${r.month}</span>
        ${Utils.badge(r.status||'pending')}
      </div>
      <div class="utility-grid">
        <div class="util-item"><div class="util-lbl">⚡ Electricity</div><div class="util-val">${r.electricity||'—'} kWh</div></div>
        <div class="util-item"><div class="util-lbl">⛽ DG</div><div class="util-val">${r.dg||'—'} L</div></div>
        <div class="util-item"><div class="util-lbl">🔥 Gas</div><div class="util-val">${r.gas||'—'} units</div></div>
        <div class="util-item"><div class="util-lbl">💧 Water</div><div class="util-val">${r.water||'—'} kL</div></div>
      </div>
      <div class="list-card-meta">Filled by: ${r.filledByName||'—'}</div>
      ${canApprove && r.status === 'submitted' ? `
      <div class="task-actions">
        <button class="btn-sm btn-success" onclick="approveUtil('${r.id}','approved')">✓ Approve & Send to Finance</button>
      </div>` : ''}
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { document.getElementById('util-list').innerHTML = '<div class="error-banner">Failed.</div>'; }
}

window.approveUtil = async (id, status) => {
  try {
    await API.approveUtilityReading(id, status);
    Utils.toast('✓ Approved — Finance notified');
    loadUtilities();
  } catch { Utils.toast('Failed', 'error'); }
};

// ── Utility Reading Form ──────────────────────────────────────────────────────
Router.register('utility-reading', (view) => {
  const user = Auth.require(); if (!user) return;
  const prevMonth = Utils.prevMonth();

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Utility Readings</div>
    <div style="width:40px"></div>
  </div>
  <div class="scroll-area">
    <div class="form-body">
      <div class="info-banner">Fill meter readings for <b>${prevMonth}</b></div>
      <label class="form-lbl">⚡ Electricity (kWh) *</label>
      <input id="u-elec" type="number" class="form-input" placeholder="e.g. 42500">
      <label class="form-lbl">⛽ DG (Litres) *</label>
      <input id="u-dg" type="number" class="form-input" placeholder="e.g. 850">
      <label class="form-lbl">🔥 Gas (Units) *</label>
      <input id="u-gas" type="number" class="form-input" placeholder="e.g. 320">
      <label class="form-lbl">💧 Water (kilo-Litres) *</label>
      <input id="u-water" type="number" class="form-input" placeholder="e.g. 48">
      <label class="form-lbl">Notes</label>
      <textarea id="u-notes" class="form-input" rows="2" placeholder="Any remarks..."></textarea>
      <div style="height:20px"></div>
      <button class="btn btn-primary w-full" onclick="submitUtility()">📤 Submit for Approval</button>
      <div style="height:80px"></div>
    </div>
  </div>`;
});

window.submitUtility = async () => {
  const user = Auth.current();
  const elec = document.getElementById('u-elec').value;
  const dg = document.getElementById('u-dg').value;
  const gas = document.getElementById('u-gas').value;
  const water = document.getElementById('u-water').value;
  if (!elec||!dg||!gas||!water) { Utils.toast('Fill all meter readings', 'error'); return; }

  const btn = document.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Submitting…';
  try {
    await API.saveUtilityReading({
      id: Utils.uid(), month: Utils.prevMonth(),
      electricity: elec, dg, gas, water,
      notes: document.getElementById('u-notes').value,
      filledBy: user.id, filledByName: user.name,
      status: 'submitted', createdAt: Utils.nowISO(),
    });
    Utils.toast('✓ Submitted to Project Head for approval');
    Router.go('tenants');
  } catch {
    Utils.toast('Failed to submit', 'error');
    btn.disabled = false; btn.textContent = '📤 Submit for Approval';
  }
};
