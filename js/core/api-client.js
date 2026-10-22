// js/core/api-client.js
const API_BASE_URL = "http://localhost:8080/api/v1";

/** Texto que a pessoa entende, em vez de "Erro HTTP: 500". */
function mensagemDeErro(status, doServidor) {
    if (doServidor && status < 500) return doServidor;
    if (status === 400) return 'Algum dado não foi aceito. Confira os campos.';
    if (status === 403) return 'Você não tem permissão pra fazer isso.';
    if (status === 404) return 'Não encontramos isso. Pode ter sido removido.';
    if (status === 413) return 'O arquivo é grande demais.';
    if (status >= 500) return 'O servidor teve um problema. Tente de novo em instantes.';
    return `Erro inesperado (${status}).`;
}

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

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    } catch {
        throw new Error('Sem conexão com o servidor. Confira se a API está ligada.');
    }

    // Sessão expirada no painel: volta pro login. Em qualquer caso, quem chamou recebe um erro.
    if (response.status === 401) {
        localStorage.clear();
        if (window.location.pathname.endsWith('admin.html')) {
            window.location.href = 'login.html';
        }
        throw new Error('Sua sessão expirou. Entre de novo.');
    }

    if (!response.ok) {
        const corpo = await response.json().catch(() => ({}));
        throw new Error(mensagemDeErro(response.status, corpo.message));
    }

    if (response.status === 204) return null;
    return await response.json();
}