import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { groupAPI } from '../services/api';

export default function ChitGroupsPage() {
  const { groups, members, fetchGroups, createGroup } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    groupMonthlyAmount: '',
    durationMonths: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  async function handleCreateGroup(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        groupMonthlyAmount: Number(formData.groupMonthlyAmount),
        durationMonths: Number(formData.durationMonths),
      };
      const group = await createGroup(payload);
      if (selectedMembers.length > 0) {
        await groupAPI.addMembers(group.id, selectedMembers);
      }
      setFormData({ name: '', groupMonthlyAmount: '', durationMonths: '', description: '' });
      setSelectedMembers([]);
      setShowForm(false);
      await fetchGroups();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup(id) {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await groupAPI.delete(id);
      await fetchGroups();
    } catch (err) {
      setError('Failed to delete group');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Chit Group Management</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Create Group'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Create New Chit Group</h3>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Group Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Group A"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Amount (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.groupMonthlyAmount}
                  onChange={(e) => setFormData({ ...formData, groupMonthlyAmount: e.target.value })}
                  required
                  placeholder="5000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Months)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                  required
                  placeholder="12"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Add Members to Group</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-md">
                {members?.map(member => (
                  <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{member.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      )}

      {/* Groups Table */}
      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Monthly Amount</th>
                <th>Duration</th>
                <th>Members</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups?.map(group => (
                <tr key={group.id}>
                  <td className="font-medium">{group.name}</td>
                  <td>₹{group.groupMonthlyAmount || 0}</td>
                  <td>{group.durationMonths || 0} months</td>
                  <td>{group.memberCount || 0}</td>
                  <td>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ACTIVE
                    </span>
                  </td>
                  <td className="space-x-2">
                    <button className="btn btn-secondary text-xs">Edit</button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
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
        {groups?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No groups created yet</p>
        )}
      </div>
    </div>
  );
}
