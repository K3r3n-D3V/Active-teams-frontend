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
