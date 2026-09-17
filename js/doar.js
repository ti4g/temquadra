/* Quadras de Palmas — tela "Doar materiais". */
(function (raiz) {
  'use strict';

  const esc = Regras.escaparHtml;
  let tela, form, fluxo, btnEnviar, slotFalha;
  let quadras = [];
  let enviandoAgora = false;

  function $(seletor) { return tela.querySelector(seletor); }

  function valorOuPendente(v) {
    return /^a definir/i.test(v || '') || !v
      ? '<span class="ponto__pendente">' + esc(v || 'A definir') + '</span>'
      : esc(v);
  }

  // ===== Estrutura da tela =====
  function htmlTela() {
    const p = CONFIG.pontoColeta;
    return '' +
      '<div class="doar">' +
        '<div class="doar__topo">' +
          '<button type="button" class="btn-voltar" id="d-voltar">' + Icones.i('voltar') + 'Voltar para o mapa</button>' +
        '</div>' +

        '<header class="doar__hero">' +
          Icones.LINHAS_QUADRA.replace('detalhe__linhas', 'doar__linhas') +
          '<p class="doar__eyebrow">Doação de materiais esportivos</p>' +
          '<h2 class="doar__titulo">Doe materiais esportivos</h2>' +
          '<p class="doar__texto">Bola murcha, rede rasgada, peteca que sumiu… Aquele material parado na sua casa pode virar jogo nas quadras públicas de Palmas.</p>' +
          '<p class="doar__contador" id="d-contador" hidden></p>' +
        '</header>' +

        '<div class="doar__grade">' +
          '<div class="doar__info">' +
            '<section class="doar__bloco" aria-labelledby="d-como">' +
              '<h3 class="doar__subtitulo" id="d-como">Como funciona</h3>' +
              '<ol class="passos">' +
                '<li class="passo"><span class="passo__num" aria-hidden="true">1</span><div><strong>Diga o que você quer doar</strong><p>Preencha o formulário: material, estado e seu WhatsApp.</p></div></li>' +
                '<li class="passo"><span class="passo__num" aria-hidden="true">2</span><div><strong>A gente te chama no WhatsApp</strong><p>Pra combinar os detalhes com você.</p></div></li>' +
                '<li class="passo"><span class="passo__num" aria-hidden="true">3</span><div><strong>Entregue no ponto de coleta ou combine com a gente</strong><p>Seu material vai pra quadra que mais precisa.</p></div></li>' +
              '</ol>' +
            '</section>' +

            '<section class="doar__bloco" aria-labelledby="d-ponto">' +
              '<h3 class="doar__subtitulo" id="d-ponto">Ponto de coleta</h3>' +
              '<div class="ponto">' +
                '<p class="ponto__linha ponto__nome">' + Icones.i('caixa') + '<span>' + valorOuPendente(p.nome) + '</span></p>' +
                '<p class="ponto__linha">' + Icones.i('pin') + '<span>' + valorOuPendente(p.endereco) + '</span></p>' +
                '<p class="ponto__linha">' + Icones.i('relogio') + '<span>' + valorOuPendente(p.horario) + '</span></p>' +
                (p.maps
                  ? '<a class="btn-sec ponto__maps" href="' + esc(p.maps) + '" target="_blank" rel="noopener">' + Icones.i('direcao') + 'Como chegar</a>'
                  : '') +
              '</div>' +
            '</section>' +

            '<section class="doar__bloco" aria-labelledby="d-precisam-titulo">' +
              '<h3 class="doar__subtitulo" id="d-precisam-titulo">Quadras que precisam</h3>' +
              '<div class="precisam" id="d-precisam"><p class="precisam__vazio">Carregando quadras…</p></div>' +
            '</section>' +
          '</div>' +

          '<section class="doar__form" aria-labelledby="d-form-titulo">' +
            '<div class="fluxo" id="doar-fluxo">' +
              '<form class="form" id="form-doar" novalidate>' +
                '<h3 class="doar__subtitulo" id="d-form-titulo">Quero doar</h3>' +

                '<fieldset class="campo" data-campo="materiais">' +
                  '<legend class="campo__rotulo">O que você vai doar? <span class="obrig" aria-hidden="true">*</span></legend>' +
                  '<div class="chips" data-chips="materiais"></div>' +
                  '<p class="campo__erro" hidden></p>' +
                '</fieldset>' +

                '<div class="campo" data-campo="outro" hidden>' +
                  '<label class="campo__rotulo" for="d-outro">Qual outro material? <span class="obrig" aria-hidden="true">*</span></label>' +
                  '<input class="entrada" id="d-outro" type="text" maxlength="80" autocomplete="off" placeholder="Ex.: bomba de encher bola">' +
                  '<p class="campo__erro" hidden></p>' +
                '</div>' +

                '<div class="campo" data-campo="quantidade">' +
                  '<label class="campo__rotulo" for="d-quantidade">Quantidade total de peças <span class="obrig" aria-hidden="true">*</span></label>' +
                  '<input class="entrada entrada--curta" id="d-quantidade" type="number" inputmode="numeric" min="1" max="99" step="1" value="1">' +
                  '<p class="campo__erro" hidden></p>' +
                '</div>' +

                '<fieldset class="campo" data-campo="estado">' +
                  '<legend class="campo__rotulo">Estado <span class="obrig" aria-hidden="true">*</span></legend>' +
                  '<div class="chips" data-chips="estado"></div>' +
                  '<p class="campo__erro" hidden></p>' +
                '</fieldset>' +

                '<div class="campo" data-campo="quadraId">' +
                  '<label class="campo__rotulo" for="d-quadra">Pra qual quadra? <span class="obrig" aria-hidden="true">*</span></label>' +
                  '<select class="entrada" id="d-quadra"><option value="">Onde precisar mais</option></select>' +
                  '<p class="campo__erro" hidden></p>' +
                '</div>' +

                '<fieldset class="campo" data-campo="entrega">' +
                  '<legend class="campo__rotulo">Como prefere entregar? <span class="obrig" aria-hidden="true">*</span></legend>' +
                  '<div class="chips" data-chips="entrega"></div>' +
                  '<p class="campo__erro" hidden></p>' +
                '</fieldset>' +

                '<div class="linha-2">' +
                  '<div class="campo" data-campo="nome">' +
                    '<label class="campo__rotulo" for="d-nome">Seu nome <span class="obrig" aria-hidden="true">*</span></label>' +
                    '<input class="entrada" id="d-nome" type="text" maxlength="80" autocomplete="given-name">' +
                    '<p class="campo__erro" hidden></p>' +
                  '</div>' +
                  '<div class="campo" data-campo="whatsapp">' +
                    '<label class="campo__rotulo" for="d-zap">WhatsApp <span class="obrig" aria-hidden="true">*</span></label>' +
                    '<input class="entrada" id="d-zap" type="text" placeholder="(63) 99999-9999">' +
                    '<p class="campo__erro" hidden></p>' +
                  '</div>' +
                '</div>' +

                '<div class="campo campo--check" data-campo="consentimento">' +
                  '<label class="check"><input type="checkbox" id="d-consentimento">' +
                    '<span>Autorizo o uso do meu contato apenas para falar sobre esta doação.</span></label>' +
                  '<p class="campo__erro" hidden></p>' +
                '</div>' +

                '<div class="hp" aria-hidden="true"><label>Não preencha este campo <input type="text" name="site" tabindex="-1" autocomplete="off"></label></div>' +
                '<div class="form-falha-slot" id="d-falha"></div>' +
                '<button type="submit" class="btn-primario" id="d-enviar">' + Icones.i('doar') + 'Enviar doação</button>' +
              '</form>' +
              '<div class="form-sucesso" hidden></div>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  // ===== Quadras que precisam =====
  function renderPrecisam() {
    const alvo = $('#d-precisam');
    const lista = quadras.filter(function (q) { return q.precisa.length; });
    if (!lista.length) {
      alvo.innerHTML = '<p class="precisam__vazio">Nenhum pedido no momento — sua doação vai pra onde precisar mais.</p>';
      return;
    }
    alvo.innerHTML = lista.map(function (q) {
      const foto = q.fotos.length ? q.fotos[0] : 'imgs/placeholder.svg';
      return '<article class="precisa-card">' +
        '<img class="precisa-card__foto" src="' + esc(foto) + '" alt="" loading="lazy">' +
        '<div class="precisa-card__corpo">' +
          '<h4 class="precisa-card__nome">' + esc(q.nome) + '</h4>' +
          '<ul class="precisa__itens">' + q.precisa.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn-sec btn-sec--p" data-doar-para="' + esc(q.id) + '">' + Icones.i('doar') + 'Doar pra esta</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderSelectQuadras() {
    const select = $('#d-quadra');
    const atual = select.value;
    select.innerHTML = '<option value="">Onde precisar mais</option>' + quadras.map(function (q) {
      return '<option value="' + esc(q.id) + '">' + esc(q.nome) + '</option>';
    }).join('');
    select.value = atual;
  }

  // Escolhe a quadra e, se nada foi marcado ainda, já marca o que ela precisa
  function escolherQuadra(id) {
    if (Form.estaEmSucesso(fluxo)) limpar();
    $('#d-quadra').value = id;
    const q = quadras.find(function (x) { return x.id === id; });
    if (q && !Form.lerChips(form, 'materiais').length) {
      const valores = Regras.MATERIAIS
        .filter(function (m) { return q.precisa.indexOf(m.label) !== -1; })
        .map(function (m) { return m.valor; });
      Form.marcarChips(form, 'materiais', valores);
    }
    const alvo = $('.doar__form');
    alvo.scrollIntoView({ block: 'start', behavior: 'smooth' });
    const primeiro = form.querySelector('input[name="materiais"]');
    if (primeiro) primeiro.focus({ preventScroll: true });
  }

  // ===== Contador =====
  function atualizarContador() {
    const el = $('#d-contador');
    Api.contarDoacoesEntregues().then(function (n) {
      if (!n) { el.hidden = true; return; }
      el.innerHTML = Icones.i('check') + n + (n === 1 ? ' material já entregue' : ' materiais já entregues');
      el.hidden = false;
    }).catch(function () { el.hidden = true; });
  }

  // ===== Envio =====
  function lerFormulario() {
    return {
      materiais: Form.lerChips(form, 'materiais'),
      outro: $('#d-outro').value,
      quantidade: $('#d-quantidade').value,
      estado: Form.lerChips(form, 'estado'),
      quadraId: $('#d-quadra').value,
      entrega: Form.lerChips(form, 'entrega'),
      nome: $('#d-nome').value,
      whatsapp: $('#d-zap').value,
      consentimento: $('#d-consentimento').checked
    };
  }

  function mostrarOutro() {
    const temOutro = Form.lerChips(form, 'materiais').indexOf('outro') !== -1;
    $('[data-campo="outro"]').hidden = !temOutro;
  }

  function mostrarSucesso() {
    Form.mostrarSucesso(fluxo, {
      titulo: 'Obrigado!',
      texto: 'Vamos te chamar no WhatsApp pra combinar a entrega.',
      textoBotao: 'Doar mais alguma coisa',
      aoEnviarOutra: function () {
        limpar();
        form.querySelector('input[name="materiais"]').focus();
      }
    });
  }

  function enviar(ev) {
    ev.preventDefault();
    if (enviandoAgora) return;
    Form.esconderFalha(slotFalha);
    if (Form.ehRobo(form)) { mostrarSucesso(); return; }

    const dados = lerFormulario();
    if (Form.mostrarErros(form, Regras.validarDoacao(dados))) return;

    const registro = Regras.montarDoacao(dados);
    enviandoAgora = true;
    Form.enviando(btnEnviar, true);
    Api.enviarDoacao(registro).then(mostrarSucesso).catch(function (erro) {
      const q = quadras.find(function (x) { return x.id === registro.quadraId; });
      Form.mostrarFalha(slotFalha, {
        detalhe: erro.message,
        aoTentar: function () { form.requestSubmit(); },
        textoWhatsapp: Regras.mensagemWhatsapp('doacao', registro, q && q.nome)
      });
    }).finally(function () {
      enviandoAgora = false;
      Form.enviando(btnEnviar, false);
    });
  }

  function limpar() {
    form.reset();
    Form.limparErros(form);
    Form.esconderFalha(slotFalha);
    mostrarOutro();
    Form.voltarAoFormulario(fluxo);
  }

  // ===== Público =====
  function definirQuadras(lista) {
    quadras = lista;
    renderPrecisam();
    renderSelectQuadras();
  }

  function abrirComQuadra(id) {
    Nav.irParaDoar();          // a tela já fica visível aqui, dá pra rolar na hora
    escolherQuadra(id);
  }

  function aoMostrar() {
    atualizarContador();
  }

  function iniciar() {
    tela = document.getElementById('tela-doar');
    tela.innerHTML = htmlTela();
    form = document.getElementById('form-doar');
    fluxo = document.getElementById('doar-fluxo');
    btnEnviar = document.getElementById('d-enviar');
    slotFalha = document.getElementById('d-falha');

    const chips = function (nome) { return form.querySelector('[data-chips="' + nome + '"]'); };
    Form.renderChips(chips('materiais'), { nome: 'materiais', opcoes: Regras.MATERIAIS, multiplo: true });
    Form.renderChips(chips('estado'), { nome: 'estado', opcoes: Regras.ESTADOS_DOACAO });
    Form.renderChips(chips('entrega'), { nome: 'entrega', opcoes: Regras.ENTREGAS });
    Form.limparAoEditar(form);
    Form.ligarMascaraWhatsapp($('#d-zap'));

    form.addEventListener('change', function (ev) {
      if (ev.target.name === 'materiais') mostrarOutro();
    });
    form.addEventListener('submit', enviar);
    $('#d-voltar').addEventListener('click', Nav.voltarParaMapa);
    $('#d-precisam').addEventListener('click', function (ev) {
      const botao = ev.target.closest('[data-doar-para]');
      if (botao) escolherQuadra(botao.dataset.doarPara);
    });

    App.aoCarregar(definirQuadras);
  }

  raiz.Doar = { definirQuadras: definirQuadras, abrirComQuadra: abrirComQuadra, aoMostrar: aoMostrar };
  document.addEventListener('DOMContentLoaded', iniciar);
})(window);
