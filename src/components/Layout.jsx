import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Download, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { navItems } from '../lib/nav.js';
import { api } from '../lib/api.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const items = navItems(user.role);
  const currentPage = items.find(({ to }) => (
    to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`)
  ));
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const hasNotifications = items.some(({ key }) => key === 'notifications');
  useEffect(() => {
    const h = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  const install = async () => { installEvt.prompt(); await installEvt.userChoice; setInstallEvt(null); };
  useEffect(() => {
    const load = () => api.get('/notifications/count').then((r) => setUnread(r.unread)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex min-h-screen bg-offwhite">
      {open && <button className="fixed inset-0 z-30 bg-navy/55 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <button
        className="fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-xl bg-navy text-white shadow-lg md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[17rem] shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-navy to-[#0B1B2E] text-slate-300 shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none`}>
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl bg-white p-1 shadow-sm" />
          <div>
            <span className="block font-display text-lg font-bold tracking-wide text-white">MODARA</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Learning portal</span>
          </div>
        </div>
        <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          {items.map(({ key, to, label, icon: Icon }) => (
            <NavLink
              key={key}
              onClick={() => setOpen(false)}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive ? 'bg-brand text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {key === 'notifications' && unread > 0 && <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-navy">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Link to="/account" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cyan/15 text-sm font-bold text-cyan">{initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{user.role}</span>
            </span>
          </Link>
          {installEvt && (
            <button onClick={install} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-cyan transition hover:bg-white/[0.06] hover:text-white">
              <Download size={16} /> Install app
            </button>
          )}
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-line/80 bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="min-w-0 pl-12 md:pl-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">MODARA / {currentPage?.label ?? 'Workspace'}</p>
            <p className="mt-0.5 text-xs text-slate-400">Learning and teaching workspace</p>
          </div>
          <div className="flex items-center gap-3">
            {hasNotifications && (
              <Link to="/notifications" aria-label={unread ? `${unread} unread notifications` : 'Notifications'} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-brand/30 hover:text-brand">
                <Bell size={18} />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
              </Link>
            )}
            <Link to="/account" className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-slate-100">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">{initials}</span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-36 truncate text-xs font-semibold text-ink">{user.name}</span>
                <span className="block text-[10px] text-ink-soft">My account</span>
              </span>
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1440px] p-5 sm:p-7 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
