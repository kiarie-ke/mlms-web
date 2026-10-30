import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Bell, Download, LogOut, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { navItems } from '../lib/nav.js';
import { api } from '../lib/api.js';
import Avatar from './Avatar.jsx';
import { Modal } from './ui.jsx';
import packageJson from '../../package.json';

const INSTALL_PROMPT_DISMISSED_KEY = 'mlms-install-prompt-dismissed';

function isIOSDevice() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isInstalledApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function hasDismissedInstallPrompt() {
  try {
    return window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true';
  } catch (error) {
    console.error('Could not read install prompt preference', error);
    return false;
  }
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMessagesPage = location.pathname === '/messages';
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [installPromptOpen, setInstallPromptOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const items = navItems(user.role);
  const currentPage = items.find(({ to }) => (
    to === '/' ? location.pathname === '/' : location.pathname === to || location.pathname.startsWith(`${to}/`)
  ));
  const hasNotifications = items.some(({ key }) => key === 'notifications');
  const hasMessages = items.some(({ key }) => key === 'messages');
  useEffect(() => {
    const iosInstallAvailable = isIOSDevice() && !isInstalledApp();
    setIsIOS(iosInstallAvailable);
    if (iosInstallAvailable && !hasDismissedInstallPrompt()) {
      const timer = window.setTimeout(() => setInstallPromptOpen(true), 2000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, []);
  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvt(event);
      if (!isInstalledApp() && !hasDismissedInstallPrompt()) setInstallPromptOpen(true);
    };
    const onAppInstalled = () => {
      setInstallEvt(null);
      setInstallPromptOpen(false);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);
  const dismissInstallPrompt = () => {
    setInstallPromptOpen(false);
    try {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Could not save install prompt preference', error);
    }
  };
  const install = async () => {
    if (!installEvt) return;
    try {
      await installEvt.prompt();
      const choice = await installEvt.userChoice;
      setInstallEvt(null);
      if (choice.outcome === 'accepted') setInstallPromptOpen(false);
      else dismissInstallPrompt();
    } catch (error) {
      console.error('Could not launch the app install prompt', error);
    }
  };
  useEffect(() => {
    const loadUnreadMessages = () => {
      api.get('/messages/unread-count')
        .then((r) => setUnreadMessages(r.unread))
        .catch((error) => console.error('Could not refresh unread message count', error));
    };
    const load = () => {
      api.get('/notifications/count').then((r) => setUnread(r.unread)).catch(() => {});
      loadUnreadMessages();
    };
    const refresh = () => { if (!document.hidden) load(); };
    const onMessagesRead = () => loadUnreadMessages();
    load();
    const t = setInterval(refresh, 10000);
    window.addEventListener('messages-read', onMessagesRead);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener('messages-read', onMessagesRead);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return (
    <div className="flex min-h-screen bg-offwhite">
      {open && <button className="fixed inset-0 z-30 bg-navy/55 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <button
        className="mobile-menu-toggle fixed left-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-xl bg-navy text-white shadow-lg md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close menu' : 'Open menu'}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-[17rem] shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-navy to-[#0B1B2E] text-slate-300 shadow-2xl transition-[transform,width] duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-[17rem]'}`}>
        <div className={`flex items-center gap-3 border-b border-white/10 px-6 py-6 ${sidebarCollapsed ? 'lg:justify-center lg:px-3' : ''}`}>
          <img src="/logo.png" alt="" className="h-11 w-11 rounded-xl bg-white p-1 shadow-sm" />
          <div className={sidebarCollapsed ? 'lg:hidden' : ''}>
            <span className="block font-display text-lg font-bold tracking-wide text-white">MODARA</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Learning portal</span>
          </div>
        </div>
        <nav aria-label="Main navigation" className={`flex-1 space-y-1 px-3 py-5 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          <p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Workspace</p>
          {items.map(({ key, to, label, icon: Icon }) => (
            <NavLink
              key={key}
              onClick={() => setOpen(false)}
              to={to}
              end={to === '/'}
              aria-label={label}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''} ${
                  isActive ? 'bg-brand text-white shadow-lg shadow-blue-950/30' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`
              }
            >
              <Icon className="shrink-0" size={18} strokeWidth={1.8} />
              <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{label}</span>
              {key === 'messages' && unreadMessages > 0 && (
                <span className={`rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-navy ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
              {key === 'notifications' && unread > 0 && <span className={`rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold text-navy ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className={`m-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 ${sidebarCollapsed ? 'lg:m-2 lg:p-2' : ''}`}>
          <div className="flex min-w-0 items-center gap-3 rounded-xl p-2">
            <Avatar user={user} size="h-10 w-10" className="text-sm" />
            <Link to="/account" aria-label="Account" onClick={() => setOpen(false)} className={`min-w-0 flex-1 rounded-lg hover:opacity-80 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{user.role}</span>
            </Link>
          </div>
          {(installEvt || isIOS) && (
            <button onClick={() => setInstallPromptOpen(true)} aria-label="Install app" title={sidebarCollapsed ? 'Install app' : undefined} className={`mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-cyan transition hover:bg-white/[0.06] hover:text-white ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
              <Download className="shrink-0" size={16} /> <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Install app</span>
            </button>
          )}
          <button onClick={logout} aria-label="Sign out" title={sidebarCollapsed ? 'Sign out' : undefined} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <LogOut className="shrink-0" size={15} /> <span className={sidebarCollapsed ? 'lg:hidden' : ''}>Sign out</span>
          </button>
        </div>
        <p className={`px-6 pb-4 text-center text-[10px] font-medium tracking-wide text-slate-500 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
          MODARA LMS · v{packageJson.version}
        </p>
      </aside>
      <main className={`min-w-0 flex-1 ${isMessagesPage ? 'md:flex md:h-screen md:min-h-0 md:flex-col md:overflow-hidden' : ''}`}>
        <header className={`sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-line/80 bg-white/90 px-5 backdrop-blur-xl sm:px-7 lg:px-10 ${isMessagesPage ? 'md:shrink-0' : ''}`}>
          <div className="flex min-w-0 items-center gap-3 pl-12 md:pl-0">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={sidebarCollapsed}
              className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-brand/30 hover:text-brand lg:grid"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft">MODARA / {currentPage?.label ?? 'Workspace'}</p>
              <p className="mt-0.5 text-xs text-slate-400">Learning and teaching workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasNotifications && (
              <Link to="/notifications" aria-label={unread ? `${unread} unread notifications` : 'Notifications'} className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-brand/30 hover:text-brand">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
            )}
            {hasMessages && (
              <Link
                to="/messages"
                aria-label={unreadMessages ? `${unreadMessages} unread messages` : 'Messages'}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-ink-soft transition hover:border-brand/30 hover:text-brand"
              >
                <MessageSquare size={18} />
                {unreadMessages > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-amber px-1 text-center text-[10px] font-bold leading-4 text-navy">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            <div className="flex items-center gap-2 rounded-xl p-1.5 pr-2">
              <Avatar user={user} size="h-9 w-9" className="text-xs" />
              <Link to="/account" className="hidden rounded-lg text-left hover:opacity-80 sm:block">
                <span className="block max-w-36 truncate text-xs font-semibold text-ink">{user.name}</span>
                <span className="block text-[10px] text-ink-soft">My account</span>
              </Link>
            </div>
          </div>
        </header>
        <div className={`mx-auto w-full max-w-[1440px] p-5 sm:p-7 lg:p-10 ${isMessagesPage ? 'md:flex md:min-h-0 md:flex-1 md:flex-col md:overflow-hidden' : ''}`}>
          <Outlet />
        </div>
      </main>
      {installPromptOpen && (
        <Modal title="Install MODARA LMS" onClose={dismissInstallPrompt}>
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Download size={22} />
            </span>
            <div>
              <p className="font-semibold text-ink">Your learning workspace, one tap away.</p>
              <p className="mt-1 text-sm text-ink-soft">Add MODARA to your home screen for quick access.</p>
            </div>
          </div>
          {installEvt ? (
            <div className="space-y-3">
              <button onClick={install} className="btn-primary w-full">
                Install app <Download size={16} />
              </button>
              <button onClick={dismissInstallPrompt} className="btn-ghost w-full">Maybe later</button>
            </div>
          ) : isIOS ? (
            <>
              <div className="mb-5 rounded-xl bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-ink">On iPhone or iPad</p>
                <ol className="space-y-3 text-sm leading-5 text-ink-soft">
                  <li className="flex gap-2"><span className="font-bold text-brand">1.</span><span>Tap the <strong className="text-ink">Share</strong> button in your browser.</span></li>
                  <li className="flex gap-2"><span className="font-bold text-brand">2.</span><span>Choose <strong className="text-ink">Add to Home Screen</strong>.</span></li>
                  <li className="flex gap-2"><span className="font-bold text-brand">3.</span><span>Tap <strong className="text-ink">Add</strong> to finish.</span></li>
                </ol>
              </div>
              <button onClick={dismissInstallPrompt} className="btn-primary w-full">Got it</button>
            </>
          ) : (
            <button onClick={dismissInstallPrompt} className="btn-ghost w-full">Close</button>
          )}
        </Modal>
      )}
    </div>
  );
}
