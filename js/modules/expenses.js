// ─── Petty Cash / Expenses Module ────────────────────────────────────────────
Router.register('expenses', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('expenses');
  const canApprove = Auth.can('approve_expense');
  const today = Utils.today();

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div><div class="topbar-title">Petty Cash</div><div class="topbar-role">${today}</div></div>
    <button class="btn-sm btn-primary" onclick="Router.go('add-expense')">+ Add</button>
  </div>
  <div id="exp-summary" class="exp-summary-row"></div>
  <div class="filter-bar">
    <button class="filter-btn active" onclick="loadExp(this,'today')">Today</button>
    <button class="filter-btn" onclick="loadExp(this,'pending')">Pending</button>
    <button class="filter-btn" onclick="loadExp(this,'week')">This Week</button>
    ${canApprove ? `<button class="filter-btn" onclick="loadExp(this,'all')">All</button>` : ''}
  </div>
  <div class="scroll-area" id="exp-list"><div class="loading-spinner"></div></div>`;

  await loadExp(null, 'today');
});

async function loadExp(btn, filter) {
  if (btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
  const user = Auth.current();
  const list = document.getElementById('exp-list');
  if (!list) return;

  try {
    const params = filter === 'pending' ? { status:'pending' } :
      filter === 'today' ? { date: Utils.today() } :
      filter === 'week' ? { week: true } : {};

    const res = await API.getExpenses(params);
    const expenses = res.expenses || [];

    // Update summary
    const summary = document.getElementById('exp-summary');
    if (summary) {
      const total = expenses.reduce((s,e) => s+Number(e.amount||0), 0);
      const approved = expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+Number(e.amount||0),0);
      const pending = expenses.filter(e=>e.status==='pending').reduce((s,e)=>s+Number(e.amount||0),0);
      summary.innerHTML = `
        <div class="exp-sum-card"><div class="exp-sum-lbl">Total</div><div class="exp-sum-val">${Utils.fmtCurrency(total)}</div></div>
        <div class="exp-sum-card success"><div class="exp-sum-lbl">Approved</div><div class="exp-sum-val">${Utils.fmtCurrency(approved)}</div></div>
        <div class="exp-sum-card warn"><div class="exp-sum-lbl">Pending</div><div class="exp-sum-val">${Utils.fmtCurrency(pending)}</div></div>`;
    }

    if (!expenses.length) { list.innerHTML = '<div class="empty-state">No expenses found</div>'; return; }

    list.innerHTML = expenses.map(e => `
    <div class="list-card">
      <div class="list-card-top">
        <span class="cat-tag">${e.category}</span>${Utils.badge(e.status)}
      </div>
      <div class="list-card-title">${e.description}</div>
      <div class="exp-card-bottom">
        <div>
          <div class="exp-amount">${Utils.fmtCurrency(e.amount)}</div>
          <div class="list-card-meta">${e.submittedByName} · ${Utils.fmtDate(e.date)}</div>
        </div>
        ${Auth.can('approve_expense') && e.status==='pending' ? `
        <div class="approval-btns">
          <button class="btn-sm btn-success" onclick="approveExp(event,'${e.id}','approved')">✓ Approve</button>
          <button class="btn-sm btn-error" onclick="approveExp(event,'${e.id}','rejected')">✕</button>
        </div>` : ''}
      </div>
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { list.innerHTML = '<div class="error-banner">Failed to load expenses.</div>'; }
}

window.approveExp = async (e, id, status) => {
  e.stopPropagation();
  const btn = e.target; btn.disabled = true;
  try {
    const user = Auth.current();
    await API.updateExpense(id, status, user.id);
    Utils.toast(status === 'approved' ? '✓ Approved' : '✓ Rejected');
    loadExp(null, 'pending');
  } catch { Utils.toast('Failed', 'error'); btn.disabled = false; }
};

// ── Add Expense Form ──────────────────────────────────────────────────────────
Router.register('add-expense', (view) => {
  const user = Auth.require(); if (!user) return;

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Add Expense</div>
    <div style="width:40px"></div>
  </div>
  <div class="scroll-area">
    <div class="form-body">
      <label class="form-lbl">Category *</label>
      <div class="chip-group" id="e-cat">
        ${window.EXPENSE_CATEGORIES.map((c,i) => `<button class="chip${i===0?' active':''}" onclick="selChip(this,'e-cat')">${c}</button>`).join('')}
      </div>
      <label class="form-lbl">Description *</label>
      <input id="e-desc" class="form-input" placeholder="What was this expense for?">
      <label class="form-lbl">Amount (₹) *</label>
      <input id="e-amt" type="number" class="form-input" placeholder="0.00" step="0.01">
      <label class="form-lbl">Date</label>
      <input id="e-date" type="date" class="form-input" value="${Utils.today()}">
      <label class="form-lbl">Receipt / Note (optional)</label>
      <textarea id="e-note" class="form-input" rows="2" placeholder="Reference number, vendor name, etc."></textarea>
      <div style="height:20px"></div>
      <button class="btn btn-primary w-full" onclick="submitExp()">Add Entry</button>
      <div style="height:80px"></div>
    </div>
  </div>`;
});

window.submitExp = async () => {
  const user = Auth.current();
  const category = document.querySelector('#e-cat .chip.active')?.textContent;
  const desc = document.getElementById('e-desc').value.trim();
  const amt = parseFloat(document.getElementById('e-amt').value);
  const date = document.getElementById('e-date').value;

  if (!category) { Utils.toast('Select a category', 'error'); return; }
  if (!desc) { Utils.toast('Enter a description', 'error'); return; }
  if (!amt || amt <= 0) { Utils.toast('Enter a valid amount', 'error'); return; }

  const btn = document.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Saving…';

  try {
    await API.addExpense({
      id: Utils.uid(),
      submittedBy: user.id, submittedByName: user.name,
      submittedByRole: user.role, category, description: desc,
      amount: amt, date,
      note: document.getElementById('e-note').value.trim(),
      status: 'pending', createdAt: Utils.nowISO(),
    });
    Utils.toast('✓ Expense added');
    Router.go('expenses');
  } catch {
    Utils.toast('Failed to save expense', 'error');
    btn.disabled = false; btn.textContent = 'Add Entry';
  }
};
