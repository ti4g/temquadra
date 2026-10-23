// js/services/quadras.service.js
import { httpClient } from '../core/api-client.js';

export async function listarQuadras() {
    return httpClient('/quadras');
}

export async function buscarQuadraPorId(id) {
    return httpClient(`/quadras/${id}`);
}

export async function cadastrarQuadra(formData) {
    return httpClient('/quadras', {
        method: 'POST',
        body: formData // Multipart Form Data com Imagens para o MinIO
    });
}

export async function atualizarQuadra(id, dados) {
    return httpClient(`/quadras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dados)
    });
}

export async function deletarQuadra(id) {
    return httpClient(`/quadras/${id}`, {
        method: 'DELETE'
    });
}
