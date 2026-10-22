// js/core/quadra.js
// Tradução dos dados da API (enums do Spring) para o que a tela mostra.

// cor: pino no mapa e ponto das etiquetas de piso.
export const PISOS = {
    CIMENTO: { nome: 'Cimento', cor: '#1C8FE3' },
    EMBORRACHADO: { nome: 'Emborrachado', cor: '#FF6B2C' },
    AREIA: { nome: 'Areia', cor: '#E9B44C' },
    GRAMADO: { nome: 'Gramado', cor: '#1FA45A' },
    GRAMA_SINTETICA: { nome: 'Grama sintética', cor: '#0FA39A' },
    OUTRO: { nome: 'Outro piso', cor: '#8A6BE0' }
};

export const COBERTURAS = {
    COBERTA: 'Coberta',
    PARCIALMENTE_COBERTA: 'Parcialmente coberta',
    DESCOBERTA: 'Descoberta'
};

// Estrutura extra da quadra. A API ainda não manda esses campos: a tela só mostra
// (etiqueta, filtro e opção no formulário) os que vierem na resposta de /quadras.
export const EXTRAS = {
    banheiro: { nome: 'Banheiro', icone: 'banheiro' },
    bebedouro: { nome: 'Bebedouro', icone: 'bebedouro' }
};

/** Quais EXTRAS a API já manda, olhando as quadras (ou sugestões) que vieram. */
export function extrasDaApi(respostas) {
    return Object.keys(EXTRAS).filter(chave => (respostas || []).some(r => chave in r));
}

export function infoPiso(enumPiso) {
    return PISOS[enumPiso] || PISOS.OUTRO;
}

/** Ilustração de quadra (SVG) usada quando não há foto. Cor = cor do piso. */
export function imagemPadrao(enumPiso) {
    const cor = infoPiso(enumPiso).cor;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'>
<rect width='400' height='240' fill='${cor}'/>
<g fill='none' stroke='#fff' stroke-opacity='.75' stroke-width='5'>
<rect x='30' y='28' width='340' height='184' rx='4'/>
<line x1='200' y1='28' x2='200' y2='212'/>
<circle cx='200' cy='120' r='34'/>
<path d='M30 78h56v84H30M370 78h-56v84h56'/></g></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Converte a resposta de /quadras para o formato da tela. */
export function normalizarQuadra(q) {
    const temCoord = typeof q.latitude === 'number' && typeof q.longitude === 'number';
    const fotos = (q.fotos || []).map(f => f.urlMinio).filter(Boolean);
    return {
        id: q.idQuadra,
        nome: q.nome,
        descricao: q.descricao || '',
        endereco: q.endereco || '',
        bairro: q.bairroRegiao || '',
        lat: temCoord ? q.latitude : null,
        lng: temCoord ? q.longitude : null,
        piso: q.tipoPiso,
        cobertura: q.cobertura,
        iluminacao: !!q.iluminacao,
        banheiro: q.banheiro === true,
        bebedouro: q.bebedouro === true,
        fotos,
        capa: fotos[0] || imagemPadrao(q.tipoPiso),
        distanciaKm: null
    };
}

/** Distância em linha reta (km) entre dois pontos. */
export function distanciaKm(a, b) {
    const R = 6371;
    const rad = x => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km) {
    if (km == null) return '';
    if (km < 1) return `${Math.round(km * 1000 / 10) * 10} m`;
    return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

export function linkRota(q) {
    return `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}`;
}
