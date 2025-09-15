export const saveToEventHistory = ({
  eventId,
  service_name,
  eventType,
  status,
  attendees = [],
  reason = "",
  leader12 = "-",
  leader12_email = "-",
  userEmail = "",
  closedAt = "",
}) => {
  // Get current history from localStorage or default to empty array
  const currentHistory = JSON.parse(localStorage.getItem("eventHistory")) || [];

  // Create new event entry
  const newEntry = {
    eventId,
    service_name,
    eventType,
    status,
    attendees,
    reason,
    leader12,
    leader12_email,
    userEmail,
    closedAt,
    timestamp: new Date().toISOString(), // Add timestamp if you want
  };

  // Add new entry to the history
  currentHistory.push(newEntry);

  // Save updated history back to localStorage
  localStorage.setItem("eventHistory", JSON.stringify(currentHistory));

  // Optional: emit event to notify listeners that history was updated
  window.dispatchEvent(new Event("eventHistoryUpdated"));

  console.log("Saved event history:", newEntry);
};
