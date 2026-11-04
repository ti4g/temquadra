<<<<<<< HEAD
// js/pages/admin-page.js
import { logout } from '../services/auth_service.js';
import { verificarAcessoAdmin } from '../core/router.js';
import {
    listarQuadras,
    buscarQuadraPorId,
    cadastrarQuadra,
    atualizarQuadra,
    deletarQuadra
} from '../services/quadras_service.js';
import {
    listarSugestoes,
    aprovarSugestao
} from '../services/sugestoes_service.js';

=======
import { logout, estaAutenticado } from '../services/auth.service.js';
import { 
    listarQuadras, 
    buscarQuadraPorId, 
    cadastrarQuadra, 
    atualizarQuadra, 
    deletarQuadra 
} from '../services/quadras.service.js';
import { 
    listarPontosColetaAdmin, 
    cadastrarPontoColeta, 
    atualizarPontoColeta,   
    deletarPontoColeta 
} from '../services/pontos-coleta.service.js';
import { 
    listarSugestoes, 
    aprovarSugestao 
} from '../services/sugestoes.service.js';

let quadrasCache = [];
let pontosCache = [];
let sugestoesCache = [];
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e
let sugestaoSelecionadaId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof estaAutenticado === 'function' && !estaAutenticado()) {
        window.location.href = 'login.html';
        return;
    }

    // Configuração do Usuário
    const uName = document.getElementById('uName');
    if (uName) uName.textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout')?.addEventListener('click', logout);

<<<<<<< HEAD
    // Inicialização e Navegação de Abas
    configurarNavegacaoAbas();
    carregarListaQuadras();
    carregarListaSugestoes();

    // Eventos do Modal de Quadra
    const modalQuadra = document.getElementById('modalQuadra');
    document.getElementById('btnNovaQuadra')?.addEventListener('click', () => abrirModalQuadra());
    document.getElementById('btnFecharModal')?.addEventListener('click', () => modalQuadra?.classList.remove('active'));
    document.getElementById('formQuadra')?.addEventListener('submit', salvarQuadra);

    // Eventos do Modal de Aprovação de Sugestão
    document.getElementById('btnFecharModalSugestao')?.addEventListener('click', () => {
        document.getElementById('modalSugestao')?.classList.remove('active');
    });
    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', processarAprovação);
});

/* =========================================================
   SISTEMA DE ABAS
   ========================================================= */
function configurarNavegacaoAbas() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const secQuadras = document.getElementById('secQuadras');
    const secSugestoes = document.getElementById('secSugestoes');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const tab = btn.dataset.tab;
            if (tab === 'quadras') {
                secQuadras.style.display = 'block';
                secSugestoes.style.display = 'none';
            } else {
                secQuadras.style.display = 'none';
                secSugestoes.style.display = 'block';
            }
        });
    });
}

/* =========================================================
   LISTAGEM DE QUADRAS OFICIAIS (TAB 1)
   ========================================================= */
async function carregarListaQuadras() {
    const tbody = document.getElementById('tBodyQuadras');
    if (!tbody) return;

    try {
        const quadras = await listarQuadras();
        tbody.innerHTML = '';

        if (!quadras || quadras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma quadra cadastrada.</td></tr>';
            return;
        }

        quadras.forEach(q => {
            const fotoUrl = (q.fotos && q.fotos.length > 0)
                ? q.fotos[0].urlMinio
                : 'https://via.placeholder.com/100x80?text=Sem+Foto';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="width: 90px;">
                    <img src="${fotoUrl}" alt="${q.nome}" class="thumb-img">
                </td>
                <td><strong>${q.nome}</strong></td>
                <td>${q.bairroRegiao || '-'}</td>
                <td><span class="badge-status status-aprovado">${q.tipoPiso}</span></td>
                <td>${q.cobertura}</td>
                <td>
                    <button class="btn-action btn-editar" data-id="${q.idQuadra}">Editar</button>
                    <button class="btn-action btn-danger btn-excluir" data-id="${q.idQuadra}">Excluir</button>
                </td>
            `;

            tr.querySelector('.btn-editar').addEventListener('click', () => editarQuadra(q.idQuadra));
            tr.querySelector('.btn-excluir').addEventListener('click', () => excluirQuadra(q.idQuadra));

            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--admin-danger);">Erro ao carregar quadras: ${err.message}</td></tr>`;
    }
}

/* =========================================================
   LISTAGEM E APROVAÇÃO DE SUGESTÕES (TAB 2)
   ========================================================= */
async function carregarListaSugestoes() {
    const tbody = document.getElementById('tBodySugestoes');
    const badge = document.getElementById('badgeSugestoes');
    if (!tbody) return;

    try {
        const sugestoes = await listarSugestoes();
        tbody.innerHTML = '';

        const pendentes = sugestoes.filter(s => s.status === 'PENDENTE');
        if (badge) badge.textContent = pendentes.length;

        if (!sugestoes || sugestoes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma sugestão recebida.</td></tr>';
            return;
        }

        sugestoes.forEach(s => {
            const fotoUrl = (s.fotos && s.fotos.length > 0)
                ? s.fotos[0].urlMinio
                : 'https://via.placeholder.com/100x80?text=Sem+Foto';

            const ehPendente = s.status === 'PENDENTE';
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td style="width: 90px;">
                    <img src="${fotoUrl}" alt="${s.nome}" class="thumb-img">
                </td>
                <td>
                    <strong>${s.nome}</strong><br>
                    <small style="color: var(--admin-text-muted);">${s.bairroRegiao || s.endereco}</small>
                </td>
                <td>
                    ${s.nomeSolicitante || 'Anônimo'}<br>
                    <small style="color: var(--admin-text-muted);">${s.telefoneSolicitante || '-'}</small>
                </td>
                <td>${s.tipoPiso} / ${s.cobertura}</td>
                <td>
                    <span class="badge-status ${ehPendente ? 'status-pendente' : 'status-aprovado'}">
                        ${s.status}
                    </span>
                </td>
                <td>
                    ${ehPendente ? `<button class="btn-action btn-approve btn-analisar" data-json='${JSON.stringify(s)}'>Analisar & Aprovar</button>` : '<span style="color: var(--admin-success); font-size: 12px;">✓ Aprovado</span>'}
                </td>
            `;

            if (ehPendente) {
                tr.querySelector('.btn-analisar').addEventListener('click', (e) => {
                    const dadosObj = JSON.parse(e.currentTarget.dataset.json);
                    abrirModalSugestao(dadosObj);
                });
            }

            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--admin-danger);">Erro ao carregar sugestões: ${err.message}</td></tr>`;
    }
}

function abrirModalSugestao(sugestao) {
    sugestaoSelecionadaId = sugestao.idSugestaoQuadra;
    const conteuto = document.getElementById('detalheSugestaoConteudo');

    const fotoUrl = (sugestao.fotos && sugestao.fotos.length > 0)
        ? sugestao.fotos[0].urlMinio
        : 'https://via.placeholder.com/500x200?text=Sem+Foto';

    conteuto.innerHTML = `
        <div style="margin-bottom: 16px; text-align: center;">
            <img src="${fotoUrl}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; border: 1px solid var(--admin-border);">
        </div>
        <p><strong>Quadra:</strong> ${sugestao.nome}</p>
        <p><strong>Solicitante:</strong> ${sugestao.nomeSolicitante || 'Não informado'} (${sugestao.telefoneSolicitante || 'Sem telefone'})</p>
        <p><strong>Endereço/Referência:</strong> ${sugestao.endereco}</p>
        <p><strong>Coordenadas:</strong> Lat ${sugestao.latitude || '-'}, Lng ${sugestao.longitude || '-'}</p>
        <p><strong>Recursos:</strong> Piso ${sugestao.tipoPiso} | Cobertura ${sugestao.cobertura} | Iluminação: ${sugestao.iluminacao ? 'Sim' : 'Não'}</p>
    `;

    document.getElementById('modalSugestao')?.classList.add('active');
}

async function processarAprovação() {
    if (!sugestaoSelecionadaId) return;

    const btn = document.getElementById('btnConfirmarAprovacao');
    const obs = document.getElementById('sugestaoObsAdmin').value.trim();

    try {
        btn.disabled = true;
        btn.textContent = 'Aprovando...';

        await aprovarSugestao(sugestaoSelecionadaId, obs);

        alert('Sugestão aprovada com sucesso! A quadra agora está publicada no mapa.');
        document.getElementById('modalSugestao')?.classList.remove('active');
        
        await carregarListaSugestoes();
        await carregarListaQuadras();
    } catch (err) {
        alert(`Erro ao aprovar sugestão: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Aprovar e Publicar no Mapa';
    }
}

/* =========================================================
   AÇÕES DO MODAL DE QUADRAS (CADASTRAR / EDITAR / SALVAR)
   ========================================================= */
function abrirModalQuadra(quadra = null) {
    const modal = document.getElementById('modalQuadra');
    if (!modal) return;

    document.getElementById('qId').value = quadra ? quadra.idQuadra : '';
    document.getElementById('qNome').value = quadra ? quadra.nome : '';
    document.getElementById('qEndereco').value = quadra ? quadra.endereco : '';
    document.getElementById('qBairro').value = quadra ? (quadra.bairroRegiao || '') : '';
    document.getElementById('qPiso').value = quadra ? quadra.tipoPiso : 'CIMENTO';
    document.getElementById('qCobertura').value = quadra ? quadra.cobertura : 'DESCOBERTA';
    document.getElementById('qLatitude').value = (quadra && quadra.latitude !== null) ? quadra.latitude : '';
    document.getElementById('qLongitude').value = (quadra && quadra.longitude !== null) ? quadra.longitude : '';
    document.getElementById('qIluminacao').checked = quadra ? (quadra.iluminacao ?? true) : true;
    document.getElementById('qAcessibilidade').checked = quadra ? (quadra.acessibilidade ?? false) : false;

    const divFotos = document.getElementById('divFotos');
    if (divFotos) divFotos.style.display = quadra ? 'none' : 'block';
=======
    // Menu Responsivo Mobile
    const sidebar = document.getElementById('adminSidebar');
    document.getElementById('btnToggleMenu')?.addEventListener('click', () => {
        sidebar?.classList.toggle('aberta');
    });

    // Navegação por Sidebar
    configurarMenuSidebar();

    // Eventos Universais para Fechamento de Modais (<dialog>)
    document.querySelectorAll('.btn-fechar-dialog').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modal;
            if (modalId) fecharModal(document.getElementById(modalId));
        });
    });

    // Carregamento Inicial
    carregarQuadras();
    carregarPontos();
    carregarSugestoes();

    // Eventos de Quadras
    document.getElementById('btnNovaQuadra')?.addEventListener('click', () => abrirModalQuadra());
    document.getElementById('formQuadra')?.addEventListener('submit', handleSalvarQuadra);
    document.getElementById('filtro-quadras')?.addEventListener('input', (e) => filtrarQuadras(e.target.value));

    // Eventos de Pontos de Doação
    document.getElementById('btnNovoPonto')?.addEventListener('click', () => abrirModalPonto());
    document.getElementById('formPonto')?.addEventListener('submit', handleSalvarPonto);
    document.getElementById('filtro-pontos')?.addEventListener('input', (e) => filtrarPontos(e.target.value));

    // Eventos de Sugestões
    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', handleAprovarSugestao);
    document.getElementById('filtro-sugestoes')?.addEventListener('input', (e) => filtrarSugestoes(e.target.value));
});

/* =========================================================
   CONTROLE DE MODAIS NATIVOS (<dialog>)
   ========================================================= */
function abrirModalDialog(dialogEl) {
    if (!dialogEl) return;
    if (typeof dialogEl.showModal === 'function') {
        dialogEl.showModal();
    } else {
        dialogEl.setAttribute('open', 'true');
    }
}

function fecharModal(dialogEl) {
    if (!dialogEl) return;
    if (typeof dialogEl.close === 'function') {
        dialogEl.close();
    } else {
        dialogEl.removeAttribute('open');
    }
}

/* =========================================================
   MENU LATERAL (SIDEBAR)
   ========================================================= */
function configurarMenuSidebar() {
    const botoes = document.querySelectorAll('.admin-nav-item');
    const secQuadras = document.getElementById('sec-quadras');
    const secSugestoes = document.getElementById('sec-sugestoes');
    const secPontos = document.getElementById('sec-pontos');
    const titulo = document.getElementById('tituloPagina');

    const titulos = {
        'sec-quadras': 'Quadras do Mapa',
        'sec-sugestoes': 'Sugestões Recebidas',
        'sec-pontos': 'Pontos de Doação'
    };

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            botoes.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetId = btn.dataset.tab;
            if (secQuadras) secQuadras.hidden = targetId !== 'sec-quadras';
            if (secSugestoes) secSugestoes.hidden = targetId !== 'sec-sugestoes';
            if (secPontos) secPontos.hidden = targetId !== 'sec-pontos';

            if (titulo && titulos[targetId]) {
                titulo.textContent = titulos[targetId];
            }

            document.getElementById('adminSidebar')?.classList.remove('aberta');
        });
    });
}

/* =========================================================
   GERENCIAMENTO DE QUADRAS
   ========================================================= */
async function carregarQuadras() {
    const listaEl = document.getElementById('lista-quadras');
    const contEl = document.getElementById('cont-quadras');
    if (!listaEl) return;

    try {
        quadrasCache = await listarQuadras();
        if (contEl) contEl.textContent = quadrasCache.length;
        renderizarQuadras(quadrasCache);
    } catch (err) {
        listaEl.innerHTML = `<li class="vazio"><p style="color:var(--admin-danger);">Erro ao carregar quadras: ${err.message}</p></li>`;
    }
}

function renderizarQuadras(lista) {
    const listaEl = document.getElementById('lista-quadras');
    if (!listaEl) return;
    listaEl.innerHTML = '';

    if (!lista || lista.length === 0) {
        listaEl.innerHTML = '<li class="vazio"><p>Nenhuma quadra encontrada.</p></li>';
        return;
    }

    lista.forEach(q => {
        const fotoUrl = (q.fotos && q.fotos.length > 0) 
            ? (q.fotos[0].urlMinio || q.fotos[0]) 
            : 'https://via.placeholder.com/100x80?text=Sem+Foto';

        const li = document.createElement('li');
        li.className = 'linha';
        li.innerHTML = `
            <img class="linha__foto" src="${fotoUrl}" alt="${q.nome}">
            <div class="linha__info">
                <span class="linha__nome">${q.nome}</span>
                <span class="linha__meta">${q.bairroRegiao || q.endereco || '-'}</span>
            </div>
            <div class="linha__acoes" onclick="event.stopPropagation()">
                <button type="button" class="btn btn--claro btn-editar">Editar</button>
                <button type="button" class="btn btn--claro btn-excluir" style="color:var(--admin-danger);">Excluir</button>
            </div>
        `;

        li.addEventListener('click', () => exibirDetalhesQuadra(q));
        li.querySelector('.btn-editar').addEventListener('click', () => handleEditarQuadra(q.idQuadra || q.id));
        li.querySelector('.btn-excluir').addEventListener('click', () => handleExcluirQuadra(q.idQuadra || q.id));

        listaEl.appendChild(li);
    });
}

function filtrarQuadras(termo) {
    const t = termo.toLowerCase().trim();
    const filtradas = quadrasCache.filter(q => 
        (q.nome && q.nome.toLowerCase().includes(t)) || 
        (q.bairroRegiao && q.bairroRegiao.toLowerCase().includes(t)) ||
        (q.endereco && q.endereco.toLowerCase().includes(t))
    );
    renderizarQuadras(filtradas);
}

function abrirModalQuadra(quadra = null) {
    const modal = document.getElementById('modalQuadra');
    if (!modal) return;
    
    document.getElementById('qId').value = quadra ? (quadra.idQuadra || quadra.id) : '';
    document.getElementById('qNome').value = quadra ? quadra.nome : '';
    document.getElementById('qEndereco').value = quadra ? quadra.endereco : '';
    document.getElementById('qBairro').value = quadra ? (quadra.bairroRegiao || '') : '';
    document.getElementById('qDescricao').value = quadra ? (quadra.descricao || '') : '';
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e

    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = quadra ? 'Editar quadra' : 'Nova quadra';

    abrirModalDialog(modal);
}

async function handleEditarQuadra(id) {
    try {
        const quadra = await buscarQuadraPorId(id);
        abrirModalQuadra(quadra);
    } catch (err) {
        alert(`Erro ao carregar dados da quadra: ${err.message}`);
    }
}

<<<<<<< HEAD
async function salvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;

    const latRaw = document.getElementById('qLatitude').value;
    const lngRaw = document.getElementById('qLongitude').value;

    const dadosQuadra = {
        nome: document.getElementById('qNome').value,
        endereco: document.getElementById('qEndereco').value,
        bairroRegiao: document.getElementById('qBairro').value,
        tipoPiso: document.getElementById('qPiso').value,
        cobertura: document.getElementById('qCobertura').value,
        descricao: '',
        latitude: latRaw !== '' ? parseFloat(latRaw) : null,
        longitude: lngRaw !== '' ? parseFloat(lngRaw) : null,
        iluminacao: document.getElementById('qIluminacao').checked,
        acessibilidade: document.getElementById('qAcessibilidade').checked
    };

    try {
        if (id) {
            await atualizarQuadra(id, { ...dadosQuadra, ativa: true });
=======
async function handleSalvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;
    const modal = document.getElementById('modalQuadra');

    try {
        if (id) {
            const payload = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                descricao: document.getElementById('qDescricao').value,
                ativa: true
            };
            await atualizarQuadra(id, payload);
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e
        } else {
            const formData = new FormData();
            const dados = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                descricao: document.getElementById('qDescricao').value
            };

            formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
            await cadastrarQuadra(formData);
        }

<<<<<<< HEAD
        document.getElementById('modalQuadra')?.classList.remove('active');
        await carregarListaQuadras();
=======
        fecharModal(modal);
        await carregarQuadras();
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

async function handleExcluirQuadra(id) {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
<<<<<<< HEAD
            await carregarListaQuadras();
=======
            await carregarQuadras();
>>>>>>> e897a4c9850108e7800024fdfabd297c4e7cbf1e
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
}

function exibirDetalhesQuadra(q) {
    const modal = document.getElementById('modalDetalheAdmin');
    const conteudo = document.getElementById('conteudoDetalheAdmin');
    document.getElementById('modalDetalheTitulo').textContent = `Quadra: ${q.nome}`;

    conteudo.innerHTML = `
        <div class="grid-detalhes">
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Nome</span>
                <span class="card-detalhe-item__valor">${q.nome}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Bairro/Região</span>
                <span class="card-detalhe-item__valor">${q.bairroRegiao || 'Não informado'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Endereço</span>
                <span class="card-detalhe-item__valor">${q.endereco || '-'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Descrição</span>
                <span class="card-detalhe-item__valor">${q.descricao || 'Sem descrição cadastrada'}</span>
            </div>
        </div>
    `;

    abrirModalDialog(modal);
}

/* =========================================================
   GERENCIAMENTO DE SUGESTÕES
   ========================================================= */
async function carregarSugestoes() {
    const listaEl = document.getElementById('lista-sugestoes');
    const contEl = document.getElementById('cont-sugestoes');
    if (!listaEl) return;

    try {
        sugestoesCache = await listarSugestoes();
        const pendentes = sugestoesCache.filter(s => s.status === 'PENDENTE');
        if (contEl) contEl.textContent = pendentes.length;
        renderizarSugestoes(sugestoesCache);
    } catch (err) {
        listaEl.innerHTML = `<li class="vazio"><p style="color:var(--admin-danger);">Erro ao carregar sugestões: ${err.message}</p></li>`;
    }
}

function renderizarSugestoes(lista) {
    const listaEl = document.getElementById('lista-sugestoes');
    if (!listaEl) return;
    listaEl.innerHTML = '';

    if (!lista || lista.length === 0) {
        listaEl.innerHTML = '<li class="vazio"><p>Nenhuma sugestão cadastrada.</p></li>';
        return;
    }

    lista.forEach(s => {
        const fotoUrl = (s.fotos && s.fotos.length > 0)
            ? (s.fotos[0].urlMinio || s.fotos[0])
            : 'https://via.placeholder.com/100x80?text=Sem+Foto';

        const ehPendente = s.status === 'PENDENTE';

        const li = document.createElement('li');
        li.className = 'linha';
        li.innerHTML = `
            <img class="linha__foto" src="${fotoUrl}" alt="${s.nome}">
            <div class="linha__info">
                <span class="linha__nome">${s.nome}</span>
                <span class="linha__meta">${s.bairroRegiao || s.endereco}</span>
            </div>
            <div class="linha__acoes" onclick="event.stopPropagation()">
                ${ehPendente 
                    ? `<button type="button" class="btn btn--primario btn-analisar">Analisar</button>` 
                    : `<span class="status status--APROVADO">Aprovada</span>`
                }
            </div>
        `;

        li.addEventListener('click', () => exibirDetalhesSugestao(s));
        if (ehPendente) {
            li.querySelector('.btn-analisar').addEventListener('click', () => abrirModalSugestao(s));
        }

        listaEl.appendChild(li);
    });
}

function filtrarSugestoes(termo) {
    const t = termo.toLowerCase().trim();
    const filtradas = sugestoesCache.filter(s => 
        (s.nome && s.nome.toLowerCase().includes(t)) || 
        (s.bairroRegiao && s.bairroRegiao.toLowerCase().includes(t)) ||
        (s.nomeSolicitante && s.nomeSolicitante.toLowerCase().includes(t))
    );
    renderizarSugestoes(filtradas);
}

function abrirModalSugestao(sugestao) {
    sugestaoSelecionadaId = sugestao.idSugestaoQuadra || sugestao.id;
    const modal = document.getElementById('modalSugestao');
    const conteudo = document.getElementById('detalheSugestaoConteudo');

    const fotoUrl = (sugestao.fotos && sugestao.fotos.length > 0)
        ? (sugestao.fotos[0].urlMinio || sugestao.fotos[0])
        : 'https://via.placeholder.com/500x200?text=Sem+Foto';

    conteudo.innerHTML = `
        <img src="${fotoUrl}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px;">
        <div class="grid-detalhes" style="margin-top: 12px;">
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Nome</span>
                <span class="card-detalhe-item__valor">${sugestao.nome}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Solicitante</span>
                <span class="card-detalhe-item__valor">${sugestao.nomeSolicitante || 'Anônimo'} (${sugestao.telefoneSolicitante || '-'})</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Endereço</span>
                <span class="card-detalhe-item__valor">${sugestao.endereco}</span>
            </div>
        </div>
    `;

    abrirModalDialog(modal);
}

async function handleAprovarSugestao() {
    if (!sugestaoSelecionadaId) return;

    try {
        await aprovarSugestao(sugestaoSelecionadaId);
        alert('Sugestão aprovada e convertida em quadra com sucesso!');
        fecharModal(document.getElementById('modalSugestao'));
        
        await carregarSugestoes();
        await carregarQuadras();
    } catch (err) {
        alert(`Erro ao aprovar sugestão: ${err.message}`);
    }
}

function exibirDetalhesSugestao(s) {
    const modal = document.getElementById('modalDetalheAdmin');
    const conteudo = document.getElementById('conteudoDetalheAdmin');
    document.getElementById('modalDetalheTitulo').textContent = `Sugestão: ${s.nome}`;

    conteudo.innerHTML = `
        <div class="grid-detalhes">
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Status</span>
                <span class="card-detalhe-item__valor"><span class="status status--${s.status}">${s.status}</span></span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Nome</span>
                <span class="card-detalhe-item__valor">${s.nome}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Solicitante</span>
                <span class="card-detalhe-item__valor">${s.nomeSolicitante || 'Anônimo'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Contato Solicitante</span>
                <span class="card-detalhe-item__valor">${s.telefoneSolicitante || 'Não informado'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Endereço</span>
                <span class="card-detalhe-item__valor">${s.endereco}</span>
            </div>
        </div>
    `;

    abrirModalDialog(modal);
}

/* =========================================================
   GERENCIAMENTO DE PONTOS DE DOAÇÃO / COLETA
   ========================================================= */
async function carregarPontos() {
    const listaEl = document.getElementById('lista-pontos');
    const contEl = document.getElementById('cont-pontos');
    if (!listaEl) return;

    try {
        pontosCache = await listarPontosColetaAdmin();
        if (contEl) contEl.textContent = pontosCache.length;
        renderizarPontos(pontosCache);
    } catch (err) {
        listaEl.innerHTML = `<li class="vazio"><p style="color:var(--admin-danger);">Erro ao carregar pontos: ${err.message}</p></li>`;
    }
}

function renderizarPontos(lista) {
    const listaEl = document.getElementById('lista-pontos');
    if (!listaEl) return;
    listaEl.innerHTML = '';

    if (!lista || lista.length === 0) {
        listaEl.innerHTML = '<li class="vazio"><p>Nenhum ponto de doação cadastrado.</p></li>';
        return;
    }

    lista.forEach(p => {
        const idPonto = p.idPontoColeta || p.id;
        const li = document.createElement('li');
        li.className = 'linha';
        li.innerHTML = `
            <div style="width: 60px; height: 60px; border-radius: 10px; background: rgba(0,240,255,0.1); display: grid; place-items: center; font-size: 24px;">📍</div>
            <div class="linha__info">
                <span class="linha__nome">${p.nome}</span>
                <span class="linha__meta">${p.endereco}</span>
            </div>
            <div class="linha__acoes" onclick="event.stopPropagation()">
                <button type="button" class="btn btn--claro btn-editar-ponto">Editar</button>
                <button type="button" class="btn btn--claro btn-excluir-ponto" style="color:var(--admin-danger);">Excluir</button>
            </div>
        `;

        li.addEventListener('click', () => exibirDetalhesPonto(p));
        li.querySelector('.btn-editar-ponto').addEventListener('click', () => abrirModalPonto(p));
        li.querySelector('.btn-excluir-ponto').addEventListener('click', () => handleExcluirPonto(idPonto));

        listaEl.appendChild(li);
    });
}

function filtrarPontos(termo) {
    const t = termo.toLowerCase().trim();
    const filtrados = pontosCache.filter(p => 
        (p.nome && p.nome.toLowerCase().includes(t)) || 
        (p.endereco && p.endereco.toLowerCase().includes(t)) ||
        (p.responsavel && p.responsavel.toLowerCase().includes(t))
    );
    renderizarPontos(filtrados);
}

function abrirModalPonto(ponto = null) {
    const modal = document.getElementById('modalPonto');
    if (!modal) return;

    document.getElementById('pId').value = ponto ? (ponto.idPontoColeta || ponto.id) : '';
    document.getElementById('pNome').value = ponto ? ponto.nome : '';
    document.getElementById('pEndereco').value = ponto ? ponto.endereco : '';
    document.getElementById('pResponsavel').value = ponto ? (ponto.responsavel || '') : '';
    document.getElementById('pTelefone').value = ponto ? (ponto.telefone || '') : '';
    document.getElementById('pHorario').value = ponto ? (ponto.horarioFuncionamento || '') : '';

    const titulo = document.getElementById('modalPontoTitulo');
    if (titulo) titulo.textContent = ponto ? 'Editar ponto de doação' : 'Novo ponto de doação';

    abrirModalDialog(modal);
}

async function handleSalvarPonto(e) {
    e.preventDefault();
    const id = document.getElementById('pId').value;
    const modal = document.getElementById('modalPonto');

    const payload = {
        nome: document.getElementById('pNome').value,
        endereco: document.getElementById('pEndereco').value,
        responsavel: document.getElementById('pResponsavel').value,
        telefone: document.getElementById('pTelefone').value,
        horarioFuncionamento: document.getElementById('pHorario').value,
        ativo: true
    };

    try {
        if (id) {
            await atualizarPontoColeta(id, payload);
        } else {
            await cadastrarPontoColeta(payload);
        }

        fecharModal(modal);
        await carregarPontos();
    } catch (err) {
        alert(`Erro ao salvar ponto: ${err.message}`);
    }
}

async function handleExcluirPonto(id) {
    if (confirm('Deseja realmente remover este ponto de doação?')) {
        try {
            await deletarPontoColeta(id);
            await carregarPontos();
        } catch (err) {
            alert(`Erro ao remover ponto: ${err.message}`);
        }
    }
}

function exibirDetalhesPonto(p) {
    const modal = document.getElementById('modalDetalheAdmin');
    const conteudo = document.getElementById('conteudoDetalheAdmin');
    document.getElementById('modalDetalheTitulo').textContent = `Ponto: ${p.nome}`;

    conteudo.innerHTML = `
        <div class="grid-detalhes">
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Nome do Ponto</span>
                <span class="card-detalhe-item__valor">${p.nome}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Endereço</span>
                <span class="card-detalhe-item__valor">${p.endereco}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Responsável</span>
                <span class="card-detalhe-item__valor">${p.responsavel || 'Não informado'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Telefone</span>
                <span class="card-detalhe-item__valor">${p.telefone || 'Não informado'}</span>
            </div>
            <div class="card-detalhe-item">
                <span class="card-detalhe-item__rotulo">Horário</span>
                <span class="card-detalhe-item__valor">${p.horarioFuncionamento || 'Não informado'}</span>
            </div>
        </div>
    `;

    abrirModalDialog(modal);
}