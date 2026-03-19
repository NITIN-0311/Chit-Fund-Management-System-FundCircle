import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import { contributionAPI, groupAPI } from '../services/api';

export default function ContributionPage() {
  const { user } = useAuth();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!groupId || !user?.memberId) return;
      try {
        const [groupRes, eligRes, contribRes] = await Promise.all([
          groupAPI.getById(groupId),
          contributionAPI.validateEligibility(user.memberId, groupId),
          contributionAPI.getByGroupAndMember(groupId, user.memberId),
        ]);
        setGroup(groupRes.data);
        setEligibility(eligRes.data);
        setContributions(contribRes.data || []);
      } catch (err) {
        setError('Failed to load contribution data');
      }
    }
    loadData();
  }, [groupId, user?.memberId]);

  async function handlePayContribution(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await contributionAPI.recordContribution({
        memberId: user.memberId,
        groupId: Number(groupId),
        amountPaid: Number(amount),
        paymentMethod: 'ONLINE',
        transactionId: 'TXN-' + Date.now(),
      });
      setSuccess('Contribution recorded successfully!');
      setAmount('');
      // Reload data
      const eligRes = await contributionAPI.validateEligibility(user.memberId, groupId);
      setEligibility(eligRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record contribution');
    } finally {
      setLoading(false);
    }
  }

  if (!group) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Make Contribution</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-blue-50 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm font-medium">Group Name</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{group.name}</p>
        </div>
        <div className="card bg-green-50 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm font-medium">Monthly Amount</p>
          <p className="text-2xl font-bold text-green-600 mt-2">₹{group.groupMonthlyAmount}</p>
        </div>
        <div className="card bg-orange-50 border-l-4 border-orange-600">
          <p className="text-gray-600 text-sm font-medium">Pending Amount</p>
          <p className="text-2xl font-bold text-orange-600 mt-2">₹{eligibility?.pendingAmount || 0}</p>
        </div>
      </div>

      {/* Payment Form */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h3>
        <form onSubmit={handlePayContribution} className="space-y-4 max-w-md">
          <div className="form-group">
            <label className="form-label">Payment Amount (₹)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="5000"
              min="0"
              max={eligibility?.pendingAmount}
            />
            <p className="text-xs text-gray-500 mt-1">
              Max amount: ₹{eligibility?.pendingAmount || 0}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || (eligibility?.isEligible && eligibility?.pendingAmount === 0)}
            className="btn-primary w-full"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      </div>

      {/* Eligibility Status */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm mb-2">Eligibility for Payout</p>
            <p className={`text-lg font-bold ${eligibility?.isEligible ? 'text-green-600' : 'text-orange-600'}`}>
              {eligibility?.isEligible ? '✓ Eligible' : '✗ Not Eligible'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {eligibility?.isEligible ? 'You can participate in payouts' : `Complete ${Math.round(100 - (eligibility?.completionPercent || 0))}% more contributions`}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-2">Completion Status</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${eligibility?.completionPercent || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(eligibility?.completionPercent || 0)}% contributions completed
            </p>
          </div>
        </div>
      </div>

      {/* Contribution History */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Contribution History</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions?.map(contrib => (
                <tr key={contrib.id}>
                  <td>{new Date(contrib.paymentDate).toLocaleDateString()}</td>
                  <td className="font-medium">₹{contrib.amountPaid}</td>
                  <td>{contrib.paymentMethod}</td>
                  <td className="text-xs text-gray-600">{contrib.transactionId}</td>
                  <td>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contributions?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No contributions recorded yet</p>
        )}
      </div>
    </div>
  );
}
