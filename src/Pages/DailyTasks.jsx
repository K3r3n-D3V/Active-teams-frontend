import React, { useEffect, useState } from "react";
import { Phone, UserPlus, Plus } from "lucide-react";

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
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [formType, setFormType] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [storedUser, setStoredUser] = useState(() =>
    JSON.parse(localStorage.getItem("userProfile") || "{}")
  );
  const [newTaskTypeName, setNewTaskTypeName] = useState("");
  const [addingTaskType, setAddingTaskType] = useState(false);
  

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}` || "http://127.0.0.1:8000";
  // const API_URL = "http://127.0.0.1:8000"

  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getInitialTaskData = () => ({
    taskType: "",
    recipient: null,
    recipientDisplay: "",
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

  const fetchTaskTypes = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tasktypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch task types");
      const data = await res.json();
      setTaskTypes(Array.isArray(data) ? data : data.taskTypes || []);
    } catch (err) {
      console.error("Error fetching task types:", err.message);
    }
  };

  const createTaskType = async () => {
    if (!newTaskTypeName.trim()) {
      alert("Please enter a task type name");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setAddingTaskType(true);
    try {
      const res = await fetch(`${API_URL}/tasktypes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTaskTypeName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create task type');
      }

      setTaskTypes([...taskTypes, data.taskType || data]);
      setNewTaskTypeName("");
      setIsAddTypeModalOpen(false);
    } catch (err) {
      console.error("Error creating task type:", err.message);
      alert("Failed to create task type: " + err.message);
    } finally {
      setAddingTaskType(false);
    }
  };

  const fetchUserTasks = async (userId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, skipping fetch");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tasks?user_email=${storedUser.email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();

      const normalizedTasks = (Array.isArray(data) ? data : data.tasks || []).map((task) => ({
        ...task,
        assignedTo: task.assignedfor || task.assignedTo,
        date: task.date || task.followup_date,
        status: (task.status || "Open").toLowerCase(),
        taskName: task.name || task.taskName,
        type: (task.type || (task.taskType?.toLowerCase()?.includes("visit") ? "visit" : "call")) || "call",
      }));

      setTasks(normalizedTasks);
    } catch (err) {
      console.error("Error fetching user tasks:", err.message);
    } finally {
      setLoading(false);
    }
  };

 const fetchPeople = async (q) => {
  if (!q.trim()) return setSearchResults([]);

  const parts = q.trim().split(/\s+/);
  const name = parts[0];
  const surname = parts.slice(1).join(" ");

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/people?name=${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch people");

    const data = await res.json();

    // Filter results
    let filtered = (data?.results || []).filter(p =>
      p.Name.toLowerCase().includes(name.toLowerCase()) &&
      (!surname || p.Surname.toLowerCase().includes(surname.toLowerCase()))
    );

    // Sort alphabetically by Name, then Surname
    filtered.sort((a, b) => {
      const nameA = a.Name.toLowerCase();
      const nameB = b.Name.toLowerCase();
      const surnameA = (a.Surname || "").toLowerCase();
      const surnameB = (b.Surname || "").toLowerCase();

      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      if (surnameA < surnameB) return -1;
      if (surnameA > surnameB) return 1;
      return 0;
    });

    setSearchResults(filtered);
  } catch (err) {
    console.error("Error fetching people:", err);
    setSearchResults([]);
  }
};

  const fetchAssigned = async (q) => {
    if (!q.trim()) return setAssignedResults([]);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/assigned?name=${encodeURIComponent(q.trim())}`, {
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
      if (userId) {
        setStoredUser(freshUser);
        fetchUserTasks(userId);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const userId = storedUser?.userId || storedUser?.id;
    if (userId) {
      fetchUserTasks(userId);
      fetchTaskTypes();
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

  const updateTask = async (taskId, updatedData) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update task");

      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId ? { ...t, ...data.updatedTask, date: data.updatedTask.followup_date } : t
        )
      );
      
      handleClose();
    } catch (err) {
      console.error("Error updating task:", err.message);
      alert("Failed to update task: " + err.message);
    }
  };

  const handleEdit = (task) => {
  // If task is completed, prevent editing
  if (task.status?.toLowerCase() === "completed") {
    alert("This task has been marked as completed and cannot be edited.");
    return;
  }

  setSelectedTask(task);
  setFormType(task.type);
  setIsModalOpen(true);
  setTaskData({
    taskType: task.taskType || "",
    recipient: {
      Name: task.contacted_person?.name?.split(" ")[0] || "",
      Surname: task.contacted_person?.name?.split(" ")[1] || "",
      Phone: task.contacted_person?.phone || "",
      Email: task.contacted_person?.email || "",
    },
    recipientDisplay: task.contacted_person?.name || "",
    assignedTo: task.name || storedUser.name,
    dueDate: formatDateTime(task.date),
    status: task.status,
    taskStage: task.status,
  });
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!storedUser?.id) throw new Error("Logged-in user ID not found");

      const person = taskData.recipient;

      if (!person || !person.Name) {
        throw new Error("Person details not found. Please select a valid recipient.");
      }

      const taskPayload = {
        memberID: storedUser.id,
        name: taskData.assignedTo || storedUser.name,
        taskType: taskData.taskType || (formType === "call" ? "Call Task" : "Visit Task"),
        contacted_person: {
          name: `${person.Name} ${person.Surname}` || "Unknown",
          phone: person.Phone || "",
          email: person.Email || "",
        },
        followup_date: new Date(taskData.dueDate).toISOString(),
        status: taskData.taskStage || "Open",
        type: formType || "call",
        assignedfor: storedUser.email,
      };

       if (selectedTask && selectedTask._id) {
        await updateTask(selectedTask._id, taskPayload);
        alert(`Task for ${person.Name} ${person.Surname} has been successfully updated!`);
      } else {
        await createTask(taskPayload);
        alert(`You have successfully captured ${person.Name} ${person.Surname}`);
        console.log("Task created successfully");
      }

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

    let matchesType =
      filterType === "all" ||
      task.type === filterType ||
      (filterType === "consolidation" && task.taskType === "consolidation");
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

  const theme = {
    bg: '#ffffff',
    cardBg: '#ffffff',
    text: '#1a1a24',
    textSecondary: '#6b7280',
    inputBg: '#f3f4f6',
    shadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    border: '#e5e7eb',
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', backgroundColor: theme.bg, minHeight: '100vh' }}>
      <div style={{
        backgroundColor: theme.cardBg,
        color: theme.text,
        borderRadius: '20px',
        padding: '48px 32px',
        textAlign: 'center',
        boxShadow: theme.shadow,
        border: `1px solid ${theme.border}`,
      }}>
        <h1 style={{ fontSize: '72px', fontWeight: '700', margin: 0, letterSpacing: '-2px' }}>
          {totalCount}
        </h1>
        <p style={{ marginTop: '12px', fontSize: '16px', letterSpacing: '1px', textTransform: 'uppercase', color: theme.textSecondary, fontWeight: '600' }}>Tasks Complete</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px', flexWrap: 'wrap' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: theme.cardBg,
              color: theme.text,
              fontWeight: '600',
              padding: '14px 28px',
              borderRadius: '12px',
              border: `2px solid ${theme.border}`,
              cursor: 'pointer',
              fontSize: '15px',
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
              gap: '10px',
              backgroundColor: theme.cardBg,
              color: theme.text,
              fontWeight: '600',
              padding: '14px 28px',
              borderRadius: '12px',
              border: `2px solid ${theme.border}`,
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: theme.shadow,
            }}
            onClick={() => handleOpen("visit")}
          >
            <UserPlus size={20} /> Visit Task
          </button>
          
          {storedUser?.role === 'admin' && (
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#0f0e13ff',
                color: '#fff',
                fontWeight: '600',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '15px',
                boxShadow: theme.shadow,
              }}
              onClick={() => setIsAddTypeModalOpen(true)}
            >
              <Plus size={20} /> New Task Type
            </button>
          )}
        </div>

        <div style={{ marginTop: '32px' }}>
          <select
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: `2px solid ${theme.border}`,
              backgroundColor: theme.inputBg,
              color: theme.text,
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
              outline: 'none',
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

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
        {["all", "call", "visit", "consolidation"].map((type) => (
          <button
            key={type}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              border: filterType === type ? 'none' : `2px solid ${theme.border}`,
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: filterType === type ? theme.text : theme.cardBg,
              color: filterType === type ? theme.cardBg : theme.text,
              fontSize: '14px',
              boxShadow: filterType === type ? theme.shadow : 'none',
            }}
            onClick={() => setFilterType(type)}
          >
            {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: theme.textSecondary, fontStyle: 'italic', padding: '40px' }}>Loading tasks...</p>
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
                padding: '24px',
                borderRadius: '16px',
                border: `1px solid ${theme.border}`,
                marginBottom: '12px',
                cursor: 'pointer',
                boxShadow: theme.shadow,
              }}
            >
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  alert(`Recipient: ${task.contacted_person?.name}\nPhone: ${task.contacted_person?.phone || 'N/A'}\nEmail: ${task.contacted_person?.email || 'N/A'}`);
                }}
              >
                <p style={{ fontWeight: '700', color: theme.text, margin: 0, fontSize: '16px' }}>
                  {task.contacted_person?.name}
                </p>
                <p style={{ fontSize: '14px', color: theme.textSecondary, margin: '6px 0 0 0' }}>{task.name}</p>
                {task.isRecurring && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    backgroundColor: '#fde047',
                    color: '#854d0e',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginTop: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Recurring
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    border: '2px solid',
                    cursor: 'pointer',
                    backgroundColor: task.status === "open" ? theme.cardBg : task.status === "completed" ? theme.text : isDarkMode ? '#3a3a3a' : '#e5e5e5',
                    color: task.status === "open" ? theme.text : task.status === "completed" ? theme.cardBg : theme.text,
                    borderColor: task.status === "open" ? theme.text : task.status === "completed" ? theme.text : theme.textSecondary,
                  }}
                  onClick={() => handleEdit(task)}
                >
                  {task.status}
                </span>
                <div style={{ fontSize: '12px', color: theme.textSecondary, marginTop: '8px', fontWeight: '500' }}>{formatDate(task.date)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isAddTypeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "32px",
              borderRadius: "16px",
              width: "440px",
              maxWidth: "90%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
              Add New Task Type
            </h2>
            <input
              type="text"
              value={newTaskTypeName}
              onChange={(e) => setNewTaskTypeName(e.target.value)}
              placeholder="Enter task type name"
              autoFocus
              style={{
                padding: "14px 16px",
                fontSize: "15px",
                borderRadius: "12px",
                border: "2px solid #e5e5e5",
                width: "100%",
                boxSizing: "border-box",
                outline: 'none',
              }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={createTaskType}
                disabled={addingTaskType}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#0f0e13ff",
                  color: "#fff",
                  fontWeight: "600",
                  borderRadius: "12px",
                  border: "none",
                  cursor: addingTaskType ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: addingTaskType ? 0.7 : 1,
                }}
              >
                {addingTaskType ? "Adding..." : "Add"}
              </button>
              <button
                onClick={() => setIsAddTypeModalOpen(false)}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#e5e5e5",
                  color: "#0f0e13ff",
                  fontWeight: "600",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${theme.border}`,
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
                outline: 'none',
              }}
            >
              <option value="">Select a task type</option>
              {taskTypes.map((opt, idx) => (
                <option key={idx} value={opt.name || opt}>
                  {opt.name || opt}
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
              name="recipientDisplay"
              value={
                typeof taskData.recipient === "object" && taskData.recipient?.Name
                  ? `${taskData.recipient.Name} ${taskData.recipient.Surname || ""}`.trim()
                  : taskData.recipientDisplay || ""
              }
              onChange={(e) => {
                const value = e.target.value;
                setTaskData({ ...taskData, recipientDisplay: value, recipient: null });
                fetchPeople(value);
              }}
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${theme.border}`,
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
                outline: 'none',
              }}
              placeholder="Enter recipient name"
            />
            {searchResults.length > 0 && (
              <ul style={{
                position: 'absolute',
                zIndex: 10,
                width: '100%',
                backgroundColor: theme.cardBg,
                border: `2px solid ${theme.border}`,
                borderRadius: '10px',
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
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                    onClick={() => {
                      setTaskData({
                        ...taskData,
                        recipient: person,
                        recipientDisplay: `${person.Name} ${person.Surname}`,
                        contacted_person: {
                          name: `${person.Name} ${person.Surname}`,
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
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: theme.text,
                marginBottom: '8px',
              }}
            >
              Assigned To
            </label>
            <input
              type="text"
              name="assignedTo"
              value={taskData.assignedTo}
              onChange={(e) => {
                const value = e.target.value;
                setTaskData({ ...taskData, assignedTo: value });
                fetchAssigned(value);
              }}
              autoComplete="off"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${theme.border}`,
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
                outline: 'none',
              }}
              placeholder="Enter name to assign task"
            />
            {assignedResults.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  width: '100%',
                  backgroundColor: theme.cardBg,
                  border: `2px solid ${theme.border}`,
                  borderRadius: '10px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  listStyle: 'none',
                  padding: 0,
                  margin: '4px 0 0 0',
                  boxShadow: theme.shadow,
                }}
              >
                {assignedResults.map((person) => (
                  <li
                    key={person._id}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.border}`,
                      color: theme.text,
                    }}
                    onClick={() => {
                      setTaskData({
                        ...taskData,
                        assignedTo: `${person.Name} ${person.Surname}`,
                        assignedEmail: person.Email || "",
                      });
                      setAssignedResults([]);
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = theme.inputBg)
                    }
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
                  >
                    {person.Name} {person.Surname}{' '}
                    {person.Location ? `(${person.Location})` : ''}
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
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${theme.border}`,
                backgroundColor: theme.inputBg,
                fontSize: '14px',
                color: theme.text,
                outline: 'none',
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
                padding: '10px 12px',
                borderRadius: '10px',
                border: `2px solid ${theme.border}`,
                fontSize: '14px',
                backgroundColor: theme.inputBg,
                color: theme.text,
                outline: 'none',
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
                padding: '10px 24px',
                borderRadius: '10px',
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
                padding: '10px 24px',
                borderRadius: '10px',
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