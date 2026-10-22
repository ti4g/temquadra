// js/core/router.js
import { estaAutenticado } from '../services/auth.service.js';

/** Manda pro login quem abre o painel sem estar logado. Devolve false nesse caso. */
export function verificarAcessoAdmin() {
    const ehPaginaAdmin = window.location.pathname.includes('admin.html');

    if (ehPaginaAdmin && !estaAutenticado()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

export function navegarPara(pagina) {
    window.location.href = pagina;
}