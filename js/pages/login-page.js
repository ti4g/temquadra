import { login, estaAutenticado } from '../services/auth.service.js';

document.addEventListener('DOMContentLoaded', () => {
    // Se o usuário já estiver autenticado, redireciona direto para o Dashboard
    if (estaAutenticado()) {
        window.location.href = 'admin.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorMsg = document.getElementById('errorMsg');
    const btnLogin = document.getElementById('btnLogin');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const passwords = document.getElementById('passwords').value;

        // Limpa mensagens de erro anteriores
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
        
        // Estado visual de carregamento
        btnLogin.disabled = true;
        btnLogin.textContent = 'Autenticando...';

        try {
            await login(email, passwords);
            // Redireciona para o Painel Administrativo após o login
            window.location.href = 'admin.html';
        } catch (err) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.';
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = 'Entrar no Painel';
        }
    });
});