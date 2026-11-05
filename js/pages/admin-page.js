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
let sugestaoSelecionadaId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof estaAutenticado === 'function' && !estaAutenticado()) {
        window.location.href = 'login.html';
        return;
    }

    const uName = document.getElementById('uName');
    if (uName) uName.textContent = localStorage.getItem('userName') || 'Admin';
    document.getElementById('btnLogout')?.addEventListener('click', logout);

    const sidebar = document.getElementById('adminSidebar');
    document.getElementById('btnToggleMenu')?.addEventListener('click', () => {
        sidebar?.classList.toggle('aberta');
    });

    configurarMenuSidebar();

    document.querySelectorAll('.btn-fechar-dialog').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.modal;
            if (modalId) fecharModal(document.getElementById(modalId));
        });
    });

    carregarQuadras();
    carregarPontos();
    carregarSugestoes();

    document.getElementById('qCep')?.addEventListener('blur', buscarEnderecoPorCep);
    document.getElementById('qCep')?.addEventListener('input', formatarMascaraCep);

    document.getElementById('btnNovaQuadra')?.addEventListener('click', () => abrirModalQuadra());
    document.getElementById('formQuadra')?.addEventListener('submit', handleSalvarQuadra);
    document.getElementById('filtro-quadras')?.addEventListener('input', (e) => filtrarQuadras(e.target.value));

    document.getElementById('btnNovoPonto')?.addEventListener('click', () => abrirModalPonto());
    document.getElementById('formPonto')?.addEventListener('submit', handleSalvarPonto);
    document.getElementById('filtro-pontos')?.addEventListener('input', (e) => filtrarPontos(e.target.value));

    document.getElementById('btnConfirmarAprovacao')?.addEventListener('click', handleAprovarSugestao);
    document.getElementById('filtro-sugestoes')?.addEventListener('input', (e) => filtrarSugestoes(e.target.value));
});

function formatarMascaraCep(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) {
        v = v.substring(0, 5) + '-' + v.substring(5, 8);
    }
    e.target.value = v;
}

async function buscarEnderecoPorCep(e) {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await response.json();

        if (dados.erro) {
            alert('CEP não encontrado.');
            return;
        }

        if (dados.logradouro) {
            document.getElementById('qEndereco').value = `${dados.logradouro}, ${dados.bairro || ''}`.trim();
        }
        if (dados.bairro) {
            document.getElementById('qBairro').value = dados.bairro;
        }
    } catch (err) {
        console.error('Erro ao consultar CEP:', err);
    }
}

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

/* GERENCIAMENTO DE QUADRAS */
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
        const fotoUrl = (q.imagens && q.imagens.length > 0) 
            ? (q.imagens[0].urlMinio || q.imagens[0]) 
            : (q.fotos && q.fotos.length > 0 ? (q.fotos[0].urlMinio || q.fotos[0]) : 'https://via.placeholder.com/100x80?text=Sem+Foto');

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

    document.getElementById('qPiso').value = quadra ? (quadra.tipoPiso || 'CIMENTO') : 'CIMENTO';
    document.getElementById('qCobertura').value = quadra ? (quadra.cobertura || 'DESCOBERTA') : 'DESCOBERTA';

    document.getElementById('qLatitude').value = (quadra && quadra.latitude != null) ? quadra.latitude : '';
    document.getElementById('qLongitude').value = (quadra && quadra.longitude != null) ? quadra.longitude : '';

    document.getElementById('qIluminacao').checked = quadra ? (quadra.iluminacao ?? false) : false;
    document.getElementById('qAcessibilidade').checked = quadra ? (quadra.acessibilidade ?? false) : false;
    document.getElementById('qBanheiro').checked = quadra ? (quadra.banheiro ?? false) : false;
    document.getElementById('qBebedouro').checked = quadra ? (quadra.bebedouro ?? false) : false;

    const divFotos = document.getElementById('divFotos');
    if (divFotos) divFotos.style.display = quadra ? 'none' : 'block';

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

async function handleSalvarQuadra(e) {
    e.preventDefault();
    const id = document.getElementById('qId').value;
    const modal = document.getElementById('modalQuadra');

    const latRaw = document.getElementById('qLatitude').value;
    const lngRaw = document.getElementById('qLongitude').value;

    const dadosQuadra = {
        nome: document.getElementById('qNome').value,
        endereco: document.getElementById('qEndereco').value,
        bairroRegiao: document.getElementById('qBairro').value,
        descricao: document.getElementById('qDescricao').value,
        tipoPiso: document.getElementById('qPiso').value,
        cobertura: document.getElementById('qCobertura').value,
        latitude: latRaw !== '' ? parseFloat(latRaw) : null,
        longitude: lngRaw !== '' ? parseFloat(lngRaw) : null,
        iluminacao: document.getElementById('qIluminacao').checked,
        acessibilidade: document.getElementById('qAcessibilidade').checked,
        banheiro: document.getElementById('qBanheiro').checked,
        bebedouro: document.getElementById('qBebedouro').checked
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

        fecharModal(modal);
        await carregarQuadras();
    } catch (err) {
        alert(`Erro ao salvar quadra: ${err.message}`);
    }
}

async function handleExcluirQuadra(id) {
    if (confirm('Deseja realmente desativar esta quadra?')) {
        try {
            await deletarQuadra(id);
            await carregarQuadras();
        } catch (err) {
            alert(`Erro ao excluir quadra: ${err.message}`);
        }
    }
}

function exibirDetalhesQuadra(q) {
    const modal = document.getElementById('modalDetalheAdmin');
    const conteudo = document.getElementById('conteudoDetalheAdmin');
    const divMidia = document.getElementById('modalDetalheMidia');
    const imgFoto = document.getElementById('modalDetalheFoto');

    const tituloEl = document.getElementById('modalDetalheTitulo');
    if (tituloEl) tituloEl.textContent = `Quadra: ${q.nome}`;

    // Obtendo a foto de forma segura
    const fotoUrl = (q.imagens && q.imagens.length > 0) 
        ? (q.imagens[0].urlMinio || q.imagens[0]) 
        : (q.fotos && q.fotos.length > 0 ? (q.fotos[0].urlMinio || q.fotos[0]) : '');

    if (divMidia && imgFoto) {
        if (fotoUrl) {
            imgFoto.src = fotoUrl;
            imgFoto.style.display = 'block';
            divMidia.classList.remove('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        } else {
            imgFoto.style.display = 'none';
            divMidia.innerHTML = '<span style="font-size: 32px;">🏟️</span>';
            divMidia.classList.add('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        }
    }

    if (conteudo) {
        conteudo.innerHTML = `
            <div class="grid-detalhes">
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Nome</span>
                    <span class="card-detalhe-item__valor">${q.nome}</span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Bairro / Região</span>
                    <span class="card-detalhe-item__valor">${q.bairroRegiao || 'Não informado'}</span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Endereço</span>
                    <span class="card-detalhe-item__valor">${q.endereco || '-'}</span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Piso / Cobertura</span>
                    <span class="card-detalhe-item__valor">${q.tipoPiso || '-'} (${q.cobertura || '-'})</span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Recursos Presentes</span>
                    <span class="card-detalhe-item__valor">
                        ${q.iluminacao ? '💡 IluminaçãoNoturna | ' : ''}
                        ${q.acessibilidade ? '♿ Acessibilidade | ' : ''}
                        ${q.banheiro ? '🚻 Banheiro | ' : ''}
                        ${q.bebedouro ? '🚰 Bebedouro' : ''}
                        ${(!q.iluminacao && !q.acessibilidade && !q.banheiro && !q.bebedouro) ? 'Nenhum recurso cadastrado' : ''}
                    </span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">Descrição</span>
                    <span class="card-detalhe-item__valor">${q.descricao || 'Sem descrição cadastrada'}</span>
                </div>
            </div>
        `;
    }

    abrirModalDialog(modal);
}

/* GERENCIAMENTO DE SUGESTÕES */
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
        const fotoUrl = (s.imagens && s.imagens.length > 0)
            ? (s.imagens[0].urlMinio || s.imagens[0])
            : (s.fotos && s.fotos.length > 0 ? (s.fotos[0].urlMinio || s.fotos[0]) : 'https://via.placeholder.com/100x80?text=Sem+Foto');

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
    const imgFoto = document.getElementById('modalSugestaoFoto');

    const fotoUrl = (sugestao.imagens && sugestao.imagens.length > 0)
        ? (sugestao.imagens[0].urlMinio || sugestao.imagens[0])
        : (sugestao.fotos && sugestao.fotos.length > 0 ? (sugestao.fotos[0].urlMinio || sugestao.fotos[0]) : '');

    if (imgFoto) {
        if (fotoUrl) {
            imgFoto.src = fotoUrl;
            imgFoto.style.display = 'block';
        } else {
            imgFoto.src = 'https://via.placeholder.com/500x200?text=Sem+Foto';
            imgFoto.style.display = 'block';
        }
    }

    if (conteudo) {
        conteudo.innerHTML = `
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
    }

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
    const divMidia = document.getElementById('modalDetalheMidia');
    const imgFoto = document.getElementById('modalDetalheFoto');
    const tituloEl = document.getElementById('modalDetalheTitulo');

    if (tituloEl) tituloEl.textContent = `Sugestão: ${s.nome}`;

    const fotoUrl = (s.imagens && s.imagens.length > 0)
        ? (s.imagens[0].urlMinio || s.imagens[0])
        : (s.fotos && s.fotos.length > 0 ? (s.fotos[0].urlMinio || s.fotos[0]) : '');

    if (divMidia && imgFoto) {
        if (fotoUrl) {
            imgFoto.src = fotoUrl;
            imgFoto.style.display = 'block';
            divMidia.classList.remove('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        } else {
            imgFoto.style.display = 'none';
            divMidia.innerHTML = '<span style="font-size: 32px;">💡</span>';
            divMidia.classList.add('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        }
    }

    if (conteudo) {
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
    }

    abrirModalDialog(modal);
}

/* GERENCIAMENTO DE PONTOS DE DOAÇÃO / COLETA */
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
        (p.responsavel && (p.responsavel.nome || p.responsavel.name || "").toLowerCase().includes(t))
    );
    renderizarPontos(filtrados);
}

function abrirModalPonto(ponto = null) {
    const modal = document.getElementById('modalPonto');
    if (!modal) return;

    document.getElementById('pId').value = ponto ? (ponto.idPontoColeta || ponto.id) : '';
    document.getElementById('pNome').value = ponto ? ponto.nome : '';
    document.getElementById('pEndereco').value = ponto ? ponto.endereco : '';
    document.getElementById('pTelefone').value = ponto ? (ponto.telefone || '') : '';
    document.getElementById('pHorario').value = ponto ? (ponto.horarioFuncionamento || '') : '';

    // Carrega dinamicamente a lista e seta o id do responsável se houver
    const responsavelId = ponto?.responsavel?.idUsuario || null;
    popularDropdownResponsavel(responsavelId);

    const titulo = document.getElementById('modalPontoTitulo');
    if (titulo) titulo.textContent = ponto ? 'Editar ponto de doação' : 'Novo ponto de doação';

    abrirModalDialog(modal);
}

async function handleSalvarPonto(e) {
    e.preventDefault();
    const id = document.getElementById('pId').value;
    const modal = document.getElementById('modalPonto');

    const dadosPonto = {
        nome: document.getElementById('pNome').value,
        endereco: document.getElementById('pEndereco').value,
        responsavelId: document.getElementById('pResponsavel').value || null, // Busca id do dropdown
        telefone: document.getElementById('pTelefone').value,
        horarioFuncionamento: document.getElementById('pHorario').value,
        ativo: true
    };

    try {
        const formData = new FormData();
        formData.append('dados', new Blob([JSON.stringify(dadosPonto)], { type: 'application/json' }));

        const inputFotos = document.getElementById('pFotos');
        if (inputFotos && inputFotos.files) {
            for (let i = 0; i < inputFotos.files.length; i++) {
                formData.append('fotos', inputFotos.files[i]);
            }
        }

        if (id) {
            await atualizarPontoColeta(id, formData); // Agora é Multipart no Backend
        } else {
            await cadastrarPontoColeta(formData); // Agora é Multipart no Backend
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
    const divMidia = document.getElementById('modalDetalheMidia');
    const imgFoto = document.getElementById('modalDetalheFoto');
    const tituloEl = document.getElementById('modalDetalheTitulo');
    
    if (tituloEl) tituloEl.textContent = `Ponto: ${p.nome}`;

    // Obtendo a primeira foto do ponto do novo array p.fotos
    const fotoUrl = (p.fotos && p.fotos.length > 0) ? p.fotos[0] : '';

    if (divMidia && imgFoto) {
        if (fotoUrl) {
            imgFoto.src = fotoUrl;
            imgFoto.style.display = 'block';
            divMidia.classList.remove('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        } else {
            imgFoto.style.display = 'none';
            divMidia.innerHTML = '<span style="font-size: 32px;">📍</span>';
            divMidia.classList.add('visualizacao-midia--fallback');
            modal?.classList.remove('dialog-sem-imagem');
        }
    }

    if (conteudo) {
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
                    <span class="card-detalhe-item__valor">${p.responsavel ? (p.responsavel.nome || p.responsavel.name) : 'Não informado'}</span>
                </div>
                <div class="card-detalhe-item">
                    <span class="card-detalhe-item__rotulo">E-mail do Responsável</span>
                    <span class="card-detalhe-item__valor">${p.responsavel ? p.responsavel.email : '-'}</span>
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
    }

    abrirModalDialog(modal);
}

// Adicione esta nova função no js/pages/admin-page.js para popular o select:
async function popularDropdownResponsavel(idSelecionado = null) {
    const selectEl = document.getElementById('pResponsavel');
    if (!selectEl) return;

    try {
        // endpoint para obter os usuários aptos do seu novo UsuarioController
        const response = await fetch('http://localhost:8080/api/v1/usuarios/responsaveis-disponiveis');
        if (!response.ok) throw new Error('Não foi possível obter os usuários.');
        
        const usuarios = await response.json();
        
        selectEl.innerHTML = '<option value="">Selecione um responsável...</option>';
        usuarios.forEach(user => {
            const opt = document.createElement('option');
            opt.value = user.idUsuario;
            // Trata 'name' (entidade) ou 'nome' (DTO) para não exibir indefinido
            const nomeExibicao = user.nome || user.name || "Sem Nome";
            opt.textContent = `${nomeExibicao} (${user.email})`;
            if (idSelecionado && user.idUsuario === idSelecionado) {
                opt.selected = true;
            }
            selectEl.appendChild(opt);
        });
    } catch (err) {
        console.error("Erro ao popular responsáveis:", err);
    }
}