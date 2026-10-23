import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { errMsg } from '../lib/format.js';
import { useAuth } from '../lib/auth.jsx';
import { Modal } from './ui.jsx';

export default function Avatar({ user, size = 'h-12 w-12', className = '', online = false }) {
  const [failedSource, setFailedSource] = useState('');
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);

  let currentUser = null;
  try {
    const auth = useAuth();
    currentUser = auth?.user;
  } catch {
    currentUser = null;
  }

  const displayName = user?.name || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const photoAvailable = user?.profilePhoto && failedSource !== user.profilePhoto;

  const showProfile = async () => {
    if (!user?.id) return;
    setOpen(true);
    setProfile(null);
    setLoading(true);
    setError('');
    setProfilePhotoFailed(false);
    try {
      setProfile(await api.get(`/auth/users/${encodeURIComponent(user.id)}/profile`));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <span className={`relative inline-flex shrink-0 ${size}`}>
        <button
          type="button"
          aria-label={`View ${displayName}'s profile`}
          title={`View ${displayName}'s profile`}
          onClick={showProfile}
          className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-cyan/15 font-bold text-cyan transition hover:ring-2 hover:ring-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95 ${size} ${className}`}
        >
          {photoAvailable ? (
            <img
              key={user.profilePhoto}
              src={user.profilePhoto}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setFailedSource(user.profilePhoto)}
            />
          ) : (
            initials
          )}
        </button>
        {online && (
          <span
            aria-label="Online"
            title="Online"
            className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
          />
        )}
      </span>

      {open && (
        <Modal title="User Profile" onClose={() => setOpen(false)}>
          {loading && (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="mt-3 text-xs font-medium text-ink-soft">Loading profile...</p>
            </div>
          )}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {profile && (
            <div className="py-2 text-center">
              <span className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-cyan/15 text-2xl font-bold text-cyan shadow-sm ring-4 ring-brand/10">
                {profile.profilePhoto && !profilePhotoFailed ? (
                  <img
                    src={profile.profilePhoto}
                    alt={`${profile.name} profile`}
                    className="h-full w-full object-cover"
                    onError={() => setProfilePhotoFailed(true)}
                  />
                ) : (
                  profile.name
                    ?.split(/\s+/)
                    .filter(Boolean)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'U'
                )}
              </span>
              <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-ink">{profile.name}</h2>
              <span className="mt-1 inline-flex items-center rounded-full bg-brand/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand">
                {profile.role}
              </span>

              <div className="mt-5 rounded-2xl border border-line/80 bg-slate-50/80 p-4 text-left shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">About me</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                  {profile.bio?.trim() || 'This person has not added an about me yet.'}
                </p>
              </div>

              {currentUser && currentUser.id === user?.id && (
                <div className="mt-5">
                  <Link
                    to="/account"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-brand/20 transition hover:bg-brand/90 active:scale-[0.99]"
                  >
                    Go to my account & settings
                  </Link>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
