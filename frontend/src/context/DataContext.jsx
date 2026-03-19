import React, { createContext, useContext, useState, useCallback } from 'react';
import { memberAPI, groupAPI, contributionAPI, auctionAPI } from '../services/api';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await memberAPI.getAll();
      setMembers(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await groupAPI.getAll();
      setGroups(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuctions = useCallback(async (groupId) => {
    try {
      setLoading(true);
      const res = await auctionAPI.getByGroup(groupId);
      setAuctions(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch auctions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMember = useCallback(async (payload) => {
    try {
      const res = await memberAPI.create(payload);
      setMembers([...members, res.data]);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create member');
    }
  }, [members]);

  const createGroup = useCallback(async (payload) => {
    try {
      const res = await groupAPI.create(payload);
      setGroups([...groups, res.data]);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create group');
    }
  }, [groups]);

  const value = {
    members,
    groups,
    contributions,
    auctions,
    loading,
    error,
    fetchMembers,
    fetchGroups,
    fetchAuctions,
    createMember,
    createGroup,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
