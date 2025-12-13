import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Copy, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSaveChanges = () => {
    alert('Profile updated successfully!');
    setEditMode(false);
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-primary) 100%)'}}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="card p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Account Information</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="btn btn-secondary text-sm"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: editMode ? 'var(--bg-secondary)' : 'transparent',
                      color: 'var(--text-primary)',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: editMode ? 'var(--bg-secondary)' : 'transparent',
                      color: 'var(--text-primary)',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editMode}
                    placeholder="0XX-XXX-XXXX"
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: editMode ? 'var(--bg-secondary)' : 'transparent',
                      color: 'var(--text-primary)',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                {editMode && (
                  <button
                    onClick={handleSaveChanges}
                    className="btn btn-primary w-full"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            <div className="card p-8 mt-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Shield size={20} />
                Security & Privacy
              </h2>
              <div className="space-y-4">
                <button className="w-full text-left p-4 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <p className="font-bold">Change Password</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Update your password regularly</p>
                </button>
                <button className="w-full text-left p-4 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <p className="font-bold">Two-Factor Authentication</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Add extra security to your account</p>
                </button>
                <button className="w-full text-left p-4 rounded-lg hover:opacity-80 transition" style={{backgroundColor: 'var(--bg-secondary)'}}>
                  <p className="font-bold">Active Sessions</p>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Manage your logged-in devices</p>
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{backgroundColor: 'var(--bg-secondary)'}}>
                <User size={24} style={{color: 'var(--primary-600)'}} />
              </div>
              <h3 className="font-bold mb-2">{user?.name}</h3>
              <p className="text-sm" style={{color: 'var(--text-secondary)'}}>{user?.email}</p>
            </div>

            <div className="card p-6 mb-6">
              <h3 className="font-bold mb-4">Account Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Account Balance</p>
                  <p className="text-2xl font-bold text-primary-600">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm" style={{color: 'var(--text-secondary)'}}>Member Since</p>
                  <p className="font-bold">Jan 2024</p>
                </div>
              </div>
            </div>

            <div className="card p-6 mb-6">
              <h3 className="font-bold mb-4">Referral Code</h3>
              <button
                onClick={copyReferralCode}
                className="w-full p-3 rounded-lg border flex items-center justify-between"
                style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)'}}
              >
                <span className="font-bold text-primary-600">{user?.referralCode}</span>
                <Copy size={16} />
              </button>
              {copied && <p className="text-xs text-green-500 mt-2">Copied to clipboard!</p>}
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
