/* Quadras de Palmas — painel "Sugerir quadra" (nova ou correção). */
(function (raiz) {
  'use strict';

  let el, form, fluxo, rodape, btnEnviar, slotFalha;
  let localizacaoGps = null;
  let fotoDataUrl = null;
  let quadras = [];
  let enviandoAgora = false;

  const TIPOS = [
    { valor: 'nova', label: 'Sugerir quadra nova' },
    { valor: 'correcao', label: 'Corrigir uma quadra' }
  ];
  const SIM_NAO = [
    { valor: 'sim', label: 'Sim' },
    { valor: 'nao', label: 'Não' }
  ];

  function $(seletor) { return el.querySelector(seletor); }
  function tipoAtual() { return Form.lerChips(form, 'tipo'); }
  function formatarCoord(c) { return c.lat.toFixed(5) + ', ' + c.lng.toFixed(5); }

  // ===== Mostrar/esconder partes conforme o tipo =====
  function mostrarTipo() {
    const tipo = tipoAtual();
    el.querySelectorAll('.grupo-tipo').forEach(function (g) {
      g.hidden = !tipo || (g.dataset.tipo !== tipo && g.dataset.tipo !== 'ambos');
    });
    $('#sugerir-titulo').textContent = tipo === 'correcao' ? 'Corrigir uma quadra' : 'Sugerir quadra';
    if (!enviandoAgora) btnEnviar.textContent = tipo === 'correcao' ? 'Enviar correção' : 'Enviar sugestão';
    atualizarConsentimento();
  }

  function atualizarConsentimento() {
    const temContato = $('#s-contato-nome').value.trim() || $('#s-contato-zap').value.trim();
    $('[data-campo="consentimento"]').hidden = !temContato;
  }

  // ===== Localização: GPS ou coordenada colada =====
  function atualizarLocalStatus() {
    const status = $('#s-local-status');
    const colada = Regras.extrairCoordenada($('#s-referencia').value);
    if (localizacaoGps) {
      status.className = 'local-status local-status--ok';
      status.innerHTML = Icones.i('pin') + '<span>Localização capturada: ' + formatarCoord(localizacaoGps) + '</span>' +
        '<button type="button" class="local-status__limpar" data-limpar-gps>Desfazer</button>';
      status.querySelector('[data-limpar-gps]').addEventListener('click', function () {
        localizacaoGps = null;
        atualizarLocalStatus();
        $('#s-gps').focus();
      });
      status.hidden = false;
    } else if (colada) {
      status.className = 'local-status local-status--ok';
      status.innerHTML = Icones.i('pin') + '<span>Coordenada reconhecida: ' + formatarCoord(colada) + '</span>';
      status.hidden = false;
    } else {
      status.hidden = true;
      status.innerHTML = '';
    }
  }

  function falhaGps() {
    const status = $('#s-local-status');
    status.className = 'local-status local-status--erro';
    status.innerHTML = Icones.i('info') + '<span>Não conseguimos pegar sua localização — cole o link do Google Maps.</span>';
    status.hidden = false;
    $('#s-referencia').focus();
  }

  function usarGps() {
    const btn = $('#s-gps');
    const texto = btn.querySelector('span');
    if (!('geolocation' in navigator)) { falhaGps(); return; }
    btn.disabled = true;
    texto.textContent = 'Pegando sua localização…';
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.disabled = false;
      texto.textContent = 'Estou na quadra — usar minha localização';
      localizacaoGps = { lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) };
      const campo = $('[data-campo="localizacao"]');
      campo.classList.remove('campo--erro');
      campo.querySelector('.campo__erro').hidden = true;
      atualizarLocalStatus();
    }, function () {
      btn.disabled = false;
      texto.textContent = 'Estou na quadra — usar minha localização';
      falhaGps();
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  // ===== Foto =====
  function escolherFoto(ev) {
    const arquivo = ev.target.files[0];
    if (!arquivo) return;
    const rotulo = $('.foto-escolher span');
    rotulo.textContent = 'Preparando foto…';
    Form.reduzirFoto(arquivo).then(function (dataUrl) {
      fotoDataUrl = dataUrl;
      const previa = $('#s-foto-previa');
      previa.querySelector('img').src = dataUrl;
      previa.hidden = false;
      rotulo.textContent = 'Trocar foto';
    }).catch(function (erro) {
      fotoDataUrl = null;
      rotulo.textContent = 'Escolher ou tirar foto';
      Form.erroNoCampo(form, 'foto', erro.message);
    }).finally(function () {
      ev.target.value = '';
    });
  }

  function removerFoto(focar) {
    fotoDataUrl = null;
    const previa = $('#s-foto-previa');
    previa.hidden = true;
    previa.querySelector('img').removeAttribute('src');
    $('.foto-escolher span').textContent = 'Escolher ou tirar foto';
    if (focar) $('#s-foto').focus();
  }

  // ===== Envio =====
  function lerFormulario() {
    return {
      tipo: tipoAtual(),
      nome: $('#s-nome').value,
      localizacao: localizacaoGps || Regras.extrairCoordenada($('#s-referencia').value),
      referencia: $('#s-referencia').value,
      piso: Form.lerChips(form, 'piso'),
      modalidades: Form.lerChips(form, 'modalidades'),
      equipamentos: Form.lerChips(form, 'equipamentos'),
      estrutura: Form.lerChips(form, 'estrutura'),
      coberta: Form.lerChips(form, 'coberta'),
      conservacao: Form.lerChips(form, 'conservacao'),
      foto: fotoDataUrl,
      quadraId: $('#s-quadra').value,
      descricao: $('#s-descricao').value,
      contatoNome: $('#s-contato-nome').value,
      contatoWhatsapp: $('#s-contato-zap').value,
      consentimento: $('#s-consentimento').checked
    };
  }

  function mostrarSucesso(tipo) {
    rodape.hidden = true;
    Form.mostrarSucesso(fluxo, {
      titulo: tipo === 'correcao' ? 'Recebemos sua correção!' : 'Recebemos sua sugestão!',
      texto: tipo === 'correcao'
        ? 'Obrigado pelo aviso. Vamos conferir e atualizar o mapa.'
        : 'Vamos revisar e, se estiver tudo certo, ela aparece no mapa.',
      aoEnviarOutra: function () {
        limpar();
        Form.marcarChips(form, 'tipo', tipo);   // continua no mesmo modo (nova/correção)
        mostrarTipo();
        Form.voltarAoFormulario(fluxo);
        rodape.hidden = false;
        const primeiro = form.querySelector(tipo === 'correcao' ? '#s-quadra' : '#s-nome');
        if (primeiro) primeiro.focus();
      }
    });
  }

  function enviar(ev) {
    ev.preventDefault();
    if (enviandoAgora) return;
    Form.esconderFalha(slotFalha);

    const dados = lerFormulario();
    if (Form.ehRobo(form)) { mostrarSucesso(dados.tipo); return; }   // finge que deu certo

    if (Form.mostrarErros(form, Regras.validarSugestao(dados))) return;

    const registro = Regras.montarSugestao(dados);
    enviandoAgora = true;
    Form.enviando(btnEnviar, true);
    Api.enviarSugestao(registro).then(function () {
      mostrarSucesso(registro.tipo);
    }).catch(function (erro) {
      const q = quadras.find(function (x) { return x.id === registro.quadraId; });
      Form.mostrarFalha(slotFalha, {
        detalhe: erro.message,
        aoTentar: function () { form.requestSubmit(); },
        textoWhatsapp: Regras.mensagemWhatsapp('sugestao', registro, q && q.nome)
      });
    }).finally(function () {
      enviandoAgora = false;
      Form.enviando(btnEnviar, false);
    });
  }

  function limpar() {
    form.reset();
    localizacaoGps = null;
    removerFoto();
    atualizarLocalStatus();
    Form.limparErros(form);
    Form.esconderFalha(slotFalha);
    mostrarTipo();
  }

  // ===== Público =====
  function abrir(opcoes) {
    opcoes = opcoes || {};
    if (Form.estaEmSucesso(fluxo)) {
      limpar();
      Form.voltarAoFormulario(fluxo);
      rodape.hidden = false;
    }
    if (opcoes.tipo) Form.marcarChips(form, 'tipo', opcoes.tipo);
    if (opcoes.quadraId) $('#s-quadra').value = opcoes.quadraId;
    mostrarTipo();
    $('.painel__corpo').scrollTop = 0;
    Nav.abrirPainel('sugerir');
  }

  function definirQuadras(lista) {
    quadras = lista;
    const select = $('#s-quadra');
    const atual = select.value;
    select.innerHTML = '<option value="">Escolha a quadra</option>' + lista.map(function (q) {
      return '<option value="' + Regras.escaparHtml(q.id) + '">' + Regras.escaparHtml(q.nome) + '</option>';
    }).join('');
    select.value = atual;
  }

  function iniciar() {
    el = document.getElementById('sugerir');
    form = document.getElementById('form-sugerir');
    fluxo = document.getElementById('sugerir-fluxo');
    rodape = document.getElementById('sugerir-rodape');
    btnEnviar = document.getElementById('s-enviar');
    slotFalha = document.getElementById('s-falha');

    const chips = function (nome) { return form.querySelector('[data-chips="' + nome + '"]'); };
    Form.renderChips(chips('tipo'), { nome: 'tipo', opcoes: TIPOS });
    Form.renderChips(chips('piso'), { nome: 'piso', opcoes: Regras.PISOS, comCor: true });
    Form.renderChips(chips('modalidades'), { nome: 'modalidades', opcoes: Regras.MODALIDADES, multiplo: true });
    Form.renderChips(chips('equipamentos'), { nome: 'equipamentos', opcoes: Regras.EQUIPAMENTOS, multiplo: true });
    Form.renderChips(chips('estrutura'), { nome: 'estrutura', opcoes: Regras.ESTRUTURAS, multiplo: true });
    Form.renderChips(chips('coberta'), { nome: 'coberta', opcoes: SIM_NAO });
    Form.renderChips(chips('conservacao'), { nome: 'conservacao', opcoes: Regras.CONSERVACOES });

    Form.limparAoEditar(form);
    Form.ligarMascaraWhatsapp($('#s-contato-zap'));

    form.addEventListener('change', function (ev) {
      if (ev.target.name === 'tipo') mostrarTipo();
    });
    form.addEventListener('submit', enviar);
    $('#s-referencia').addEventListener('input', atualizarLocalStatus);
    $('#s-contato-nome').addEventListener('input', atualizarConsentimento);
    $('#s-contato-zap').addEventListener('input', atualizarConsentimento);
    $('#s-gps').addEventListener('click', usarGps);
    $('#s-foto').addEventListener('change', escolherFoto);
    $('#s-foto-remover').addEventListener('click', function () { removerFoto(true); });
    el.querySelector('[data-fechar]').addEventListener('click', Nav.pedirFechar);

    Nav.registrarPainel('sugerir', { el: el });
    App.aoCarregar(definirQuadras);
  }

  raiz.Sugerir = { abrir: abrir, definirQuadras: definirQuadras };
  document.addEventListener('DOMContentLoaded', iniciar);
})(window);
