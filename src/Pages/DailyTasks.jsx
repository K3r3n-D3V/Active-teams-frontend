import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FaPhone, FaUserPlus } from "react-icons/fa";
import Modal from "../components/TaskModal";
import "./DailyTasks.css";
import "../components/TaskModal.css";

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formType, setFormType] = useState(""); // "call" | "visit"
  const [dateRange, setDateRange] = useState("today");
  const [filterType, setFilterType] = useState("all");

  const API_URL = "http://127.0.0.1:8000";

  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const [taskOptions] = useState([
    "Cell request",
    "Visit",
    "Service Invitation",
    "Follow Up",
    "Wrong Number",
    "Awaiting Call",
    "No Answer",
  ]);

  // Get logged-in user from localStorage once
  const [storedUser] = useState(() =>
    JSON.parse(localStorage.getItem("userProfile") || "{}")
  );

  // taskData state
  const [taskData, setTaskData] = useState({
    taskType: "",
    recipient: "",
    assignedTo: storedUser?.email || "",
    dueDate: getCurrentDateTime(),
    status: "Open",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [assignedResults, setAssignedResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // ---------- API CALLS ----------
const fetchUserTasks = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    setLoading(true);
    const res = await axios.get(`${API_URL}/tasks/user-tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Fetched tasks raw:", res.data);

    const normalizedTasks = (res.data.tasks || []).map((task) => ({
      ...task,
      assignedTo: task.assignedfor || task.assignedTo, // normalize assignedFor
      date: task.date || task.followup_date,           // normalize date
      status: task.status?.toLowerCase() || "open",   // normalize status
      taskName: task.name || task.taskName,
    }));

    setTasks(normalizedTasks);
  } catch (err) {
    console.error("Error fetching user tasks:", err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};


  const fetchPeople = async (q) => {
    if (!q.trim()) return setSearchResults([]);
    try {
      const res = await axios.get(`${API_URL}/people`, { params: { name: q } });
      setSearchResults(res.data.results || []);
    } catch (err) {
      console.error("Error fetching people:", err);
    }
  };

  const fetchAssigned = async (q) => {
    if (!q.trim()) return setAssignedResults([]);
    try {
      const res = await axios.get(`${API_URL}/people`, { params: { name: q } });
      setAssignedResults(res.data.results || []);
    } catch (err) {
      console.error("Error fetching assigned people:", err);
    }
  };

  // ---------- LIFECYCLE ----------
  useEffect(() => {
    fetchUserTasks();
  }, []);

  // ---------- MODAL & FORM ----------
  const handleOpen = (type) => {
    setFormType(type);
    setIsModalOpen(true);
    setTaskData((prev) => ({
      ...prev,
      dueDate: getCurrentDateTime(),
      assignedTo: storedUser?.email || "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
  };

const createTask = async (taskPayload) => {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await axios.post(`${API_URL}/tasks`, taskPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Task created:", res.data);

    // Immediately append new task to state
    setTasks((prev) => [
      ...prev,
      {
        ...res.data.task,
        assignedTo: res.data.task.assignedfor,
        date: res.data.task.followup_date,
        status: res.data.task.status.toLowerCase(),
        taskName: res.data.task.name,
      },
    ]);
  } catch (err) {
    console.error("Error creating task:", err.response?.data || err.message);
    throw err;
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!storedUser?.id) throw new Error("Logged-in user ID not found");

      const sanitizedEmail = taskData.recipient
        ? taskData.recipient.toLowerCase().replace(/\s+/g, "") + "@gmail.com"
        : "unknown@gmail.com";

   const taskPayload = {
  memberID: storedUser.id,
  name: taskData.assignedTo || storedUser.name,
  taskType: taskData.taskType || (formType === "call" ? "Call Task" : "Visit Task"),
  contacted_person: {
    name: taskData.recipient || "Unknown",
    phone: "0786655753",
    email: sanitizedEmail,
  },
  followup_date: new Date(taskData.dueDate).toISOString(),
  status: taskData.taskStage || "Open",   // ✅ must be status, not taskStage
  type: formType || "call",
  assignedfor: storedUser.email,
};

      console.log("Submitting task payload:", taskPayload);
      await createTask(taskPayload);

      setIsModalOpen(false);
      setTaskData({
        taskType: "",
        recipient: "",
        assignedTo:taskData.assignedTo || storedUser.name,
        dueDate: getCurrentDateTime(),
        status: "Open",
      });
    } catch (err) {
      console.error("Error adding task:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- FILTERING ----------
  const filteredTasks = tasks.filter((task) => {
  let matchesType = filterType === "all" || task.type === filterType;
  let matchesDate = true;

  const today = dayjs();
  const taskDate = dayjs(task.date);

  if (dateRange === "today") matchesDate = taskDate.isSame(today, "day");
  else if (dateRange === "thisWeek") matchesDate = taskDate.isSame(today, "week");
  else if (dateRange === "previous7") matchesDate = taskDate.isAfter(today.subtract(7, "day"));
  else if (dateRange === "previousMonth") matchesDate = taskDate.isAfter(today.subtract(1, "month"));

  return matchesType && matchesDate;
});


  const totalCount = filteredTasks.length;

  // ---------- RENDER ----------
  return (
    <div className="daily-container">
      {/* Counter */}
      <div className="counter-card">
        <h1>{totalCount}</h1>
        <p>Tasks Complete</p>

        <div className="task-actions">
          <button className="icon-btn" onClick={() => handleOpen("call")}>
            <FaPhone className="icon phone-right" /> Call Task
          </button>
          <button className="icon-btn" onClick={() => handleOpen("visit")}>
            <FaUserPlus className="icon" /> Visit Task
          </button>
        </div>

        {/* Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <form className="task-form" onSubmit={handleSubmit}>
            <h3>Task Information</h3>

            <label>Task Type</label>
            <select name="taskType" value={taskData.taskType} onChange={handleChange}>
              {taskOptions.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>

            <div className="input-wrapper">
              <label>Recipient</label>
              <input
                type="text"
                name="recipient"
                value={taskData.recipient}
                onChange={(e) => {
                  const value = e.target.value;
                  setTaskData({ ...taskData, recipient: value });
                  fetchPeople(value);
                }}
                autoComplete="off"
                required
              />
              {searchResults.length > 0 && (
                <ul className="autocomplete-list">
                  {searchResults.map((person) => (
                    <li
                      key={person._id}
                      onClick={() => {
                        setTaskData({
                          ...taskData,
                          recipient: `${person.Name} ${person.Surname}`,
                          contacted_person: {
                            name: person.Name,
                            phone: person.Phone || "",
                            email: person.Email || "",
                          },
                        });
                        setSearchResults([]);
                      }}
                    >
                      {person.Name} {person.Surname} {person.Location ? `(${person.Location})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="input-wrapper">
              <label>Assigned To</label>
              <input
                type="text"
                name="assignedTo"
                value={taskData.assignedTo}
                onChange={(e) => {
                  handleChange(e);
                  fetchAssigned(e.target.value);
                }}
                required
              />
              {assignedResults.length > 0 && (
                <ul className="autocomplete-list">
                  {assignedResults.map((person) => (
                    <li
                      key={person._id}
                      onClick={() => {
                        setTaskData({
                          ...taskData,
                          assignedfor: `${person.Name} ${person.Surname}`,
                        });
                        setAssignedResults([]);
                      }}
                    >
                      {person.Name} {person.Surname} {person.Location ? `(${person.Location})` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <label>Due Date & Time</label>
            <input
              type="datetime-local"
              name="dueDate"
              value={taskData.dueDate}
              onChange={handleChange}
              disabled
            />

            <label>Task Stage</label>
            <select name="taskStage" value={taskData.taskStage} onChange={handleChange}>
              <option value="Open">Open</option>
              <option value="Awaiting task">Awaiting task</option>
              <option value="Completed">Completed</option>
            </select>

            <div className="modal-footer">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Task"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Date Filter */}
        <div className="date-filter">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="previous7">Previous 7 Days</option>
            <option value="previousMonth">Previous Month</option>
          </select>
        </div>
      </div>

      {/* Type Filter */}
      <div className="type-filter">
        <button className={filterType === "all" ? "active" : ""} onClick={() => setFilterType("all")}>All</button>
        <button className={filterType === "call" ? "active" : ""} onClick={() => setFilterType("call")}>Calls</button>
        <button className={filterType === "visit" ? "active" : ""} onClick={() => setFilterType("visit")}>Visits</button>
      </div>

      {/* Task List */}
      <div className="task-list">
        {loading ? <p>Loading tasks...</p> :
          filteredTasks.length === 0 ? <p>No tasks yet.</p> :
            filteredTasks.map((task) => (
              <div key={task._id} className="task-item">
                <div>
                  <p className="task-title">{task.contacted_person?.name}</p>
                  <p className="task-subtitle">{task.name}</p>
                  {task.isRecurring && <span className="recurring-badge">Recurring</span>}
                </div>
                <div className="task-meta">
                  <span
                    className={`status ${task.status} ${task.status === "Awaiting task" ? "editable" : ""}`}
                    onClick={() => {
                      if (task.status === "Awaiting task") {
                        setSelectedTask(task);
                        setTaskData({
                          taskType: task.taskType || "",
                          recipient: task.contacted_person?.name || "",
                          assignedTo: storedUser?.email || "",
                          dueDate: task.date
                            ? dayjs(task.date).format("YYYY-MM-DDTHH:mm")
                            : getCurrentDateTime(),
                          status: task.status || "Open",
                        });
                        setIsModalOpen(true);
                      }
                    }}
                  >
                    {task.status}
                  </span>
                  <span className="task-date">{dayjs(task.date).format("MMM D, YYYY")}</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
