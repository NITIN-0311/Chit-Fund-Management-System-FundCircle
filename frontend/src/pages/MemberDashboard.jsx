import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, groupAPI, contributionAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function MemberDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [myGroups, setMyGroups] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.memberId) return;
      setLoading(true);
      try {
        const [summaryRes, groupsRes] = await Promise.all([
          reportAPI.getSummary(user.memberId),
          groupAPI.getAll(),
        ]);
        setSummary(summaryRes.data);
        setMyGroups(groupsRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.memberId]);

  if (loading) return <div className="p-8 text-center">Loading your dashboard...</div>;

  const totalDue = summary?.totalDue || 0;
  const totalPaid = summary?.totalPaid || 0;
  const pendingAmount = summary?.pendingAmount || 0;
  const nextDueDate = '2026-04-15';

  const contributionData = [
    { month: 'Jan', amount: 5000 },
    { month: 'Feb', amount: 5000 },
    { month: 'Mar', amount: 5000 },
    { month: 'Apr', amount: 0 },
  ];

  const payoutData = [
    { group: 'Group A', payout: 85000 },
    { group: 'Group B', payout: 65000 },
    { group: 'Group C', payout: 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.email}! 👋</h1>
        <p className="text-gray-600 mt-2">Here's your chit fund activity summary.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-blue-50 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Total Due</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalDue}</p>
          <p className="text-xs text-gray-500 mt-2">Across all groups</p>
        </div>

        <div className="card bg-green-50 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-medium">Total Paid</p>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{totalPaid}</p>
          <p className="text-xs text-gray-500 mt-2">Contributions made</p>
        </div>

        <div className="card bg-orange-50 border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">₹{pendingAmount}</p>
          <p className="text-xs text-gray-500 mt-2">Amount pending</p>
        </div>

        <div className="card bg-purple-50 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm font-medium">Next Due</p>
          <p className="text-xl font-bold text-purple-600 mt-2">{nextDueDate}</p>
          <p className="text-xs text-gray-500 mt-2">Payment deadline</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Monthly Contributions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={contributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Payouts</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payoutData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="payout" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* My Groups */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Groups</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Monthly Amount</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {myGroups?.slice(0, 5).map(group => (
                <tr key={group.id} onClick={() => window.location.href = `/contribution/${group.id}`}>
                  <td className="font-medium cursor-pointer hover:text-blue-600">{group.name}</td>
                  <td>₹{group.groupMonthlyAmount || 0}</td>
                  <td>{group.durationMonths || 0} months</td>
                  <td>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {group.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-primary text-xs">Make Payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
