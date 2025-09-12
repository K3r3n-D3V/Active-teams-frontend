// src/utils/eventHistory.js

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
  // TODO: Replace this with actual save logic (e.g., API call)
  console.log("Saving event history:", {
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
  });
};
