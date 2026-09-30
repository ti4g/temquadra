// js/pages/admin-page.js
import { logout, estaAutenticado } from '../services/auth.service.js';
import { 
    listarQuadras, 
    buscarQuadraPorId, 
    cadastrarQuadra, 
    atualizarQuadra, 
    deletarQuadra 
} from '../services/quadras.service.js';
import { verificarAcessoAdmin } from '../core/router.js'; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Executa a guarda de rotas vinda do seu router.js
    verificarAcessoAdmin();

    // 2. Preenche o nome do usuário ativo e ativa o botão de Logout
    const uName = document.getElementById('uName');
    if (uName) uName.textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout')?.addEventListener('click', logout);

    // 3. Inicializa a tabela de quadras
    carregarLista();

    // 4. Configuração dos eventos do Modal
    const modal = document.getElementById('modalQuadra');
    document.getElementById('btnNovaQuadra')?.addEventListener('click', () => abrirModal());
    document.getElementById('btnFecharModal')?.addEventListener('click', () => modal?.classList.remove('active'));

    // 5. Submit do formulário de salvar/editar quadra
    document.getElementById('formQuadra')?.addEventListener('submit', salvarQuadra);
});

async function carregarTabelaQuadras() {
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
                <td style="width: 100px;">
                    <img src="${fotoUrl}" alt="${q.nome}" style="width: 70px; height: 50px; object-fit: cover; border-radius: 6px;">
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

            // Adiciona listeners para editar e excluir
            tr.querySelector('.btn-editar').addEventListener('click', () => handleEditarQuadra(q.idQuadra));
            tr.querySelector('.btn-excluir').addEventListener('click', () => handleExcluirQuadra(q.idQuadra));

            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">${err.message}</td></tr>`;
    }
}

function abrirModal(quadra = null) {
    const modal = document.getElementById('modalQuadra');
    if (!modal) return;
    
    document.getElementById('qId').value = quadra ? quadra.idQuadra : '';
    document.getElementById('qNome').value = quadra ? quadra.nome : '';
    document.getElementById('qEndereco').value = quadra ? quadra.endereco : '';
    document.getElementById('qBairro').value = quadra ? (quadra.bairroRegiao || '') : '';
    document.getElementById('qPiso').value = quadra ? quadra.tipoPiso : 'CIMENTO';
    document.getElementById('qCobertura').value = quadra ? quadra.cobertura : 'DESCOBERTA';

    const divFotos = document.getElementById('divFotos');
    if (divFotos) divFotos.style.display = quadra ? 'none' : 'block';

    const modalTitulo = document.getElementById('modalTitulo');
    if (modalTitulo) modalTitulo.textContent = quadra ? 'Editar Quadra' : 'Nova Quadra';

    modal.classList.add('active');
}

async function handleEditarQuadra(id) {
    try {
        const quadra = await buscarQuadraPorId(id);
        abrirModal(quadra);
    } catch (err) {
        alert(`Erro ao carregar dados da quadra: ${err.message}`);
    }
}

async function handleSalvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;

    try {
        if (id) {
            // Edição via PUT
            const payload = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                tipoPiso: document.getElementById('qPiso').value,
                cobertura: document.getElementById('qCobertura').value,
                descricao: '',
                latitude: -10.2085,
                longitude: -48.3470,
                iluminacao: true,
                acessibilidade: true,
                ativa: true
            };
            await atualizarQuadra(id, payload);
        } else {
            // Novo Cadastro via POST (Multipart Form Data)
            const formData = new FormData();
            const dados = {
                nome: document.getElementById('qNome').value,
                endereco: document.getElementById('qEndereco').value,
                bairroRegiao: document.getElementById('qBairro').value,
                tipoPiso: document.getElementById('qPiso').value,
                cobertura: document.getElementById('qCobertura').value,
                descricao: '',
                latitude: -10.2085,
                longitude: -48.3470,
                iluminacao: true,
                acessibilidade: true
            };

            formData.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));

            const inputFotos = document.getElementById('qFotos');
            if (inputFotos && inputFotos.files) {
                for (let i = 0; i < inputFotos.files.length; i++) {
                    formData.append('fotos', inputFotos.files[i]);
                }
            }

            await cadastrarQuadra(formData);
        }

        document.getElementById('modalQuadra')?.classList.remove('active');
        await carregarTabelaQuadras();
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

async function handleExcluirQuadra(id) {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
            await carregarTabelaQuadras();
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
}