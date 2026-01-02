import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Copy, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';

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
    <UserLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Account Information</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                >
                  {editMode ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded-lg border-2 border-slate-200"
                    style={{
                      backgroundColor: editMode ? '#f9fafb' : 'transparent',
                      color: '#111827',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!editMode}
                    className="w-full px-4 py-2 rounded-lg border-2 border-slate-200"
                    style={{
                      backgroundColor: editMode ? '#f9fafb' : 'transparent',
                      color: '#111827',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-900">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editMode}
                    placeholder="0XX-XXX-XXXX"
                    className="w-full px-4 py-2 rounded-lg border-2 border-slate-200"
                    style={{
                      backgroundColor: editMode ? '#f9fafb' : 'transparent',
                      color: '#111827',
                      opacity: editMode ? 1 : 0.6,
                    }}
                  />
                </div>

                {editMode && (
                  <button
                    onClick={handleSaveChanges}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 mt-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
                <Shield size={20} />
                Security & Privacy
              </h2>
              <div className="space-y-4">
                <button className="w-full text-left p-4 rounded-xl hover:shadow-lg transition bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                  <p className="font-bold text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-600">Update your password regularly</p>
                </button>
                <button className="w-full text-left p-4 rounded-xl hover:shadow-lg transition bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                  <p className="font-bold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-600">Add extra security to your account</p>
                </button>
                <button className="w-full text-left p-4 rounded-xl hover:shadow-lg transition bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                  <p className="font-bold text-slate-900">Active Sessions</p>
                  <p className="text-sm text-slate-600">Manage your logged-in devices</p>
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-purple-500">
                <User size={24} className="text-white" />
              </div>
              <h3 className="font-bold mb-2 text-slate-900">{user?.name}</h3>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold mb-4 text-slate-900">Account Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Account Balance</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GHS {user?.balance?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Member Since</p>
                  <p className="font-bold text-slate-900">Jan 2024</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 mb-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold mb-4 text-slate-900">Referral Code</h3>
              <button
                onClick={copyReferralCode}
                className="w-full p-3 rounded-xl border-2 border-blue-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 hover:border-blue-400 transition-all"
              >
                <span className="font-bold text-blue-600">{user?.referralCode}</span>
                <Copy size={16} className="text-blue-600" />
              </button>
              {copied && <p className="text-xs text-green-500 mt-2">Copied to clipboard!</p>}
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
      </div>
    </UserLayout>
  );
}
