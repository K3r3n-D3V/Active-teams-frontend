import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import { FaPhone, FaUserPlus } from "react-icons/fa";
import TaskModal from "../components/TaskModal";
import "./DailyTasks.css";

export default function DailyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState(""); // "call" | "visit"
  const [dateRange, setDateRange] = useState("today");
  const [filterType, setFilterType] = useState("all");
  const [currentDay, setCurrentDay] = useState(dayjs().format("YYYY-MM-DD"));

  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/tasks`;

  const getCurrentDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const [taskData, setTaskData] = useState({
    taskType: "",
    recipient: "",
    assignedTo: "",
    dueDate: getCurrentDateTime(),
    taskStage: "Open",
    comments: "",
    contacted_person: { name: "", phone: "", email: "" },
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      const today = dayjs().format("YYYY-MM-DD");
      if (today !== currentDay) setCurrentDay(today);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [currentDay]);

  const handleOpen = (type) => {
    setFormType(type);
    setIsModalOpen(true);
    setTaskData((prev) => ({
      ...prev,
      dueDate: getCurrentDateTime(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sanitizedEmail =
      taskData.recipient.toLowerCase().replace(/\s+/g, "") + "@gmail.com";

    const taskPayload = {
      memberID: "1234",
      name: taskData.assignedTo,
      taskType:
        taskData.taskType || (formType === "call" ? "Call Task" : "Visit Task"),
      contacted_person: {
        name: taskData.recipient,
        phone: selectedTask.contacted_person?.phone || "0786655753",
        email: sanitizedEmail,
      },
      followup_date: new Date(taskData.dueDate).toISOString(),
      status: taskData.taskStage,
      type: formType,
    };

    try {
      await axios.post(API_URL, taskPayload);
      setTasks((prev) => [...prev, taskPayload]);
      setIsModalOpen(false);
      setTaskData({
        taskType: "",
        recipient: "",
        assignedTo: "",
        dueDate: getCurrentDateTime(),
        taskStage: "Open",
        comments: "",
        contacted_person: { name: "", phone: "", email: "" },
      });
      fetchTasks();
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    let matchesType = filterType === "all" || task.type === filterType;
    let matchesDate = true;
    const today = dayjs();
    const taskDate = dayjs(task.followup_date);
    if (dateRange === "today") matchesDate = taskDate.isSame(today, "day");
    else if (dateRange === "thisWeek") matchesDate = taskDate.isSame(today, "week");
    else if (dateRange === "previous7") matchesDate = taskDate.isAfter(today.subtract(7, "day"));
    else if (dateRange === "previousMonth") matchesDate = taskDate.isAfter(today.subtract(1, "month"));
    return matchesType && matchesDate;
  });

  return (
    <div className="daily-container">
      <div className="counter-card">
        <h1>{filteredTasks.length}</h1>
        <p>Tasks</p>

        <div className="task-actions">
          <button className="icon-btn" onClick={() => handleOpen("call")}>
            <FaPhone className="icon phone-right" /> Call Task
          </button>
          <button className="icon-btn" onClick={() => handleOpen("visit")}>
            <FaUserPlus className="icon" /> Visit Task
          </button>
        </div>

        <div className="date-filter">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="previous7">Previous 7 Days</option>
            <option value="previousMonth">Previous Month</option>
          </select>
        </div>
      </div>

      <div className="type-filter">
        <button className={filterType === "all" ? "active" : ""} onClick={() => setFilterType("all")}>All</button>
        <button className={filterType === "call" ? "active" : ""} onClick={() => setFilterType("call")}>Calls</button>
        <button className={filterType === "visit" ? "active" : ""} onClick={() => setFilterType("visit")}>Visits</button>
      </div>

      <div className="task-list">
        {loading ? (
          <p>Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          filteredTasks.map((task, idx) => (
            <div key={idx} className="task-item">
              <div>
                <p className="task-text">{task.contacted_person?.name}</p>
                <p className="task-text">{task.name}</p>
              </div>
              <div className="task-meta">
                <span className={`status ${task.status?.toLowerCase()}`}>{task.status}</span>
                <span className="task-date">{dayjs(task.followup_date).format("MMM D, YYYY")}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formType={formType}
        taskData={taskData}
        setTaskData={setTaskData}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
