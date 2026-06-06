// ─── Authentication ───────────────────────────────────────────────────────────
window.Auth = (() => {
  const SESSION_KEY = 'kmall_session';

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  }
  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function login(employeeId, password) {
    const res = await API.login(employeeId.trim().toUpperCase(), password);
    const users = res.users || [];
    const user = users.find(u =>
      (u.employeeId?.toUpperCase() === employeeId.trim().toUpperCase() ||
       u.email?.toLowerCase() === employeeId.trim().toLowerCase()) &&
      u.password === password &&
      u.isActive !== false
    );
    if (!user) throw new Error('Invalid credentials');
    const { password: _pw, ...safeUser } = user;
    setSession(safeUser);
    return safeUser;
  }

  function logout() {
    clearSession();
    window.Router.go('login');
  }

  function current() { return getSession(); }

  function require() {
    const user = getSession();
    if (!user) { window.Router.go('login'); return null; }
    return user;
  }

  function can(permission) {
    const user = getSession();
    if (!user) return false;
    const perms = {
      assign_tasks: ['super_admin','project_head'],
      approve_expense: ['super_admin','project_head','finance_manager'],
      manage_users: ['super_admin'],
      view_all: ['super_admin','project_head'],
      manage_tenants: ['super_admin','project_head','mall_manager','finance_manager'],
      approve_utility: ['super_admin','project_head'],
      review_reports: ['super_admin','project_head','mall_manager'],
    };
    return (perms[permission] || []).includes(user.role);
  }

  return { login, logout, current, require, can, setSession, clearSession };
})();
