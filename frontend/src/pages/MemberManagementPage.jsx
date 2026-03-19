import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { memberAPI } from '../services/api';

export default function MemberManagementPage() {
  const { members, fetchMembers, createMember } = useData();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  async function handleAddMember(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createMember(formData);
      setFormData({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
      await fetchMembers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteMember(id) {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await memberAPI.delete(id);
      await fetchMembers();
    } catch (err) {
      setError('Failed to delete member');
    }
  }

  const filteredMembers = members?.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Member Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Add New Member</h3>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="john@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="City, State"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="card">
        <input
          type="text"
          className="form-input"
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Members Table */}
      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers?.map(member => (
                <tr key={member.id}>
                  <td className="font-medium">{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || 'N/A'}</td>
                  <td>{member.address || 'N/A'}</td>
                  <td className="text-sm text-gray-500">{new Date(member.createdAt).toLocaleDateString()}</td>
                  <td className="space-x-2">
                    <button className="btn btn-secondary text-xs">Edit</button>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="btn btn-danger text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMembers?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No members found</p>
        )}
      </div>
    </div>
  );
}
