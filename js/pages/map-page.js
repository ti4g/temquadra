// js/pages/map-page.js
import { listarQuadras } from '../services/quadras.service.js';
import { escaparHtml } from '../core/utils.js';

let map;
let camadaMarcadores;
let quadras = [];
let carregou = false;

const CENTRO_PALMAS = [-10.2085, -48.3470];
const ZOOM_INICIAL = 13;

document.addEventListener('DOMContentLoaded', () => {
    iniciarMapa();
    carregarQuadras();

    // Eventos de Busca por Texto e Filtros de Chips
    document.getElementById('campo-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtros')?.addEventListener('change', aplicarFiltros);

    // Alternador de Vistas em Dispositivos Móveis (Lista / Mapa)
    document.querySelectorAll('.alternador__btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const vista = btn.dataset.vista;
            const app = document.getElementById('app');
            app.classList.toggle('mostrar-mapa', vista === 'mapa');
            app.classList.toggle('mostrar-lista', vista === 'lista');
            document.querySelectorAll('.alternador__btn').forEach(b => b.classList.toggle('ativo', b === btn));
            if (vista === 'mapa' && map) setTimeout(() => map.invalidateSize(), 0);
        });
    });
});

function iniciarMapa() {
    map = L.map('mapa', { zoomControl: true }).setView(CENTRO_PALMAS, ZOOM_INICIAL);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap'
    }).addTo(map);
    camadaMarcadores = L.layerGroup().addTo(map);
}

async function carregarQuadras() {
    const alvo = document.getElementById('lista');
    try {
        const dados = await listarQuadras();

        quadras = dados.map(q => ({
            id: q.idQuadra,
            nome: q.nome,
            regiao: q.bairroRegiao || 'Palmas - TO',
            lat: q.latitude || -10.2085,
            lng: q.longitude || -48.3470,
            piso: (q.tipoPiso || 'CIMENTO').toLowerCase(),
            cobertura: (q.cobertura || 'DESCOBERTA').toLowerCase(),
            iluminacao: q.iluminacao,
            acessibilidade: q.acessibilidade,
            foto: (q.fotos && q.fotos.length > 0) ? q.fotos[0].urlMinio : 'https://via.placeholder.com/400x220?text=Sem+Foto'
        }));

        carregou = true;
        aplicarFiltros();
    } catch (err) {
        if (alvo) alvo.innerHTML = `<p class="estado-lista estado-lista--erro">Erro ao carregar quadras: ${err.message}</p>`;
    }
}

function aplicarFiltros() {
    if (!carregou) return;

    const termo = (document.getElementById('campo-busca')?.value || '').toLowerCase().trim();
    const pisos = Array.from(document.querySelectorAll('#filtros input[data-grupo="piso"]:checked')).map(c => c.value);
    const coberturas = Array.from(document.querySelectorAll('#filtros input[data-grupo="cobertura"]:checked')).map(c => c.value);
    const precisaIluminacao = document.querySelector('#filtros input[data-grupo="recurso"][value="iluminacao"]:checked') !== null;
    const precisaAcessibilidade = document.querySelector('#filtros input[data-grupo="recurso"][value="acessibilidade"]:checked') !== null;

    const filtradas = quadras.filter(q => {
        const bateTexto = !termo || q.nome.toLowerCase().includes(termo) || q.regiao.toLowerCase().includes(termo);
        const batePiso = pisos.length === 0 || pisos.includes(q.piso);
        const bateCobertura = coberturas.length === 0 || coberturas.includes(q.cobertura);
        const bateIlum = !precisaIluminacao || q.iluminacao === true;
        const bateAcess = !precisaAcessibilidade || q.acessibilidade === true;

        return bateTexto && batePiso && bateCobertura && bateIlum && bateAcess;
    });

    renderCards(filtradas);
    renderMarcadores(filtradas);
}

function renderMarcadores(lista) {
    camadaMarcadores.clearLayers();
    lista.forEach(q => {
        const m = L.marker([q.lat, q.lng], { title: q.nome });
        m.bindPopup(`<strong>${escaparHtml(q.nome)}</strong><br>${escaparHtml(q.regiao)}`);
        m.on('click', () => abrirDetalhe(q.id));
        m.addTo(camadaMarcadores);
    });
}

function renderCards(lista) {
    const alvo = document.getElementById('lista');
    if (!alvo) return;
    alvo.innerHTML = '';

    if (!lista.length) {
        alvo.innerHTML = '<div class="vazio"><p>Nenhuma quadra encontrada com estes filtros.</p></div>';
        return;
    }

    lista.forEach(q => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <div class="card__midia">
                <img class="card__foto" src="${escaparHtml(q.foto)}" alt="${escaparHtml(q.nome)}">
                <span class="card__piso">${q.piso.toUpperCase()}</span>
            </div>
            <div class="card__corpo">
                <p class="card__regiao">${escaparHtml(q.regiao)}</p>
                <h3 class="card__nome">${escaparHtml(q.nome)}</h3>
            </div>
        `;
        card.addEventListener('click', () => abrirDetalhe(q.id));
        alvo.appendChild(card);
    });
}

/**
 * Abertura fluida do Painel Lateral de Detalhes
 */function abrirDetalhe(id) {
    const q = quadras.find(item => item.id === id);
    if (!q) return;

    const painel = document.getElementById('detalhe');
    const linkGoogleMaps = `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}`;

    painel.innerHTML = `
        <button type="button" class="detalhe__fechar" id="detalhe-fechar" aria-label="Fechar">✕</button>
        
        <div class="detalhe__hero">
            <img src="${escaparHtml(q.foto)}" alt="${escaparHtml(q.nome)}">
            <div class="detalhe__heroInfo">
                <h2>${escaparHtml(q.nome)}</h2>
                <p class="mono">${escaparHtml(q.regiao)}</p>
            </div>
        </div>

        <div class="detalhe__corpo">
            <div class="detalhe__grid-info">
                <div class="info-card">
                    <div class="info-card__label">Tipo de Piso</div>
                    <div class="info-card__value">${q.piso.toUpperCase()}</div>
                </div>
                <div class="info-card">
                    <div class="info-card__label">Cobertura</div>
                    <div class="info-card__value">${q.cobertura.toUpperCase()}</div>
                </div>
                <div class="info-card">
                    <div class="info-card__label">Iluminação</div>
                    <div class="info-card__value">${q.iluminacao ? 'Possui 💡' : 'Não possui'}</div>
                </div>
                <div class="info-card">
                    <div class="info-card__label">Acessibilidade</div>
                    <div class="info-card__value">${q.acessibilidade ? 'Acessível ♿' : 'Não informado'}</div>
                </div>
            </div>
        </div>

        <div class="detalhe__rodape">
            <a class="btn-primario" href="${linkGoogleMaps}" target="_blank" style="text-align: center; text-decoration: none;">
                📍 Como Chegar (Google Maps)
            </a>
        </div>
    `;

    // Fecha o modal ao clicar no botão "x"
    document.getElementById('detalhe-fechar')?.addEventListener('click', () => {
        painel.classList.remove('active');
    });

    // Ativa a exibição do painel lateral e foca no ponto no mapa
    painel.classList.add('active');
    if (map) map.panTo([q.lat, q.lng]);
}