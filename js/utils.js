// ─── Utilities ────────────────────────────────────────────────────────────────
window.$ = id => document.getElementById(id);
window.$$ = sel => document.querySelectorAll(sel);

window.Utils = {
  today() { return new Date().toISOString().slice(0,10); },
  nowISO() { return new Date().toISOString(); },
  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  },
  fmtTime(iso) {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
  },
  fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:true});
  },
  fmtCurrency(n) {
    return '₹' + Number(n||0).toLocaleString('en-IN');
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); },
  getMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },
  prevMonth() {
    const d = new Date();
    d.setMonth(d.getMonth()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  },
  badge(status) {
    const map = {
      present:'success', late:'warn', absent:'error', on_leave:'info',
      pending:'warn', approved:'success', rejected:'error',
      submitted:'info', reviewed:'purple', draft:'gray', returned:'warn',
      open:'error', in_progress:'info', resolved:'success', escalated:'danger', closed:'gray',
      reported:'warn', critical:'error', major:'warn', moderate:'info', minor:'success',
      active:'success', inactive:'gray',
    };
    const cls = map[status] || 'gray';
    const labels = {
      on_leave:'On Leave', in_progress:'In Progress',
      security_head:'Security & HK Head', store_keeper:'Store Keeper',
    };
    const label = labels[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g,' ');
    return `<span class="badge badge-${cls}">${label}</span>`;
  },
  toast(msg, type='success') {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id='toast'; document.body.appendChild(t); }
    t.className = `toast toast-${type} show`;
    t.textContent = msg;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
  },
  confirm(msg) { return window.confirm(msg); },
  async getGPS() {
    return new Promise((res, rej) => {
      if (!navigator.geolocation) { res(null); return; }
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null),
        { timeout: 8000 }
      );
    });
  },
  isLate(timeISO) {
    const d = new Date(timeISO);
    const cutoff = new Date(d);
    const [h,m] = window.KMALL_CONFIG.MALL_OPEN.split(':');
    cutoff.setHours(parseInt(h), parseInt(m) + window.KMALL_CONFIG.CHECKIN_GRACE_MINS, 0, 0);
    return d > cutoff;
  },
  roleLabel(role) { return (window.ROLES[role]||{}).label || role; },
  roleColor(role) { return (window.ROLES[role]||{}).color || '#666'; },
};
