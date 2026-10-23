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

let sugestaoSelecionadaId = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdmin();

    const uName = document.getElementById('uName');
    if (uName) uName.textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout')?.addEventListener('click', logout);

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

    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = quadra ? 'Editar Quadra' : 'Nova Quadra';

    modal.classList.add('active');
}

async function editarQuadra(id) {
    try {
        const quadra = await buscarQuadraPorId(id);
        abrirModalQuadra(quadra);
    } catch (err) {
        alert(`Erro ao buscar dados da quadra: ${err.message}`);
    }
}

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
        } else {
            const formData = new FormData();
            formData.append('dados', new Blob([JSON.stringify(dadosQuadra)], { type: 'application/json' }));

            const inputFotos = document.getElementById('qFotos');
            if (inputFotos && inputFotos.files) {
                for (let i = 0; i < inputFotos.files.length; i++) {
                    formData.append('fotos', inputFotos.files[i]);
                }
            }

            await cadastrarQuadra(formData);
        }

        document.getElementById('modalQuadra')?.classList.remove('active');
        await carregarListaQuadras();
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

async function excluirQuadra(id) {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
            await carregarListaQuadras();
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
}