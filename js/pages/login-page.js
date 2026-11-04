<<<<<<< HEAD
import { login, estaAutenticado } from '../services/auth_service.js';
=======
// js/pages/login-page.js
import { login, estaAutenticado } from '../services/auth.service.js';
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e

document.addEventListener('DOMContentLoaded', () => {
    // Quem já está logado vai direto pro painel
    if (estaAutenticado()) {
        window.location.href = 'admin.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const erro = document.getElementById('errorMsg');
    const botao = document.getElementById('btnLogin');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('passwords').value;
        erro.hidden = true;

        if (!email || !senha) {
            erro.textContent = 'Preencha o e-mail e a senha.';
            erro.hidden = false;
            return;
        }

        botao.disabled = true;
        botao.textContent = 'Entrando…';

        try {
            await login(email, senha);
            window.location.href = 'admin.html';
        } catch (err) {
            erro.textContent = 'E-mail ou senha não conferem. Confira e tente de novo.';
            erro.hidden = false;
            botao.disabled = false;
            botao.textContent = 'Entrar';
        }
    });
});
