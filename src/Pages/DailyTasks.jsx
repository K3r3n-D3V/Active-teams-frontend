import React, { useEffect, useState } from "react";
import { Phone, UserPlus } from "lucide-react";

function Modal({ isOpen, onClose, children, theme }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.cardBg,
          color: theme.text,
          padding: "28px",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          border: `1px solid ${theme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "22px",
            cursor: "pointer",
            color: theme.textSecondary,
            fontWeight: "bold",
          }}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div style={{ marginTop: "8px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [storedUser, setStoredUser] = useState(() =>
    JSON.parse(localStorage.getItem("userProfile") || "{}")
  );

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}`

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

  const getInitialTaskData = () => ({
    taskType: "",
    recipient: "",
    assignedTo: `${storedUser?.name || ""} ${storedUser?.surname || ""}`.trim(),
    dueDate: getCurrentDateTime(),
    status: "Open",
    taskStage: "Open",
  });

  const [taskData, setTaskData] = useState(getInitialTaskData());
  const [searchResults, setSearchResults] = useState([]);
  const [assignedResults, setAssignedResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMedia.matches);
    };

    checkDarkMode();

    const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeMedia.addListener(handler);

    return () => darkModeMedia.removeListener(handler);
  }, []);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isDateInRange = (date, startDate, endDate) => {
    return date >= startDate && date <= endDate;
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const getEndOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchUserTasks = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching tasks for userEmail:", storedUser.email);
      
      const res = await fetch(`${API_URL}/tasks?user_email=${storedUser.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      console.log("Fetched tasks raw:", data);

    const normalizedTasks = (Array.isArray(data) ? data : data.tasks || []).map((task) => ({
      ...task,
      assignedTo: task.assignedfor || task.assignedTo,
      date: task.date || task.followup_date,
      status: (task.status || "Open").toLowerCase(),
      taskName: task.name || task.taskName,
      type: (task.type || (task.taskType?.toLowerCase()?.includes("visit") ? "visit" : "call")) || "call",
    }));


      console.log("Normalized tasks:", normalizedTasks);
      setTasks(normalizedTasks);
    } catch (err) {
      console.error("Error fetching user tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeople = async (q) => {
    if (!q.trim()) return setSearchResults([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/people?name=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Error fetching people:", err);
    }
  };

  const fetchAssigned = async (q) => {
    if (!q.trim()) return setAssignedResults([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/people?name=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignedResults(data.results || []);
    } catch (err) {
      console.error("Error fetching assigned people:", err);
    }
  };

  const createTask = async (taskPayload) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskPayload),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create task');
      }

      console.log("Task created:", data);

      if (data.task) {
        setTasks((prev) => [
          {
            ...data.task,
            assignedTo: data.task.assignedfor,
            date: data.task.followup_date,
            status: (data.task.status || "Open").toLowerCase(),
            taskName: data.task.name,
            type: data.task.type,
          },
          ...prev,
        ]);
      }
      
      return data;
    } catch (err) {
      console.error("Error creating task:", err.message);
      throw err;
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const freshUser = JSON.parse(localStorage.getItem("userProfile") || "{}");
      const userId = freshUser?.userId || freshUser?.id;
      console.log("Storage changed, fetching tasks for userId:", userId);
      if (userId) {
        setStoredUser(freshUser);
        fetchUserTasks(userId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const userId = storedUser?.userId || storedUser?.id;
    console.log("Initial fetch for userId:", userId, "storedUser:", storedUser);
    if (userId) {
      fetchUserTasks(userId);
    } else {
      console.log("No userId found in storedUser:", storedUser);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleOpen = (type) => {
    setFormType(type);
    setIsModalOpen(true);
    setTaskData(getInitialTaskData());
    setSearchResults([]);
    setAssignedResults([]);
    setSelectedTask({});
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setTaskData(getInitialTaskData());
    setSearchResults([]);
    setAssignedResults([]);
    setSelectedTask({});
    setFormType("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
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
        status: taskData.taskStage || "Open",
        type: formType || "call",
        assignedfor: storedUser.email,
      };

      console.log("Submitting task payload:", taskPayload);
      const result = await createTask(taskPayload);
      console.log("Task creation result:", result);

      handleClose();
    } catch (err) {
      console.error("Error adding task:", err.message);
      alert("Failed to create task: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const taskDate = parseDate(task.date);
    if (!taskDate) return false;

    let matchesType = filterType === "all" || task.type === filterType;
    let matchesDate = true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "today") {
      matchesDate = isSameDay(taskDate, today);
    } else if (dateRange === "thisWeek") {
      const startOfWeek = getStartOfWeek(today);
      const endOfWeek = getEndOfWeek(today);
      matchesDate = isDateInRange(taskDate, startOfWeek, endOfWeek);
    } else if (dateRange === "previous7") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      matchesDate = isDateInRange(taskDate, sevenDaysAgo, endOfToday);
    } else if (dateRange === "previousWeek") {
      const lastWeekDate = new Date(today);
      lastWeekDate.setDate(today.getDate() - 7);
      const startOfLastWeek = getStartOfWeek(lastWeekDate);
      const endOfLastWeek = getEndOfWeek(lastWeekDate);
      matchesDate = isDateInRange(taskDate, startOfLastWeek, endOfLastWeek);
    } else if (dateRange === "previousMonth") {
      const lastMonthDate = new Date(today);
      lastMonthDate.setMonth(today.getMonth() - 1);
      const startOfLastMonth = getStartOfMonth(lastMonthDate);
      const endOfLastMonth = getEndOfMonth(lastMonthDate);
      matchesDate = isDateInRange(taskDate, startOfLastMonth, endOfLastMonth);
    }

    return matchesType && matchesDate;
  });

  const totalCount = filteredTasks.length;

  // Default to light mode

const theme = {
  bg: '#f9fafb',
  cardBg: '#fff',
  text: '#000',
  textSecondary: '#666',
  inputBg: '#f5f5f5',
  shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  border: '#eee',
};


  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', backgroundColor: theme.bg, minHeight: '100vh' }}>
      {/* Counter Card */}
      <div style={{
        backgroundColor: theme.cardBg,
        color: theme.text,
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: theme.shadow,
        marginTop: '40px',
      }}>
        <h1 style={{ fontSize: '60px', fontWeight: '800', margin: 0 }}>
          {totalCount}
        </h1>
        <p style={{ marginTop: '12px', fontSize: '18px', letterSpacing: '0.5px' }}>Tasks Complete</p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '32px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: theme.cardBg,
              color: theme.text,
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: theme.shadow,
            }}
            onClick={() => handleOpen("call")}
          >
            <Phone size={20} /> Call Task
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: theme.cardBg,
              color: theme.text,
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: theme.shadow,
            }}
            onClick={() => handleOpen("visit")}
          >
            <UserPlus size={20} /> Visit Task
          </button>
        </div>

        {/* Date filter */}
        <div style={{ marginTop: '24px' }}>
          <select
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: theme.cardBg,
              color: theme.text,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: theme.shadow,
            }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="previousWeek">Previous Week</option>
            <option value="previousMonth">Previous Month</option>
          </select>
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
        {["all", "call", "visit"].map((type) => (
          <button
            key={type}
            style={{
              padding: '8px 24px',
              borderRadius: '24px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              backgroundColor: filterType === type ? theme.text : theme.cardBg,
              color: filterType === type ? theme.cardBg : theme.text,
              fontSize: '14px',
              boxShadow: theme.shadow,
            }}
            onClick={() => setFilterType(type)}
          >
            {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ marginTop: '32px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: theme.textSecondary, fontStyle: 'italic' }}>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: theme.textSecondary }}>No tasks yet.</p>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.cardBg,
                padding: '20px',
                borderRadius: '16px',
                border: 'none',
                marginBottom: '16px',
                cursor: 'pointer',
                boxShadow: theme.shadow,
              }}
            >
              <div>
                <p style={{ fontWeight: '600', color: theme.text, margin: 0 }}>
                  {task.contacted_person?.name}
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '4px 0 0 0' }}>{task.name}</p>
                {task.isRecurring && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#fde047',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '4px',
                  }}>
                    Recurring
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    border: '2px solid',
                    cursor: 'pointer',
                    backgroundColor: task.status === "open" ? theme.cardBg : task.status === "completed" ? theme.text : isDarkMode ? '#3a3a3a' : '#e5e5e5',
                    color: task.status === "open" ? theme.text : task.status === "completed" ? theme.cardBg : theme.text,
                    borderColor: task.status === "open" ? theme.text : task.status === "completed" ? theme.text : theme.textSecondary,
                  }}
                  onClick={() => {
                    if (task.status === "awaiting task") {
                      setSelectedTask(task);
                      setTaskData({
                        taskType: task.taskType || "",
                        recipient: task.contacted_person?.name || "",
                        assignedTo: `${storedUser?.name || ""} ${storedUser?.surname || ""}`.trim(),
                        dueDate: task.date ? formatDateTime(task.date) : getCurrentDateTime(),
                        status: task.status || "Open",
                        taskStage: task.status || "Open",
                      });
                      setFormType(task.type || "call");
                      setIsModalOpen(true);
                    }
                  }}
                >
                  {task.status}
                </span>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '4px' }}>{formatDate(task.date)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={handleClose} theme={theme}>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: theme.text, margin: 0 }}>
            {formType === "call" ? "Call" : "Visit"} Task
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
              Task Type
            </label>
            <select 
              name="taskType"
              value={taskData.taskType}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
              }}
            >
              <option value="">Select a task type</option>
              {taskOptions.map((opt, idx) => (
                <option key={idx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
              Recipient
            </label>
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
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
              }}
              placeholder="Enter recipient name"
            />
            {searchResults.length > 0 && (
              <ul style={{
                position: 'absolute',
                zIndex: 10,
                width: '100%',
                backgroundColor: theme.cardBg,
                border: 'none',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0 0',
                boxShadow: theme.shadow,
              }}>
                {searchResults.map((person) => (
                  <li
                    key={person._id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
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
                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.inputBg}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {person.Name} {person.Surname} {person.Location ? `(${person.Location})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={taskData.assignedTo}
              onChange={(e) => {
                handleChange(e);
                fetchAssigned(e.target.value);
              }}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
              }}
            />
            {assignedResults.length > 0 && (
              <ul style={{
                position: 'absolute',
                zIndex: 10,
                width: '100%',
                backgroundColor: theme.cardBg,
                border: 'none',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                listStyle: 'none',
                padding: 0,
                margin: '4px 0 0 0',
                boxShadow: theme.shadow,
              }}>
                {assignedResults.map((person) => (
                  <li
                    key={person._id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                    onClick={() => {
                      setTaskData({
                        ...taskData,
                        assignedTo: `${person.Name} ${person.Surname}`,
                      });
                      setAssignedResults([]);
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.inputBg}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {person.Name} {person.Surname} {person.Location ? `(${person.Location})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
              Due Date & Time
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={taskData.dueDate}
              onChange={handleChange}
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: theme.inputBg,
                fontSize: '14px',
                color: theme.text,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: theme.text, marginBottom: '8px' }}>
              Task Stage
            </label>
            <select
              name="taskStage"
              value={taskData.taskStage}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
              }}
            >
              <option value="Open">Open</option>
              <option value="Awaiting task">Awaiting task</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px' }}>
            <button
              type="button"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: '#e5e5e5',
                color: '#000',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                backgroundColor: submitting ? '#666' : '#000',
                color: '#fff',
                fontWeight: '600',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}