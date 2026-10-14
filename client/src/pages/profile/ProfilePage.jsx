import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/authService';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone ?? '' } });
  const passForm    = useForm();

  const onSaveProfile = async (data) => {
    setSavingProfile(true);
    try { await updateProfile(data); toast.success('Profile updated'); }
    catch { } finally { setSavingProfile(false); }
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPassword(true);
    try { await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }); toast.success('Password changed'); passForm.reset(); }
    catch { } finally { setSavingPassword(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Profile */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-5">My Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold text-white">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className="badge-blue mt-1 inline-block">{user?.role?.name}</span>
          </div>
        </div>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <div><label className="label">Name</label><input className="input" {...profileForm.register('name', { required: true })} /></div>
          <div><label className="label">Phone</label><input className="input" {...profileForm.register('phone')} /></div>
          <button type="submit" disabled={savingProfile} className="btn btn-primary">{savingProfile ? 'Saving…' : 'Save Profile'}</button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-5">Change Password</h2>
        <form onSubmit={passForm.handleSubmit(onChangePassword)} className="space-y-4">
          <div><label className="label">Current Password</label><input type="password" className="input" {...passForm.register('currentPassword', { required: true })} /></div>
          <div><label className="label">New Password</label><input type="password" className="input" {...passForm.register('newPassword', { required: true, minLength: 8 })} /></div>
          <div><label className="label">Confirm New Password</label><input type="password" className="input" {...passForm.register('confirmPassword', { required: true })} /></div>
          <button type="submit" disabled={savingPassword} className="btn btn-primary">{savingPassword ? 'Saving…' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  );
};
export default ProfilePage;
