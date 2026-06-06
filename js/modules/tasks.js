// ─── Task Management Module ───────────────────────────────────────────────────
Router.register('tasks', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('tasks');
  const canAssign = Auth.can('assign_tasks');

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Tasks</div>
    ${canAssign ? `<button class="btn-sm btn-primary" onclick="Router.go('assign-task')">+ Assign</button>` : '<div style="width:64px"></div>'}
  </div>
  <div class="filter-bar" id="task-filters">
    <button class="filter-btn active" data-filter="mine" onclick="setTaskFilter(this,'mine')">Mine</button>
    ${canAssign ? `<button class="filter-btn" data-filter="all" onclick="setTaskFilter(this,'all')">All Staff</button>` : ''}
    <button class="filter-btn" data-filter="pending" onclick="setTaskFilter(this,'pending')">Pending</button>
    <button class="filter-btn" data-filter="done" onclick="setTaskFilter(this,'done')">Done</button>
    <button class="filter-btn" data-filter="overdue" onclick="setTaskFilter(this,'overdue')">Overdue</button>
  </div>
  <div class="scroll-area" id="task-list"><div class="loading-spinner"></div></div>`;

  await loadTasks(user, 'mine');
});

async function loadTasks(user, filter) {
  const list = document.getElementById('task-list');
  if (!list) return;

  try {
    const params = filter === 'all' ? {} : filter === 'mine' ? { assignedTo: user.id } :
      filter === 'pending' ? { assignedTo: user.id, status: 'pending' } :
      filter === 'done' ? { assignedTo: user.id, status: 'done' } :
      { assignedTo: user.id, overdue: true };

    const res = await API.getTasks(params);
    const tasks = res.tasks || [];
    const today = Utils.today();

    if (!tasks.length) { list.innerHTML = '<div class="empty-state">No tasks found</div>'; return; }

    list.innerHTML = tasks.map(t => {
      const isOverdue = t.dueDate && t.dueDate < today && t.status !== 'done';
      return `
      <div class="list-card task-card priority-${t.priority||'medium'} ${isOverdue?'overdue-card':''}" onclick="Router.go('task-detail',{id:'${t.id}'})">
        <div class="list-card-top">
          <div class="task-info">
            <div class="list-card-title">${t.title}</div>
            <div class="list-card-meta">
              ${t.assignedToName ? `👤 ${t.assignedToName}` : ''}
              ${t.dueDate ? ` · ⏰ ${Utils.fmtDate(t.dueDate)}` : ''}
              ${t.frequency ? ` · 🔄 ${t.frequency}` : ''}
            </div>
          </div>
          ${Utils.badge(isOverdue ? 'overdue' : t.status)}
        </div>
        ${t.description ? `<div class="task-desc">${t.description}</div>` : ''}
        ${t.status !== 'done' ? `
        <div class="task-actions">
          ${t.status === 'pending' ? `<button class="btn-sm btn-info" onclick="updateTaskStatus(event,'${t.id}','in_progress')">Start</button>` : ''}
          ${t.status === 'in_progress' ? `<button class="btn-sm btn-success" onclick="updateTaskStatus(event,'${t.id}','done')">Mark Done ✓</button>` : ''}
          ${Auth.can('assign_tasks') ? `<button class="btn-sm btn-outline" onclick="Router.go('assign-task',{editId:'${t.id}'})">Edit</button>` : ''}
        </div>` : ''}
      </div>`;
    }).join('') + '<div style="height:80px"></div>';
  } catch(e) {
    list.innerHTML = '<div class="error-banner">Failed to load tasks.</div>';
  }
}

window.setTaskFilter = (btn, filter) => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const user = Auth.current();
  if (user) loadTasks(user, filter);
};

window.updateTaskStatus = async (e, id, status) => {
  e.stopPropagation();
  const btn = e.target;
  btn.disabled = true;
  try {
    await API.updateTask({ id, status, completedAt: status === 'done' ? Utils.nowISO() : undefined });
    Utils.toast(status === 'done' ? '✓ Task marked complete!' : '▶ Task started');
    const user = Auth.current();
    if (user) loadTasks(user, 'mine');
  } catch {
    Utils.toast('Failed to update task', 'error');
    btn.disabled = false;
  }
};

// ── Assign Task Form ──────────────────────────────────────────────────────────
Router.register('assign-task', async (view) => {
  const user = Auth.require(); if (!user) return;
  if (!Auth.can('assign_tasks')) { Utils.toast('No permission', 'error'); Router.back(); return; }

  const usersRes = await API.getUsers();
  const users = (usersRes.users || []).filter(u => u.isActive !== false && u.id !== user.id);

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Assign Task</div>
    <div style="width:40px"></div>
  </div>
  <div class="scroll-area">
    <div class="form-body">
      <label class="form-lbl">Assign To *</label>
      <select id="t-assignee" class="form-input">
        <option value="">Select staff member…</option>
        ${users.map(u => `<option value="${u.id}" data-name="${u.name}">${u.name} — ${Utils.roleLabel(u.role)}</option>`).join('')}
      </select>
      <label class="form-lbl">Task Title *</label>
      <input id="t-title" class="form-input" placeholder="e.g. HVAC pre-opening check">
      <label class="form-lbl">Description</label>
      <textarea id="t-desc" class="form-input" placeholder="Details, instructions..." rows="3"></textarea>
      <label class="form-lbl">Priority</label>
      <div class="chip-group" id="t-priority">
        <button class="chip" onclick="selChip(this,'t-priority')">Low</button>
        <button class="chip active" onclick="selChip(this,'t-priority')">Medium</button>
        <button class="chip" onclick="selChip(this,'t-priority')">High</button>
        <button class="chip" onclick="selChip(this,'t-priority')">Urgent</button>
      </div>
      <label class="form-lbl">Frequency</label>
      <div class="chip-group" id="t-freq">
        <button class="chip active" onclick="selChip(this,'t-freq')">Once</button>
        <button class="chip" onclick="selChip(this,'t-freq')">Daily</button>
        <button class="chip" onclick="selChip(this,'t-freq')">Weekly</button>
        <button class="chip" onclick="selChip(this,'t-freq')">Monthly</button>
      </div>
      <label class="form-lbl">Due Date</label>
      <input id="t-due" type="date" class="form-input" value="${Utils.today()}">
      <div style="height:20px"></div>
      <button class="btn btn-primary w-full" onclick="submitTask()">📌 Assign Task</button>
      <div style="height:80px"></div>
    </div>
  </div>`;
});

window.selChip = (btn, groupId) => {
  document.querySelectorAll(`#${groupId} .chip`).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};

window.submitTask = async () => {
  const user = Auth.current();
  const assigneeEl = document.getElementById('t-assignee');
  const assigneeId = assigneeEl.value;
  const assigneeName = assigneeEl.options[assigneeEl.selectedIndex]?.dataset.name || '';
  const title = document.getElementById('t-title').value.trim();
  const desc = document.getElementById('t-desc').value.trim();
  const priority = document.querySelector('#t-priority .chip.active')?.textContent?.toLowerCase() || 'medium';
  const freq = document.querySelector('#t-freq .chip.active')?.textContent?.toLowerCase() || 'once';
  const due = document.getElementById('t-due').value;

  if (!assigneeId) { Utils.toast('Select a staff member', 'error'); return; }
  if (!title) { Utils.toast('Enter a task title', 'error'); return; }

  const btn = document.querySelector('button.btn-primary');
  btn.disabled = true; btn.textContent = 'Assigning…';

  try {
    await API.createTask({
      id: Utils.uid(),
      title, description: desc, priority, frequency: freq,
      dueDate: due, status: 'pending',
      assignedTo: assigneeId, assignedToName: assigneeName,
      assignedBy: user.id, assignedByName: user.name,
      createdAt: Utils.nowISO(),
    });
    Utils.toast('✓ Task assigned to ' + assigneeName);
    Router.go('tasks');
  } catch {
    Utils.toast('Failed to assign task', 'error');
    btn.disabled = false; btn.textContent = '📌 Assign Task';
  }
};
