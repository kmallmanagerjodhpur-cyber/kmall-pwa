// ─── SOP Checklist Module ─────────────────────────────────────────────────────
Router.register('checklist', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('checklist');
  const today = Utils.today();

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div><div class="topbar-title">Daily Checklist</div><div class="topbar-role">${today}</div></div>
    <div style="width:40px"></div>
  </div>
  <div class="cl-progress-bar-wrap" id="cl-progress-wrap">
    <div class="cl-progress-header"><span>Today's Progress</span><span id="cl-pct">0%</span></div>
    <div class="prog-bar"><div class="prog-fill" id="cl-fill" style="width:0%"></div></div>
    <div class="cl-progress-sub" id="cl-sub">Loading…</div>
  </div>
  <div class="scroll-area" id="cl-body"><div class="loading-spinner"></div></div>`;

  try {
    const res = await API.getChecklist({ userId: user.id, date: today });
    const saved = res.data;
    const roleItems = window.CHECKLISTS[user.role] || [];
    renderChecklist(roleItems, saved);
  } catch {
    renderChecklist(window.CHECKLISTS[user.role] || [], null);
  }
});

let _clItems = [];
let _clId = null;

function renderChecklist(roleItems, saved) {
  const body = document.getElementById('cl-body');
  if (!body) return;

  _clId = saved?.id || null;
  const savedMap = {};
  if (saved?.items) {
    (typeof saved.items === 'string' ? JSON.parse(saved.items) : saved.items)
      .forEach(i => { savedMap[i.itemId] = i; });
  }

  _clItems = roleItems.map(item => ({
    ...item,
    completed: savedMap[item.id]?.completed || false,
    note: savedMap[item.id]?.note || '',
    completedAt: savedMap[item.id]?.completedAt || null,
  }));

  updateProgress();

  const daily = _clItems.filter(i => i.freq === 'daily');
  const periodic = _clItems.filter(i => i.freq !== 'daily');

  body.innerHTML = `
  ${daily.length ? `
  <div class="cl-section-title">Daily Tasks</div>
  ${daily.map((item, i) => clItemHTML(item, _clItems.indexOf(item))).join('')}` : ''}
  ${periodic.length ? `
  <div class="cl-section-title">Periodic Tasks</div>
  ${periodic.map(item => clItemHTML(item, _clItems.indexOf(item))).join('')}` : ''}
  ${!_clItems.length ? '<div class="empty-state">No checklist for your role</div>' : ''}
  <div style="height:90px"></div>`;

  body.innerHTML += `
  <div class="cl-action-bar">
    <button class="btn btn-outline flex-1" onclick="saveCL(false)">💾 Save</button>
    <button class="btn btn-primary flex-2" onclick="saveCL(true)">📤 Submit</button>
  </div>`;
}

function clItemHTML(item, idx) {
  return `
  <div class="cl-item ${item.completed ? 'done' : ''}" id="cli-${idx}">
    <button class="cl-check ${item.completed ? 'done' : ''}" onclick="toggleCL(${idx})" aria-label="Toggle">
      ${item.completed ? '✓' : ''}
    </button>
    <div class="cl-item-body">
      <div class="cl-task ${item.completed ? 'done' : ''}" onclick="toggleCL(${idx})">${item.task}</div>
      ${item.completed && item.completedAt ? `<div class="cl-done-time">✓ ${Utils.fmtTime(item.completedAt)}</div>` : ''}
    </div>
  </div>`;
}

function updateProgress() {
  const done = _clItems.filter(i => i.completed).length;
  const total = _clItems.length;
  const pct = total ? Math.round(done/total*100) : 0;
  const pctEl = document.getElementById('cl-pct');
  const fillEl = document.getElementById('cl-fill');
  const subEl = document.getElementById('cl-sub');
  if (pctEl) pctEl.textContent = pct + '%';
  if (fillEl) fillEl.style.width = pct + '%';
  if (subEl) subEl.textContent = `${done} of ${total} tasks completed`;
}

window.toggleCL = (idx) => {
  _clItems[idx].completed = !_clItems[idx].completed;
  _clItems[idx].completedAt = _clItems[idx].completed ? Utils.nowISO() : null;
  updateProgress();
  const el = document.getElementById(`cli-${idx}`);
  if (el) {
    el.className = `cl-item ${_clItems[idx].completed ? 'done' : ''}`;
    el.querySelector('.cl-check').className = `cl-check ${_clItems[idx].completed ? 'done' : ''}`;
    el.querySelector('.cl-check').textContent = _clItems[idx].completed ? '✓' : '';
    const taskEl = el.querySelector('.cl-task');
    if (taskEl) taskEl.className = `cl-task ${_clItems[idx].completed ? 'done' : ''}`;
    const timeEl = el.querySelector('.cl-done-time');
    if (_clItems[idx].completed) {
      if (!timeEl) {
        const t = document.createElement('div');
        t.className = 'cl-done-time';
        t.textContent = `✓ ${Utils.fmtTime(Utils.nowISO())}`;
        el.querySelector('.cl-item-body').appendChild(t);
      }
    } else if (timeEl) timeEl.remove();
  }
};

window.saveCL = async (submit) => {
  const user = Auth.current();
  if (!user) return;
  const done = _clItems.filter(i => i.completed).length;
  const pct = _clItems.length ? Math.round(done/_clItems.length*100) : 0;

  if (submit && pct < 100) {
    if (!confirm(`Only ${pct}% complete. Submit anyway?`)) return;
  }

  const btn = submit ? document.querySelector('.btn-primary') : document.querySelector('.btn-outline');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    await API.saveChecklist({
      id: _clId || Utils.uid(),
      userId: user.id, userName: user.name, userRole: user.role,
      date: Utils.today(),
      items: JSON.stringify(_clItems.map(i => ({ itemId: i.id, task: i.task, completed: i.completed, note: i.note, completedAt: i.completedAt }))),
      completionPct: pct,
      submittedAt: submit ? Utils.nowISO() : undefined,
    });
    Utils.toast(submit ? `✓ Checklist submitted (${pct}%)` : '✓ Progress saved');
  } catch {
    Utils.toast('Failed to save', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = submit ? '📤 Submit' : '💾 Save'; }
  }
};
