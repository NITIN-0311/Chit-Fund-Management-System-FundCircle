import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../services/api';
import Papa from 'papaparse';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const { user } = useAuth();
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatement() {
      if (!user?.memberId) return;
      try {
        const res = await reportAPI.generateStatement(user.memberId);
        setStatement(res.data);
        setError('');
      } catch (err) {
        setError('Failed to load statement');
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [user?.memberId]);

  const handleExportPDF = async () => {
    try {
      const response = await reportAPI.exportPDF(user.memberId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${user.memberId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      alert('Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await reportAPI.exportCSV(user.memberId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${user.memberId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading statement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Monthly Statements & Reports</h2>
        <div className="space-x-3">
          <button onClick={handleExportPDF} className="btn-secondary">
            📄 Export PDF
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
            📊 Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Summary */}
      {statement && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card bg-blue-50 border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-medium">Total Due</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{statement.totalDue || 0}</p>
            </div>
            <div className="card bg-green-50 border-l-4 border-green-600">
              <p className="text-gray-600 text-sm font-medium">Total Paid</p>
              <p className="text-3xl font-bold text-green-600 mt-2">₹{statement.totalPaid || 0}</p>
            </div>
            <div className="card bg-orange-50 border-l-4 border-orange-600">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">₹{statement.pendingAmount || 0}</p>
            </div>
            <div className="card bg-purple-50 border-l-4 border-purple-600">
              <p className="text-gray-600 text-sm font-medium">Completion</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statement.completionPercent || 0}%
              </p>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Completion Status</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-600 to-green-600 h-4 rounded-full transition-all"
                style={{ width: `${statement.completionPercent || 0}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {Math.round(statement.completionPercent || 0)}% of total obligations completed
            </p>
          </div>

          {/* Contribution Breakdown */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contribution Summary</h3>
            <div className="space-y-3">
              {statement.contributions?.map((contrib, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{contrib.groupName}</p>
                    <p className="text-sm text-gray-500">Month {contrib.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{contrib.amountPaid}</p>
                    <p className="text-xs text-gray-500">{new Date(contrib.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payout History */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Payout History</h3>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Auction Month</th>
                    <th>Bid Amount</th>
                    <th>Payout Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.payouts?.map((payout, idx) => (
                    <tr key={idx}>
                      <td className="font-medium">{payout.groupName}</td>
                      <td>Month {payout.auctionMonth}</td>
                      <td>₹{payout.bidAmount}</td>
                      <td className="text-green-600 font-bold">₹{payout.payoutAmount}</td>
                      <td>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!statement.payouts || statement.payouts.length === 0) && (
              <p className="text-center text-gray-500 py-8">No payouts received yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
