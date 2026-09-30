// js/core/api-client.js
const API_BASE_URL = "http://localhost:8080/api/v1";

export async function httpClient(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    const headers = { ...(options.headers || {}) };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const config = { ...options, headers };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
        localStorage.clear();
        if (!window.location.pathname.endsWith('index.html')) {
            window.location.href = 'index.html';
        }
        return;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro na requisição.' }));
        throw new Error(error.message || `Erro HTTP: ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
}