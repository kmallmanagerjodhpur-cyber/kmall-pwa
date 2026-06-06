// ─── Daily Reports / EOD Module ───────────────────────────────────────────────
Router.register('reports', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('reports');
  const canReview = Auth.can('review_reports');
  const today = Utils.today();

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div><div class="topbar-title">EOD Report</div><div class="topbar-role">${today}</div></div>
    ${canReview ? `<button class="icon-btn" onclick="Router.go('all-reports')">📂</button>` : '<div style="width:40px"></div>'}
  </div>
  <div class="scroll-area" id="rpt-view"><div class="loading-spinner"></div></div>`;

  try {
    const res = await API.getReports({ userId: user.id, date: today });
    const report = (res.reports || [])[0] || null;
    renderReportForm(document.getElementById('rpt-view'), report, user);
  } catch {
    renderReportForm(document.getElementById('rpt-view'), null, user);
  }
});

function renderReportForm(container, report, user) {
  const submitted = ['submitted','reviewed','approved'].includes(report?.status);
  const dis = submitted ? 'disabled' : '';

  container.innerHTML = `
  ${report ? `<div class="status-banner">${Utils.badge(report.status)} ${report.reviewerNote ? `<span class="review-note">💬 ${report.reviewerNote}</span>` : ''}</div>` : ''}
  <div class="form-body">
    <label class="form-lbl">Day Summary *</label>
    <textarea id="r-summary" class="form-input" rows="4" placeholder="Overview of today's operations..." ${dis}>${report?.summary||''}</textarea>
    <label class="form-lbl">Tasks Completed (one per line)</label>
    <textarea id="r-tasks" class="form-input" rows="4" placeholder="Morning walkthrough done&#10;HVAC checked — all zones 22°C" ${dis}>${report?.tasksCompleted||''}</textarea>
    <label class="form-lbl">Issues / Violations Noticed</label>
    <textarea id="r-issues" class="form-input" rows="3" placeholder="Any violations or issues..." ${dis}>${report?.issues||''}</textarea>
    <label class="form-lbl">Tomorrow's Plan</label>
    <textarea id="r-plan" class="form-input" rows="3" placeholder="Key activities for tomorrow..." ${dis}>${report?.tomorrowPlan||''}</textarea>
    <div style="height:10px"></div>
    ${!submitted ? `
    <div class="form-actions">
      <button class="btn btn-outline flex-1" onclick="saveRpt('draft')">💾 Save Draft</button>
      <button class="btn btn-primary flex-2" onclick="saveRpt('submitted')">📤 Submit</button>
    </div>` : `<div class="success-banner">✓ Report submitted</div>`}
    <div style="height:80px"></div>
  </div>`;

  window._reportId = report?.id || null;
}

window.saveRpt = async (status) => {
  const user = Auth.current();
  const summary = document.getElementById('r-summary').value.trim();
  if (status === 'submitted' && !summary) { Utils.toast('Add a summary first', 'error'); return; }

  const btn = status === 'submitted' ? document.querySelector('.btn-primary') : document.querySelector('.btn-outline');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    await API.saveReport({
      id: window._reportId || Utils.uid(),
      userId: user.id, userName: user.name, userRole: user.role,
      date: Utils.today(),
      summary,
      tasksCompleted: document.getElementById('r-tasks').value.trim(),
      issues: document.getElementById('r-issues').value.trim(),
      tomorrowPlan: document.getElementById('r-plan').value.trim(),
      status,
      submittedAt: status === 'submitted' ? Utils.nowISO() : undefined,
      updatedAt: Utils.nowISO(),
    });
    Utils.toast(status === 'submitted' ? '✓ Report submitted' : '✓ Draft saved');
    if (status === 'submitted') Router.go('reports');
  } catch {
    Utils.toast('Failed to save report', 'error');
    if (btn) { btn.disabled = false; }
  }
};

// ── All Reports (admin) ───────────────────────────────────────────────────────
Router.register('all-reports', async (view) => {
  const user = Auth.require(); if (!user) return;
  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">All Reports</div>
    <div style="width:40px"></div>
  </div>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="loadAllRpts(this,'${Utils.today()}')">Today</button>
    <button class="filter-btn" onclick="loadAllRpts(this,'pending')">Pending Review</button>
  </div>
  <div class="scroll-area" id="all-rpts"><div class="loading-spinner"></div></div>`;
  await loadAllRpts(null, Utils.today());
});

window.loadAllRpts = async (btn, filter) => {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const list = document.getElementById('all-rpts');
  if (!list) return;
  try {
    const params = filter === 'pending' ? { status: 'submitted' } : { date: filter };
    const res = await API.getReports(params);
    const reports = res.reports || [];
    if (!reports.length) { list.innerHTML = '<div class="empty-state">No reports found</div>'; return; }
    list.innerHTML = reports.map(r => `
    <div class="list-card" onclick="Router.go('review-report',{id:'${r.id}'})">
      <div class="list-card-top">
        <div class="user-info-row">
          <div class="user-avatar sm" style="background:${Utils.roleColor(r.userRole)}">${(r.userName||'?').charAt(0)}</div>
          <div>
            <div class="list-card-title">${r.userName}</div>
            <div class="list-card-meta">${Utils.roleLabel(r.userRole)} · ${Utils.fmtDate(r.date)}</div>
          </div>
        </div>
        ${Utils.badge(r.status)}
      </div>
      ${r.summary ? `<div class="report-preview">${r.summary.slice(0,80)}…</div>` : ''}
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { list.innerHTML = '<div class="error-banner">Failed to load.</div>'; }
};
