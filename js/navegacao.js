/* Quadras de Palmas — telas (mapa | doar), painéis laterais (detalhe | sugerir)
   e o botão "voltar" do navegador/celular.

   Estado no histórico: { tela: 'mapa'|'doar', painel: null|'detalhe'|'sugerir' }
   - Abrir painel empilha um estado; trocar de painel substitui (não empilha de novo).
   - Voltar (navegador, celular, ×, Esc) fecha o painel.
   - Quem abre /#doar direto não tem nada empilhado: "Voltar para o mapa" troca a tela
     sem sair do site. */
(function (raiz) {
  'use strict';

  const paineis = {};          // nome -> { el, aoFechar }
  let painelAberto = null;
  let telaVisivel = null;
  let focoAntesDoPainel = null;
  let voltarAoMapaDepois = false;

  function estado() { return history.state || {}; }
  function telaDoEndereco() { return location.hash === '#doar' ? 'doar' : 'mapa'; }

  function aplicarTela(tela) {
    document.getElementById('tela-mapa').hidden = tela !== 'mapa';
    document.getElementById('tela-doar').hidden = tela !== 'doar';
    document.body.dataset.tela = tela;
    const mudou = tela !== telaVisivel;
    telaVisivel = tela;
    if (mudou && typeof Nav.aoMostrarTela === 'function') Nav.aoMostrarTela(tela);
  }

  function marcarAberto(p, aberto) {
    p.el.classList.toggle('aberto', aberto);
    p.el.inert = !aberto;
    p.el.setAttribute('aria-hidden', aberto ? 'false' : 'true');
  }

  function fecharVisual(restaurarFoco) {
    if (!painelAberto) return;
    const p = paineis[painelAberto];
    marcarAberto(p, false);
    painelAberto = null;
    if (p.aoFechar) p.aoFechar();
    if (restaurarFoco !== false) {
      if (focoAntesDoPainel && document.contains(focoAntesDoPainel)) {
        focoAntesDoPainel.focus({ preventScroll: true });
      }
      focoAntesDoPainel = null;
    }
  }

  function focarDentro(el) {
    const alvo = el.querySelector('[data-foco-inicial]') ||
      el.querySelector('button, [href], input, select, textarea');
    if (alvo) alvo.focus({ preventScroll: true });
  }

  const Nav = {
    aoMostrarTela: null,

    telaAtual: function () { return telaVisivel; },
    painelAtual: function () { return painelAberto; },

    registrarPainel: function (nome, cfg) {
      paineis[nome] = cfg;
      marcarAberto(cfg, false);
    },

    abrirPainel: function (nome) {
      const p = paineis[nome];
      if (!p) return;
      if (!painelAberto) focoAntesDoPainel = document.activeElement;
      if (painelAberto && painelAberto !== nome) fecharVisual(false);
      if (painelAberto !== nome) {
        marcarAberto(p, true);
        painelAberto = nome;
      }
      focarDentro(p.el);
      const novo = { tela: telaVisivel, painel: nome };
      if (estado().painel) history.replaceState(novo, '');
      else history.pushState(novo, '');
    },

    pedirFechar: function () {
      if (!painelAberto) return;
      if (estado().painel) history.back();   // o popstate fecha
      else fecharVisual();
    },

    irParaDoar: function () {
      if (painelAberto) {
        fecharVisual();
        history.replaceState({ tela: 'doar', painel: null }, '', '#doar');
      } else if (telaVisivel !== 'doar') {
        history.pushState({ tela: 'doar', painel: null }, '', '#doar');
      }
      aplicarTela('doar');
      document.getElementById('tela-doar').scrollTop = 0;
    },

    voltarParaMapa: function () {
      const e = estado();
      if (e.painel) {                 // primeiro fecha o painel, depois volta
        voltarAoMapaDepois = true;
        history.back();
        return;
      }
      if (e.tela === 'doar') {        // a tela Doar foi empilhada: é só voltar
        history.back();
        return;
      }
      history.replaceState({ tela: 'mapa', painel: null }, '', location.pathname + location.search);
      aplicarTela('mapa');
    },

    iniciar: function () {
      // Recarregou com painel aberto no histórico: o painel não existe mais na tela
      if (estado().painel) history.replaceState({ tela: estado().tela, painel: null }, '');
      aplicarTela(estado().tela || telaDoEndereco());

      raiz.addEventListener('popstate', function () {
        const e = estado();
        if (!e.painel && painelAberto) fecharVisual();
        aplicarTela(e.tela || telaDoEndereco());
        if (voltarAoMapaDepois) {
          voltarAoMapaDepois = false;
          Nav.voltarParaMapa();
        }
      });

      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') Nav.pedirFechar();
      });
    }
  };

  raiz.Nav = Nav;
})(window);
