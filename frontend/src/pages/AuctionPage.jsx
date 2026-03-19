import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auctionAPI, groupAPI } from '../services/api';

export default function AuctionPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [auctions, setAuctions] = useState([]);
  const [winners, setWinners] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await groupAPI.getAll();
        setGroups(res.data || []);
        if (res.data?.length > 0) {
          await loadAuctions(res.data[0].id);
          setSelectedGroup(res.data[0].id);
        }
      } catch (err) {
        setError('Failed to load groups');
      }
    }
    loadGroups();
  }, []);

  async function loadAuctions(groupId) {
    try {
      const [auctRes, winnersRes] = await Promise.all([
        auctionAPI.getByGroup(groupId),
        auctionAPI.getWinners(groupId),
      ]);
      setAuctions(auctRes.data || []);
      setWinners(winnersRes.data || []);
    } catch (err) {
      setError('Failed to load auctions');
    }
  }

  async function handlePlaceBid(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await auctionAPI.updateBid(selectedAuction.id, user.memberId, Number(bidAmount));
      setSuccess('Bid placed successfully!');
      setBidAmount('');
      await loadAuctions(selectedGroup);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setLoading(false);
    }
  }

  async function handleGroupChange(groupId) {
    setSelectedGroup(groupId);
    await loadAuctions(groupId);
    setSelectedAuction(null);
    setBidAmount('');
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Chit Auctions</h2>

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

      {/* Group Filter */}
      <div className="card">
        <label className="form-label">Filter by Group</label>
        <select
          className="form-input"
          value={selectedGroup || ''}
          onChange={(e) => handleGroupChange(e.target.value)}
        >
          {groups?.map(group => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Auctions */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Auctions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions?.map(auction => (
            <div
              key={auction.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedAuction?.id === auction.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
              onClick={() => setSelectedAuction(auction)}
            >
              <p className="text-sm font-medium text-gray-600">Month {auction.auctionMonth}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">₹{auction.poolAmount || 0}</p>
              <p className="text-xs text-gray-500 mt-2">
                Status: <span className="font-semibold">{auction.status}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Bids: <span className="font-semibold">{auction.bidCount || 0}</span>
              </p>
            </div>
          ))}
        </div>
        {auctions?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No auctions available for this group</p>
        )}
      </div>

      {/* Auction Details & Bidding */}
      {selectedAuction && user?.role === 'MEMBER' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Place Your Bid</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm mb-2">Auction Month</p>
              <p className="text-2xl font-bold text-gray-900">Month {selectedAuction.auctionMonth}</p>

              <p className="text-gray-600 text-sm mt-4 mb-2">Pool Amount</p>
              <p className="text-2xl font-bold text-blue-600">₹{selectedAuction.poolAmount || 0}</p>

              <p className="text-gray-600 text-sm mt-4 mb-2">Potential Payout</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(selectedAuction.poolAmount * 0.8) || 0}
              </p>
            </div>

            <form onSubmit={handlePlaceBid} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Your Bid (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                  placeholder="Enter bid amount"
                  min="100"
                  max={selectedAuction.poolAmount}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Min: ₹100 | Max: ₹{selectedAuction.poolAmount || 0}
                </p>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Placing...' : 'Place Bid'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Previous Winners */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Previous Winners</h3>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Winner</th>
                <th>Bid Amount</th>
                <th>Payout</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {winners?.map(winner => (
                <tr key={winner.id}>
                  <td>Month {winner.auctionMonth}</td>
                  <td className="font-medium">{winner.winnerName}</td>
                  <td>₹{winner.bidAmount}</td>
                  <td className="text-green-600 font-medium">₹{winner.payoutAmount}</td>
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
        {winners?.length === 0 && (
          <p className="text-center text-gray-500 py-8">No auction winners yet</p>
        )}
      </div>
    </div>
  );
}
