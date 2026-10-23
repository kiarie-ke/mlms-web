import { useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import Avatar from '../components/Avatar.jsx';
import { Field, Notice, PageHeader } from '../components/ui.jsx';
import { errMsg } from '../lib/format.js';

const emptyPassword = { current: '', next: '' };

export default function Account() {
  const { user, refreshUser } = useAuth();
  const photoInput = useRef(null);
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone ?? '', bio: user.bio ?? '' });
  const [password, setPassword] = useState(emptyPassword);
  const [profileMessage, setProfileMessage] = useState({ text: '', error: false });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', error: false });
  const [photoMessage, setPhotoMessage] = useState({ text: '', error: false });
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    setProfileMessage({ text: '', error: false });
    try {
      await api.patch('/auth/profile', profile);
      await refreshUser();
      setProfileMessage({ text: 'Your profile details have been saved.', error: false });
    } catch (error) {
      setProfileMessage({ text: errMsg(error), error: true });
    } finally {
      setProfileBusy(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordBusy(true);
    setPasswordMessage({ text: '', error: false });
    try {
      await api.post('/auth/password', password);
      setPassword(emptyPassword);
      await refreshUser();
      setPasswordMessage({ text: 'Password updated.', error: false });
    } catch (error) {
      setPasswordMessage({ text: errMsg(error), error: true });
    } finally {
      setPasswordBusy(false);
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setPhotoMessage({ text: 'Choose an image smaller than 3 MB.', error: true });
      return;
    }
    setPhotoBusy(true);
    setPhotoMessage({ text: '', error: false });
    try {
      const body = new FormData();
      body.append('file', file);
      await api.post('/auth/profile/photo', body);
      await refreshUser();
      setPhotoMessage({ text: 'Profile photo updated.', error: false });
    } catch (error) {
      setPhotoMessage({ text: errMsg(error), error: true });
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoMessage({ text: '', error: false });
    try {
      await api.del('/auth/profile/photo');
      await refreshUser();
      setPhotoMessage({ text: 'Profile photo removed.', error: false });
    } catch (error) {
      setPhotoMessage({ text: errMsg(error), error: true });
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="My account" />
      <div className="mx-auto grid max-w-5xl gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        {user.mustChangePassword ? (
          <section className="card xl:col-span-2">
            <div className="mb-5 flex items-center gap-4">
              <Avatar user={user} size="h-16 w-16" className="text-lg" />
              <div>
                <h2 className="font-display text-xl font-bold text-ink">{user.name}</h2>
                <p className="text-sm text-ink-soft">{user.email}</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-ink">Secure your account</h3>
            <p className="mb-4 mt-1 text-sm text-ink-soft">
              Change your temporary password before continuing to the learning portal.
            </p>
            <form onSubmit={savePassword} className="max-w-md">
              <Field label="Current password" type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} required />
              <Field label="New password (at least 8 characters)" type="password" autoComplete="new-password" minLength={8} value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} required />
              <Notice error={passwordMessage.error}>{passwordMessage.text}</Notice>
              <button className="btn-primary mt-2" disabled={passwordBusy}>
                {passwordBusy ? 'Updating password...' : 'Change password'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <section className="card">
              <div className="mb-6 flex items-center gap-4 border-b border-line pb-5">
                <Avatar user={user} size="h-16 w-16" className="text-lg" />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-xl font-bold text-ink">{user.name}</h2>
                  <p className="mt-1 truncate text-sm text-ink-soft">{user.email}</p>
                  <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">{user.role}</span>
                </div>
              </div>
              <form onSubmit={saveProfile}>
                <h3 className="mb-4 text-lg font-semibold text-ink">Profile details</h3>
                <Field label="Full name" autoComplete="name" maxLength={100} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required />
                <Field label="Email address" type="email" value={user.email} disabled />
                <Field label="Phone number" type="tel" autoComplete="tel" maxLength={30} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} />
                <div className="mb-3">
                  <label className="label" htmlFor="profile-bio">About me</label>
                  <textarea id="profile-bio" className="input min-h-28 resize-y" maxLength={500} value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} placeholder="Add a short introduction..." />
                  <p className="mt-1 text-right text-xs text-ink-soft">{profile.bio.length}/500</p>
                </div>
                <Notice error={profileMessage.error}>{profileMessage.text}</Notice>
                <button className="btn-primary mt-2 inline-flex items-center gap-2" disabled={profileBusy}>
                  <Check size={16} /> {profileBusy ? 'Saving...' : 'Save profile'}
                </button>
              </form>
            </section>

            <div className="space-y-5">
              <section className="card">
                <h3 className="text-lg font-semibold text-ink">Profile photo</h3>
                <p className="mb-5 mt-1 text-sm text-ink-soft">Add a clear photo so people can recognize you around the portal.</p>
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-slate-50/70 px-4 py-6 text-center">
                  <Avatar user={user} size="h-28 w-28" className="mb-4 text-2xl shadow-sm ring-4 ring-white" />
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
                  <p className="mt-1 text-xs text-ink-soft">PNG, JPG or WebP · up to 3 MB</p>
                  <input ref={photoInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadPhoto} />
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => photoInput.current?.click()} disabled={photoBusy}>
                      {user.profilePhoto ? <Camera size={16} /> : <ImagePlus size={16} />}
                      {photoBusy ? 'Updating...' : user.profilePhoto ? 'Change photo' : 'Upload photo'}
                    </button>
                    {user.profilePhoto && (
                      <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={removePhoto} disabled={photoBusy}>
                        <Trash2 size={16} /> Remove
                      </button>
                    )}
                  </div>
                </div>
                <Notice error={photoMessage.error}>{photoMessage.text}</Notice>
              </section>

              <section className="card">
                <h3 className="text-lg font-semibold text-ink">Password & security</h3>
                <p className="mb-4 mt-1 text-sm text-ink-soft">Choose a strong password and keep your account secure.</p>
                <form onSubmit={savePassword}>
                  <Field label="Current password" type="password" autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} required />
                  <Field label="New password (at least 8 characters)" type="password" autoComplete="new-password" minLength={8} value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} required />
                  <Notice error={passwordMessage.error}>{passwordMessage.text}</Notice>
                  <button className="btn-secondary mt-2" disabled={passwordBusy}>{passwordBusy ? 'Updating...' : 'Update password'}</button>
                </form>
              </section>
            </div>
          </>
        )}
      </div>
    </>
  );
}
