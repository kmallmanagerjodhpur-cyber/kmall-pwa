// ─── K-Mall PWA — Main App Controller ────────────────────────────────────────

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── Login Screen ──────────────────────────────────────────────────────────────
Router.register('login', (view) => {
  view.innerHTML = `
  <div class="login-screen">
    <div class="login-hero">
      <img src="assets/icon-192.png" class="login-logo" alt="K-Mall">
      <div class="login-brand">K-MALL</div>
      <div class="login-sub">Management Portal</div>
      <div class="login-company">Khalsa Builders and Associates</div>
    </div>
    <div class="login-card">
      <div class="login-card-title">Sign In</div>
      <div class="login-card-sub">Use your official credentials</div>
      <label class="form-lbl" style="margin-top:0">Employee ID</label>
      <input id="l-id" class="form-input" placeholder="e.g. KM-ADMIN" autocomplete="username" autocapitalize="none">
      <label class="form-lbl">Password</label>
      <div class="pw-wrap">
        <input id="l-pw" class="form-input" type="password" placeholder="Password" autocomplete="current-password">
        <button class="pw-toggle" onclick="togglePw()" tabindex="-1">👁</button>
      </div>
      <div id="l-err" class="form-error" style="display:none"></div>
      <button class="btn btn-primary w-full" id="l-btn" onclick="doLogin()" style="margin-top:18px">Sign In →</button>
      <div class="login-hint">Default: KM-ADMIN / admin@kmall</div>
    </div>
    <div class="login-footer">⏰ Mall Hours: 10:30 AM – 11:00 PM Daily</div>
  </div>`;

  document.getElementById('l-pw').addEventListener('keydown', e => {
    if (e.key === 'Enter') doLogin();
  });
});

window.togglePw = () => {
  const inp = document.getElementById('l-pw');
  if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
};

window.doLogin = async () => {
  const id = document.getElementById('l-id')?.value?.trim();
  const pw = document.getElementById('l-pw')?.value?.trim();
  const err = document.getElementById('l-err');
  const btn = document.getElementById('l-btn');

  if (!id || !pw) { showErr('Please enter your Employee ID and password.'); return; }

  btn.disabled = true; btn.textContent = 'Signing in…';
  err.style.display = 'none';

  try {
    await Auth.login(id, pw);
    Router.go('dashboard');
  } catch(e) {
    showErr('Invalid Employee ID or password.');
    btn.disabled = false; btn.textContent = 'Sign In →';
  }
};

function showErr(msg) {
  const err = document.getElementById('l-err');
  if (err) { err.textContent = msg; err.style.display = 'block'; }
}

// ── Profile / More ────────────────────────────────────────────────────────────
Router.register('profile', async (view) => {
  const user = Auth.require(); if (!user) return;
  Router.setTab('profile');

  view.innerHTML = `
  <div class="profile-hero">
    <div class="profile-avatar" style="background:${Utils.roleColor(user.role)}">${user.name.charAt(0).toUpperCase()}</div>
    <div class="profile-name">${user.name}</div>
    <div class="profile-role-badge" style="background:${Utils.roleColor(user.role)}">${Utils.roleLabel(user.role)}</div>
    <div class="profile-meta">${user.employeeId} ${user.email ? '· '+user.email : ''}</div>
  </div>
  <div class="scroll-area">
    ${Auth.can('manage_users') ? `
    <div class="profile-section-title">Admin</div>
    <div class="menu-item" onclick="Router.go('manage-users')">
      <span class="menu-icon">👥</span><span class="menu-label">Manage Staff Accounts</span><span class="menu-arrow">›</span>
    </div>` : ''}
    <div class="profile-section-title">Security</div>
    <div class="menu-item" onclick="Router.go('change-password')">
      <span class="menu-icon">🔒</span><span class="menu-label">Change Password</span><span class="menu-arrow">›</span>
    </div>
    <div class="profile-section-title">Emergency</div>
    <div class="emergency-list">
      <div class="emg-row"><span>🔥 Fire Dept.</span><b>101</b></div>
      <div class="emg-row"><span>🚔 Police</span><b>100</b></div>
      <div class="emg-row"><span>🚑 Ambulance</span><b>108</b></div>
    </div>
    <button class="btn logout-btn" onclick="Auth.logout()">🚪 Sign Out</button>
    <div class="app-version">K-Mall Manager v${window.KMALL_CONFIG.VERSION} · ${window.KMALL_CONFIG.COMPANY}</div>
    <div style="height:80px"></div>
  </div>`;
});

// ── Manage Users (Super Admin) ────────────────────────────────────────────────
Router.register('manage-users', async (view) => {
  const user = Auth.require(); if (!user) return;
  if (!Auth.can('manage_users')) { Utils.toast('Access denied', 'error'); Router.back(); return; }

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">Staff Accounts</div>
    <button class="btn-sm btn-primary" onclick="Router.go('add-user')">+ Add</button>
  </div>
  <div class="scroll-area" id="users-list"><div class="loading-spinner"></div></div>`;

  try {
    const res = await API.getUsers();
    const users = res.users || [];
    const list = document.getElementById('users-list');
    list.innerHTML = users.map(u => `
    <div class="list-card user-card">
      <div class="list-card-top">
        <div class="user-info-row">
          <div class="user-avatar" style="background:${Utils.roleColor(u.role)}">${(u.name||'?').charAt(0).toUpperCase()}</div>
          <div>
            <div class="list-card-title">${u.name}</div>
            <div class="list-card-meta">${Utils.roleLabel(u.role)} · ${u.employeeId}</div>
          </div>
        </div>
        ${Utils.badge(u.isActive !== false ? 'active' : 'inactive')}
      </div>
      <div class="task-actions">
        <button class="btn-sm btn-outline" onclick="Router.go('add-user',{editId:'${u.id}'})">Edit</button>
        <button class="btn-sm ${u.isActive!==false?'btn-error':'btn-success'}" onclick="toggleUser('${u.id}',${u.isActive!==false})">
          ${u.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>`).join('') + '<div style="height:80px"></div>';
  } catch { document.getElementById('users-list').innerHTML = '<div class="error-banner">Failed to load users.</div>'; }
});

window.toggleUser = async (id, isActive) => {
  if (isActive && !confirm('Deactivate this user? They will not be able to log in.')) return;
  try {
    await API.updateUser({ id, isActive: !isActive });
    Utils.toast(isActive ? 'User deactivated' : 'User activated');
    Router.go('manage-users');
  } catch { Utils.toast('Failed', 'error'); }
};

// ── Add/Edit User ─────────────────────────────────────────────────────────────
Router.register('add-user', (view, params) => {
  const user = Auth.require(); if (!user) return;

  view.innerHTML = `
  <div class="topbar">
    <button class="icon-btn" onclick="Router.back()">←</button>
    <div class="topbar-title">${params.editId ? 'Edit' : 'Add'} Staff</div>
    <div style="width:40px"></div>
  </div>
  <div class="scroll-area">
    <div class="form-body">
      <label class="form-lbl">Full Name *</label>
      <input id="u-name" class="form-input" placeholder="e.g. Rahul Sharma">
      <label class="form-lbl">Employee ID *</label>
      <input id="u-empid" class="form-input" placeholder="e.g. KM-002">
      <label class="form-lbl">Email</label>
      <input id="u-email" type="email" class="form-input" placeholder="e.g. rahul@kmall.in">
      <label class="form-lbl">Phone</label>
      <input id="u-phone" type="tel" class="form-input" placeholder="+91 98765 43210">
      <label class="form-lbl">Password *</label>
      <input id="u-pw" class="form-input" placeholder="Min 6 characters" type="password">
      <label class="form-lbl">Role *</label>
      <div id="u-role-list">
        ${Object.entries(window.ROLES).map(([k,v]) => `
        <div class="role-option" onclick="selRole(this,'${k}')">
          <div class="role-dot" style="background:${v.color}"></div>
          <span class="role-option-label">${v.label}</span>
          <span class="role-check" style="display:none">✓</span>
        </div>`).join('')}
      </div>
      <div style="height:20px"></div>
      <button class="btn btn-primary w-full" onclick="submitUser()">Create Account</button>
      <div style="height:80px"></div>
    </div>
  </div>`;
});

window.selRole = (el, role) => {
  document.querySelectorAll('.role-option').forEach(r => {
    r.classList.remove('active');
    r.querySelector('.role-check').style.display = 'none';
  });
  el.classList.add('active');
  el.querySelector('.role-check').style.display = 'inline';
  el.dataset.role = role;
};

window.submitUser = async () => {
  const name = document.getElementById('u-name').value.trim();
  const empId = document.getElementById('u-empid').value.trim().toUpperCase();
  const pw = document.getElementById('u-pw').value;
  const roleEl = document.querySelector('.role-option.active');

  if (!name) { Utils.toast('Enter full name', 'error'); return; }
  if (!empId) { Utils.toast('Enter employee ID', 'error'); return; }
  if (!pw || pw.length < 6) { Utils.toast('Password must be at least 6 characters', 'error'); return; }
  if (!roleEl) { Utils.toast('Select a role', 'error'); return; }

  const btn = document.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Creating…';

  try {
    await API.createUser({
      id: Utils.uid(),
      name, employeeId: empId, role: roleEl.dataset.role,
      email: document.getElementById('u-email').value.trim(),
      phone: document.getElementById('u-phone').value.trim(),
      password: pw, isActive: true, createdAt: Utils.nowISO(),
    });
    Utils.toast(`✓ Account created for ${name}`);
    Router.go('manage-users');
  } catch {
    Utils.toast('Failed to create account', 'error');
    btn.disabled = false; btn.textContent = 'Create Account';
  }
};

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
function renderTabBar() {
  const user = Auth.current();
  const shell = document.getElementById('shell');
  if (!shell || !user) return;

  const tabs = [
    { id:'dashboard', icon:'🏠', label:'Home' },
    { id:'tasks', icon:'📌', label:'Tasks' },
    { id:'checklist', icon:'✅', label:'Checklist' },
    { id:'incidents', icon:'🚨', label:'Incidents' },
    { id:'profile', icon:'👤', label:'More' },
  ];

  const bar = document.createElement('nav');
  bar.className = 'tab-bar';
  bar.innerHTML = tabs.map(t => `
    <button class="tab-btn" data-tab="${t.id}" onclick="Router.go('${t.id}');Router.setTab('${t.id}')">
      <span class="tab-icon">${t.icon}</span>
      <span class="tab-label">${t.label}</span>
    </button>`).join('');

  const existing = document.querySelector('.tab-bar');
  if (existing) existing.replaceWith(bar);
  else shell.appendChild(bar);
}

// ── App Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.current();
  if (user) {
    renderTabBar();
    Router.go('dashboard');
  } else {
    Router.go('login');
  }
});

// Re-render tab bar after login
const _origLogin = Auth.login.bind(Auth);
