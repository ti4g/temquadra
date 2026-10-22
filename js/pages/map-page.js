// js/pages/map-page.js
// Tela pública: mapa + gaveta com a lista, busca, filtros, "perto de mim",
// detalhe da quadra, sugerir quadra e doar materiais.
import { listarQuadras } from '../services/quadras.service.js';
import { escaparHtml as esc, normalizarTexto } from '../core/utils.js';
import { PISOS, COBERTURAS, EXTRAS, extrasDaApi, infoPiso, imagemPadrao, normalizarQuadra, distanciaKm, formatarDistancia, linkRota } from '../core/quadra.js';
import { icone, avisar, criarGaveta, usarImagemReserva } from '../components/ui.js';
import { iniciarSugerir, prepararSugerir } from '../components/sugerir.js';

const CENTRO_PALMAS = [-10.2085, -48.3470];

const estado = {
    quadras: [],
    carregou: false,
    texto: '',
    pisos: new Set(),
    coberta: false,
    iluminacao: false,
    exigir: new Set(),    // extras marcados no filtro (banheiro, bebedouro)
    extras: [],           // extras que a API já manda
    voce: null,           // { lat, lng } quando "Perto de mim" está ligado
    selecionada: null
};

let mapa, camadaPinos, pinoVoce, gaveta;
const pinos = new Map();
const $ = sel => document.querySelector(sel);

/* =========================================================
   Mapa
   ========================================================= */
function iniciarMapa() {
    mapa = L.map('mapa', { zoomControl: false, attributionControl: true }).setView(CENTRO_PALMAS, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapa);
    mapa.attributionControl.setPrefix(false);
    if (window.matchMedia('(min-width: 900px)').matches) L.control.zoom({ position: 'topright' }).addTo(mapa);
    camadaPinos = L.layerGroup().addTo(mapa);
}

const SVG_QUADRA = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="6" y="2.5" width="12" height="19" rx="1.5"/><path d="M6 12h12M9.5 2.5v3h5v-3M9.5 21.5v-3h5v3"/><circle cx="12" cy="12" r="2.4"/></svg>';

function iconePino(q, ativo) {
    return L.divIcon({
        className: `pino${ativo ? ' ativo' : ''}`,
        html: `<span class="pino__corpo" style="--cor:${infoPiso(q.piso).cor}">${SVG_QUADRA}</span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 44]
    });
}

/** Quadras no mesmo ponto viram um pequeno círculo de pinos, pra nenhuma ficar escondida. */
function posicoesNoMapa(lista) {
    const grupos = new Map();
    lista.forEach(q => {
        const chave = `${q.lat.toFixed(5)},${q.lng.toFixed(5)}`;
        grupos.set(chave, [...(grupos.get(chave) || []), q]);
    });
    const pos = new Map();
    grupos.forEach(grupo => grupo.forEach((q, i) => {
        if (grupo.length === 1) return pos.set(q.id, [q.lat, q.lng]);
        const ang = (2 * Math.PI * i) / grupo.length;
        pos.set(q.id, [q.lat + 0.0007 * Math.sin(ang), q.lng + 0.0007 * Math.cos(ang)]);
    }));
    return pos;
}

function renderPinos(lista) {
    camadaPinos.clearLayers();
    pinos.clear();
    const comLocal = lista.filter(q => q.lat != null);
    const pos = posicoesNoMapa(comLocal);
    comLocal.forEach(q => {
        const m = L.marker(pos.get(q.id), {
            icon: iconePino(q, q.id === estado.selecionada),
            title: q.nome,
            keyboard: true,
            riseOnHover: true
        });
        m.on('click', () => abrirDetalhe(q.id));
        m.addTo(camadaPinos);
        pinos.set(q.id, m);
    });
}

function destacarPino(id) {
    pinos.forEach((m, pid) => {
        const q = estado.quadras.find(x => x.id === pid);
        m.setIcon(iconePino(q, pid === id));
        if (pid === id) {
            m.setZIndexOffset(1000);
            const el = m.getElement();
            el?.classList.add('pula');
            setTimeout(() => el?.classList.remove('pula'), 500);
        } else {
            m.setZIndexOffset(0);
        }
    });
}

/** Espaço que topo/gaveta/painel ocupam por cima do mapa, pra enquadrar os pinos no que sobra. */
function folgasDoMapa() {
    const desktop = gaveta?.ehDesktop();
    const topo = $('#topo').offsetHeight;
    return desktop
        ? { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40] }
        : { paddingTopLeft: [30, topo + 20], paddingBottomRight: [30, window.innerHeight * 0.55] };
}

function enquadrar(lista) {
    const pontos = lista.filter(q => q.lat != null).map(q => [q.lat, q.lng]);
    if (estado.voce) pontos.push([estado.voce.lat, estado.voce.lng]);
    if (!pontos.length) return;
    if (pontos.length === 1) return mapa.setView(pontos[0], 16);
    mapa.fitBounds(pontos, { ...folgasDoMapa(), maxZoom: 16 });
}

/* =========================================================
   Filtros e lista
   ========================================================= */
function montarChips() {
    const presentes = new Set(estado.quadras.map(q => q.piso));
    const pisos = Object.keys(PISOS).filter(p => presentes.has(p));
    const html = pisos.map(p => `
        <label class="chip"><input type="checkbox" data-filtro="piso" value="${p}">
        <span class="chip__ponto" style="--cor:${PISOS[p].cor}"></span>${PISOS[p].nome}</label>`).join('') + `
        <span class="filtros__divisor" aria-hidden="true"></span>` +
        // Só oferece o filtro se alguma quadra tiver aquilo; senão ele só esvaziaria a lista.
        (estado.quadras.some(q => q.cobertura !== 'DESCOBERTA') ? `
        <label class="chip"><input type="checkbox" data-filtro="coberta">${icone('teto', 'ic--p')}Coberta</label>` : '') +
        (estado.quadras.some(q => q.iluminacao) ? `
        <label class="chip"><input type="checkbox" data-filtro="iluminacao">${icone('luz', 'ic--p')}Iluminação</label>` : '') +
        estado.extras.filter(k => estado.quadras.some(q => q[k])).map(k => `
        <label class="chip"><input type="checkbox" data-filtro="extra" value="${k}">${icone(EXTRAS[k].icone, 'ic--p')}${EXTRAS[k].nome}</label>`).join('');
    $('#btn-perto').insertAdjacentHTML('afterend', html);
}

function passaNosFiltros(q) {
    if (estado.texto) {
        const alvo = normalizarTexto(`${q.nome} ${q.bairro} ${q.endereco}`);
        if (!estado.texto.split(/\s+/).every(t => alvo.includes(t))) return false;
    }
    if (estado.pisos.size && !estado.pisos.has(q.piso)) return false;
    if (estado.coberta && q.cobertura === 'DESCOBERTA') return false;
    if (estado.iluminacao && !q.iluminacao) return false;
    for (const k of estado.exigir) if (!q[k]) return false;
    return true;
}

function temFiltroAtivo() {
    return !!(estado.texto || estado.pisos.size || estado.coberta || estado.iluminacao || estado.exigir.size);
}

function aplicar({ enquadrarMapa = false } = {}) {
    if (!estado.carregou) return;
    let lista = estado.quadras.filter(passaNosFiltros);
    if (estado.voce) lista = [...lista].sort((a, b) => (a.distanciaKm ?? 1e9) - (b.distanciaKm ?? 1e9));

    renderLista(lista);
    renderPinos(lista);
    atualizarContador(lista.length);
    if (enquadrarMapa) enquadrar(estado.voce ? lista.slice(0, 3) : lista);
}

function atualizarContador(n) {
    const total = estado.quadras.length;
    const plural = x => (x === 1 ? 'quadra' : 'quadras');
    let texto = temFiltroAtivo() ? `${n} de ${total} ${plural(total)}` : `${total} ${plural(total)} no mapa`;
    if (estado.voce && n) texto += ', das mais perto pras mais longe';
    $('#contador').textContent = texto;
}

function tagsDaQuadra(q) {
    const p = infoPiso(q.piso);
    let html = `<span class="tag"><span class="chip__ponto" style="--cor:${p.cor}"></span>${p.nome}</span>`;
    if (q.cobertura !== 'DESCOBERTA') html += `<span class="tag">${icone('teto')}${q.cobertura === 'COBERTA' ? 'Coberta' : 'Meio coberta'}</span>`;
    if (q.iluminacao) html += `<span class="tag" title="Tem iluminação">${icone('luz')}<span class="so-leitor">Tem iluminação</span></span>`;
    estado.extras.filter(k => q[k]).forEach(k => {
        html += `<span class="tag" title="${EXTRAS[k].nome}">${icone(EXTRAS[k].icone)}<span class="so-leitor">${EXTRAS[k].nome}</span></span>`;
    });
    return html;
}

function renderLista(lista) {
    const alvo = $('#lista');
    if (!lista.length) {
        alvo.innerHTML = `
            <li class="vazio">
                ${desenhoVazio()}
                <h2>Nenhuma quadra com esses filtros</h2>
                <p>Tire algum filtro ou, se você conhece uma quadra assim, sugira pra gente.</p>
                <div class="vazio__acoes">
                    <button type="button" class="btn btn--claro btn--p" id="limpar-filtros">Limpar filtros</button>
                    <button type="button" class="btn btn--escuro btn--p" data-abrir="sugerir">Sugerir quadra</button>
                </div>
            </li>`;
        return;
    }
    alvo.innerHTML = lista.map(q => `
        <li>
            <button type="button" class="item${q.id === estado.selecionada ? ' selecionado' : ''}" data-quadra="${esc(q.id)}">
                <img class="item__foto" src="${esc(q.capa)}" data-reserva="${imagemPadrao(q.piso)}" alt="" loading="lazy">
                <span class="item__info">
                    <span class="item__topo">
                        <span class="item__nome">${esc(q.nome)}</span>
                        ${q.distanciaKm != null ? `<span class="item__dist">${formatarDistancia(q.distanciaKm)}</span>` : ''}
                    </span>
                    <span class="item__bairro">${esc(q.bairro || q.endereco || 'Palmas')}</span>
                    <span class="item__tags">${tagsDaQuadra(q)}</span>
                </span>
            </button>
        </li>`).join('');
}

function renderCarregando() {
    $('#lista').innerHTML = Array.from({ length: 3 }, () => `
        <li class="esqueleto" aria-hidden="true">
            <span class="esqueleto__bloco" style="height:92px"></span>
            <span style="display:grid;gap:8px;align-content:center">
                <span class="esqueleto__bloco" style="height:18px;width:80%"></span>
                <span class="esqueleto__bloco" style="height:14px;width:50%"></span>
                <span class="esqueleto__bloco" style="height:24px;width:40%"></span>
            </span>
        </li>`).join('');
    $('#contador').textContent = 'Carregando quadras…';
}

function renderErro() {
    $('#contador').textContent = '';
    $('#lista').innerHTML = `
        <li class="vazio">
            ${desenhoVazio()}
            <h2>O mapa não respondeu</h2>
            <p>Não conseguimos buscar as quadras agora. Confira sua conexão e tente de novo.</p>
            <div class="vazio__acoes"><button type="button" class="btn btn--escuro btn--p" id="tentar-de-novo">Tentar de novo</button></div>
        </li>`;
}

function desenhoVazio() {
    return `<svg class="vazio__desenho" viewBox="0 0 120 80" aria-hidden="true">
        <rect x="6" y="10" width="108" height="62" rx="8" fill="#EAF5FD"/>
        <g fill="none" stroke="#1C8FE3" stroke-width="3" stroke-linecap="round">
            <rect x="14" y="18" width="92" height="46" rx="3"/><path d="M60 18v46"/><circle cx="60" cy="41" r="10"/>
        </g>
        <circle cx="88" cy="30" r="9" fill="#FFD23F"/></svg>`;
}

/* =========================================================
   Perto de mim
   ========================================================= */
function alternarPerto() {
    const botao = $('#btn-perto');
    if (estado.voce) {
        estado.voce = null;
        estado.quadras.forEach(q => { q.distanciaKm = null; });
        if (pinoVoce) { pinoVoce.remove(); pinoVoce = null; }
        botao.setAttribute('aria-pressed', 'false');
        aplicar({ enquadrarMapa: true });
        return;
    }
    if (!navigator.geolocation) return avisar('Seu navegador não informa a localização.', { tipo: 'erro' });

    botao.classList.add('carregando');
    navigator.geolocation.getCurrentPosition(pos => {
        botao.classList.remove('carregando');
        estado.voce = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        estado.quadras.forEach(q => { q.distanciaKm = q.lat != null ? distanciaKm(estado.voce, q) : null; });
        pinoVoce = L.marker([estado.voce.lat, estado.voce.lng], {
            icon: L.divIcon({ className: 'voce', html: '<span class="voce__ponto"></span>', iconSize: [18, 18], iconAnchor: [9, 9] }),
            interactive: false, keyboard: false
        }).addTo(mapa);
        botao.setAttribute('aria-pressed', 'true');
        aplicar({ enquadrarMapa: true });
        if (!gaveta.ehDesktop() && gaveta.estado() === 'espiando') gaveta.ir('meio');
    }, erro => {
        botao.classList.remove('carregando');
        avisar(erro.code === 1
            ? 'Você não liberou a localização. Dá pra ativar nas permissões do navegador.'
            : 'Não deu pra achar sua localização agora.', { tipo: 'erro', duracao: 4500 });
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
}

/* =========================================================
   Painéis (detalhe, sugerir, doar) + botão voltar do celular
   ========================================================= */
let painelAberto = null;
let focoAnterior = null;

function abrirPainel(nome) {
    const el = $(`#painel-${nome}`);
    if (painelAberto && painelAberto !== nome) fecharVisual(false);
    if (painelAberto !== nome) history.pushState({ painel: nome }, '');
    focoAnterior = focoAnterior || document.activeElement;
    painelAberto = nome;
    el.inert = false;
    el.setAttribute('aria-hidden', 'false');
    el.classList.add('aberto');
    if (!gaveta.ehDesktop()) $('#veu').hidden = false;
    setTimeout(() => el.querySelector('[data-fechar], button, input')?.focus({ preventScroll: true }), 60);
}

function fecharVisual(devolverFoco = true) {
    if (!painelAberto) return;
    const el = $(`#painel-${painelAberto}`);
    el.classList.remove('aberto');
    el.inert = true;
    el.setAttribute('aria-hidden', 'true');
    $('#veu').hidden = true;
    if (painelAberto === 'detalhe') {
        estado.selecionada = null;
        destacarPino(null);
        document.querySelectorAll('.item.selecionado').forEach(i => i.classList.remove('selecionado'));
        const url = new URL(location.href);
        if (url.searchParams.has('quadra')) { url.searchParams.delete('quadra'); history.replaceState(history.state, '', url); }
    }
    painelAberto = null;
    if (devolverFoco && focoAnterior && document.contains(focoAnterior)) focoAnterior.focus({ preventScroll: true });
    focoAnterior = null;
}

/** Fechar sempre passa pelo histórico, assim o "voltar" do celular e o X fazem a mesma coisa. */
function fecharPainel() {
    if (!painelAberto) return;
    if (history.state?.painel) history.back();
    else fecharVisual();
}

window.addEventListener('popstate', () => fecharVisual());

/* ---------- Detalhe da quadra ---------- */
function tagsDoDetalhe(q) {
    const p = infoPiso(q.piso);
    const itens = [
        `<span class="chip__ponto" style="--cor:${p.cor}"></span>Piso de ${p.nome.toLowerCase()}`,
        `${icone(q.cobertura === 'DESCOBERTA' ? 'sol' : 'teto')}${COBERTURAS[q.cobertura] || 'Cobertura não informada'}`,
        q.iluminacao ? `${icone('luz')}Iluminação à noite` : null,
        ...estado.extras.filter(k => q[k]).map(k => `${icone(EXTRAS[k].icone)}${EXTRAS[k].nome}`)
    ];
    return itens.filter(Boolean).map(t => `<li class="tag">${t}</li>`).join('');
}

function abrirDetalhe(id) {
    const q = estado.quadras.find(x => x.id === id);
    if (!q) return;
    estado.selecionada = id;
    destacarPino(id);
    document.querySelectorAll('.item').forEach(i => i.classList.toggle('selecionado', i.dataset.quadra === id));

    const fotos = q.fotos.length ? q.fotos : [q.capa];

    const el = $('#painel-detalhe');
    el.innerHTML = `
        <div class="detalhe__flutuantes">
            <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${icone('fechar')}</button>
            <button type="button" class="btn-icone" id="btn-compartilhar" aria-label="Compartilhar quadra">${icone('compartilhar')}</button>
        </div>
        <div class="detalhe__rolagem">
            <div class="detalhe__galeria" id="galeria">
                ${fotos.map((f, i) => `<img src="${esc(f)}" data-reserva="${imagemPadrao(q.piso)}" alt="${i === 0 ? `Foto da ${esc(q.nome)}` : ''}" ${i ? 'loading="lazy"' : ''}>`).join('')}
            </div>
            ${fotos.length > 1 ? `<div class="detalhe__pontos" aria-hidden="true">${fotos.map((_, i) => `<span class="${i ? '' : 'ativo'}"></span>`).join('')}</div>` : ''}
            <div class="detalhe__corpo">
                <div>
                    ${q.bairro ? `<p class="detalhe__bairro">${esc(q.bairro)}${q.distanciaKm != null ? `, a ${formatarDistancia(q.distanciaKm)} de você` : ''}</p>` : ''}
                    <h2 class="detalhe__nome">${esc(q.nome)}</h2>
                </div>
                ${q.endereco ? `<p class="detalhe__endereco">${icone('pino')}<span>${esc(q.endereco)}</span></p>` : ''}

                <ul class="detalhe__tags" aria-label="Como é a quadra">${tagsDoDetalhe(q)}</ul>

                ${q.descricao ? `<p class="detalhe__descricao">${esc(q.descricao)}</p>` : ''}
            </div>
        </div>
        <div class="painel__rodape">
            ${q.lat != null
                ? `<a class="btn btn--primario" href="${esc(linkRota(q))}" target="_blank" rel="noopener">${icone('rota')}Como chegar</a>`
                : `<span class="campo__dica">Essa quadra ainda não tem localização no mapa.</span>`}
        </div>`;

    const galeria = el.querySelector('#galeria');
    const pontos = el.querySelectorAll('.detalhe__pontos span');
    if (pontos.length) {
        galeria.addEventListener('scroll', () => {
            const i = Math.round(galeria.scrollLeft / galeria.clientWidth);
            pontos.forEach((s, j) => s.classList.toggle('ativo', i === j));
        }, { passive: true });
    }
    el.querySelector('#btn-compartilhar').addEventListener('click', () => compartilhar(q));

    const url = new URL(location.href);
    url.searchParams.set('quadra', id);
    abrirPainel('detalhe');
    history.replaceState(history.state, '', url);

    if (q.lat != null) {
        if (gaveta.ehDesktop()) mapa.flyTo([q.lat, q.lng], Math.max(mapa.getZoom(), 15), { duration: .6 });
        else mapa.setView([q.lat, q.lng], Math.max(mapa.getZoom(), 15));
    }
}

async function compartilhar(q) {
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('quadra', q.id);
    const dados = { title: q.nome, text: `Bora jogar na ${q.nome}?`, url: url.href };
    try {
        if (navigator.share) await navigator.share(dados);
        else { await navigator.clipboard.writeText(url.href); avisar('Link copiado'); }
    } catch (err) {
        if (err.name !== 'AbortError') avisar('Não deu pra compartilhar.', { tipo: 'erro' });
    }
}

/* ---------- Doar ---------- */
function montarDoar() {
    const cfg = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : {});
    const ponto = cfg.pontoColeta || {};
    const definido = ponto.endereco && !/a definir/i.test(ponto.endereco);
    const zap = (cfg.whatsappProjeto || '').replace(/\D/g, '');
    const itens = [
        ['caixa', 'Bolas de futebol, vôlei e basquete'],
        ['piso', 'Redes de vôlei e de gol'],
        ['coracao', 'Coletes, cones e apitos'],
        ['luz', 'Tudo que estiver em bom estado']
    ];
    $('#painel-doar').innerHTML = `
        <div class="painel__topo">
            <h2 id="doar-titulo">Doar materiais</h2>
            <button type="button" class="btn-icone" data-fechar aria-label="Fechar">${icone('fechar')}</button>
        </div>
        <div class="painel__corpo" style="display:grid;gap:18px">
            <p>Muita quadra pública de Palmas não tem bola, rede ou trave. Material parado na sua casa vira jogo em alguma delas.</p>
            <ul class="doar__lista">${itens.map(([ic, t]) => `<li>${icone(ic)}${t}</li>`).join('')}</ul>
            <div class="doar__ponto">
                <h3>Onde entregar</h3>
                ${definido
                    ? `<p><strong>${esc(ponto.nome)}</strong><br>${esc(ponto.endereco)}${ponto.horario && !/a definir/i.test(ponto.horario) ? `<br>${esc(ponto.horario)}` : ''}</p>`
                    : `<p>O ponto de coleta ainda está sendo combinado. Volte aqui em breve pra ver onde entregar.</p>`}
            </div>
        </div>
        ${zap || (definido && ponto.maps) ? `
        <div class="painel__rodape">
            ${zap ? `<a class="btn btn--primario" target="_blank" rel="noopener" href="https://wa.me/${zap}?text=${encodeURIComponent('Oi! Quero doar materiais esportivos pro TemQuadra.')}">${icone('whatsapp')}Falar no WhatsApp</a>` : ''}
            ${definido && ponto.maps ? `<a class="btn btn--claro" target="_blank" rel="noopener" href="${esc(ponto.maps)}">${icone('rota')}Como chegar</a>` : ''}
        </div>` : ''}`;
}

/* =========================================================
   Início
   ========================================================= */
async function carregar() {
    renderCarregando();
    try {
        const dados = await listarQuadras();
        estado.extras = extrasDaApi(dados);
        estado.quadras = (dados || []).map(normalizarQuadra);
        estado.carregou = true;
        montarChips();
        aplicar({ enquadrarMapa: true });

        const pedida = new URLSearchParams(location.search).get('quadra');
        if (pedida && estado.quadras.some(q => q.id === pedida)) abrirDetalhe(pedida);
        else if (pedida) {
            // Link de uma quadra que saiu do mapa (ou id errado)
            avisar('Essa quadra não está mais no mapa.', { tipo: 'erro' });
            history.replaceState(null, '', location.pathname);
        }
    } catch {
        renderErro();
    }
}

function ligarEventos() {
    $('#btn-doar').innerHTML = icone('coracao');
    $('#btn-sugerir').innerHTML = `${icone('mais', 'ic--p')}Sugerir`;
    $('#btn-perto').innerHTML = `${icone('alvo', 'ic--p')}Perto de mim`;
    $('.busca__icone').innerHTML = icone('busca');
    $('#busca-limpar').innerHTML = icone('fechar');

    const busca = $('#campo-busca');
    let espera;
    busca.addEventListener('input', () => {
        $('#busca-limpar').hidden = !busca.value;
        clearTimeout(espera);
        espera = setTimeout(() => { estado.texto = normalizarTexto(busca.value); aplicar({ enquadrarMapa: true }); }, 120);
    });
    busca.addEventListener('focus', () => { if (!gaveta.ehDesktop()) gaveta.ir('meio'); });
    busca.addEventListener('keydown', ev => { if (ev.key === 'Enter') busca.blur(); });
    $('#busca-limpar').addEventListener('click', () => {
        busca.value = ''; estado.texto = ''; $('#busca-limpar').hidden = true;
        aplicar({ enquadrarMapa: true }); busca.focus();
    });

    $('#filtros').addEventListener('change', ev => {
        const c = ev.target;
        if (c.dataset.filtro === 'piso') c.checked ? estado.pisos.add(c.value) : estado.pisos.delete(c.value);
        else if (c.dataset.filtro === 'extra') c.checked ? estado.exigir.add(c.value) : estado.exigir.delete(c.value);
        else if (c.dataset.filtro) estado[c.dataset.filtro] = c.checked;
        navigator.vibrate?.(8);
        aplicar({ enquadrarMapa: true });
    });
    $('#btn-perto').addEventListener('click', alternarPerto);

    document.addEventListener('click', ev => {
        const item = ev.target.closest('[data-quadra]');
        if (item) return abrirDetalhe(item.dataset.quadra);
        const abrir = ev.target.closest('[data-abrir]');
        if (abrir?.dataset.abrir === 'sugerir') return abrirSugerir();
        if (ev.target.closest('#limpar-filtros')) return limparFiltros();
        if (ev.target.closest('#tentar-de-novo')) return carregar();
        if (ev.target.closest('.painel [data-fechar]')) return fecharPainel();
    });
    $('#btn-sugerir').addEventListener('click', abrirSugerir);
    $('#btn-doar').addEventListener('click', () => { montarDoar(); abrirPainel('doar'); });
    $('#veu').addEventListener('click', fecharPainel);
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && painelAberto) fecharPainel(); });
}

function abrirSugerir() {
    prepararSugerir(estado.extras);
    abrirPainel('sugerir');
}

function limparFiltros() {
    estado.texto = ''; estado.pisos.clear();
    estado.coberta = estado.iluminacao = false;
    estado.exigir.clear();
    $('#campo-busca').value = ''; $('#busca-limpar').hidden = true;
    document.querySelectorAll('#filtros input').forEach(i => { i.checked = false; });
    aplicar({ enquadrarMapa: true });
}

function iniciarGaveta() {
    const topo = $('#topo');
    const alca = $('#gaveta-alca');
    const atualizarTopo = () => document.documentElement.style.setProperty('--topo-h', `${topo.offsetHeight}px`);
    gaveta = criarGaveta($('#gaveta'), {
        alca,
        corpo: $('#gaveta-corpo'),
        topoLivre: () => topo.offsetHeight,
        espiar: () => alca.offsetHeight + 14
    });
    new ResizeObserver(() => { atualizarTopo(); gaveta.ir(gaveta.estado()); }).observe(topo);
    atualizarTopo();
}

document.addEventListener('DOMContentLoaded', () => {
    usarImagemReserva();
    ligarEventos();
    iniciarMapa();
    iniciarGaveta();
    iniciarSugerir($('#painel-sugerir'));
    carregar();
});
