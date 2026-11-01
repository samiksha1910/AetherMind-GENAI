
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong.");
  }

  return data;
}

export async function checkBackend() {
  return apiRequest("/api/health");
}

export async function extractTasks(text, source = "Text") {
  return apiRequest("/api/ai/extract", {
    method: "POST",
    body: JSON.stringify({ text, source }),
  });
}

export async function getTasks() {
  return apiRequest("/api/tasks");
}

export async function createTask(task) {
  return apiRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(id, updates) {
  return apiRequest(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id) {
  return apiRequest(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

// GOALS API

export async function getGoals() {
  return apiRequest("/api/goals");
}

export async function createGoal(goal) {
  return apiRequest("/api/goals", {
    method: "POST",
    body: JSON.stringify(goal),
  });
}

export async function updateGoal(id, updates) {
  return apiRequest(`/api/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteGoal(id) {
  return apiRequest(`/api/goals/${id}`, {
    method: "DELETE",
  });
}

export async function breakDownGoal(text) {
  return apiRequest("/api/ai/breakdown-goal", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
