// ===== Estado global =====
let map;                 // mapa Leaflet
let camadaMarcadores;    // grupo de pinos
const marcadores = {};   // id da quadra -> marcador

const CENTRO_PALMAS = [-10.2491, -48.3243];
const ZOOM_INICIAL = 13;

// ===== Identidade por tipo de piso (a "assinatura" visual) =====
const PISO_META = {
  areia:        { label: 'Areia',        cor: '#E0A94E' },
  gramado:      { label: 'Gramado',      cor: '#37A96A' },
  cimento:      { label: 'Cimento',      cor: '#17B0BD' },
  emborrachado: { label: 'Emborrachado', cor: '#FF6A4D' }
};
function pisoLabel(p) { return (PISO_META[p] && PISO_META[p].label) || p; }
function corDoPiso(q) { return (PISO_META[q.piso] && PISO_META[q.piso].cor) || '#17B0BD'; }

const MOD_LABEL = { volei: 'Vôlei', basquete: 'Basquete', futsal: 'Futsal', society: 'Society' };
function modLabel(m) { return MOD_LABEL[m] || m; }

// ===== Ícones (SVG) dos equipamentos =====
const ICONE = {
  redeVolei: '<svg viewBox="0 0 24 24"><path d="M3 8h18v9H3z"/><path d="M3 12h18M3 15h18M8 8v9M13 8v9M18 8v9M3 5v3M21 5v3"/></svg>',
  aroBasquete: '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="8" rx="1"/><path d="M9 11c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M10 13.5 9 21M14 13.5 15 21M12 14v7"/></svg>',
  traves: '<svg viewBox="0 0 24 24"><path d="M3 20V7h18v13"/><path d="M3 7l3-3h12l3 3"/><path d="M7 20v-6h10v6"/></svg>',
  iluminacao: '<svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="4"/><path d="M12 2v2M12 18v2M3 11h2M19 11h2M5.6 4.6l1.4 1.4M17 17l1.4 1.4M18.4 4.6 17 6M7 17l-1.4 1.4"/></svg>'
};
const EQUIP = [
  { chave: 'redeVolei',   label: 'Rede de vôlei' },
  { chave: 'aroBasquete', label: 'Aro de basquete' },
  { chave: 'traves',      label: 'Traves' },
  { chave: 'iluminacao',  label: 'Iluminação' }
];
function equipsPresentes(q) { return EQUIP.filter(function (e) { return q.equipamentos[e.chave]; }); }

// Traços de quadra (marcações) usados como marca-d'água no detalhe
const LINHAS_QUADRA =
  '<svg class="detalhe__linhas" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
  '<g fill="none" stroke="#fff" stroke-width="2">' +
  '<rect x="6" y="6" width="188" height="108" rx="2"/>' +
  '<line x1="100" y1="6" x2="100" y2="114"/>' +
  '<circle cx="100" cy="60" r="22"/>' +
  '<rect x="6" y="38" width="34" height="44"/>' +
  '<rect x="160" y="38" width="34" height="44"/></g></svg>';

// ===== Mapa =====
function iniciarMapa() {
  map = L.map('mapa', { zoomControl: true }).setView(CENTRO_PALMAS, ZOOM_INICIAL);
  // Mapa claro (Esri Light Gray) — gratuito e sem chave; deixa os pinos saltarem.
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
  for (const id in marcadores) delete marcadores[id];
  lista.forEach(function (q) {
    const m = L.marker([q.coordenadas.lat, q.coordenadas.lng], { icon: criarIcone(corDoPiso(q), false) });
    m.bindPopup('<strong>' + q.nome + '</strong><br>' + q.regiao);
    m.on('click', function () { abrirDetalhe(q.id); });
    m.addTo(camadaMarcadores);
    marcadores[q.id] = m;
  });
}

function destacar(id, on) {
  const m = marcadores[id];
  const q = QUADRAS.find(function (x) { return x.id === id; });
  if (m && q) m.setIcon(criarIcone(corDoPiso(q), on));
}

// ===== Utilidades de dados =====
function temFoto(q) { return q.fotos && q.fotos.length; }
function fotoDe(q) { return temFoto(q) ? q.fotos[0] : 'imgs/placeholder.svg'; }

// Link do Google Maps: usa o link cadastrado; senão, gera rota pelas coordenadas.
function linkMaps(q) {
  if (q.maps) return q.maps;
  return 'https://www.google.com/maps/dir/?api=1&destination=' + q.coordenadas.lat + ',' + q.coordenadas.lng;
}

// ===== Lista de cards =====
function renderCards(lista) {
  const alvo = document.getElementById('lista');
  alvo.innerHTML = '';
  if (!lista.length) {
    alvo.innerHTML =
      '<div class="vazio">' + LINHAS_QUADRA.replace('detalhe__linhas', 'vazio__linhas') +
      '<p>Nenhuma quadra com esses filtros.<br>Tente afrouxar a busca.</p></div>';
    return;
  }
  lista.forEach(function (q) {
    const equips = equipsPresentes(q);
    const iconesHTML = equips.length
      ? '<div class="card__equip">' + equips.map(function (e) {
          return '<span class="ic" title="' + e.label + '">' + ICONE[e.chave] + '</span>';
        }).join('') + '</div>'
      : '<p class="card__semequip">Sem equipamentos cadastrados</p>';

    const midiaClasse = 'card__midia' + (temFoto(q) ? '' : ' card__midia--vazia');

    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = q.id;
    card.innerHTML =
      '<div class="' + midiaClasse + '">' +
        '<img class="card__foto" src="' + fotoDe(q) + '" alt="Foto da ' + q.nome + '">' +
        (q.demo ? '<span class="card__demo">exemplo</span>' : '') +
        '<span class="card__piso" style="--cor:' + corDoPiso(q) + '">' + pisoLabel(q.piso) +
          (q.coberta ? ' · coberta' : '') + '</span>' +
      '</div>' +
      '<div class="card__corpo">' +
        '<p class="card__regiao">' + q.regiao + '</p>' +
        '<h3 class="card__nome">' + q.nome + '</h3>' +
        iconesHTML +
      '</div>';
    card.addEventListener('click', function () { abrirDetalhe(q.id); });
    card.addEventListener('mouseenter', function () { destacar(q.id, true); });
    card.addEventListener('mouseleave', function () { destacar(q.id, false); });
    alvo.appendChild(card);
  });
}

// ===== Painel de detalhe =====
function abrirDetalhe(id) {
  const q = QUADRAS.find(function (x) { return x.id === id; });
  if (!q) return;
  const cor = corDoPiso(q);
  const equips = equipsPresentes(q);

  const heroClasse = 'detalhe__hero' + (temFoto(q) ? '' : ' detalhe__hero--vazia');
  const equipsHTML = equips.length
    ? equips.map(function (e) {
        return '<li><span class="ic" style="color:' + cor + '">' + ICONE[e.chave] + '</span>' + e.label + '</li>';
      }).join('')
    : '<li>Nenhum equipamento cadastrado</li>';

  const el = document.getElementById('detalhe');
  el.innerHTML =
    '<button class="detalhe__fechar" id="detalhe-fechar" aria-label="Fechar">&times;</button>' +
    '<div class="' + heroClasse + '" style="--cor:' + cor + '">' +
      '<img src="' + fotoDe(q) + '" alt="Foto da ' + q.nome + '">' +
      (temFoto(q) ? '' : LINHAS_QUADRA) +
      '<div class="detalhe__heroInfo">' +
        '<span class="detalhe__pisoTag" style="--cor:' + cor + '">' + pisoLabel(q.piso) + '</span>' +
        '<h2>' + q.nome + '</h2>' +
        '<p class="mono">' + q.regiao + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="detalhe__corpo">' +
      '<a class="btn-direcao" href="' + linkMaps(q) + '" target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>' +
        'Como chegar' +
      '</a>' +
      '<div class="detalhe__fatos">' +
        '<div class="fato"><div class="fato__rot">Cobertura</div><div class="fato__val">' + (q.coberta ? 'Coberta' : 'Descoberta') + '</div></div>' +
        '<div class="fato"><div class="fato__rot">Conservação</div><div class="fato__val">' + q.conservacao + '</div></div>' +
      '</div>' +
      '<p class="detalhe__tit">Modalidades</p>' +
      '<div class="mods">' + q.modalidades.map(function (m) { return '<span class="mod">' + modLabel(m) + '</span>'; }).join('') + '</div>' +
      '<p class="detalhe__tit">Equipamentos</p>' +
      '<ul class="equips">' + equipsHTML + '</ul>' +
      (q.demo ? '<p class="detalhe__aviso">Quadra de exemplo — dados e foto a substituir pelos reais.</p>' : '') +
    '</div>';
  el.classList.add('aberto');
  document.getElementById('detalhe-fechar').addEventListener('click', fecharDetalhe);
  if (map) map.panTo([q.coordenadas.lat, q.coordenadas.lng]);
  const m = marcadores[id];
  if (m) m.openPopup();
}

function fecharDetalhe() {
  document.getElementById('detalhe').classList.remove('aberto');
}

// ===== Filtros =====
function lerFiltros() {
  const grupos = {};
  document.querySelectorAll('.filtros input[type="checkbox"]:checked').forEach(function (cb) {
    const g = cb.dataset.grupo, v = cb.dataset.valor;
    (grupos[g] = grupos[g] || []).push(v);
  });
  return grupos;
}

function quadraTemValor(q, grupo, valor) {
  if (grupo === 'piso') return q.piso === valor;
  if (grupo === 'modalidade') return q.modalidades.includes(valor);
  if (grupo === 'equipamento') return q.equipamentos[valor] === true;
  if (grupo === 'cobertura') return valor === 'coberta' ? q.coberta : !q.coberta;
  return false;
}

function aplicarFiltros() {
  const grupos = lerFiltros();
  const lista = QUADRAS.filter(function (q) {
    return Object.keys(grupos).every(function (g) {
      return grupos[g].some(function (v) { return quadraTemValor(q, g, v); });
    });
  });
  renderCards(lista);
  renderMarcadores(lista);
  document.getElementById('contador').textContent =
    lista.length + (lista.length === 1 ? ' quadra' : ' quadras');
}

// ===== Responsivo =====
function alternarVista(vista) {
  const app = document.getElementById('app');
  app.classList.toggle('mostrar-mapa', vista === 'mapa');
  app.classList.toggle('mostrar-lista', vista === 'lista');
  document.querySelectorAll('.alternador__btn').forEach(function (b) {
    b.classList.toggle('ativo', b.dataset.vista === vista);
  });
  if (vista === 'mapa' && map) setTimeout(function () { map.invalidateSize(); }, 0);
}

// ===== Início =====
function iniciar() {
  iniciarMapa();
  aplicarFiltros();
  document.querySelectorAll('.filtros input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', aplicarFiltros);
  });
  document.querySelectorAll('.alternador__btn').forEach(function (b) {
    b.addEventListener('click', function () { alternarVista(b.dataset.vista); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharDetalhe();
  });
  alternarVista('lista');
}
document.addEventListener('DOMContentLoaded', iniciar);
