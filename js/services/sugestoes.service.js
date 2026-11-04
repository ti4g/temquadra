import { httpClient } from '../core/api-client.js';

export async function listarSugestoes() {
    return httpClient('/quadras/sugestoes');
}


export async function enviarSugestao(formData) {
    return httpClient('/quadras/sugestoes', {
        method: 'POST',
        body: formData
    });
}

export async function aprovarSugestao(idSugestao, observacaoAdmin = '') {
    return httpClient(`/quadras/sugestoes/${idSugestao}/aprovar`, {
        method: 'POST',
        body: JSON.stringify({ observacaoAdmin })
    });
}