import { logout } from './services/auth.service.js';
import { listarQuadras, buscarQuadraPorId, cadastrarQuadra, atualizarQuadra, deletarQuadra } from './services/quadras.service.js';

let quadrasCache = [];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('uName').textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout').addEventListener('click', logout);

    carregarLista();

    // Eventos do Modal
    const modal = document.getElementById('modalQuadra');
    document.getElementById('btnNovaQuadra').addEventListener('click', () => abrirModal());
    document.getElementById('btnFecharModal').addEventListener('click', () => modal.classList.remove('active'));

    document.getElementById('formQuadra').addEventListener('submit', salvarQuadra);
});

async function carregarLista() {
    const tbody = document.getElementById('tBodyQuadras');
    try {
        quadrasCache = await listarQuadras();
        tbody.innerHTML = '';

        if (quadrasCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhuma quadra cadastrada.</td></tr>';
            return;
        }

       quadrasCache.forEach(q => {
    // Obtém a imagem do MinIO ou exibe imagem padrão
    const fotoUrl = (q.fotos && q.fotos.length > 0) 
        ? q.fotos[0].urlMinio 
        : 'https://via.placeholder.com/100x80?text=Sem+Foto';

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="width: 120px;">
            <img src="${fotoUrl}" alt="${q.nome}">
        </td>
        <td><strong>${q.nome}</strong></td>
        <td>${q.bairroRegiao || '-'}</td>
        <td>${q.tipoPiso}</td>
        <td>${q.cobertura}</td>
        <td>
            <button class="btn-sec" onclick="window.editarQuadra('${q.idQuadra}')">Editar</button>
            <button class="btn-sec" style="color: var(--coral);" onclick="window.excluirQuadra('${q.idQuadra}')">Excluir</button>
        </td>
    `;
    tbody.appendChild(tr);
});
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">${err.message}</td></tr>`;
    }
}

// Abre o modal preenchido para cadastro ou edição
function abrirModal(quadra = null) {
    const modal = document.getElementById('modalQuadra');
    
    document.getElementById('qId').value = quadra ? quadra.idQuadra : '';
    document.getElementById('qNome').value = quadra ? quadra.nome : '';
    document.getElementById('qEndereco').value = quadra ? quadra.endereco : '';
    document.getElementById('qBairro').value = quadra ? (quadra.bairroRegiao || '') : '';
    document.getElementById('qPiso').value = quadra ? quadra.tipoPiso : 'CIMENTO';
    document.getElementById('qCobertura').value = quadra ? quadra.cobertura : 'DESCOBERTA';

    // Oculta upload de fotos na edição (pode ser expandido conforme necessidade)
    document.getElementById('divFotos').style.display = quadra ? 'none' : 'block';
    document.getElementById('modalTitulo').textContent = quadra ? 'Editar Quadra' : 'Nova Quadra';

    modal.classList.add('active');
}

// Ação de clique no botão "Editar"
window.editarQuadra = async (id) => {
    try {
        const quadra = await buscarQuadraPorId(id);
        abrirModal(quadra);
    } catch (err) {
        alert(`Erro ao buscar dados da quadra: ${err.message}`);
    }
};

async function salvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;

    try {
        if (id) {
            // Atualização via PUT
            const payload = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                tipoPiso: document.getElementById('qPiso').value,
                cobertura: document.getElementById('qCobertura').value,
                descricao: '',
                latitude: 0,
                longitude: 0,
                iluminacao: true,
                acessibilidade: false,
                ativa: true
            };
            await atualizarQuadra(id, payload);
        } else {
            // Cadastro via POST (Multipart/form-data com imagens para MinIO)
            const formData = new FormData();
            const dados = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                tipoPiso: document.getElementById('qPiso').value,
                cobertura: document.getElementById('qCobertura').value,
                descricao: '',
                latitude: 0,
                longitude: 0,
                iluminacao: true,
                acessibilidade: false
            };

            formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));

            const files = document.getElementById('qFotos').files;
            for (let i = 0; i < files.length; i++) {
                formData.append('fotos', files[i]);
            }

            await cadastrarQuadra(formData);
        }

        document.getElementById('modalQuadra').classList.remove('active');
        carregarLista();
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

window.excluirQuadra = async (id) => {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
            carregarLista();
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
};