import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function fetchSummary() {
  const { data } = await api.get("/dashboard/summary");
  return data;
}

export async function fetchMembers() {
  const { data } = await api.get("/members");
  return data;
}

export async function createMember(payload) {
  const { data } = await api.post("/members", payload);
  return data;
}

export async function fetchGroups() {
  const { data } = await api.get("/groups");
  return data;
}

export async function fetchGroup(groupId) {
  const { data } = await api.get(`/groups/${groupId}`);
  return data;
}

export async function createGroup(payload) {
  const { data } = await api.post("/groups", payload);
  return data;
}

export async function assignMemberToGroup(groupId, memberId) {
  const { data } = await api.post(`/groups/${groupId}/members`, { memberId });
  return data;
}

export async function fetchContributions() {
  const { data } = await api.get("/contributions");
  return data;
}

export async function createContribution(payload) {
  const { data } = await api.post("/contributions", payload);
  return data;
}

export async function fetchAuctions() {
  const { data } = await api.get("/auctions");
  return data;
}

export async function scheduleAuction(payload) {
  const { data } = await api.post("/auctions", payload);
  return data;
}

export async function completeAuction(auctionId, payload) {
  const { data } = await api.post(`/auctions/${auctionId}/complete`, payload);
  return data;
}

export async function fetchMemberStatement(memberId) {
  const { data } = await api.get(`/dashboard/statement/member/${memberId}`);
  return data;
}

export async function fetchMyStatement() {
  const { data } = await api.get("/dashboard/statement/me");
  return data;
}
