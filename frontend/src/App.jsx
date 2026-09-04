import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/leads";

const emptyForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  source: "Website",
  status: "New",
  notes: "",
  nextFollowUp: "",
};

function App() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    Total: 0,
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Converted: 0,
    Lost: 0,
  });

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);

  // Get leads
  const fetchLeads = async () => {
    try {
      const res = await axios.get(API, {
        params: {
          search,
          status,
          source,
          sort,
          page,
          limit: 10,
        },
      });

      setLeads(res.data.data);
      setPages(res.data.pages);
    } catch (error) {
      console.log(error);
    }
  };

  // Get dashboard statistics
  const fetchStats = async () => {
    try {
      const res = await axios.get(API, {
        params: {
          limit: 1000,
        },
      });

      const allLeads = res.data.data;

      const newStats = {
        Total: allLeads.length,
        New: 0,
        Contacted: 0,
        Qualified: 0,
        Converted: 0,
        Lost: 0,
      };

      allLeads.forEach((lead) => {
        if (newStats[lead.status] !== undefined) {
          newStats[lead.status]++;
        }
      });

      setStats(newStats);

      calculateFollowUps(allLeads);
    } catch (error) {
      console.log(error);
    }
  };

  // Follow-up logic
  const calculateFollowUps = (allLeads) => {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const todayList = [];
    const overdueList = [];

    allLeads.forEach((lead) => {
      if (!lead.nextFollowUp) return;

      if (
        lead.status === "Converted" ||
        lead.status === "Lost"
      ) {
        return;
      }

      const followUp = new Date(lead.nextFollowUp);
      followUp.setHours(0, 0, 0, 0);

      if (followUp.getTime() === today.getTime()) {
        todayList.push(lead);
      }

      if (followUp < today) {
        overdueList.push(lead);
      }
    });

    setTodayFollowUps(todayList);
    setOverdueFollowUps(overdueList);
  };

  useEffect(() => {
    fetchLeads();
  }, [search, status, source, sort, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Input change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add / Edit lead
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Name is required");
      return;
    }

    if (!form.email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API}/${editingId}`, form);
        alert("Lead updated successfully");
      } else {
        await axios.post(API, form);
        alert("Lead added successfully");
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      fetchLeads();
      fetchStats();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  // Edit
  const handleEdit = (lead) => {
    setEditingId(lead._id);

    setForm({
      name: lead.name || "",
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "Other",
      status: lead.status || "New",
      notes: lead.notes || "",
      nextFollowUp: lead.nextFollowUp
        ? lead.nextFollowUp.substring(0, 10)
        : "",
    });

    setShowForm(true);
  };

  // Delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/${id}`);

      fetchLeads();
      fetchStats();
    } catch (error) {
      console.log(error);
    }
  };

  // Status update directly from table
  const handleStatusChange = async (lead, newStatus) => {
    try {
      await axios.put(`${API}/${lead._id}`, {
        ...lead,
        status: newStatus,
      });

      fetchLeads();
      fetchStats();
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN");
  };

  return (
    <div className="app">

      {/* Header */}
      <header>
        <div>
          <h1>Lead Management</h1>
          <p>Manage your leads and follow-ups</p>
        </div>

        <button
          className="add-btn"
          onClick={() => {
            setForm(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add Lead
        </button>
      </header>

      {/* Dashboard */}
      <section className="stats">

        <div className="card">
          <span>Total Leads</span>
          <strong>{stats.Total}</strong>
        </div>

        <div className="card">
          <span>New</span>
          <strong>{stats.New}</strong>
        </div>

        <div className="card">
          <span>Contacted</span>
          <strong>{stats.Contacted}</strong>
        </div>

        <div className="card">
          <span>Qualified</span>
          <strong>{stats.Qualified}</strong>
        </div>

        <div className="card">
          <span>Converted</span>
          <strong>{stats.Converted}</strong>
        </div>

        <div className="card">
          <span>Lost</span>
          <strong>{stats.Lost}</strong>
        </div>

      </section>

      {/* Visual breakdown */}
      <section className="breakdown">

        <h2>Lead Status Breakdown</h2>

        {Object.entries(stats)
          .filter(([key]) => key !== "Total")
          .map(([key, value]) => {
            const percentage =
              stats.Total === 0
                ? 0
                : (value / stats.Total) * 100;

            return (
              <div className="bar-row" key={key}>
                <span>{key}</span>

                <div className="bar-container">
                  <div
                    className="bar"
                    style={{
                      width: `${percentage}%`,
                    }}
                  ></div>
                </div>

                <b>{value}</b>
              </div>
            );
          })}

      </section>

      {/* Follow-ups */}
      <section className="followups">

        <div className="follow-card">
          <h2>Today's Follow-ups</h2>

          {todayFollowUps.length === 0 ? (
            <p>No follow-ups today.</p>
          ) : (
            todayFollowUps.map((lead) => (
              <div className="follow-item" key={lead._id}>
                <strong>{lead.name}</strong>
                <span>{lead.company}</span>
              </div>
            ))
          )}
        </div>

        <div className="follow-card overdue">
          <h2>Overdue Follow-ups</h2>

          {overdueFollowUps.length === 0 ? (
            <p>No overdue follow-ups.</p>
          ) : (
            overdueFollowUps.map((lead) => (
              <div className="follow-item" key={lead._id}>
                <strong>{lead.name}</strong>
                <span>{formatDate(lead.nextFollowUp)}</span>
              </div>
            ))
          )}
        </div>

      </section>

      {/* Lead form */}
      {showForm && (
        <div className="form-container">

          <h2>
            {editingId ? "Edit Lead" : "Add Lead"}
          </h2>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div>
                <label>Full Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label>Company</label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Enter company"
                />
              </div>

              <div>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label>Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone"
                />
              </div>

              <div>
                <label>Lead Source</label>
                <select
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                >
                  <option>Website</option>
                  <option>LinkedIn</option>
                  <option>Referral</option>
                  <option>Facebook</option>
                  <option>Google</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Converted</option>
                  <option>Lost</option>
                </select>
              </div>

              <div>
                <label>Next Follow-up</label>
                <input
                  type="date"
                  name="nextFollowUp"
                  value={form.nextFollowUp}
                  onChange={handleChange}
                />
              </div>

              <div className="full">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Enter notes"
                ></textarea>
              </div>

            </div>

            <div className="form-buttons">

              <button type="submit">
                {editingId ? "Update Lead" : "Add Lead"}
              </button>

              <button
                type="button"
                className="cancel"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Search & filters */}
      <section className="toolbar">

        <input
          className="search"
          placeholder="Search name, company or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option>New</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Converted</option>
          <option>Lost</option>
        </select>

        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Sources</option>
          <option>Website</option>
          <option>LinkedIn</option>
          <option>Referral</option>
          <option>Facebook</option>
          <option>Google</option>
          <option>Other</option>
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="nameAsc">Name A-Z</option>
          <option value="nameDesc">Name Z-A</option>
        </select>

      </section>

      {/* Table */}
      <section className="table-container">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Source</th>
              <th>Status</th>
              <th>Follow-up</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {leads.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id}>

                  <td>{lead.name}</td>

                  <td>{lead.company || "-"}</td>

                  <td>{lead.email}</td>

                  <td>{lead.phone || "-"}</td>

                  <td>{lead.source}</td>

                  <td>
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleStatusChange(
                          lead,
                          e.target.value
                        )
                      }
                    >
                      <option>New</option>
                      <option>Contacted</option>
                      <option>Qualified</option>
                      <option>Converted</option>
                      <option>Lost</option>
                    </select>
                  </td>

                  <td>
                    {formatDate(lead.nextFollowUp)}
                  </td>

                  <td>
                    <button
                      className="edit"
                      onClick={() => handleEdit(lead)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete"
                      onClick={() =>
                        handleDelete(lead._id)
                      }
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </section>

      {/* Pagination */}
      <div className="pagination">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {pages || 1}
        </span>

        <button
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>

      </div>

    </div>
  );
}

export default App;