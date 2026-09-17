/* Quadras de Palmas — peças comuns dos formulários (sugerir e doar).
   A validação em si mora em js/regras.js; aqui é só a parte de tela. */
(function (raiz) {
  'use strict';

  const esc = Regras.escaparHtml;
  const LIMITE_FOTO = 10 * 1024 * 1024;

  // ===== Chips: radio (escolhe um) ou checkbox (vários) =====
  function renderChips(container, cfg) {
    const tipo = cfg.multiplo ? 'checkbox' : 'radio';
    container.innerHTML = cfg.opcoes.map(function (o) {
      return '<label class="chip">' +
        (cfg.comCor ? '<span class="chip__dot" style="--c:' + Icones.corDoPiso(o.valor) + '"></span>' : '') +
        '<input type="' + tipo + '" name="' + cfg.nome + '" value="' + esc(o.valor) + '">' +
        '<span>' + esc(o.label) + '</span></label>';
    }).join('');
  }

  function lerChips(el, nome) {
    const inputs = el.querySelectorAll('input[name="' + nome + '"]');
    const marcados = [];
    inputs.forEach(function (i) { if (i.checked) marcados.push(i.value); });
    if (inputs.length && inputs[0].type === 'radio') return marcados[0] || '';
    return marcados;
  }

  function marcarChips(el, nome, valores) {
    const lista = [].concat(valores);
    el.querySelectorAll('input[name="' + nome + '"]').forEach(function (i) {
      i.checked = lista.indexOf(i.value) !== -1;
    });
  }

  // ===== Erros por campo ([data-campo="nome"] com um .campo__erro dentro) =====
  function limparCampo(campo) {
    campo.classList.remove('campo--erro');
    const p = campo.querySelector('.campo__erro');
    if (p) { p.textContent = ''; p.hidden = true; }
    campo.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
  }

  function limparErros(el) {
    el.querySelectorAll('[data-campo]').forEach(limparCampo);
  }

  function erroNoCampo(el, nome, mensagem) {
    const campo = el.querySelector('[data-campo="' + nome + '"]');
    if (!campo) return null;
    campo.classList.add('campo--erro');
    const p = campo.querySelector('.campo__erro');
    if (p) {
      if (!p.id) p.id = 'erro-' + Math.random().toString(36).slice(2, 8);
      p.innerHTML = Icones.i('info') + '<span>' + esc(mensagem) + '</span>';
      p.hidden = false;
    }
    campo.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(function (i) {
      i.setAttribute('aria-invalid', 'true');
      if (p) i.setAttribute('aria-describedby', p.id);
    });
    return campo;
  }

  // Mostra os erros e leva o foco ao primeiro (na ordem da tela). Devolve true se havia erro.
  function mostrarErros(el, erros) {
    limparErros(el);
    Object.keys(erros).forEach(function (nome) { erroNoCampo(el, nome, erros[nome]); });
    const primeiro = el.querySelector('.campo--erro');
    if (!primeiro) return false;
    primeiro.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const alvo = primeiro.querySelector('input:not([type="hidden"]), select, textarea, button');
    if (alvo) alvo.focus({ preventScroll: true });
    return true;
  }

  // Some o erro do campo assim que a pessoa mexe nele
  function limparAoEditar(form) {
    ['input', 'change'].forEach(function (evento) {
      form.addEventListener(evento, function (ev) {
        const campo = ev.target.closest('.campo--erro');
        if (campo) limparCampo(campo);
      });
    });
  }

  // ===== Estados de envio =====
  function enviando(botao, sim) {
    if (sim) {
      botao.dataset.textoOriginal = botao.textContent;
      botao.textContent = 'Enviando…';
    } else if (botao.dataset.textoOriginal) {
      botao.textContent = botao.dataset.textoOriginal;
    }
    botao.disabled = sim;
    botao.setAttribute('aria-busy', sim ? 'true' : 'false');
  }

  // fluxo = elemento com um <form class="form"> e um .form-sucesso
  function mostrarSucesso(fluxo, cfg) {
    const form = fluxo.querySelector('.form');
    const caixa = fluxo.querySelector('.form-sucesso');
    caixa.innerHTML =
      '<span class="form-sucesso__icone">' + Icones.i('check') + '</span>' +
      '<h3 class="form-sucesso__titulo">' + esc(cfg.titulo) + '</h3>' +
      '<p class="form-sucesso__texto">' + esc(cfg.texto) + '</p>' +
      '<button type="button" class="btn-sec">' + esc(cfg.textoBotao || 'Enviar outra') + '</button>';
    caixa.querySelector('button').addEventListener('click', cfg.aoEnviarOutra);
    form.hidden = true;
    caixa.hidden = false;
    caixa.scrollIntoView({ block: 'nearest' });
    caixa.querySelector('.form-sucesso__titulo').setAttribute('tabindex', '-1');
    caixa.querySelector('.form-sucesso__titulo').focus({ preventScroll: true });
  }

  function voltarAoFormulario(fluxo) {
    fluxo.querySelector('.form-sucesso').hidden = true;
    fluxo.querySelector('.form').hidden = false;
  }

  function estaEmSucesso(fluxo) {
    return !fluxo.querySelector('.form-sucesso').hidden;
  }

  // slot = onde a caixa de falha aparece
  function mostrarFalha(slot, cfg) {
    const link = cfg.textoWhatsapp ? linkWhatsapp(cfg.textoWhatsapp) : null;
    slot.innerHTML =
      '<div class="form-falha" role="alert">' +
        '<p class="form-falha__titulo">' + Icones.i('info') + 'Não conseguimos enviar agora.</p>' +
        (cfg.detalhe ? '<p class="form-falha__detalhe">' + esc(cfg.detalhe) + '</p>' : '') +
        '<p class="form-falha__detalhe">O que você preencheu continua aqui.</p>' +
        '<div class="form-falha__acoes">' +
          '<button type="button" class="btn-sec" data-tentar>Tentar de novo</button>' +
          (link ? '<a class="btn-whats" href="' + esc(link) + '" target="_blank" rel="noopener">' +
            Icones.i('whatsapp') + 'Enviar pelo WhatsApp</a>' : '') +
        '</div>' +
      '</div>';
    slot.querySelector('[data-tentar]').addEventListener('click', cfg.aoTentar);
    slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function esconderFalha(slot) { slot.innerHTML = ''; }

  // ===== Foto: reduz no navegador antes de enviar =====
  function reduzirFoto(arquivo, maxLado, qualidade) {
    maxLado = maxLado || 1600;
    qualidade = qualidade || 0.82;
    return new Promise(function (ok, erro) {
      if (!arquivo) { ok(null); return; }
      const ehImagem = /^image\//.test(arquivo.type) || /\.(heic|heif)$/i.test(arquivo.name || '');
      if (!ehImagem) { erro(new Error('Escolha um arquivo de imagem (JPG, PNG ou WEBP).')); return; }
      if (arquivo.size > LIMITE_FOTO) { erro(new Error('A foto passa de 10 MB. Escolha uma menor.')); return; }
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = function () {
        const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * escala);
        canvas.height = Math.round(img.naturalHeight * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        ok(canvas.toDataURL('image/jpeg', qualidade));
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        erro(new Error('Não conseguimos ler essa imagem. Tente uma foto em JPG ou PNG.'));
      };
      img.src = url;
    });
  }

  // ===== WhatsApp =====
  function ligarMascaraWhatsapp(input) {
    input.setAttribute('inputmode', 'tel');
    input.setAttribute('autocomplete', 'tel-national');
    input.addEventListener('input', function () {
      input.value = Regras.formatarWhatsapp(input.value);
    });
  }

  function linkWhatsapp(texto) {
    // CONFIG é "const" em js/config.js: não fica em window, então testa pelo nome
    const numero = Regras.apenasDigitos(typeof CONFIG !== 'undefined' ? CONFIG.whatsappProjeto : '');
    if (!numero) return null;
    return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);
  }

  // ===== Anti-spam: campo escondido que só robô preenche =====
  function ehRobo(form) {
    const campo = form.querySelector('.hp input');
    return !!(campo && campo.value);
  }

  raiz.Form = {
    renderChips: renderChips,
    lerChips: lerChips,
    marcarChips: marcarChips,
    limparErros: limparErros,
    erroNoCampo: erroNoCampo,
    mostrarErros: mostrarErros,
    limparAoEditar: limparAoEditar,
    enviando: enviando,
    mostrarSucesso: mostrarSucesso,
    voltarAoFormulario: voltarAoFormulario,
    estaEmSucesso: estaEmSucesso,
    mostrarFalha: mostrarFalha,
    esconderFalha: esconderFalha,
    reduzirFoto: reduzirFoto,
    ligarMascaraWhatsapp: ligarMascaraWhatsapp,
    linkWhatsapp: linkWhatsapp,
    ehRobo: ehRobo
  };
})(window);
