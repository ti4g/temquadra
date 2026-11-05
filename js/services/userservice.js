import { httpClient } from '../core/api-client.js';


export async function listarUsuarios() {
    return httpClient('/usuarios');
}
