import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { reportAPI, groupAPI } from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { groups, members, fetchGroups, fetchMembers } = useData();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        await fetchGroups();
        await fetchMembers();
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const totalMembers = members?.length || 0;
  const activeGroups = groups?.filter(g => g.status === 'ACTIVE')?.length || 0;
  const totalContributions = groups?.reduce((sum, g) => sum + (g.totalCollected || 0), 0) || 0;
  const pendingDues = groups?.reduce((sum, g) => sum + (g.pendingDues || 0), 0) || 0;

  const chartData = [
    { month: 'Jan', collected: 50000, pending: 15000 },
    { month: 'Feb', collected: 65000, pending: 12000 },
    { month: 'Mar', collected: 72000, pending: 8000 },
    { month: 'Apr', collected: 85000, pending: 5000 },
  ];

  const groupStatusData = [
    { name: 'Active', value: activeGroups },
    { name: 'Inactive', value: (groups?.length || 0) - activeGroups },
  ];

  const COLORS = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, Admin! 👋</h1>
        <p className="text-gray-600 mt-2">Here's your chit fund system overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Total Members</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totalMembers}</p>
          <p className="text-xs text-gray-500 mt-2">Active participants in all groups</p>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-medium">Active Groups</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeGroups}</p>
          <p className="text-xs text-gray-500 mt-2">Running chit groups</p>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm font-medium">Total Collected</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">₹{(totalContributions / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-2">Cumulative collections</p>
        </div>

        <div className="card bg-orange-50 border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm font-medium">Pending Dues</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">₹{(pendingDues / 100000).toFixed(1)}L</p>
          <p className="text-xs text-gray-500 mt-2">Amount to be recovered</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Collections vs Pending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Group Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={groupStatusData} cx="50%" cy="50%" labelLine={false} label>
                {groupStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Groups Table */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Groups</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Members</th>
                <th>Monthly Amount</th>
                <th>Status</th>
                <th>Collections</th>
              </tr>
            </thead>
            <tbody>
              {groups?.slice(0, 5).map(group => (
                <tr key={group.id}>
                  <td className="font-medium">{group.name}</td>
                  <td>{group.memberCount || 0}</td>
                  <td>₹{group.groupMonthlyAmount || 0}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      group.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>₹{group.totalCollected || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
