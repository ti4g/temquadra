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
export async function cadastrarPontoColeta(formData) {
    return httpClient('/pontos-coleta', {
        method: 'POST',
        body: formData //aceita fotos
    });
}

/**
 * Atualiza um ponto de coleta existente
 */
export async function atualizarPontoColeta(idPonto, formData) {
    return httpClient(`/pontos-coleta/${idPonto}`, {
        method: 'PUT', // multipart mapping
        body: formData // Alterado de JSON para FormData para suportar fotos
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