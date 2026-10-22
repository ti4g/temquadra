// js/core/utils.js

/**
 * Higieniza strings para evitar ataques de Cross-Site Scripting (XSS)
 * ao injetar textos dinâmicos no HTML[cite: 31].
 */
export function escaparHtml(valor) {
    return String(valor == null ? '' : valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Formata strings em caixa alta / snake_case vindo dos Enums do Spring Boot 
 * (ex: "GRAMA_SINTETICA" => "Grama sintética")[cite: 1].
 */
export function formatarEnum(texto) {
    if (!texto) return '';
    const minusculo = texto.toLowerCase().replace(/_/g, ' ');
    return minusculo.charAt(0).toUpperCase() + minusculo.slice(1);
}

/**
 * Extrai coordenadas latitude/longitude de um texto colado do Google Maps[cite: 31].
 * Aceita formatos como: "-10.2083, -48.3281" ou links contendo "@-10.20,-48.34"[cite: 31].
 */
export function extrairCoordenada(entrada) {
    if (!entrada) return null;
    const re = /(?<![\d.])(-?\d{1,2}\.\d+)\s*,\s*\+?(-?\d{1,3}\.\d+)(?![\d.])/g;
    let match;
    while ((match = re.exec(String(entrada))) !== null) {
        const lat = Number(match[1]);
        const lng = Number(match[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
            return { lat, lng };
        }
    }
    return null;
}

/** Minúsculas e sem acento, pra busca não depender de "Ginásio" x "ginasio". */
export function normalizarTexto(valor) {
    return String(valor == null ? '' : valor)
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().trim();
}

/**
 * Reduz uma foto do celular antes do envio (lado maior até `max` px, JPEG).
 * O back aceita no máximo 1 MB por arquivo, e foto de celular costuma passar disso.
 */
export function reduzirImagem(arquivo, { max = 1600, qualidade = 0.82 } = {}) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(arquivo);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const escala = Math.min(1, max / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * escala);
            canvas.height = Math.round(img.height * escala);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                if (!blob) return reject(new Error('Não deu pra ler essa imagem.'));
                const nome = arquivo.name.replace(/\.[^.]+$/, '') + '.jpg';
                resolve(new File([blob], nome, { type: 'image/jpeg' }));
            }, 'image/jpeg', qualidade);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Esse arquivo não é uma imagem.')); };
        img.src = url;
    });
}

/**
 * Aplica máscara de telefone / WhatsApp enquanto o usuário digita (Ex: (63) 99999-9999)[cite: 31].
 */
export function formatarWhatsapp(valor) {
    const digitos = String(valor == null ? '' : valor).replace(/\D/g, '').slice(0, 11);
    if (!digitos) return '';
    if (digitos.length <= 2) return `(${digitos}`;
    
    const ddd = digitos.slice(0, 2);
    const resto = digitos.slice(2);
    if (resto.length <= 4) return `(${ddd}) ${resto}`;
    
    const corte = resto.length > 8 ? 5 : 4;
    return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}