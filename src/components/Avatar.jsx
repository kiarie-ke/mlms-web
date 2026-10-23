import { useState } from 'react';
import { api } from '../lib/api.js';
import { errMsg } from '../lib/format.js';
import { Modal } from './ui.jsx';

export default function Avatar({ user, size = 'h-12 w-12', className = '', online = false }) {
  const [failedSource, setFailedSource] = useState('');
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhotoFailed, setProfilePhotoFailed] = useState(false);
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const photoAvailable = user.profilePhoto && failedSource !== user.profilePhoto;

  const showProfile = async () => {
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
          aria-label={`View ${user.name}'s profile`}
          title={`View ${user.name}'s profile`}
          onClick={showProfile}
          className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-cyan/15 font-bold text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${size} ${className}`}
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
        {online && <span aria-label="Online" title="Online" className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />}
      </span>
      {open && (
        <Modal title="Profile" onClose={() => setOpen(false)}>
          {loading && <p className="py-8 text-center text-sm text-ink-soft">Loading profile...</p>}
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {profile && (
            <div className="py-2 text-center">
              <span className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-cyan/15 text-2xl font-bold text-cyan ring-4 ring-brand/10">
                {profile.profilePhoto && !profilePhotoFailed ? (
                  <img
                    src={profile.profilePhoto}
                    alt={`${profile.name} profile`}
                    className="h-full w-full object-cover"
                    onError={() => setProfilePhotoFailed(true)}
                  />
                ) : (
                  profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
                )}
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-ink">{profile.name}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand">{profile.role}</p>
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink-soft">About me</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                  {profile.bio?.trim() || 'This person has not added an about me yet.'}
                </p>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
