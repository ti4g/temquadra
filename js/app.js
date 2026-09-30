/* Quadras de Palmas — mapa, filtros avançados, busca e integração com painéis */
(function (raiz) {
  'use strict';

  const esc = Regras.escaparHtml;

  let map;
  let camadaMarcadores;
  const marcadores = {};
  let quadras = [];
  let carregou = false;

  const CENTRO_PALMAS = [-10.2085, -48.3470];
  const ZOOM_INICIAL = 13;

  function acharQuadra(id) { return quadras.find(q => q.id === id); }
  function temFoto(q) { return q.fotos && q.fotos.length > 0; }
  function fotoDe(q) { return temFoto(q) ? q.fotos[0] : 'imgs/placeholder.svg'; }

  function linkMaps(q) {
    return `https://www.google.com/maps/dir/?api=1&destination=${q.coordenadas.lat},${q.coordenadas.lng}`;
  }

  function iniciarMapa() {
    map = L.map('mapa', { zoomControl: true }).setView(CENTRO_PALMAS, ZOOM_INICIAL);
    const esriOpts = { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; OpenStreetMap' };
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', esriOpts).addTo(map);
    camadaMarcadores = L.layerGroup().addTo(map);
  }

  function criarIcone(cor) {
    return L.divIcon({
      className: 'pin',
      html: `<span class="pin__ponto" style="--cor:${cor}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
  }

  function renderMarcadores(lista) {
    camadaMarcadores.clearLayers();
    Object.keys(marcadores).forEach(id => delete marcadores[id]);

    lista.forEach(q => {
      const m = L.marker([q.coordenadas.lat, q.coordenadas.lng], {
        icon: criarIcone(Icones.corDoPiso(q.piso)),
        title: q.nome
      });
      m.bindPopup(`<strong>${esc(q.nome)}</strong><br>${esc(q.regiao)}`);
      m.on('click', () => abrirDetalhe(q.id));
      m.addTo(camadaMarcadores);
      marcadores[q.id] = m;
    });
  }

  function aplicarFiltros() {
    if (!carregou) return;

    const termoBusca = (document.getElementById('campo-busca')?.value || '').toLowerCase().trim();

    const pisosSelecionados = Array.from(document.querySelectorAll('#filtros input[data-grupo="piso"]:checked')).map(c => c.value);
    const coberturasSelecionadas = Array.from(document.querySelectorAll('#filtros input[data-grupo="cobertura"]:checked')).map(c => c.value);
    
    const precisaIluminacao = document.querySelector('#filtros input[data-grupo="recurso"][value="iluminacao"]:checked') !== null;
    const precisaAcessibilidade = document.querySelector('#filtros input[data-grupo="recurso"][value="acessibilidade"]:checked') !== null;

    const listaFiltrada = quadras.filter(q => {
      const bateTexto = !termoBusca || q.nome.toLowerCase().includes(termoBusca) || q.regiao.toLowerCase().includes(termoBusca);
      const batePiso = pisosSelecionados.length === 0 || pisosSelecionados.includes(q.piso);
      const bateCobertura = coberturasSelecionadas.length === 0 || coberturasSelecionadas.includes(q.cobertura);
      
      const bateIluminacao = !precisaIluminacao || q.iluminacao === true;
      const bateAcessibilidade = !precisaAcessibilidade || q.acessibilidade === true; // <-- Filtro de Acessibilidade

      return bateTexto && batePiso && bateCobertura && bateIluminacao && bateAcessibilidade;
    });

    renderCards(listaFiltrada);
    renderMarcadores(listaFiltrada);
  }

  function abrirDetalhe(id) {
    const q = acharQuadra(id);
    if (!q) return;

    const el = document.getElementById('detalhe');
    el.innerHTML = `
      <button type="button" class="detalhe__fechar" id="detalhe-fechar">×</button>
      <div class="detalhe__hero" style="--cor:${Icones.corDoPiso(q.piso)}">
        <img src="${esc(fotoDe(q))}" alt="${esc(q.nome)}">
        <div class="detalhe__heroInfo">
          <h2>${esc(q.nome)}</h2>
          <p class="mono">${esc(q.regiao)}</p>
        </div>
      </div>
      <div class="detalhe__corpo">
        <p><strong>Piso:</strong> ${q.piso.toUpperCase()}</p>
        <p><strong>Cobertura:</strong> ${q.cobertura.toUpperCase()}</p>
        <p><strong>Iluminação:</strong> ${q.iluminacao ? 'Sim 💡' : 'Não'}</p>
        <p><strong>Acessibilidade:</strong> ${q.acessibilidade ? 'Possui Rampa / Acessível ♿' : 'Não informado'}</p>
      </div>
      <div class="detalhe__rodape">
        <a class="btn-direcao" href="${esc(linkMaps(q))}" target="_blank">Como chegar</a>
      </div>
    `;

    document.getElementById('detalhe-fechar').addEventListener('click', () => Nav.pedirFechar());
    Nav.abrirPainel('detalhe');
    if (map) map.panTo([q.coordenadas.lat, q.coordenadas.lng]);
  }

  function renderCards(lista) {
    const alvo = document.getElementById('lista');
    if (!alvo) return;
    alvo.innerHTML = '';

    if (!lista.length) {
      alvo.innerHTML = '<div class="vazio"><p>Nenhuma quadra encontrada com esses filtros.</p></div>';
      return;
    }

    lista.forEach(q => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card__midia">
          <img class="card__foto" src="${esc(fotoDe(q))}" alt="${esc(q.nome)}">
          <span class="card__piso" style="--cor:${Icones.corDoPiso(q.piso)}">${q.piso.toUpperCase()}</span>
        </div>
        <div class="card__corpo">
          <p class="card__regiao">${esc(q.regiao)}</p>
          <h3 class="card__nome">${esc(q.nome)}</h3>
        </div>
      `;
      card.addEventListener('click', () => abrirDetalhe(q.id));
      alvo.appendChild(card);
    });
  }

  function abrirDetalhe(id) {
    const q = acharQuadra(id);
    if (!q) return;

    const el = document.getElementById('detalhe');
    if (!el) return;

    el.innerHTML = `
      <button type="button" class="detalhe__fechar" id="detalhe-fechar">×</button>
      <div class="detalhe__hero" style="--cor:${Icones.corDoPiso(q.piso)}">
        <img src="${esc(fotoDe(q))}" alt="${esc(q.nome)}">
        <div class="detalhe__heroInfo">
          <h2>${esc(q.nome)}</h2>
          <p class="mono">${esc(q.regiao)}</p>
        </div>
      </div>
      <div class="detalhe__corpo">
        <p><strong>Piso:</strong> ${q.piso.toUpperCase()}</p>
        <p><strong>Cobertura:</strong> ${q.cobertura.toUpperCase()}</p>
        <p><strong>Iluminação:</strong> ${q.iluminacao ? 'Sim' : 'Não'}</p>
      </div>
      <div class="detalhe__rodape">
        <a class="btn-direcao" href="${esc(linkMaps(q))}" target="_blank">Como chegar</a>
      </div>
    `;

    document.getElementById('detalhe-fechar').addEventListener('click', () => Nav.pedirFechar());
    Nav.abrirPainel('detalhe');
    if (map) map.panTo([q.coordenadas.lat, q.coordenadas.lng]);
  }

  function alternarVista(vista) {
    const app = document.getElementById('app');
    if (!app) return;
    app.classList.toggle('mostrar-mapa', vista === 'mapa');
    app.classList.toggle('mostrar-lista', vista === 'lista');
    document.querySelectorAll('.alternador__btn').forEach(b => {
      const ativo = b.dataset.vista === vista;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
    if (vista === 'mapa' && map) setTimeout(() => map.invalidateSize(), 0);
  }

  function carregarQuadras() {
    Api.listarQuadras().then(lista => {
      quadras = lista;
      carregou = true;
      aplicarFiltros();
      if (raiz.Sugerir) raiz.Sugerir.definirQuadras(lista);
    }).catch(err => {
      const alvo = document.getElementById('lista');
      if (alvo) alvo.innerHTML = '<p class="estado-lista estado-lista--erro">Erro ao carregar quadras.</p>';
    });
  }

  function iniciar() {
    // 1. Registra os painéis laterais no gerenciador de navegação
    Nav.registrarPainel('detalhe', { el: document.getElementById('detalhe') });
    
    // 2. Inicializa o Mapa Leaflet
    iniciarMapa();

    // 3. Associa os cliques nos botões do topo aos formulários/telas
    document.getElementById('btn-sugerir')?.addEventListener('click', () => {
      if (raiz.Sugerir) raiz.Sugerir.abrir({ tipo: 'nova' });
    });

    document.getElementById('btn-doar')?.addEventListener('click', () => {
      Nav.irParaDoar();
    });

    // 4. Alternadores de tela responsiva (Lista / Mapa)
    document.querySelectorAll('.alternador__btn').forEach(b => {
      b.addEventListener('click', () => alternarVista(b.dataset.vista));
    });

    // 5. Pesquisa e Filtros em tempo real
    document.getElementById('campo-busca')?.addEventListener('input', aplicarFiltros);
    document.getElementById('filtros')?.addEventListener('change', aplicarFiltros);

    // 6. Inicializa o estado de histórico e busca as quadras
    Nav.iniciar();
    carregarQuadras();
  }

  raiz.App = {
    abrirDetalhe: abrirDetalhe,
    quadras: () => quadras
  };

  document.addEventListener('DOMContentLoaded', iniciar);
})(window);