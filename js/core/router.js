// js/core/router.js
import { estaAutenticado } from '../services/auth.service.js';

export function verificarAcessoAdmin() {
    // Se tentar acessar uma página administrativa sem estar logado
    const ehPaginaAdmin = window.location.pathname.includes('admin.html');
    
    if (ehPaginaAdmin && !estaAutenticado()) {
        window.location.href = 'login.html';
    }
}

export function navegarPara(pagina) {
    window.location.href = pagina;
}