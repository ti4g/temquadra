// js/pages/admin-page.js
// Painel da equipe: quadras (cadastrar, editar, desativar) e sugestões (aprovar).
import { logout } from '../services/auth.service.js';
import { verificarAcessoAdmin } from '../core/router.js';
import { listarQuadras, buscarQuadraPorId, cadastrarQuadra, atualizarQuadra, deletarQuadra } from '../services/quadras.service.js';
import { listarSugestoes, aprovarSugestao } from '../services/sugestoes.service.js';
import { escaparHtml as esc, normalizarTexto } from '../core/utils.js';
import { infoPiso, imagemPadrao, COBERTURAS, EXTRAS, extrasDaApi } from '../core/quadra.js';
import { icone, avisar, confirmar, usarImagemReserva } from '../components/ui.js';
import { criarSeletorLocal } from '../components/seletor-local.js';
import { htmlEscolhaPiso, htmlEscolhaCobertura, htmlExtras, lerExtras, criarSeletorFotos, validarObrigatorios, limparErroAoDigitar } from '../components/campos-quadra.js';

const $ = sel => document.querySelector(sel);
// extras: campos opcionais (banheiro, bebedouro) que a API já manda. editando: quadra aberta na folha.
const estado = { quadras: [], sugestoes: [], filtro: '', extras: [], editando: null };
let local = null;
let fotos = null;

/* ---------- Carregamento ---------- */
async function carregarQuadras() {
    try {
        estado.quadras = (await listarQuadras()) || [];
        estado.extras = extrasDaApi(estado.quadras);
        renderQuadras();
    } catch (err) {
        $('#lista-quadras').innerHTML = `<li class="vazio-admin"><h2>Não deu pra carregar as quadras</h2><p>${esc(err.message)}</p></li>`;
    }
    atualizarResumo();
}

async function carregarSugestoes() {
    try {
        const lista = (await listarSugestoes()) || [];
        estado.extras = [...new Set([...estado.extras, ...extrasDaApi(lista)])];
        // Pendentes primeiro; dentro de cada grupo, as mais novas primeiro
        estado.sugestoes = lista.sort((a, b) =>
            (a.status === 'PENDENTE' ? 0 : 1) - (b.status === 'PENDENTE' ? 0 : 1) ||
            String(b.dataCriacao).localeCompare(String(a.dataCriacao)));
        renderSugestoes();
    } catch (err) {
        $('#lista-sugestoes').innerHTML = `<div class="vazio-admin"><h2>Não deu pra carregar as sugestões</h2><p>${esc(err.message)}</p></div>`;
    }
    atualizarResumo();
}

function pendentes() {
    return estado.sugestoes.filter(s => s.status === 'PENDENTE').length;
}

function atualizarResumo() {
    const q = estado.quadras.length;
    const p = pendentes();
    $('#cont-quadras').textContent = q;
    const cont = $('#cont-sugestoes');
    cont.textContent = p;
    cont.classList.toggle('aba__contagem--alerta', p > 0);
    const partes = [`${q} ${q === 1 ? 'quadra ativa' : 'quadras ativas'} no mapa`];
    partes.push(p ? `${p} ${p === 1 ? 'sugestão esperando' : 'sugestões esperando'} sua análise` : 'nenhuma sugestão esperando');
    $('#resumo').textContent = `${partes.join(' e ')}.`;
}

/* ---------- Quadras ---------- */
function tags(q) {
    const p = infoPiso(q.tipoPiso);
    let html = `<span class="tag"><span class="chip__ponto" style="--cor:${p.cor}"></span>${p.nome}</span>`;
    html += `<span class="tag">${icone(q.cobertura === 'DESCOBERTA' ? 'sol' : 'teto')}${COBERTURAS[q.cobertura] || q.cobertura}</span>`;
    if (q.iluminacao) html += `<span class="tag">${icone('luz')}Luz</span>`;
    estado.extras.filter(k => q[k]).forEach(k => { html += `<span class="tag">${icone(EXTRAS[k].icone)}${EXTRAS[k].nome}</span>`; });
    if (q.latitude == null) html += `<span class="tag" style="color:var(--perigo)">${icone('alerta')}Sem local</span>`;
    return html;
}

function renderQuadras() {
    const alvo = $('#lista-quadras');
    const lista = estado.quadras.filter(q => !estado.filtro ||
        normalizarTexto(`${q.nome} ${q.bairroRegiao} ${q.endereco}`).includes(estado.filtro));

    if (!estado.quadras.length) {
        alvo.innerHTML = `<li class="vazio-admin"><h2>Nenhuma quadra ainda</h2><p>Cadastre a primeira ou aprove uma sugestão.</p></li>`;
        return;
    }
    if (!lista.length) {
        alvo.innerHTML = `<li class="vazio-admin"><p>Nenhuma quadra bate com "${esc($('#filtro-quadras').value)}".</p></li>`;
        return;
    }
    alvo.innerHTML = lista.map(q => `
        <li class="linha">
            <img class="linha__foto" src="${esc(q.fotos?.[0]?.urlMinio || imagemPadrao(q.tipoPiso))}" data-reserva="${imagemPadrao(q.tipoPiso)}" alt="" loading="lazy">
            <div class="linha__info">
                <span class="linha__nome">${esc(q.nome)}</span>
                <span class="linha__meta">${esc(q.bairroRegiao || q.endereco || '')}</span>
                <span class="linha__tags">${tags(q)}</span>
            </div>
            <div class="linha__acoes">
                <button type="button" class="btn-icone" data-editar="${esc(q.idQuadra)}" aria-label="Editar ${esc(q.nome)}" title="Editar">${icone('lapis')}</button>
                <button type="button" class="btn-icone btn-icone--perigo" data-desativar="${esc(q.idQuadra)}" aria-label="Tirar ${esc(q.nome)} do mapa" title="Tirar do mapa">${icone('lixo')}</button>
            </div>
        </li>`).join('');
}

async function desativar(id) {
    const q = estado.quadras.find(x => x.idQuadra === id);
    const ok = await confirmar({
        titulo: 'Tirar a quadra do mapa?',
        texto: `"${q?.nome}" deixa de aparecer pro público. Os dados continuam guardados.`,
        confirmar: 'Tirar do mapa',
        perigo: true
    });
    if (!ok) return;
    try {
        await deletarQuadra(id);
        avisar('Quadra tirada do mapa');
        carregarQuadras();
    } catch (err) {
        avisar(`Não deu pra tirar do mapa: ${err.message}`, { tipo: 'erro' });
    }
}

/* ---------- Folha de cadastro/edição ---------- */
function abrirFolha(q = null) {
    const modal = $('#modalQuadra');
    $('#modalTitulo').textContent = q ? 'Editar quadra' : 'Nova quadra';
    $('#btnSalvar').textContent = q ? 'Salvar alterações' : 'Cadastrar quadra';
    $('#qId').value = q?.idQuadra || '';
    $('#qNome').value = q?.nome || '';
    $('#qEndereco').value = q?.endereco || '';
    $('#qBairro').value = q?.bairroRegiao || '';
    $('#qDescricao').value = q?.descricao || '';
    $('#qIluminacao').checked = q ? !!q.iluminacao : false;
    $('#qExtras').innerHTML = htmlExtras(estado.extras, q || {});
    estado.editando = q;
    $('#qPisos').innerHTML = htmlEscolhaPiso(q?.tipoPiso || 'CIMENTO');
    $('#qCoberturas').innerHTML = htmlEscolhaCobertura(q?.cobertura || 'DESCOBERTA');
    modal.querySelectorAll('[aria-invalid]').forEach(c => c.setAttribute('aria-invalid', 'false'));
    modal.querySelectorAll('.campo__erro').forEach(e => { e.hidden = true; });

    $('#divFotos').hidden = !!q;
    $('#avisoFotos').hidden = !q;
    fotos?.limpar();
    if (!q) fotos = criarSeletorFotos($('#qFotos'), { max: 5 });

    local?.destruir();
    const inicial = q && q.latitude != null ? { lat: q.latitude, lng: q.longitude } : null;
    local = criarSeletorLocal($('#qLocal'), { inicial, botaoGps: 'Usar minha localização' });

    modal.showModal();
    modal.querySelector('.folha__corpo').scrollTop = 0;
    setTimeout(() => local.ativar(), 350);
}

function fecharFolha() {
    $('#modalQuadra').close();
}

async function editar(id) {
    try {
        abrirFolha(await buscarQuadraPorId(id));
    } catch (err) {
        avisar(`Não deu pra abrir a quadra: ${err.message}`, { tipo: 'erro' });
    }
}

async function salvar(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    if (!validarObrigatorios(form, ['qNome', 'qEndereco'])) return;

    const id = $('#qId').value;
    const ponto = local?.obter();
    const dados = {
        nome: $('#qNome').value.trim(),
        endereco: $('#qEndereco').value.trim(),
        bairroRegiao: $('#qBairro').value.trim() || null,
        descricao: $('#qDescricao').value.trim() || null,
        tipoPiso: form.querySelector('[name="tipoPiso"]:checked').value,
        cobertura: form.querySelector('[name="cobertura"]:checked').value,
        latitude: ponto?.lat ?? null,
        longitude: ponto?.lng ?? null,
        iluminacao: $('#qIluminacao').checked,
        // A tela não usa mais acessibilidade, mas a API exige o campo: mantém o que já estava salvo.
        acessibilidade: estado.editando?.acessibilidade ?? false,
        ...lerExtras(form, estado.extras)
    };

    const botao = $('#btnSalvar');
    const rotulo = botao.textContent;
    botao.disabled = true;
    botao.textContent = 'Salvando…';
    try {
        if (id) {
            await atualizarQuadra(id, { ...dados, ativa: true });
            avisar('Alterações salvas');
        } else {
            const corpo = new FormData();
            corpo.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
            fotos.arquivos().forEach(a => corpo.append('fotos', a));
            await cadastrarQuadra(corpo);
            avisar('Quadra cadastrada e já no mapa');
        }
        fecharFolha();
        carregarQuadras();
    } catch (err) {
        avisar(`Não deu pra salvar: ${err.message}`, { tipo: 'erro', duracao: 5000 });
    } finally {
        botao.disabled = false;
        botao.textContent = rotulo;
    }
}

/* ---------- Sugestões ---------- */
function quando(data) {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ROTULO_STATUS = { PENDENTE: 'Esperando', APROVADO: 'Aprovada', REJEITADO: 'Recusada' };

function renderSugestoes() {
    const alvo = $('#lista-sugestoes');
    if (!estado.sugestoes.length) {
        alvo.innerHTML = `<div class="vazio-admin"><h2>Nenhuma sugestão por aqui</h2><p>Quando alguém sugerir uma quadra pelo mapa, ela aparece nesta aba.</p></div>`;
        return;
    }
    alvo.innerHTML = estado.sugestoes.map(s => {
        const p = infoPiso(s.tipoPiso);
        const zap = (s.telefoneSolicitante || '').replace(/\D/g, '');
        const temLocal = s.latitude != null && s.longitude != null;
        return `
        <article class="sugestao">
            <div class="sugestao__cabeca">
                <div>
                    <h2 class="sugestao__nome">${esc(s.nome)}</h2>
                    <p class="sugestao__quando">Enviada em ${quando(s.dataCriacao)}</p>
                </div>
                <span class="status status--${esc(s.status)}">${ROTULO_STATUS[s.status] || esc(s.status)}</span>
            </div>
            ${s.fotos?.length ? `<div class="sugestao__fotos">${s.fotos.map(f => `<img src="${esc(f.urlMinio)}" data-reserva="${imagemPadrao(s.tipoPiso)}" alt="" loading="lazy">`).join('')}</div>` : ''}
            <div class="linha__tags">
                <span class="tag"><span class="chip__ponto" style="--cor:${p.cor}"></span>${p.nome}</span>
                <span class="tag">${icone(s.cobertura === 'DESCOBERTA' ? 'sol' : 'teto')}${COBERTURAS[s.cobertura] || esc(s.cobertura)}</span>
                ${s.iluminacao ? `<span class="tag">${icone('luz')}Luz</span>` : ''}
                ${estado.extras.filter(k => s[k]).map(k => `<span class="tag">${icone(EXTRAS[k].icone)}${EXTRAS[k].nome}</span>`).join('')}
            </div>
            <div class="sugestao__dados">
                <p>${icone('pino')}<span>${esc(s.endereco)}${s.bairroRegiao ? `, ${esc(s.bairroRegiao)}` : ''}
                    ${temLocal ? ` <a href="https://www.google.com/maps?q=${s.latitude},${s.longitude}" target="_blank" rel="noopener">ver no mapa</a>` : ' (sem ponto no mapa)'}</span></p>
                ${s.descricao ? `<p>${icone('lista')}<span>${esc(s.descricao)}</span></p>` : ''}
                ${s.nomeSolicitante || zap ? `<p>${icone('whatsapp')}<span>${esc(s.nomeSolicitante || 'Sem nome')}${zap ? `, <a href="https://wa.me/55${zap}" target="_blank" rel="noopener">${esc(s.telefoneSolicitante)}</a>` : ''}</span></p>` : ''}
            </div>
            ${s.observacaoAdmin ? `<p class="sugestao__obs">${esc(s.observacaoAdmin)}</p>` : ''}
            ${s.status === 'PENDENTE' ? `
            <div class="sugestao__acoes">
                <button type="button" class="btn btn--primario" data-aprovar="${esc(s.idSugestaoQuadra)}">${icone('check')}Aprovar e pôr no mapa</button>
            </div>` : ''}
        </article>`;
    }).join('');
}

async function aprovar(id, botao) {
    const s = estado.sugestoes.find(x => x.idSugestaoQuadra === id);
    const semLocal = s && s.latitude == null;
    const ok = await confirmar({
        titulo: 'Aprovar essa sugestão?',
        texto: semLocal
            ? `"${s.nome}" vira uma quadra, mas veio sem ponto no mapa. Depois de aprovar, edite a quadra pra marcar o local.`
            : `"${s?.nome}" vai aparecer no mapa pra todo mundo.`,
        confirmar: 'Aprovar'
    });
    if (!ok) return;
    botao.disabled = true;
    try {
        await aprovarSugestao(id);
        avisar('Sugestão aprovada e já no mapa');
        carregarSugestoes();
        carregarQuadras();
    } catch (err) {
        botao.disabled = false;
        avisar(`Não deu pra aprovar: ${err.message}`, { tipo: 'erro', duracao: 5000 });
    }
}

/* ---------- Abas ---------- */
function mostrarAba(nome) {
    ['quadras', 'sugestoes'].forEach(n => {
        const ativa = n === nome;
        const aba = $(`#aba-${n}`);
        aba.setAttribute('aria-selected', ativa ? 'true' : 'false');
        aba.tabIndex = ativa ? 0 : -1;
        $(`#sec-${n}`).hidden = !ativa;
    });
    history.replaceState(null, '', nome === 'sugestoes' ? '#sugestoes' : location.pathname);
}

/* ---------- Início ---------- */
document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAcessoAdmin()) return;
    usarImagemReserva();

    const nome = localStorage.getItem('userName') || '';
    $('#uName').textContent = nome;
    $('#saudacao').textContent = nome ? `Oi, ${nome.split(' ')[0]}!` : 'Oi!';
    $('#btnLogout').innerHTML = icone('sair');
    $('#btnFecharModal').innerHTML = icone('fechar');
    $('#btnNovaQuadra').innerHTML = `${icone('mais', 'ic--p')}Nova quadra`;

    $('#btnLogout').addEventListener('click', logout);
    $('#btnNovaQuadra').addEventListener('click', () => abrirFolha());
    $('#btnFecharModal').addEventListener('click', fecharFolha);
    $('#btnCancelar').addEventListener('click', fecharFolha);
    $('#modalQuadra').addEventListener('close', () => { local?.destruir(); local = null; });
    $('#formQuadra').addEventListener('submit', salvar);
    limparErroAoDigitar($('#formQuadra'));

    $('#filtro-quadras').addEventListener('input', ev => {
        estado.filtro = normalizarTexto(ev.target.value);
        renderQuadras();
    });

    $('#aba-quadras').addEventListener('click', () => mostrarAba('quadras'));
    $('#aba-sugestoes').addEventListener('click', () => mostrarAba('sugestoes'));
    $('.abas').addEventListener('keydown', ev => {
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        const proxima = $('#aba-quadras').getAttribute('aria-selected') === 'true' ? 'sugestoes' : 'quadras';
        mostrarAba(proxima);
        $(`#aba-${proxima}`).focus();
    });

    document.addEventListener('click', ev => {
        const editarBtn = ev.target.closest('[data-editar]');
        if (editarBtn) return editar(editarBtn.dataset.editar);
        const desativarBtn = ev.target.closest('[data-desativar]');
        if (desativarBtn) return desativar(desativarBtn.dataset.desativar);
        const aprovarBtn = ev.target.closest('[data-aprovar]');
        if (aprovarBtn) return aprovar(aprovarBtn.dataset.aprovar, aprovarBtn);
    });

    if (location.hash === '#sugestoes') mostrarAba('sugestoes');
    window.addEventListener('hashchange', () => mostrarAba(location.hash === '#sugestoes' ? 'sugestoes' : 'quadras'));
    $('#lista-quadras').innerHTML = '<li class="vazio-admin">Carregando quadras…</li>';
    carregarQuadras();
    carregarSugestoes();
});
