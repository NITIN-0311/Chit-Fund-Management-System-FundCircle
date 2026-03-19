import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Simulate profile update
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call API here: await userAPI.updateProfile(profileData)
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Profile Info */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">Account Information</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary text-sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Email Address</p>
              <p className="text-lg font-medium text-gray-900">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-medium text-gray-900">
                {user?.role === 'ADMIN' ? '👨‍💼 Administrator' : '👤 Member'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Member ID</p>
              <p className="text-lg font-medium text-gray-900">{user?.memberId || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={profileData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-4">Change Password (Optional)</h4>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-input"
                  value={profileData.currentPassword}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-input"
                  value={profileData.newPassword}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  value={profileData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}
      </div>

      {/* Security Info */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium text-gray-900">Last Login</p>
              <p className="text-sm text-gray-600">Today at 3:45 PM</p>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-600">1 session active</p>
            </div>
            <button className="btn btn-secondary text-xs">Logout Other Sessions</button>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="card border-t-2 border-red-200">
        <p className="text-gray-700 mb-4">Want to sign out?</p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to logout?')) {
              logout();
              window.location.href = '/login';
            }
          }}
          className="btn-danger w-full"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
