/* Quadras de Palmas — mapa, lista, filtros e detalhe da quadra.
   Dados sempre via Api (js/api.js); regras via Regras (js/regras.js). */
(function (raiz) {
  'use strict';

  const esc = Regras.escaparHtml;

  // ===== Estado =====
  let map;
  let camadaMarcadores;
  const marcadores = {};        // id da quadra -> marcador
  let quadras = [];
  let carregou = false;
  const ouvintesCarregar = [];

  const CENTRO_PALMAS = [-10.2085, -48.3470];
  const ZOOM_INICIAL = 14;

  const GRUPOS_FILTRO = [
    { grupo: 'piso', titulo: 'Piso', catalogo: Regras.PISOS, comCor: true },
    { grupo: 'modalidade', titulo: 'Modalidade', catalogo: Regras.MODALIDADES },
    { grupo: 'equipamento', titulo: 'Equipamentos', catalogo: Regras.EQUIPAMENTOS },
    { grupo: 'estrutura', titulo: 'Estrutura', catalogo: Regras.ESTRUTURAS },
    { grupo: 'cobertura', titulo: 'Cobertura', catalogo: Regras.COBERTURAS }
  ];

  function acharQuadra(id) { return quadras.find(function (q) { return q.id === id; }); }
  function temFoto(q) { return q.fotos.length > 0; }
  function fotoDe(q) { return temFoto(q) ? q.fotos[0] : 'imgs/placeholder.svg'; }

  // Link do Google Maps: usa o cadastrado; senão, rota pelas coordenadas
  function linkMaps(q) {
    if (q.maps) return q.maps;
    return 'https://www.google.com/maps/dir/?api=1&destination=' + q.coordenadas.lat + ',' + q.coordenadas.lng;
  }

  // ===== Mapa =====
  function iniciarMapa() {
    map = L.map('mapa', { zoomControl: true }).setView(CENTRO_PALMAS, ZOOM_INICIAL);
    // Mapa claro (Esri Light Gray) — gratuito e sem chave; deixa os pinos saltarem
    const esriOpts = { maxZoom: 19, maxNativeZoom: 16, attribution: 'Tiles &copy; Esri &mdash; &copy; OpenStreetMap' };
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', esriOpts).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', esriOpts).addTo(map);
    camadaMarcadores = L.layerGroup().addTo(map);
  }

  function criarIcone(cor, destaque) {
    return L.divIcon({
      className: 'pin' + (destaque ? ' pin--destaque' : ''),
      html: '<span class="pin__ponto" style="--cor:' + cor + '"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  }

  function renderMarcadores(lista) {
    camadaMarcadores.clearLayers();
    Object.keys(marcadores).forEach(function (id) { delete marcadores[id]; });
    lista.forEach(function (q) {
      const m = L.marker([q.coordenadas.lat, q.coordenadas.lng], {
        icon: criarIcone(Icones.corDoPiso(q.piso), false),
        title: q.nome,
        alt: q.nome
      });
      m.bindPopup('<strong>' + esc(q.nome) + '</strong>' + (q.regiao ? '<br>' + esc(q.regiao) : ''));
      m.on('click', function () { abrirDetalhe(q.id); });
      m.addTo(camadaMarcadores);
      marcadores[q.id] = m;
    });
  }

  function destacar(id, ligado) {
    const m = marcadores[id];
    const q = acharQuadra(id);
    if (m && q) m.setIcon(criarIcone(Icones.corDoPiso(q.piso), ligado));
  }

  // ===== Filtros =====
  function renderFiltros() {
    document.getElementById('filtros').innerHTML = GRUPOS_FILTRO.map(function (g) {
      return '<div class="filtros__grupo" role="group" aria-label="' + g.titulo + '">' +
        '<span class="filtros__rotulo" aria-hidden="true">' + g.titulo + '</span>' +
        g.catalogo.map(function (item) {
          return '<label class="chip">' +
            (g.comCor ? '<span class="chip__dot" style="--c:' + Icones.corDoPiso(item.valor) + '"></span>' : '') +
            '<input type="checkbox" data-grupo="' + g.grupo + '" data-valor="' + item.valor + '">' +
            '<span>' + item.label + '</span></label>';
        }).join('') +
        '</div>';
    }).join('');
  }

  function lerFiltros() {
    const grupos = {};
    document.querySelectorAll('#filtros input[type="checkbox"]:checked').forEach(function (cb) {
      (grupos[cb.dataset.grupo] = grupos[cb.dataset.grupo] || []).push(cb.dataset.valor);
    });
    return grupos;
  }

  function aplicarFiltros() {
    if (!carregou) return;
    const lista = Regras.filtrarQuadras(quadras, lerFiltros());
    renderCards(lista);
    renderMarcadores(lista);
    document.getElementById('contador').textContent =
      lista.length + (lista.length === 1 ? ' quadra' : ' quadras');
  }

  // ===== Lista de cards =====
  function htmlIconesCard(q) {
    const eq = Regras.EQUIPAMENTOS.filter(function (e) { return q.equipamentos[e.valor]; });
    const es = Regras.ESTRUTURAS.filter(function (e) { return q.estrutura[e.valor]; });
    if (!eq.length && !es.length) return '<p class="card__semequip">Sem equipamentos cadastrados</p>';
    function icone(e, extra) {
      return '<span class="ic' + (extra || '') + '" role="img" title="' + e.label + '" aria-label="' + e.label + '">' +
        Icones.svg(e.valor) + '</span>';
    }
    return '<div class="card__equip">' +
      eq.map(function (e) { return icone(e); }).join('') +
      (eq.length && es.length ? '<span class="card__div" aria-hidden="true"></span>' : '') +
      es.map(function (e) { return icone(e, ' ic--estrutura'); }).join('') +
      '</div>';
  }

  function renderCards(lista) {
    const alvo = document.getElementById('lista');
    alvo.innerHTML = '';
    if (!lista.length) {
      alvo.innerHTML =
        '<div class="vazio">' + Icones.LINHAS_QUADRA.replace('detalhe__linhas', 'vazio__linhas') +
        '<p>Nenhuma quadra com esses filtros.<br>Tente afrouxar a busca.</p></div>';
      return;
    }
    lista.forEach(function (q) {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = q.id;
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Ver detalhes: ' + q.nome);
      card.innerHTML =
        '<div class="card__midia' + (temFoto(q) ? '' : ' card__midia--vazia') + '">' +
          '<img class="card__foto" src="' + esc(fotoDe(q)) + '" alt="" loading="lazy">' +
          (q.demo ? '<span class="card__demo">exemplo</span>' : '') +
          (q.precisa.length ? '<span class="card__precisa">' + Icones.i('doar') + 'Precisa de doação</span>' : '') +
          '<span class="card__piso" style="--cor:' + Icones.corDoPiso(q.piso) + '">' +
            Regras.rotulo(Regras.PISOS, q.piso) + (q.coberta ? ' · coberta' : '') + '</span>' +
        '</div>' +
        '<div class="card__corpo">' +
          (q.regiao ? '<p class="card__regiao">' + esc(q.regiao) + '</p>' : '') +
          '<h3 class="card__nome">' + esc(q.nome) + '</h3>' +
          htmlIconesCard(q) +
        '</div>';
      card.addEventListener('click', function () { abrirDetalhe(q.id); });
      card.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirDetalhe(q.id); }
      });
      card.addEventListener('mouseenter', function () { destacar(q.id, true); });
      card.addEventListener('mouseleave', function () { destacar(q.id, false); });
      alvo.appendChild(card);
    });
  }

  function mostrarCarregando() {
    document.getElementById('contador').textContent = '';
    document.getElementById('lista').innerHTML =
      '<p class="estado-lista" role="status">Carregando quadras…</p>';
  }

  function mostrarErroCarregar() {
    document.getElementById('contador').textContent = '';
    document.getElementById('lista').innerHTML =
      '<div class="estado-lista estado-lista--erro" role="alert">' +
        '<p>Não foi possível carregar as quadras.</p>' +
        '<button type="button" class="btn-sec" id="tentar-carregar">Tentar de novo</button>' +
      '</div>';
    document.getElementById('tentar-carregar').addEventListener('click', carregarQuadras);
  }

  function carregarQuadras() {
    mostrarCarregando();
    Api.listarQuadras().then(function (lista) {
      quadras = lista;
      carregou = true;
      aplicarFiltros();
      ouvintesCarregar.forEach(function (fn) { fn(quadras); });
    }).catch(mostrarErroCarregar);
  }

  // ===== Detalhe =====
  function abrirDetalhe(id) {
    const q = acharQuadra(id);
    if (!q) return;
    const cor = Icones.corDoPiso(q.piso);

    const eq = Regras.EQUIPAMENTOS.filter(function (e) { return q.equipamentos[e.valor]; });
    const equipsHTML = eq.length
      ? eq.map(function (e) {
          return '<li><span class="ic" style="color:' + cor + '">' + Icones.svg(e.valor) + '</span>' + e.label + '</li>';
        }).join('')
      : '<li>Nenhum equipamento cadastrado</li>';

    const avisoRede = q.equipamentos.postesVolei && !q.equipamentos.redeVolei
      ? '<p class="aviso aviso--info">' + Icones.i('info') + '<span>Tem postes de vôlei — leve sua rede.</span></p>'
      : '';

    const estruturaHTML = Regras.ESTRUTURAS.map(function (e) {
      const tem = q.estrutura[e.valor];
      return '<li class="' + (tem ? '' : 'equips__nao') + '">' +
        '<span class="ic ic--estrutura">' + Icones.svg(e.valor) + '</span>' + e.label +
        '<span class="status status--' + (tem ? 'sim' : 'nao') + '">' + (tem ? 'Tem' : 'Não tem') + '</span></li>';
    }).join('');

    const precisaHTML = q.precisa.length
      ? '<div class="precisa">' +
          '<p class="detalhe__tit">Precisa de doação</p>' +
          '<ul class="precisa__itens">' + q.precisa.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="btn-doar-quadra" id="detalhe-doar">' + Icones.i('doar') + 'Quero doar</button>' +
        '</div>'
      : '';

    const el = document.getElementById('detalhe');
    el.innerHTML =
      '<button type="button" class="detalhe__fechar" id="detalhe-fechar" aria-label="Fechar" data-foco-inicial>' + Icones.i('x') + '</button>' +
      '<div class="detalhe__hero' + (temFoto(q) ? '' : ' detalhe__hero--vazia') + '" style="--cor:' + cor + '">' +
        '<img src="' + esc(fotoDe(q)) + '" alt="Foto da ' + esc(q.nome) + '">' +
        (temFoto(q) ? '' : Icones.LINHAS_QUADRA) +
        '<div class="detalhe__heroInfo">' +
          '<span class="detalhe__pisoTag" style="--cor:' + cor + '">' + Regras.rotulo(Regras.PISOS, q.piso) + '</span>' +
          '<h2 id="detalhe-titulo">' + esc(q.nome) + '</h2>' +
          (q.regiao ? '<p class="mono">' + esc(q.regiao) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '<div class="detalhe__corpo">' +
        '<div class="detalhe__fatos">' +
          '<div class="fato"><div class="fato__rot">Cobertura</div><div class="fato__val">' + (q.coberta ? 'Coberta' : 'Descoberta') + '</div></div>' +
          '<div class="fato"><div class="fato__rot">Conservação</div><div class="fato__val">' + (Regras.rotulo(Regras.CONSERVACOES, q.conservacao) || '—') + '</div></div>' +
        '</div>' +
        '<p class="detalhe__tit">Modalidades</p>' +
        '<div class="mods">' + q.modalidades.map(function (m) { return '<span class="mod">' + esc(Regras.rotulo(Regras.MODALIDADES, m)) + '</span>'; }).join('') + '</div>' +
        '<p class="detalhe__tit">Equipamentos</p>' +
        '<ul class="equips">' + equipsHTML + '</ul>' +
        avisoRede +
        '<p class="detalhe__tit">Estrutura</p>' +
        '<ul class="equips">' + estruturaHTML + '</ul>' +
        precisaHTML +
        (q.demo ? '<p class="detalhe__aviso">Quadra de exemplo — dados e foto a substituir pelos reais.</p>' : '') +
        '<button type="button" class="link-corrigir" id="detalhe-corrigir">Algo errado? Sugerir correção</button>' +
      '</div>' +
      '<div class="detalhe__rodape">' +
        '<a class="btn-direcao" href="' + esc(linkMaps(q)) + '" target="_blank" rel="noopener">' +
          Icones.i('direcao') + 'Como chegar' +
        '</a>' +
      '</div>';
    el.setAttribute('aria-labelledby', 'detalhe-titulo');

    document.getElementById('detalhe-fechar').addEventListener('click', Nav.pedirFechar);
    const btnDoar = document.getElementById('detalhe-doar');
    if (btnDoar) btnDoar.addEventListener('click', function () {
      if (raiz.Doar) raiz.Doar.abrirComQuadra(q.id);
    });
    document.getElementById('detalhe-corrigir').addEventListener('click', function () {
      if (raiz.Sugerir) raiz.Sugerir.abrir({ tipo: 'correcao', quadraId: q.id });
    });

    Nav.abrirPainel('detalhe');
    if (map) map.panTo([q.coordenadas.lat, q.coordenadas.lng]);
    if (marcadores[id]) marcadores[id].openPopup();
  }

  // ===== Responsivo =====
  function alternarVista(vista) {
    const app = document.getElementById('app');
    app.classList.toggle('mostrar-mapa', vista === 'mapa');
    app.classList.toggle('mostrar-lista', vista === 'lista');
    document.querySelectorAll('.alternador__btn').forEach(function (b) {
      const ativo = b.dataset.vista === vista;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
    if (vista === 'mapa' && map) setTimeout(function () { map.invalidateSize(); }, 0);
  }

  // ===== Início =====
  function iniciar() {
    Nav.registrarPainel('detalhe', { el: document.getElementById('detalhe') });
    Nav.aoMostrarTela = function (tela) {
      if (tela === 'mapa' && map) setTimeout(function () { map.invalidateSize(); }, 0);
      if (tela === 'doar' && raiz.Doar) raiz.Doar.aoMostrar();
    };

    iniciarMapa();
    renderFiltros();
    document.getElementById('filtros').addEventListener('change', aplicarFiltros);
    document.querySelectorAll('.alternador__btn').forEach(function (b) {
      b.addEventListener('click', function () { alternarVista(b.dataset.vista); });
    });
    document.getElementById('btn-doar').addEventListener('click', function () { Nav.irParaDoar(); });
    document.getElementById('btn-sugerir').addEventListener('click', function () {
      if (raiz.Sugerir) raiz.Sugerir.abrir({ tipo: 'nova' });
    });

    alternarVista('lista');
    Nav.iniciar();
    carregarQuadras();
  }

  raiz.App = {
    abrirDetalhe: abrirDetalhe,
    quadras: function () { return quadras; },
    // Chama fn(quadras) quando carregar (ou já, se carregou)
    aoCarregar: function (fn) {
      ouvintesCarregar.push(fn);
      if (carregou) fn(quadras);
    }
  };

  document.addEventListener('DOMContentLoaded', iniciar);
})(window);
