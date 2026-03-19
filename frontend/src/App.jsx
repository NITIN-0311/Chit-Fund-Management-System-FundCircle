import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import {
  setAuthToken,
  login,
  fetchSummary,
  fetchMembers,
  createMember,
  fetchGroups,
  fetchGroup,
  createGroup,
  assignMemberToGroup,
  fetchContributions,
  createContribution,
  fetchAuctions,
  scheduleAuction,
  completeAuction,
  fetchMemberStatement,
  fetchMyStatement,
} from "./services/api";

const money = (value) => `INR ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const initialMemberForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
};

const initialGroupForm = {
  name: "",
  monthlyAmount: "",
  durationMonths: "",
  startDate: "",
  status: "ACTIVE",
};

const initialContributionForm = {
  groupId: "",
  memberId: "",
  contributionMonth: "",
  amountPaid: "",
  paidOn: "",
  paymentMode: "ONLINE",
  notes: "",
};

const initialAuctionScheduleForm = {
  groupId: "",
  monthNumber: "",
  scheduledOn: "",
};

const initialAuctionCompleteForm = {
  auctionId: "",
  winnerMemberId: "",
  bidDiscountPercent: "",
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("cf_token") || "");
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("cf_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState(null);
  const [members, setMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [auctions, setAuctions] = useState([]);

  const [memberForm, setMemberForm] = useState(initialMemberForm);
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [assignForm, setAssignForm] = useState({ groupId: "", memberId: "" });
  const [contributionForm, setContributionForm] = useState(initialContributionForm);
  const [auctionScheduleForm, setAuctionScheduleForm] = useState(initialAuctionScheduleForm);
  const [auctionCompleteForm, setAuctionCompleteForm] = useState(initialAuctionCompleteForm);

  const [statementMemberId, setStatementMemberId] = useState("");
  const [statementData, setStatementData] = useState(null);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    if (user.role === "ADMIN") {
      void refreshAdminData();
    } else {
      void loadMemberStatement();
    }
  }, [token, user]);

  useEffect(() => {
    if (!token || !selectedGroupId || user?.role !== "ADMIN") {
      return;
    }

    void (async () => {
      try {
        const detail = await fetchGroup(selectedGroupId);
        setSelectedGroupDetail(detail);
      } catch (error) {
        setStatus({
          type: "error",
          text: error.response?.data?.message || "Unable to load group details.",
        });
      }
    })();
  }, [token, selectedGroupId, user?.role]);

  const contributionTrend = useMemo(() => {
    const map = new Map();

    contributions.forEach((row) => {
      const key = `M${row.contribution_month}`;
      const current = map.get(key) || 0;
      map.set(key, current + Number(row.amount_paid));
    });

    return Array.from(map.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => Number(a.month.slice(1)) - Number(b.month.slice(1)));
  }, [contributions]);

  const memberCountByGroup = useMemo(
    () =>
      groups.map((group) => ({
        group: group.name,
        members: Number(group.member_count || 0),
      })),
    [groups]
  );

  async function refreshAdminData() {
    setLoading(true);
    try {
      const [summaryData, memberData, groupData, contributionData, auctionData] = await Promise.all([
        fetchSummary(),
        fetchMembers(),
        fetchGroups(),
        fetchContributions(),
        fetchAuctions(),
      ]);

      setSummary(summaryData);
      setMembers(memberData);
      setGroups(groupData);
      setContributions(contributionData);
      setAuctions(auctionData);
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Failed to fetch dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadMemberStatement() {
    setLoading(true);
    try {
      const data = await fetchMyStatement();
      setStatementData(data);
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Unable to load member statement.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await login(authForm.email, authForm.password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem("cf_token", response.token);
      localStorage.setItem("cf_user", JSON.stringify(response.user));
      setStatus({ type: "success", text: "Login successful." });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Unable to login.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setToken("");
    setUser(null);
    setSummary(null);
    setMembers([]);
    setGroups([]);
    setContributions([]);
    setAuctions([]);
    setStatementData(null);
    setSelectedGroupId("");
    setSelectedGroupDetail(null);
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");
    setAuthToken("");
  }

  async function submitMember(event) {
    event.preventDefault();
    try {
      await createMember(memberForm);
      setMemberForm(initialMemberForm);
      setStatus({ type: "success", text: "Member added." });
      await refreshAdminData();
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Member creation failed." });
    }
  }

  async function submitGroup(event) {
    event.preventDefault();
    try {
      await createGroup({
        ...groupForm,
        monthlyAmount: Number(groupForm.monthlyAmount),
        durationMonths: Number(groupForm.durationMonths),
      });
      setGroupForm(initialGroupForm);
      setStatus({ type: "success", text: "Group created." });
      await refreshAdminData();
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Group creation failed." });
    }
  }

  async function submitAssignMember(event) {
    event.preventDefault();
    try {
      await assignMemberToGroup(Number(assignForm.groupId), Number(assignForm.memberId));
      setAssignForm({ groupId: "", memberId: "" });
      setStatus({ type: "success", text: "Member assigned to group." });
      await refreshAdminData();
      if (selectedGroupId) {
        setSelectedGroupId(String(assignForm.groupId));
      }
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Assignment failed." });
    }
  }

  async function submitContribution(event) {
    event.preventDefault();
    try {
      await createContribution({
        ...contributionForm,
        groupId: Number(contributionForm.groupId),
        memberId: Number(contributionForm.memberId),
        contributionMonth: Number(contributionForm.contributionMonth),
        amountPaid: Number(contributionForm.amountPaid),
      });
      setContributionForm(initialContributionForm);
      setStatus({ type: "success", text: "Contribution recorded." });
      await refreshAdminData();
      if (selectedGroupId) {
        setSelectedGroupId(String(selectedGroupId));
      }
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Contribution entry failed.",
      });
    }
  }

  async function submitScheduleAuction(event) {
    event.preventDefault();
    try {
      await scheduleAuction({
        groupId: Number(auctionScheduleForm.groupId),
        monthNumber: Number(auctionScheduleForm.monthNumber),
        scheduledOn: auctionScheduleForm.scheduledOn,
      });
      setAuctionScheduleForm(initialAuctionScheduleForm);
      setStatus({ type: "success", text: "Auction scheduled." });
      await refreshAdminData();
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Unable to schedule auction." });
    }
  }

  async function submitCompleteAuction(event) {
    event.preventDefault();
    try {
      await completeAuction(Number(auctionCompleteForm.auctionId), {
        winnerMemberId: Number(auctionCompleteForm.winnerMemberId),
        bidDiscountPercent: Number(auctionCompleteForm.bidDiscountPercent),
      });
      setAuctionCompleteForm(initialAuctionCompleteForm);
      setStatus({ type: "success", text: "Auction completed and payout updated." });
      await refreshAdminData();
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Unable to complete auction." });
    }
  }

  async function submitStatementLookup(event) {
    event.preventDefault();
    try {
      const data = await fetchMemberStatement(Number(statementMemberId));
      setStatementData(data);
      setStatus({ type: "success", text: "Statement generated." });
    } catch (error) {
      setStatus({ type: "error", text: error.response?.data?.message || "Unable to fetch statement." });
    }
  }

  if (!token || !user) {
    return (
      <div className="app-shell">
        <div className="background-layer" />
        <main className="auth-page">
          <section className="auth-card">
            <p className="eyebrow">Chit Fund Management System</p>
            <h1>Structured Savings, Transparent Auctions</h1>
            <p className="intro">
              Login as admin or member to track contributions, run auctions, and manage monthly statements.
            </p>

            <form className="form-grid" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  placeholder="Enter password"
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="hint-list">
              <p>Quick start:</p>
              <p>1. Create members and groups from admin dashboard.</p>
              <p>2. Assign members, post contributions, schedule auctions.</p>
              <p>3. Generate member-wise statements instantly.</p>
            </div>

            {status.text ? <div className={`status ${status.type}`}>{status.text}</div> : null}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="background-layer" />
      <main className="dashboard-page">
        <header className="topbar">
          <div>
            <p className="eyebrow">Chit Fund Management System</p>
            <h1>{user.role === "ADMIN" ? "Admin Control Center" : "Member Dashboard"}</h1>
          </div>
          <div className="topbar-actions">
            <span className="role-tag">{user.role}</span>
            <button className="ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {status.text ? <div className={`status ${status.type}`}>{status.text}</div> : null}

        {user.role === "ADMIN" ? (
          <section className="admin-layout">
            <section className="card-grid summary-grid">
              <article className="stat-card">
                <p>Total Members</p>
                <h3>{summary?.totalMembers ?? "-"}</h3>
              </article>
              <article className="stat-card">
                <p>Active Groups</p>
                <h3>{summary?.activeGroups ?? "-"}</h3>
              </article>
              <article className="stat-card">
                <p>Collected Amount</p>
                <h3>{money(summary?.totalCollected)}</h3>
              </article>
              <article className="stat-card">
                <p>Pending Dues</p>
                <h3>{money(summary?.totalPending)}</h3>
              </article>
            </section>

            <section className="card-grid charts-grid">
              <article className="panel chart-panel">
                <h2>Contribution Trend</h2>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={contributionTrend}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#39505d" />
                      <XAxis dataKey="month" stroke="#aac2cf" />
                      <YAxis stroke="#aac2cf" />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#f4a259" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel chart-panel">
                <h2>Members by Group</h2>
                <div className="chart-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memberCountByGroup}>
                      <CartesianGrid strokeDasharray="4 4" stroke="#39505d" />
                      <XAxis dataKey="group" stroke="#aac2cf" />
                      <YAxis stroke="#aac2cf" />
                      <Tooltip />
                      <Bar dataKey="members" fill="#2a9d8f" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="card-grid form-grid-admin">
              <form className="panel form-panel" onSubmit={submitMember}>
                <h2>Register Member</h2>
                <input
                  placeholder="Full Name"
                  value={memberForm.fullName}
                  onChange={(event) => setMemberForm({ ...memberForm, fullName: event.target.value })}
                  required
                />
                <input
                  placeholder="Phone"
                  value={memberForm.phone}
                  onChange={(event) => setMemberForm({ ...memberForm, phone: event.target.value })}
                  required
                />
                <input
                  placeholder="Email"
                  value={memberForm.email}
                  onChange={(event) => setMemberForm({ ...memberForm, email: event.target.value })}
                />
                <input
                  placeholder="Address"
                  value={memberForm.address}
                  onChange={(event) => setMemberForm({ ...memberForm, address: event.target.value })}
                />
                <button type="submit">Add Member</button>
              </form>

              <form className="panel form-panel" onSubmit={submitGroup}>
                <h2>Create Chit Group</h2>
                <input
                  placeholder="Group Name"
                  value={groupForm.name}
                  onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Monthly Amount"
                  value={groupForm.monthlyAmount}
                  onChange={(event) => setGroupForm({ ...groupForm, monthlyAmount: event.target.value })}
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Duration (Months)"
                  value={groupForm.durationMonths}
                  onChange={(event) => setGroupForm({ ...groupForm, durationMonths: event.target.value })}
                  required
                />
                <input
                  type="date"
                  value={groupForm.startDate}
                  onChange={(event) => setGroupForm({ ...groupForm, startDate: event.target.value })}
                  required
                />
                <select
                  value={groupForm.status}
                  onChange={(event) => setGroupForm({ ...groupForm, status: event.target.value })}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <button type="submit">Create Group</button>
              </form>

              <form className="panel form-panel" onSubmit={submitAssignMember}>
                <h2>Assign Member to Group</h2>
                <select
                  value={assignForm.groupId}
                  onChange={(event) => setAssignForm({ ...assignForm, groupId: event.target.value })}
                  required
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <select
                  value={assignForm.memberId}
                  onChange={(event) => setAssignForm({ ...assignForm, memberId: event.target.value })}
                  required
                >
                  <option value="">Select Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
                <button type="submit">Assign</button>
              </form>

              <form className="panel form-panel" onSubmit={submitContribution}>
                <h2>Record Contribution</h2>
                <select
                  value={contributionForm.groupId}
                  onChange={(event) => setContributionForm({ ...contributionForm, groupId: event.target.value })}
                  required
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <select
                  value={contributionForm.memberId}
                  onChange={(event) => setContributionForm({ ...contributionForm, memberId: event.target.value })}
                  required
                >
                  <option value="">Select Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Contribution Month"
                  value={contributionForm.contributionMonth}
                  onChange={(event) =>
                    setContributionForm({ ...contributionForm, contributionMonth: event.target.value })
                  }
                  required
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Amount Paid"
                  value={contributionForm.amountPaid}
                  onChange={(event) => setContributionForm({ ...contributionForm, amountPaid: event.target.value })}
                  required
                />
                <input
                  type="date"
                  value={contributionForm.paidOn}
                  onChange={(event) => setContributionForm({ ...contributionForm, paidOn: event.target.value })}
                />
                <select
                  value={contributionForm.paymentMode}
                  onChange={(event) => setContributionForm({ ...contributionForm, paymentMode: event.target.value })}
                >
                  <option value="CASH">CASH</option>
                  <option value="ONLINE">ONLINE</option>
                  <option value="UPI">UPI</option>
                </select>
                <button type="submit">Save Contribution</button>
              </form>

              <form className="panel form-panel" onSubmit={submitScheduleAuction}>
                <h2>Schedule Auction</h2>
                <select
                  value={auctionScheduleForm.groupId}
                  onChange={(event) => setAuctionScheduleForm({ ...auctionScheduleForm, groupId: event.target.value })}
                  required
                >
                  <option value="">Select Group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Month Number"
                  value={auctionScheduleForm.monthNumber}
                  onChange={(event) =>
                    setAuctionScheduleForm({ ...auctionScheduleForm, monthNumber: event.target.value })
                  }
                  required
                />
                <input
                  type="date"
                  value={auctionScheduleForm.scheduledOn}
                  onChange={(event) =>
                    setAuctionScheduleForm({ ...auctionScheduleForm, scheduledOn: event.target.value })
                  }
                  required
                />
                <button type="submit">Schedule</button>
              </form>

              <form className="panel form-panel" onSubmit={submitCompleteAuction}>
                <h2>Complete Auction</h2>
                <input
                  type="number"
                  min="1"
                  placeholder="Auction ID"
                  value={auctionCompleteForm.auctionId}
                  onChange={(event) => setAuctionCompleteForm({ ...auctionCompleteForm, auctionId: event.target.value })}
                  required
                />
                <select
                  value={auctionCompleteForm.winnerMemberId}
                  onChange={(event) =>
                    setAuctionCompleteForm({ ...auctionCompleteForm, winnerMemberId: event.target.value })
                  }
                  required
                >
                  <option value="">Winner Member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Bid Discount %"
                  value={auctionCompleteForm.bidDiscountPercent}
                  onChange={(event) =>
                    setAuctionCompleteForm({ ...auctionCompleteForm, bidDiscountPercent: event.target.value })
                  }
                  required
                />
                <button type="submit">Complete Auction</button>
              </form>
            </section>

            <section className="card-grid list-grid">
              <article className="panel list-panel">
                <div className="panel-head">
                  <h2>Groups</h2>
                  <select
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                  >
                    <option value="">View Group Member Status</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Monthly</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Members</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>{money(group.monthly_amount)}</td>
                          <td>{group.duration_months}</td>
                          <td>{group.status}</td>
                          <td>{group.member_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel list-panel">
                <h2>Recent Contributions</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Group</th>
                        <th>Month</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contributions.slice(0, 8).map((row) => (
                        <tr key={row.id}>
                          <td>{row.full_name}</td>
                          <td>{row.group_name}</td>
                          <td>{row.contribution_month}</td>
                          <td>{money(row.amount_paid)}</td>
                          <td>{new Date(row.paid_on).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="panel list-panel">
                <h2>Auction History</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Group</th>
                        <th>Month</th>
                        <th>Status</th>
                        <th>Winner</th>
                        <th>Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctions.map((auction) => (
                        <tr key={auction.id}>
                          <td>{auction.id}</td>
                          <td>{auction.group_name}</td>
                          <td>{auction.month_number}</td>
                          <td>{auction.status}</td>
                          <td>{auction.winner_name || "-"}</td>
                          <td>{auction.winner_payout ? money(auction.winner_payout) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>

            {selectedGroupDetail ? (
              <section className="panel">
                <h2>Group Member Eligibility: {selectedGroupDetail.name}</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Paid Total</th>
                        <th>Pending</th>
                        <th>Completion %</th>
                        <th>Eligible</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroupDetail.members.map((member) => (
                        <tr key={member.member_id}>
                          <td>{member.full_name}</td>
                          <td>{money(member.paid_total)}</td>
                          <td>{money(member.pending_amount)}</td>
                          <td>{Number(member.completion_percent).toFixed(2)}</td>
                          <td>{member.is_eligible ? "YES" : "NO"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="panel statement-panel">
              <h2>Member Monthly Statement</h2>
              <form className="statement-form" onSubmit={submitStatementLookup}>
                <input
                  type="number"
                  min="1"
                  placeholder="Member ID"
                  value={statementMemberId}
                  onChange={(event) => setStatementMemberId(event.target.value)}
                  required
                />
                <button type="submit">Generate Statement</button>
              </form>
              <StatementView data={statementData} />
            </section>
          </section>
        ) : (
          <section className="panel statement-panel">
            <h2>My Statement</h2>
            {loading ? <p>Loading statement...</p> : <StatementView data={statementData} />}
          </section>
        )}
      </main>
    </div>
  );
}

function StatementView({ data }) {
  if (!data) {
    return <p>No statement loaded yet.</p>;
  }

  return (
    <div className="statement-wrap">
      <div className="statement-head">
        <p>
          <strong>Member:</strong> {data.member.full_name}
        </p>
        <p>
          <strong>Total Due:</strong> {money(data.totals.overallDue)}
        </p>
        <p>
          <strong>Total Paid:</strong> {money(data.totals.overallPaid)}
        </p>
        <p>
          <strong>Pending:</strong> {money(data.totals.overallPending)}
        </p>
      </div>

      {data.statements.map((statement) => (
        <article className="statement-group" key={statement.groupId}>
          <h3>{statement.groupName}</h3>
          <p>
            Monthly: {money(statement.monthlyAmount)} | Duration: {statement.durationMonths} months | Completion: {" "}
            {Number(statement.summary.completionPercent).toFixed(2)}%
          </p>
          <div className="table-wrap compact">
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Paid On</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {statement.contributions.length === 0 ? (
                  <tr>
                    <td colSpan="4">No contributions yet.</td>
                  </tr>
                ) : (
                  statement.contributions.map((row, index) => (
                    <tr key={`${statement.groupId}_${row.contribution_month}_${index}`}>
                      <td>{row.contribution_month}</td>
                      <td>{money(row.amount_paid)}</td>
                      <td>{new Date(row.paid_on).toLocaleDateString()}</td>
                      <td>{row.payment_mode}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

export default App;
