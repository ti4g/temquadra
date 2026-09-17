/* Quadras de Palmas — painel da equipe (admin.html).
   Tudo passa pela Api: no modo demonstração, só enxerga o que foi enviado neste navegador. */
(function (raiz) {
  'use strict';

  const esc = Regras.escaparHtml;
  const FILTROS = [
    { valor: 'pendente', label: 'Pendentes' },
    { valor: 'aprovada', label: 'Aprovadas' },
    { valor: 'recusada', label: 'Recusadas' }
  ];
  const VAZIO = {
    pendente: 'Nenhuma sugestão esperando revisão.',
    aprovada: 'Nenhuma sugestão aprovada ainda.',
    recusada: 'Nenhuma sugestão recusada.'
  };

  let statusSugestoes = 'pendente';
  let quadrasPorId = {};

  function $(id) { return document.getElementById(id); }

  function dataBr(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function nomeQuadra(id) {
    if (!id) return 'Onde precisar mais';
    return quadrasPorId[id] ? quadrasPorId[id].nome : id;
  }

  function linha(rotulo, valorHtml) {
    return '<dt>' + rotulo + '</dt><dd>' + valorHtml + '</dd>';
  }

  function rotulosMarcados(catalogo, obj) {
    const lista = catalogo.filter(function (i) { return obj && obj[i.valor]; }).map(function (i) { return i.label; });
    return lista.length ? esc(lista.join(', ')) : '<span class="admin-apagado">nenhum</span>';
  }

  function htmlContato(nome, numero) {
    const digitos = Regras.apenasDigitos(numero);
    if (!nome && !digitos) return '';
    return '<div class="admin-contato">' +
      '<span><strong>Contato:</strong> ' + esc(nome || 'sem nome') +
        (digitos ? ' · ' + esc(Regras.formatarWhatsapp(digitos)) : '') + '</span>' +
      (digitos
        ? '<a class="btn-whats btn-whats--p" href="https://wa.me/55' + digitos + '" target="_blank" rel="noopener">' +
            Icones.i('whatsapp') + 'Chamar no WhatsApp</a>'
        : '') +
      '</div>';
  }

  function aviso(mensagem) {
    const el = $('a-aviso');
    el.textContent = mensagem || '';
    el.hidden = !mensagem;
  }

  function erroCarregar(erro) {
    return '<p class="admin-vazio admin-vazio--erro">Não foi possível carregar. ' + esc(erro.message) + '</p>';
  }

  // Se a sessão caiu, volta para o login
  function tratarSessao(erro) {
    if (/login/i.test(erro.message)) { mostrarEstado(); return true; }
    return false;
  }

  // ===== Sugestões =====
  function htmlSugestao(s) {
    const nova = s.tipo === 'nova';
    let dados;
    if (nova) {
      const onde = s.localizacao
        ? esc(s.localizacao.lat + ', ' + s.localizacao.lng) +
          ' · <a href="https://www.google.com/maps?q=' + encodeURIComponent(s.localizacao.lat + ',' + s.localizacao.lng) +
          '" target="_blank" rel="noopener">ver no mapa</a>'
        : '<span class="admin-sem">Sem coordenadas</span>';
      dados =
        linha('Onde', onde) +
        (s.referencia ? linha('Referência', esc(s.referencia)) : '') +
        linha('Piso', esc(Regras.rotulo(Regras.PISOS, s.piso))) +
        linha('Modalidades', esc((s.modalidades || []).map(function (m) { return Regras.rotulo(Regras.MODALIDADES, m); }).join(', '))) +
        linha('Equipamentos', rotulosMarcados(Regras.EQUIPAMENTOS, s.equipamentos)) +
        linha('Estrutura', rotulosMarcados(Regras.ESTRUTURAS, s.estrutura)) +
        linha('Coberta', s.coberta ? 'Sim' : 'Não') +
        linha('Conservação', s.conservacao ? esc(Regras.rotulo(Regras.CONSERVACOES, s.conservacao)) : '<span class="admin-apagado">não informada</span>');
    } else {
      dados =
        linha('Quadra', esc(nomeQuadra(s.quadraId))) +
        linha('O que está errado', esc(s.descricao));
    }

    let acoes;
    if (s.status === 'pendente') {
      const semCoord = nova && !s.localizacao;
      acoes = '<div class="admin-acoes">' +
        '<button type="button" class="btn-aprovar" data-acao="aprovar"' + (semCoord ? ' disabled aria-describedby="dica-' + esc(s.id) + '"' : '') + '>' +
          Icones.i('check') + 'Aprovar</button>' +
        '<button type="button" class="btn-recusar" data-acao="recusar">' + Icones.i('x') + 'Recusar</button>' +
        (semCoord ? '<span class="admin-dica" id="dica-' + esc(s.id) + '">Sem coordenadas — complete no Supabase</span>' : '') +
        '</div>';
    } else {
      acoes = '<p class="admin-decidida">' + (s.status === 'aprovada' ? 'Aprovada' : 'Recusada') +
        (s.decididoEm ? ' em ' + dataBr(s.decididoEm) : '') + '</p>';
    }

    return '<article class="admin-item" data-id="' + esc(s.id) + '" data-tipo="' + (nova ? 'nova' : 'correcao') + '">' +
      '<div class="admin-item__topo">' +
        '<div>' +
          '<span class="etiqueta etiqueta--' + (nova ? 'nova' : 'correcao') + '">' + (nova ? 'Quadra nova' : 'Correção') + '</span>' +
          '<h2 class="admin-item__titulo">' + (nova ? esc(s.nome) : esc(nomeQuadra(s.quadraId))) + '</h2>' +
        '</div>' +
        '<span class="admin-item__data">' + dataBr(s.criadoEm) + '</span>' +
      '</div>' +
      '<dl class="admin-dados">' + dados + '</dl>' +
      (nova && s.foto ? '<img class="admin-foto" src="' + esc(s.foto) + '" alt="Foto enviada de ' + esc(s.nome) + '">' : '') +
      htmlContato(s.contatoNome, s.contatoWhatsapp) +
      acoes +
    '</article>';
  }

  async function carregarSugestoes() {
    const alvo = $('a-lista-sugestoes');
    alvo.innerHTML = '<p class="admin-vazio">Carregando…</p>';
    try {
      const lista = await Api.listarSugestoes(statusSugestoes);
      alvo.innerHTML = lista.length
        ? lista.map(htmlSugestao).join('')
        : '<p class="admin-vazio">' + VAZIO[statusSugestoes] + '</p>';
    } catch (erro) {
      if (!tratarSessao(erro)) alvo.innerHTML = erroCarregar(erro);
    }
  }

  async function decidirSugestao(botao) {
    const item = botao.closest('.admin-item');
    const aprovar = botao.dataset.acao === 'aprovar';
    const pergunta = aprovar
      ? (item.dataset.tipo === 'nova'
          ? 'Aprovar esta sugestão? A quadra vai aparecer no mapa.'
          : 'Marcar esta correção como aprovada? Lembre de ajustar a quadra no banco.')
      : 'Recusar esta sugestão?';
    if (!raiz.confirm(pergunta)) return;

    aviso('');
    const botoes = Array.prototype.slice.call(item.querySelectorAll('.admin-acoes button'));
    const estavamDesabilitados = botoes.map(function (b) { return b.disabled; });
    botoes.forEach(function (b) { b.disabled = true; });
    try {
      if (aprovar) await Api.aprovarSugestao(item.dataset.id);
      else await Api.recusarSugestao(item.dataset.id);
      await Promise.all([carregarSugestoes(), atualizarContagens(), carregarQuadras()]);
    } catch (erro) {
      if (tratarSessao(erro)) return;
      aviso('Não foi possível salvar. Tente de novo. (' + erro.message + ')');
      botoes.forEach(function (b, i) { b.disabled = estavamDesabilitados[i]; });   // o item continua como estava
    }
  }

  // ===== Doações =====
  function htmlDoacao(d) {
    const opcoes = Regras.STATUS_DOACAO.map(function (s) {
      return '<option value="' + s.valor + '"' + (s.valor === d.status ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');
    return '<article class="admin-item" data-id="' + esc(d.id) + '" data-status="' + esc(d.status) + '">' +
      '<div class="admin-item__topo">' +
        '<div>' +
          '<span class="etiqueta etiqueta--doacao">' + d.quantidade + (d.quantidade === 1 ? ' peça' : ' peças') + '</span>' +
          '<h2 class="admin-item__titulo">' + esc((d.materiais || []).join(', ')) + '</h2>' +
        '</div>' +
        '<span class="admin-item__data">' + dataBr(d.criadoEm) + '</span>' +
      '</div>' +
      '<dl class="admin-dados">' +
        linha('Estado', esc(Regras.rotulo(Regras.ESTADOS_DOACAO, d.estado))) +
        linha('Quadra', esc(nomeQuadra(d.quadraId))) +
        linha('Entrega', esc(Regras.rotulo(Regras.ENTREGAS, d.entrega))) +
      '</dl>' +
      htmlContato(d.nome, d.whatsapp) +
      '<label class="admin-status">Status ' +
        '<select class="entrada" data-acao="status" data-anterior="' + esc(d.status) + '">' + opcoes + '</select>' +
      '</label>' +
    '</article>';
  }

  async function carregarDoacoes() {
    const alvo = $('a-lista-doacoes');
    alvo.innerHTML = '<p class="admin-vazio">Carregando…</p>';
    try {
      const lista = await Api.listarDoacoes();
      alvo.innerHTML = lista.length
        ? lista.map(htmlDoacao).join('')
        : '<p class="admin-vazio">Nenhuma doação recebida ainda.</p>';
    } catch (erro) {
      if (!tratarSessao(erro)) alvo.innerHTML = erroCarregar(erro);
    }
  }

  async function mudarStatus(select) {
    const item = select.closest('.admin-item');
    const anterior = select.dataset.anterior;
    aviso('');
    select.disabled = true;
    try {
      await Api.mudarStatusDoacao(item.dataset.id, select.value);
      select.dataset.anterior = select.value;
      item.dataset.status = select.value;
      atualizarContagens();
    } catch (erro) {
      if (tratarSessao(erro)) return;
      select.value = anterior;
      aviso('Não foi possível salvar. Tente de novo. (' + erro.message + ')');
    } finally {
      select.disabled = false;
    }
  }

  // ===== Contagens nas abas =====
  async function atualizarContagens() {
    try {
      const pendentes = await Api.listarSugestoes('pendente');
      const doacoes = await Api.listarDoacoes();
      const novas = doacoes.filter(function (d) { return d.status === 'nova'; }).length;
      $('a-num-pendentes').textContent = pendentes.length || '';
      $('a-num-novas').textContent = novas || '';
    } catch (erro) {
      tratarSessao(erro);
    }
  }

  async function carregarQuadras() {
    try {
      const quadras = await Api.listarQuadras();
      quadrasPorId = {};
      quadras.forEach(function (q) { quadrasPorId[q.id] = q; });
    } catch (erro) {
      quadrasPorId = {};
    }
  }

  // ===== Abas =====
  function escolherAba(nome) {
    ['sugestoes', 'doacoes'].forEach(function (aba) {
      const ativa = aba === nome;
      const botao = $('a-tab-' + aba);
      botao.setAttribute('aria-selected', ativa ? 'true' : 'false');
      botao.tabIndex = ativa ? 0 : -1;
      $('a-aba-' + aba).hidden = !ativa;
    });
    aviso('');
  }

  // ===== Sessão =====
  async function mostrarEstado() {
    const sessao = await Api.sessaoAtual();
    $('a-login').hidden = !!sessao;
    $('a-painel').hidden = !sessao;
    $('a-sair').hidden = !sessao;
    if (sessao) {
      $('a-usuario').textContent = sessao.email;
      await carregarQuadras();
      carregarSugestoes();
      carregarDoacoes();
      atualizarContagens();
    } else {
      $('a-email').focus();
    }
  }

  async function entrar(ev) {
    ev.preventDefault();
    const form = $('form-login');
    const erros = {};
    if (!$('a-email').value.trim()) erros.email = 'Informe o e-mail.';
    if (!$('a-senha').value) erros.senha = 'Informe a senha.';
    if (Form.mostrarErros(form, erros)) return;

    const erroEl = $('a-login-erro');
    erroEl.hidden = true;
    const botao = $('a-entrar');
    Form.enviando(botao, true);
    try {
      await Api.entrar($('a-email').value, $('a-senha').value);
      $('a-senha').value = '';
      await mostrarEstado();
    } catch (erro) {
      erroEl.textContent = erro.message;
      erroEl.hidden = false;
      $('a-senha').select();
    } finally {
      Form.enviando(botao, false);
    }
  }

  function iniciar() {
    if (Api.modo === 'demonstracao') {
      $('a-demo').hidden = false;
      $('a-dica-demo').hidden = false;
    }

    Form.renderChips($('a-filtro-status'), { nome: 'status', opcoes: FILTROS });
    Form.marcarChips($('a-filtro-status'), 'status', statusSugestoes);
    $('a-filtro-status').addEventListener('change', function () {
      statusSugestoes = Form.lerChips($('a-filtro-status'), 'status');
      carregarSugestoes();
    });

    $('form-login').addEventListener('submit', entrar);
    Form.limparAoEditar($('form-login'));
    $('a-sair').addEventListener('click', async function () {
      await Api.sair();
      mostrarEstado();
    });

    $('a-tab-sugestoes').addEventListener('click', function () { escolherAba('sugestoes'); });
    $('a-tab-doacoes').addEventListener('click', function () { escolherAba('doacoes'); });
    document.querySelector('.admin-abas').addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
      const proxima = $('a-tab-sugestoes').getAttribute('aria-selected') === 'true' ? 'doacoes' : 'sugestoes';
      escolherAba(proxima);
      $('a-tab-' + proxima).focus();
    });

    $('a-lista-sugestoes').addEventListener('click', function (ev) {
      const botao = ev.target.closest('[data-acao]');
      if (botao && !botao.disabled) decidirSugestao(botao);
    });
    $('a-lista-doacoes').addEventListener('change', function (ev) {
      if (ev.target.dataset.acao === 'status') mudarStatus(ev.target);
    });

    mostrarEstado();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})(window);
