const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`; // replace with your backend API URL

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }
  
  return response.json(); // Should return { access_token, refresh_token_id, refresh_token } or similar
};

export const logout = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
};

export const refreshToken = async (refreshTokenId, refreshTokenValue) => {
  const response = await fetch(`${API_BASE_URL}/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token_id: refreshTokenId,
      refresh_token: refreshTokenValue,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Token refresh failed");
  }

  return response.json(); // Should return new access and refresh tokens
};


// // Add this function to your StatsDashboard component
// export const calculateOverdueCells = (events) => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   return events.filter(event => {
//     // Must match exactly what your Events screen uses
//     if (!event.eventType) return false;
    
//     const eventType = event.eventType.toLowerCase();
//     const isCellEvent = eventType.includes('cell') || 
//                        eventType.includes('small group') ||
//                        eventType.includes('small-group') ||
//                        eventType.includes('small_groups');
    
//     if (!isCellEvent) return false;

//     // Completion logic that matches Events screen
//     const did_not_meet = event.did_not_meet || false;
//     const hasAttendees = event.attendees && event.attendees.length > 0;
//     const status = (event.status || '').toLowerCase().trim();
    
//     const isCompleted = hasAttendees || 
//                        status === 'completed' || 
//                        status === 'closed' || 
//                        did_not_meet;

//     if (isCompleted) return false;
//     if (!event.date) return false;
    
//     const eventDate = new Date(event.date);
//     eventDate.setHours(0, 0, 0, 0);
    
//     return eventDate < today;
//   });
// };
