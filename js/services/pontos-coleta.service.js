import { httpClient } from '../core/api-client.js';

/**
 * Busca todos os pontos de coleta/doação cadastrados
 */
export async function listarPontosColetaAdmin() {
    return httpClient('/pontos-coleta');
}


/**
 * Cadastra um novo ponto de coleta
 */
export async function cadastrarPontoColeta(dados) {
    return httpClient('/pontos-coleta', {
        method: 'POST',
        body: JSON.stringify(dados)
    });
}

/**
 * Atualiza um ponto de coleta existente
 */
export async function atualizarPontoColeta(idPonto, dados) {
    return httpClient(`/pontos-coleta/${idPonto}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    });
}

/**
 * Desativa/Exclui um ponto de coleta
 */
export async function deletarPontoColeta(idPonto) {
    return httpClient(`/pontos-coleta/${idPonto}`, {
        method: 'DELETE'
    });
}