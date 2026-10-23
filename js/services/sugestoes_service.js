import { httpClient } from '../core/api-client.js';


export async function enviarSugestao(formData) {
    return httpClient('/quadras/sugestoes', {
        method: 'POST',
        body: formData
    });
}


export async function listarSugestoes() {
    return httpClient('/quadras/sugestoes', {
        method: 'GET'
    });
}

/**
 * Aprova uma sugestão de quadra. O Spring Boot moverá os dados da sugestão
 * para a tabela oficial de quadras e atualizará o status da sugestão para APROVADO.
 * Endpoint: POST /api/v1/quadras/sugestoes/{idSugestao}/aprovar
 * 
 * @param {string} idSugestao - UUID da sugestão
 * @param {string} observacaoAdmin - Nota opcional do administrador
 */
export async function aprovarSugestao(idSugestao, observacaoAdmin = '') {
    return httpClient(`/quadras/sugestoes/${idSugestao}/aprovar`, {
        method: 'POST',
        body: JSON.stringify({ observacaoAdmin })
    });
}