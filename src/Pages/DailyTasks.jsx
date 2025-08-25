import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import "./DailyTasks.css";
import { FaPhone, FaUserPlus } from "react-icons/fa";
import Modal from "../components/TaskModal";
import "../components/TaskModal.css";

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formType, setFormType] = useState(""); // "call" | "visit"
  const [dateRange, setDateRange] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [currentDay, setCurrentDay] = useState(dayjs().format("YYYY-MM-DD"));

  const API_URL = "http://127.0.0.1:8000/tasks";

  // ✅ Helper to format datetime for <input type="datetime-local">
  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const [taskType, setTaskType] = useState("Awaiting Call");
  const taskOptions = [
      "Proper connect - Cell request",
      "Proper connect - Visit",
      "Proper call - Service Invitation",
      "Follow Up",
      "Wrong Number",
      "Awaiting Call",
      "No Answer",
    ];

  const [taskData, setTaskData] = useState({
    taskType: "",
    recipient: "",
    assignedTo: "",
    dueDate: getCurrentDateTime(),
    taskStage: "Open",
    comments: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch Tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // ✅ Reset completed count when day changes
    const interval = setInterval(() => {
      const today = dayjs().format("YYYY-MM-DD");
      if (today !== currentDay) {
        setCurrentDay(today);
      }
    }, 60 * 1000); // check every minute

    return () => clearInterval(interval);
  }, [currentDay]);

  // ✅ Open Modal
  const handleOpen = (type) => {
    setFormType(type);
    setIsModalOpen(true);
    setTaskData((prev) => ({
      ...prev,
      dueDate: getCurrentDateTime(),
    }));
  };

  // ✅ Controlled inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
  };

  // ✅ Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const sanitizedEmail = taskData.recipient
      .toLowerCase()
      .replace(/\s+/g, "") + "@gmail.com";
    const newTask = {
      memberID: "12345",
      name: taskData.assignedTo,  // use recipient as name
      taskType: taskData.taskType || (formType === "call" ? "Call Task" : "Visit Task"),
      contacted_person: {
        name: taskData.recipient,
        phone: "0786655753",
        email: sanitizedEmail,
      },
      followup_date: new Date(taskData.dueDate).toISOString(), // proper ISO datetime
      status: taskData.taskStage,
      type: formType,
    };


    try {
      await axios.post(API_URL, newTask);
      setTasks((prev) => [...prev, newTask]);
      fetchTasks();
      setIsModalOpen(false);
      setTaskData({
        taskType: "",
        recipient: "",
        assignedTo: "",
        dueDate: getCurrentDateTime(),
        taskStage: "Open",
        comments: "",
      });
    } catch (err) {
      console.error("Error adding task:", err);
    } finally {
      console.log("Task payload:", JSON.stringify(newTask, null, 2));

      setSubmitting(false);
    }

  };

  // ✅ Filtering logic
  const filteredTasks = tasks.filter((task) => {
    let matchesType = filterType === "all" || task.type === filterType;

    // Date filtering
    let matchesDate = true;
    const today = dayjs();
    const taskDate = dayjs(task.followup_date);

    if (dateRange === "today") {
      matchesDate = taskDate.isSame(today, "day");
    } else if (dateRange === "thisWeek") {
      matchesDate = taskDate.isSame(today, "week");
    } else if (dateRange === "previous7") {
      matchesDate = taskDate.isAfter(today.subtract(7, "day"));
    } else if (dateRange === "previousMonth") {
      matchesDate = taskDate.isAfter(today.subtract(1, "month"));
    }

    return matchesType && matchesDate;
  });

  // ✅ Dynamic counters
  const completedCount = filteredTasks.filter((t) => t.status === "Completed").length;
  const totalCount = filteredTasks.length;

  return (
    <div className="daily-container">
      {/* Counter */}
      <div className="counter-card">
        <h1> {totalCount}</h1>
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
            <div className="task-info">
              <h3>Task Information</h3>

                <div>
                  <label className="block text-sm font-medium mb-2">Task Type</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                  >
                    {taskOptions.map((option, idx) => (
                      <option key={idx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

              <label>Recipient</label>
              <input type="text" name="recipient" value={taskData.recipient} onChange={handleChange} required />

              <label>Assigned To</label>
              <input type="text" name="assignedTo" value={taskData.assignedTo} onChange={handleChange} required />

              <label>Due Date & Time</label>
              <input type="datetime-local" name="dueDate" value={taskData.dueDate} onChange={handleChange} required />

              <label>Task Stage</label>
              <select name="taskStage" value={taskData.taskStage} onChange={handleChange}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="finish-btn" disabled={submitting}>
                {submitting ? <span className="loader"></span> : "Finish"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Date Filter */}
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="previous7">Previous 7 Days</option>
          <option value="previousMonth">Previous Month</option>
        </select>
      </div>

      {/* Type Filter */}
      <div className="type-filter">
        <button className={filterType === "all" ? "active" : ""} onClick={() => setFilterType("all")}>All</button>
        <button className={filterType === "call" ? "active" : ""} onClick={() => setFilterType("call")}>Calls</button>
        <button className={filterType === "visit" ? "active" : ""} onClick={() => setFilterType("visit")}>Visits</button>
      </div>

      {/* Task List */}
      <div className="task-list">
        {loading ? (
          <p className="loading">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="no-tasks">No tasks yet.</p>
        ) : (
          filteredTasks.map((task, index) => (
            <div key={index} className="task-item">
              <div>
                <p className="task-title">{task.contacted_person?.name}</p>
                <p className="task-subtitle">{task.name}</p>
                <p className="task-email">{task.contacted_person?.email}</p>
              </div>
              <div className="task-meta">
                <span className={`status ${task.status === "Completed" ? "completed" : "pending"}`}>
                  {task.status}
                </span>
                <span className="task-date">{dayjs(task.followup_date).format("MMM D, YYYY")}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
