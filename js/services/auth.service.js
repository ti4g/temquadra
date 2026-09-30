// js/services/auth.service.js
import { httpClient } from '../core/api-client.js';

export async function login(email, passwords) {
    const data = await httpClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, passwords })
    });

    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userRole', data.role);

    return data;
}

export function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

export function estaAutenticado() {
    return !!localStorage.getItem('token');
}