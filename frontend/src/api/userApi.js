import { API_BASE_URL } from "../config/apiConfig";

function getAccessToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Authentication token was not found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseApiResponse(response) {
  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

export async function getUsers() {
  const response = await fetch(
    `${API_BASE_URL}/api/users`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );

  return parseApiResponse(response);
}

export async function createUser(payload) {
  const response = await fetch(
    `${API_BASE_URL}/api/users`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  return parseApiResponse(response);
}

export async function updateUser(
  userId,
  payload,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  );

  return parseApiResponse(response);
}

export async function updateUserStatus(
  userId,
  isActive,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/status`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        is_active: isActive,
      }),
    },
  );

  return parseApiResponse(response);
}

export async function resetUserPassword(
  userId,
  newPassword,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${userId}/password`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        new_password: newPassword,
      }),
    },
  );

  return parseApiResponse(response);
}