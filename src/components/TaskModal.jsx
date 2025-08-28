import React from "react";
import "./TaskModal.css";

export default function TaskModal({ isOpen, onClose, formType, taskData, setTaskData, handleSubmit, submitting }) {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData({ ...taskData, [name]: value });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2 className="modal-title">{formType === "call" ? "Add Call Task" : "Add Visit Task"}</h2>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="task-form-body">
            <div className="task-info">
              <label>
                Recipient
                <input
                  name="recipient"
                  value={taskData.recipient}
                  onChange={handleChange}
                  placeholder="Enter recipient name"
                  required
                />
              </label>

              <label>
                Assigned To
                <input
                  name="assignedTo"
                  value={taskData.assignedTo}
                  onChange={handleChange}
                  placeholder="Enter assignee"
                  required
                />
              </label>

              <label>
                Due Date
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={taskData.dueDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Task Type
                <input
                  name="taskType"
                  value={taskData.taskType}
                  onChange={handleChange}
                  placeholder="Enter task type"
                />
              </label>
            </div>

            <div className="task-comments">
              <label>
                Comments
                <textarea
                  name="comments"
                  value={taskData.comments}
                  onChange={handleChange}
                  placeholder="Add notes here..."
                />
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="finish-btn" disabled={submitting}>
              {submitting ? <span className="loader"></span> : "Save Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
