// js/pages/admin-page.js
import { logout } from '../services/auth.service.js';
import { verificarAcessoAdmin } from '../core/router.js';
import {
    listarQuadras,
    buscarQuadraPorId,
    cadastrarQuadra,
    atualizarQuadra,
    deletarQuadra
} from '../services/quadras.service.js';

document.addEventListener('DOMContentLoaded', () => {
    verificarAcessoAdmin();

    const uName = document.getElementById('uName');
    if (uName) uName.textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout')?.addEventListener('click', logout);

    carregarLista();

    const modal = document.getElementById('modalQuadra');
    document.getElementById('btnNovaQuadra')?.addEventListener('click', () => abrirModal());
    document.getElementById('btnFecharModal')?.addEventListener('click', () => modal?.classList.remove('active'));

    document.getElementById('formQuadra')?.addEventListener('submit', salvarQuadra);
});

async function carregarLista() {
    const tbody = document.getElementById('tBodyQuadras');
    if (!tbody) return;

    try {
        const quadras = await listarQuadras();
        tbody.innerHTML = '';

        if (!quadras || quadras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhuma quadra cadastrada.</td></tr>';
            return;
        }

        quadras.forEach(q => {
            const fotoUrl = (q.fotos && q.fotos.length > 0)
                ? q.fotos[0].urlMinio
                : 'https://via.placeholder.com/100x80?text=Sem+Foto';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="width: 110px;">
                    <img src="${fotoUrl}" alt="${q.nome}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 6px;">
                </td>
                <td><strong>${q.nome}</strong></td>
                <td>${q.bairroRegiao || '-'}</td>
                <td>${q.tipoPiso}</td>
                <td>${q.cobertura}</td>
                <td>
                    <button class="btn-sec btn-editar" data-id="${q.idQuadra}">Editar</button>
                    <button class="btn-sec btn-excluir" data-id="${q.idQuadra}" style="color: var(--coral, red);">Excluir</button>
                </td>
            `;

            tr.querySelector('.btn-editar').addEventListener('click', () => editarQuadra(q.idQuadra));
            tr.querySelector('.btn-excluir').addEventListener('click', () => excluirQuadra(q.idQuadra));

            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Erro ao carregar quadras: ${err.message}</td></tr>`;
    }
}

/**
 * Abre o Modal preenchido para cadastro ou edição
 */
function abrirModal(quadra = null) {
    const modal = document.getElementById('modalQuadra');
    if (!modal) return;

    // Campos de Texto/Seleção Principais
    document.getElementById('qId').value = quadra ? quadra.idQuadra : '';
    document.getElementById('qNome').value = quadra ? quadra.nome : '';
    document.getElementById('qEndereco').value = quadra ? quadra.endereco : '';
    document.getElementById('qBairro').value = quadra ? (quadra.bairroRegiao || '') : '';
    document.getElementById('qPiso').value = quadra ? quadra.tipoPiso : 'CIMENTO';
    document.getElementById('qCobertura').value = quadra ? quadra.cobertura : 'DESCOBERTA';

    // Latitude e Longitude: Se for edição, atribui o valor do banco; se for cadastro novo, deixa string vazia '' (exibindo o placeholder)
    document.getElementById('qLatitude').value = (quadra && quadra.latitude !== null && quadra.latitude !== undefined) ? quadra.latitude : '';
    document.getElementById('qLongitude').value = (quadra && quadra.longitude !== null && quadra.longitude !== undefined) ? quadra.longitude : '';

    // Checkboxes de Recursos
    document.getElementById('qIluminacao').checked = quadra ? (quadra.iluminacao ?? true) : true;
    document.getElementById('qAcessibilidade').checked = quadra ? (quadra.acessibilidade ?? false) : false;

    // Alterna visualização do campo de fotos
    const divFotos = document.getElementById('divFotos');
    if (divFotos) divFotos.style.display = quadra ? 'none' : 'block';

    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = quadra ? 'Editar Quadra' : 'Nova Quadra';

    modal.classList.add('active');
}

async function editarQuadra(id) {
    try {
        const quadra = await buscarQuadraPorId(id);
        abrirModal(quadra);
    } catch (err) {
        alert(`Erro ao buscar dados da quadra: ${err.message}`);
    }
}

/**
 * Envia o cadastro (POST multipart/form-data) ou atualização (PUT JSON) para a API
 */
async function salvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;

    const latRaw = document.getElementById('qLatitude').value;
    const lngRaw = document.getElementById('qLongitude').value;

    // Se estiver em branco, envia null para a API; caso contrário, converte para número decimal
    const latValor = latRaw !== '' ? parseFloat(latRaw) : null;
    const lngValor = lngRaw !== '' ? parseFloat(lngRaw) : null;

    const dadosQuadra = {
        nome: document.getElementById('qNome').value,
        endereco: document.getElementById('qEndereco').value,
        bairroRegiao: document.getElementById('qBairro').value,
        tipoPiso: document.getElementById('qPiso').value,
        cobertura: document.getElementById('qCobertura').value,
        descricao: '',
        latitude: latValor,
        longitude: lngValor,
        iluminacao: document.getElementById('qIluminacao').checked,
        acessibilidade: document.getElementById('qAcessibilidade').checked
    };

    try {
        if (id) {
            // Edição
            await atualizarQuadra(id, { ...dadosQuadra, ativa: true });
        } else {
            // Novo Cadastro
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
        await carregarLista();
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

async function excluirQuadra(id) {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
            await carregarLista();
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
}