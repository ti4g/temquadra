# Quadras de Palmas — Plano de Implementação

> **Para quem for executar:** implemente tarefa por tarefa, em ordem. Cada tarefa
> termina com uma verificação concreta no navegador. Os passos usam checkbox
> (`- [ ]`) para acompanhamento. Como é um site estático (HTML/CSS/JS puro, sem
> instalar nada), a "verificação" de cada tarefa é abrir o `index.html` no
> navegador e conferir o resultado descrito.

**Goal:** Construir um protótipo navegável — mapa interativo de Palmas com pinos nas
quadras esportivas + lista de cards sincronizada e filtros — em HTML/CSS/JS puro,
de graça e sem backend.

**Architecture:** Página única. Os dados das quadras ficam num arquivo `js/dados.js`
como um array global `QUADRAS` (carregado via `<script>`, para funcionar abrindo o
arquivo direto, sem servidor). O `js/app.js` desenha o mapa (Leaflet + OpenStreetMap),
a lista de cards, os filtros, o detalhe e a sincronização entre eles.

**Tech Stack:** HTML5, CSS3, JavaScript ES6 (sem framework/sem build). Leaflet 1.9.4
via CDN + tiles do OpenStreetMap. Google Forms para sugestões da comunidade.

## Global Constraints

- **Pasta do projeto (raiz):** `C:\Users\tiago\OneDrive\Documentos\Meus Projetos\Quadra`
  — todos os caminhos abaixo são relativos a ela.
- **Sem build e sem servidor:** o `index.html` tem que funcionar abrindo direto no
  navegador (duplo-clique). Por isso os dados vêm de `js/dados.js` (script global),
  **não** de `fetch()` de um `.json` (fetch em `file://` é bloqueado pelo navegador).
- **Só bibliotecas gratuitas e sem cadastro:** Leaflet + OpenStreetMap. Nada de
  Google Maps (exige conta de faturamento).
- **Idioma da interface:** português.
- **Nomes de arquivos de imagem:** sem espaços e sem acentos (evita problemas de
  caminho). Ex.: `imgs/praca-303-sul.jpg`.
- **Controle de versão (opcional):** os passos de `git commit` são recomendados para
  o trabalho em dupla, mas opcionais. Se ainda não usam git, rode `git init` uma vez
  na raiz do projeto, ou simplesmente pule os passos de commit.

---

### Task 1: Esqueleto da página + mapa de Palmas

**Files:**
- Create: `index.html`
- Create: `css/estilos.css`
- Create: `js/app.js`

**Interfaces:**
- Produces: função global `iniciarMapa()` que cria a variável global `map` (mapa
  Leaflet) e a `camadaMarcadores` (L.layerGroup) sobre o elemento `#mapa`. Constantes
  `CENTRO_PALMAS` e `ZOOM_INICIAL`.

- [ ] **Passo 1: Criar `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quadras de Palmas</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body>
  <header class="cabecalho">
    <h1 class="cabecalho__titulo">Quadras de Palmas</h1>
    <div class="filtros" id="filtros"><!-- filtros entram na Task 7 --></div>
  </header>

  <main class="app" id="app">
    <section class="app__lista">
      <p id="contador">Carregando…</p>
      <div id="lista"><!-- cards entram na Task 4 --></div>
    </section>
    <section class="app__mapa">
      <div id="mapa"></div>
    </section>
  </main>

  <aside class="detalhe" id="detalhe"><!-- detalhe entra na Task 5 --></aside>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="js/dados.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Passo 2: Criar `css/estilos.css` (base + layout)**

```css
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  display: flex; flex-direction: column;
  font-family: system-ui, -apple-system, Arial, sans-serif; color: #222;
}
.cabecalho {
  padding: 12px 16px; border-bottom: 1px solid #eee;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
.cabecalho__titulo { font-size: 20px; margin: 0; }
.app { flex: 1; display: flex; min-height: 0; }
.app__lista {
  width: 420px; max-width: 42%; overflow-y: auto;
  padding: 12px; border-right: 1px solid #eee;
}
.app__mapa { flex: 1; min-width: 0; }
#mapa { height: 100%; }
#contador { font-size: 14px; color: #666; margin: 0 0 8px; }
```

- [ ] **Passo 3: Criar `js/app.js` (mapa só)**

```js
// ===== Estado global =====
let map;                 // mapa Leaflet
let camadaMarcadores;    // grupo de pinos
const marcadores = {};   // id da quadra -> marcador

const CENTRO_PALMAS = [-10.2491, -48.3243];
const ZOOM_INICIAL = 13;

function iniciarMapa() {
  map = L.map('mapa').setView(CENTRO_PALMAS, ZOOM_INICIAL);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  camadaMarcadores = L.layerGroup().addTo(map);
}

function iniciar() {
  iniciarMapa();
}
document.addEventListener('DOMContentLoaded', iniciar);
```

- [ ] **Passo 4: Verificar no navegador**

Abra `index.html` (duplo-clique). Esperado: o cabeçalho "Quadras de Palmas" aparece
e, ao lado direito, um **mapa mostrando Palmas** (com internet para carregar os tiles).
O `#contador` ainda mostra "Carregando…". Sem erros no console (F12 → Console).

- [ ] **Passo 5: Commit (opcional)**

```bash
git add index.html css/estilos.css js/app.js
git commit -m "feat: esqueleto da pagina e mapa de Palmas"
```

---

### Task 2: Dados das quadras + imagem placeholder

**Files:**
- Create: `js/dados.js`
- Create: `imgs/placeholder.svg`
- Rename: `imgs/Praça 303 sul.jpg` → `imgs/praca-303-sul.jpg`
- Rename: `imgs/praça 507sul.jpeg` → `imgs/praca-507-sul.jpeg`

**Interfaces:**
- Produces: array global `QUADRAS`, com 6 objetos no formato definido na spec
  (`id, nome, regiao, coordenadas{lat,lng}, piso, modalidades[], equipamentos{redeVolei,
  aroBasquete, traves, iluminacao}, coberta, conservacao, fotos[], demo`).

- [ ] **Passo 1: Renomear as fotos reais para nomes sem espaço/acento**

```bash
mv "imgs/Praça 303 sul.jpg" "imgs/praca-303-sul.jpg"
mv "imgs/praça 507sul.jpeg" "imgs/praca-507-sul.jpeg"
```

- [ ] **Passo 2: Criar `imgs/placeholder.svg` (usado por quem não tem foto)**

```html
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#e9edf2"/>
  <text x="200" y="150" fill="#9aa4b2" font-family="Arial, sans-serif"
        font-size="20" text-anchor="middle" dominant-baseline="middle">sem foto</text>
</svg>
```

- [ ] **Passo 3: Criar `js/dados.js`**

> Coordenadas das quadras são **aproximadas** e devem ser refinadas depois com o
> local real de cada uma.

```js
const QUADRAS = [
  {
    id: "303-sul",
    nome: "Praça 303 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.2610, lng: -48.3350 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-303-sul.jpg"],
    demo: false
  },
  {
    id: "507-sul",
    nome: "Praça 507 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.2740, lng: -48.3300 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-507-sul.jpeg"],
    demo: false
  },
  {
    id: "demo-areia",
    nome: "Quadra de Areia (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2200, lng: -48.3400 },
    piso: "areia",
    modalidades: ["volei"],
    equipamentos: { redeVolei: true, aroBasquete: false, traves: false, iluminacao: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    demo: true
  },
  {
    id: "demo-society",
    nome: "Campo Society (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2050, lng: -48.3450 },
    piso: "gramado",
    modalidades: ["society"],
    equipamentos: { redeVolei: false, aroBasquete: false, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: [],
    demo: true
  },
  {
    id: "demo-ginasio",
    nome: "Ginásio Coberto (exemplo)",
    regiao: "Exemplo — Centro",
    coordenadas: { lat: -10.2450, lng: -48.3280 },
    piso: "emborrachado",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: true, aroBasquete: true, traves: true, iluminacao: true },
    coberta: true,
    conservacao: "boa",
    fotos: [],
    demo: true
  },
  {
    id: "demo-basquete",
    nome: "Quadra de Basquete (exemplo)",
    regiao: "Exemplo — Sul",
    coordenadas: { lat: -10.2900, lng: -48.3250 },
    piso: "cimento",
    modalidades: ["basquete"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: false, iluminacao: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    demo: true
  }
];
```

- [ ] **Passo 4: Verificar no navegador**

Recarregue `index.html`. Abra o console (F12) e digite `QUADRAS.length`. Esperado: `6`.
Digite `QUADRAS[0].nome`. Esperado: `"Praça 303 Sul"`. Nenhum erro no console.

- [ ] **Passo 5: Commit (opcional)**

```bash
git add js/dados.js imgs/
git commit -m "feat: base de dados das quadras e placeholder"
```

---

### Task 3: Pinos das quadras no mapa

**Files:**
- Modify: `js/app.js`
- Modify: `css/estilos.css`

**Interfaces:**
- Consumes: `map`, `camadaMarcadores`, `marcadores`, `QUADRAS`.
- Produces: `criarIcone(destaque)` (retorna um `L.divIcon`); `renderMarcadores(lista)`
  (desenha um pino por quadra da `lista` e guarda cada um em `marcadores[id]`).

- [ ] **Passo 1: Adicionar estilo dos pinos ao final de `css/estilos.css`**

```css
.pin { background: transparent; border: none; }
.pin__ponto {
  display: block; width: 18px; height: 18px;
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  background: #2f6fed; border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.4);
}
.pin--destaque .pin__ponto { background: #e0483d; width: 24px; height: 24px; }
```

- [ ] **Passo 2: Adicionar as funções de pino em `js/app.js` (antes de `iniciar`)**

```js
function criarIcone(destaque) {
  return L.divIcon({
    className: 'pin' + (destaque ? ' pin--destaque' : ''),
    html: '<span class="pin__ponto"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24]
  });
}

function renderMarcadores(lista) {
  camadaMarcadores.clearLayers();
  for (const id in marcadores) delete marcadores[id];
  lista.forEach(function (q) {
    const m = L.marker([q.coordenadas.lat, q.coordenadas.lng], { icon: criarIcone(false) });
    m.bindPopup('<strong>' + q.nome + '</strong><br>' + q.regiao);
    m.addTo(camadaMarcadores);
    marcadores[q.id] = m;
  });
}
```

- [ ] **Passo 3: Chamar `renderMarcadores` no `iniciar`**

Substitua a função `iniciar` por:

```js
function iniciar() {
  iniciarMapa();
  renderMarcadores(QUADRAS);
}
```

- [ ] **Passo 4: Verificar no navegador**

Recarregue. Esperado: **6 pinos** aparecem no mapa (em Palmas). Clicar num pino abre
um balão com o nome e a região da quadra.

- [ ] **Passo 5: Commit (opcional)**

```bash
git add js/app.js css/estilos.css
git commit -m "feat: pinos das quadras no mapa"
```

---

### Task 4: Lista de cards

**Files:**
- Modify: `js/app.js`
- Modify: `css/estilos.css`

**Interfaces:**
- Consumes: `QUADRAS`.
- Produces: `fotoDe(q)`, `pisoLabel(p)`, `iconesEquip(q)` (helpers); `renderCards(lista)`
  (preenche `#lista` com um card por quadra). Cards de `demo: true` ganham selo
  "demonstração".

- [ ] **Passo 1: Adicionar estilo dos cards ao final de `css/estilos.css`**

```css
.card {
  position: relative; display: flex; gap: 10px; padding: 8px;
  border: 1px solid #eee; border-radius: 12px; margin-bottom: 10px;
  cursor: pointer; background: #fff; transition: box-shadow .15s;
}
.card:hover { box-shadow: 0 2px 10px rgba(0,0,0,.12); }
.card__foto {
  width: 96px; height: 72px; object-fit: cover; border-radius: 8px; flex: none;
}
.card__demo {
  position: absolute; top: 6px; left: 6px; background: #f1c40f; color: #4a3b00;
  font-size: 11px; padding: 2px 6px; border-radius: 6px; font-weight: 600;
}
.card__corpo { min-width: 0; }
.card__nome { font-size: 15px; margin: 0 0 2px; }
.card__regiao { font-size: 13px; color: #666; margin: 0 0 4px; }
.card__piso, .card__equip { font-size: 12px; color: #444; margin: 0; }
.vazio { color: #666; font-size: 14px; }
```

- [ ] **Passo 2: Adicionar helpers + `renderCards` em `js/app.js` (antes de `iniciar`)**

```js
function fotoDe(q) {
  return (q.fotos && q.fotos.length) ? q.fotos[0] : 'imgs/placeholder.svg';
}

const PISO_LABEL = { areia: 'Areia', gramado: 'Gramado', cimento: 'Cimento', emborrachado: 'Emborrachado' };
function pisoLabel(p) { return PISO_LABEL[p] || p; }

function iconesEquip(q) {
  const itens = [];
  if (q.equipamentos.redeVolei) itens.push('🏐 Rede de vôlei');
  if (q.equipamentos.aroBasquete) itens.push('🏀 Aro de basquete');
  if (q.equipamentos.traves) itens.push('🥅 Traves');
  if (q.equipamentos.iluminacao) itens.push('💡 Iluminação');
  return itens;
}

function renderCards(lista) {
  const alvo = document.getElementById('lista');
  alvo.innerHTML = '';
  if (!lista.length) {
    alvo.innerHTML = '<p class="vazio">Nenhuma quadra encontrada com esses filtros.</p>';
    return;
  }
  lista.forEach(function (q) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = q.id;
    card.innerHTML =
      '<img class="card__foto" src="' + fotoDe(q) + '" alt="Foto da ' + q.nome + '">' +
      (q.demo ? '<span class="card__demo">demonstração</span>' : '') +
      '<div class="card__corpo">' +
        '<h3 class="card__nome">' + q.nome + '</h3>' +
        '<p class="card__regiao">' + q.regiao + '</p>' +
        '<p class="card__piso">' + pisoLabel(q.piso) + (q.coberta ? ' · coberta' : ' · descoberta') + '</p>' +
        '<p class="card__equip">' + (iconesEquip(q).join(' · ') || '—') + '</p>' +
      '</div>';
    alvo.appendChild(card);
  });
}
```

- [ ] **Passo 3: Chamar `renderCards` no `iniciar`**

Substitua a função `iniciar` por:

```js
function iniciar() {
  iniciarMapa();
  renderCards(QUADRAS);
  renderMarcadores(QUADRAS);
}
```

- [ ] **Passo 4: Verificar no navegador**

Recarregue. Esperado: a coluna da esquerda mostra **6 cards**. Os cards da 303 e 507
mostram as **fotos reais**; os 4 de exemplo mostram o **placeholder "sem foto"** e o
selo amarelo **"demonstração"**. Cada card mostra nome, região, piso e equipamentos.

- [ ] **Passo 5: Commit (opcional)**

```bash
git add js/app.js css/estilos.css
git commit -m "feat: lista de cards das quadras"
```

---

### Task 5: Painel de detalhe da quadra

**Files:**
- Modify: `js/app.js`
- Modify: `css/estilos.css`

**Interfaces:**
- Consumes: `QUADRAS`, `map`, `marcadores`, `fotoDe`, `pisoLabel`, `iconesEquip`.
- Produces: `abrirDetalhe(id)` (mostra o painel `#detalhe` com todos os atributos da
  quadra e centraliza o mapa nela); `fecharDetalhe()`.

- [ ] **Passo 1: Adicionar estilo do painel ao final de `css/estilos.css`**

```css
.detalhe {
  position: fixed; top: 0; right: 0; height: 100%; width: 360px; max-width: 90%;
  background: #fff; box-shadow: -4px 0 16px rgba(0,0,0,.15);
  transform: translateX(100%); transition: transform .2s;
  overflow-y: auto; z-index: 1200;
}
.detalhe.aberto { transform: translateX(0); }
.detalhe__fechar {
  position: absolute; top: 8px; right: 8px; border: none; background: rgba(0,0,0,.5);
  color: #fff; width: 32px; height: 32px; border-radius: 50%; font-size: 20px;
  cursor: pointer; line-height: 1;
}
.detalhe__foto { width: 100%; height: 200px; object-fit: cover; }
.detalhe__corpo { padding: 16px; }
.detalhe__corpo h2 { margin: 0 0 4px; }
.detalhe__regiao { color: #666; margin: 0 0 12px; }
.detalhe__lista { list-style: none; padding: 0; margin: 0; }
.detalhe__lista li { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.detalhe__aviso { margin-top: 12px; color: #8a6d00; background: #fff8dd; padding: 8px; border-radius: 8px; font-size: 13px; }
```

- [ ] **Passo 2: Adicionar `abrirDetalhe` e `fecharDetalhe` em `js/app.js`**

```js
function abrirDetalhe(id) {
  const q = QUADRAS.find(function (x) { return x.id === id; });
  if (!q) return;
  const el = document.getElementById('detalhe');
  el.innerHTML =
    '<button class="detalhe__fechar" id="detalhe-fechar" aria-label="Fechar">&times;</button>' +
    '<img class="detalhe__foto" src="' + fotoDe(q) + '" alt="Foto da ' + q.nome + '">' +
    '<div class="detalhe__corpo">' +
      '<h2>' + q.nome + '</h2>' +
      '<p class="detalhe__regiao">' + q.regiao + '</p>' +
      '<ul class="detalhe__lista">' +
        '<li><strong>Piso:</strong> ' + pisoLabel(q.piso) + '</li>' +
        '<li><strong>Cobertura:</strong> ' + (q.coberta ? 'Coberta' : 'Descoberta') + '</li>' +
        '<li><strong>Conservação:</strong> ' + q.conservacao + '</li>' +
        '<li><strong>Modalidades:</strong> ' + q.modalidades.join(', ') + '</li>' +
        '<li><strong>Equipamentos:</strong> ' + (iconesEquip(q).join(', ') || '—') + '</li>' +
      '</ul>' +
      (q.demo ? '<p class="detalhe__aviso">Dados de demonstração — a substituir por dados reais.</p>' : '') +
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
```

- [ ] **Passo 3: Verificar no navegador**

Recarregue. No console (F12), digite `abrirDetalhe('303-sul')`. Esperado: um painel
desliza da direita mostrando a foto da Praça 303 Sul e a lista de atributos (piso,
cobertura, conservação, modalidades, equipamentos). Clicar no **×** fecha o painel.
Teste também `abrirDetalhe('demo-areia')` → deve aparecer o aviso "Dados de demonstração".

- [ ] **Passo 4: Commit (opcional)**

```bash
git add js/app.js css/estilos.css
git commit -m "feat: painel de detalhe da quadra"
```

---

### Task 6: Sincronização mapa ↔ lista (hover e clique)

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `abrirDetalhe`, `criarIcone`, `marcadores`.
- Produces: `destacar(id, on)` (troca o ícone do pino para a versão destacada);
  `renderCards` e `renderMarcadores` passam a abrir o detalhe no clique; os cards
  destacam o pino no hover.

- [ ] **Passo 1: Adicionar `destacar` em `js/app.js`**

```js
function destacar(id, on) {
  const m = marcadores[id];
  if (m) m.setIcon(criarIcone(on));
}
```

- [ ] **Passo 2: Substituir `renderCards` para ligar clique e hover**

Substitua a função `renderCards` inteira por esta versão (igual à anterior, mas com os
`addEventListener` no final do `forEach`):

```js
function renderCards(lista) {
  const alvo = document.getElementById('lista');
  alvo.innerHTML = '';
  if (!lista.length) {
    alvo.innerHTML = '<p class="vazio">Nenhuma quadra encontrada com esses filtros.</p>';
    return;
  }
  lista.forEach(function (q) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = q.id;
    card.innerHTML =
      '<img class="card__foto" src="' + fotoDe(q) + '" alt="Foto da ' + q.nome + '">' +
      (q.demo ? '<span class="card__demo">demonstração</span>' : '') +
      '<div class="card__corpo">' +
        '<h3 class="card__nome">' + q.nome + '</h3>' +
        '<p class="card__regiao">' + q.regiao + '</p>' +
        '<p class="card__piso">' + pisoLabel(q.piso) + (q.coberta ? ' · coberta' : ' · descoberta') + '</p>' +
        '<p class="card__equip">' + (iconesEquip(q).join(' · ') || '—') + '</p>' +
      '</div>';
    card.addEventListener('click', function () { abrirDetalhe(q.id); });
    card.addEventListener('mouseenter', function () { destacar(q.id, true); });
    card.addEventListener('mouseleave', function () { destacar(q.id, false); });
    alvo.appendChild(card);
  });
}
```

- [ ] **Passo 3: Substituir `renderMarcadores` para abrir detalhe no clique do pino**

Substitua a função `renderMarcadores` inteira por:

```js
function renderMarcadores(lista) {
  camadaMarcadores.clearLayers();
  for (const id in marcadores) delete marcadores[id];
  lista.forEach(function (q) {
    const m = L.marker([q.coordenadas.lat, q.coordenadas.lng], { icon: criarIcone(false) });
    m.bindPopup('<strong>' + q.nome + '</strong><br>' + q.regiao);
    m.on('click', function () { abrirDetalhe(q.id); });
    m.addTo(camadaMarcadores);
    marcadores[q.id] = m;
  });
}
```

- [ ] **Passo 4: Verificar no navegador**

Recarregue. Esperado:
1. Passar o mouse sobre um **card** deixa o **pino correspondente maior e vermelho**;
   tirar o mouse volta ao normal (azul).
2. Clicar num **card** abre o painel de detalhe daquela quadra.
3. Clicar num **pino** também abre o painel de detalhe.

- [ ] **Passo 5: Commit (opcional)**

```bash
git add js/app.js
git commit -m "feat: sincronizacao entre lista e mapa"
```

---

### Task 7: Filtros (piso, modalidade, equipamentos, cobertura)

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/estilos.css`

**Interfaces:**
- Consumes: `QUADRAS`, `renderCards`, `renderMarcadores`.
- Produces: `lerFiltros()`, `quadraTemValor(q, grupo, valor)`, `aplicarFiltros()`
  (filtra e redesenha lista + pinos e atualiza `#contador`). `aplicarFiltros` passa a
  ser a renderização inicial no `iniciar`.

- [ ] **Passo 1: Preencher a `div#filtros` no `index.html`**

Substitua a linha `<div class="filtros" id="filtros"><!-- filtros entram na Task 7 --></div>`
por:

```html
<div class="filtros" id="filtros">
  <fieldset class="filtro-grupo">
    <legend>Piso</legend>
    <label><input type="checkbox" data-grupo="piso" data-valor="areia"> Areia</label>
    <label><input type="checkbox" data-grupo="piso" data-valor="gramado"> Gramado</label>
    <label><input type="checkbox" data-grupo="piso" data-valor="cimento"> Cimento</label>
    <label><input type="checkbox" data-grupo="piso" data-valor="emborrachado"> Emborrachado</label>
  </fieldset>
  <fieldset class="filtro-grupo">
    <legend>Modalidade</legend>
    <label><input type="checkbox" data-grupo="modalidade" data-valor="volei"> Vôlei</label>
    <label><input type="checkbox" data-grupo="modalidade" data-valor="basquete"> Basquete</label>
    <label><input type="checkbox" data-grupo="modalidade" data-valor="futsal"> Futsal</label>
    <label><input type="checkbox" data-grupo="modalidade" data-valor="society"> Society</label>
  </fieldset>
  <fieldset class="filtro-grupo">
    <legend>Equipamentos</legend>
    <label><input type="checkbox" data-grupo="equipamento" data-valor="redeVolei"> Rede de vôlei</label>
    <label><input type="checkbox" data-grupo="equipamento" data-valor="aroBasquete"> Aro de basquete</label>
    <label><input type="checkbox" data-grupo="equipamento" data-valor="traves"> Traves</label>
    <label><input type="checkbox" data-grupo="equipamento" data-valor="iluminacao"> Iluminação</label>
  </fieldset>
  <fieldset class="filtro-grupo">
    <legend>Cobertura</legend>
    <label><input type="checkbox" data-grupo="cobertura" data-valor="coberta"> Coberta</label>
    <label><input type="checkbox" data-grupo="cobertura" data-valor="descoberta"> Descoberta</label>
  </fieldset>
</div>
```

- [ ] **Passo 2: Adicionar estilo dos filtros ao final de `css/estilos.css`**

```css
.filtros { display: flex; gap: 12px; flex-wrap: wrap; }
.filtro-grupo {
  border: 1px solid #e3e3e3; border-radius: 8px; padding: 4px 10px 8px; margin: 0;
}
.filtro-grupo legend { font-size: 12px; color: #666; padding: 0 4px; }
.filtro-grupo label { display: block; font-size: 13px; cursor: pointer; }
```

- [ ] **Passo 3: Adicionar as funções de filtro em `js/app.js`**

```js
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
```

- [ ] **Passo 4: Atualizar `iniciar` para usar filtros**

Substitua a função `iniciar` por:

```js
function iniciar() {
  iniciarMapa();
  aplicarFiltros();
  document.querySelectorAll('.filtros input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', aplicarFiltros);
  });
}
```

- [ ] **Passo 5: Verificar no navegador**

Recarregue. Esperado:
- O `#contador` mostra "6 quadras".
- Marcar **Piso → Areia** deixa só a "Quadra de Areia" (contador "1 quadra") e só 1 pino.
- Marcar **Equipamentos → Aro de basquete** mostra só quadras com aro (some a de areia
  e a de society); lista e pinos mudam juntos.
- Marcar dois pisos (ex.: Areia + Cimento) mostra as dos dois tipos (OR dentro do grupo).
- Combinar grupos (ex.: Cimento + Aro de basquete) aplica os dois ao mesmo tempo (AND
  entre grupos).
- Desmarcar tudo volta a 6 quadras.

- [ ] **Passo 6: Commit (opcional)**

```bash
git add index.html js/app.js css/estilos.css
git commit -m "feat: filtros por piso, modalidade, equipamentos e cobertura"
```

---

### Task 8: Botão "Sugerir quadra" (Google Forms)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: um link `#btn-sugerir` no cabeçalho que abre, em nova aba, o Google Form
  da dupla.

**Nota — criar o Google Form:** a dupla cria um Google Form (grátis, na conta de vocês)
com estes campos, para bater com o modelo de dados:
Nome/referência · Região/bairro · Tipo de piso (areia/gramado/cimento/emborrachado) ·
Modalidades · Equipamentos (rede de vôlei? aro? traves? iluminação?) · Coberta ou
descoberta · Conservação (boa/regular/ruim) · Foto (upload, opcional) · Contato de quem
sugeriu (opcional). Depois copiem o link do Form (botão "Enviar" → ícone de link) e
substituam no `href` abaixo.

- [ ] **Passo 1: Adicionar o botão no cabeçalho do `index.html`**

Logo depois de `</div>` que fecha a `div#filtros`, ainda dentro do `<header>`, adicione:

```html
<a class="btn-sugerir" id="btn-sugerir"
   href="https://forms.gle/SEU-FORMULARIO-AQUI"
   target="_blank" rel="noopener">+ Sugerir quadra</a>
```

- [ ] **Passo 2: Adicionar estilo do botão ao final de `css/estilos.css`**

```css
.btn-sugerir {
  margin-left: auto; background: #2f6fed; color: #fff; text-decoration: none;
  padding: 8px 14px; border-radius: 999px; font-size: 14px; font-weight: 600;
  white-space: nowrap;
}
.btn-sugerir:hover { background: #245bc4; }
```

- [ ] **Passo 3: Verificar no navegador**

Recarregue. Esperado: um botão azul **"+ Sugerir quadra"** no canto direito do cabeçalho.
Clicar abre uma **nova aba** no endereço do `href` (por enquanto o placeholder; depois
vira o link real do Form). Substitua `https://forms.gle/SEU-FORMULARIO-AQUI` pelo link
real quando o Form estiver pronto.

- [ ] **Passo 4: Commit (opcional)**

```bash
git add index.html css/estilos.css
git commit -m "feat: botao sugerir quadra (Google Forms)"
```

---

### Task 9: Responsivo — alternar Mapa/Lista no celular

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/estilos.css`

**Interfaces:**
- Consumes: `map`.
- Produces: `alternarVista(vista)` (`'mapa'` ou `'lista'`) — mostra uma das duas colunas
  no celular, marca o botão ativo e chama `map.invalidateSize()` ao mostrar o mapa
  (senão o mapa fica cinza). No desktop as duas colunas continuam visíveis.

- [ ] **Passo 1: Adicionar o alternador no `index.html`**

Logo no começo do `<main class="app" id="app">`, antes da `<section class="app__lista">`,
adicione:

```html
<div class="alternador">
  <button class="alternador__btn ativo" data-vista="lista">Lista</button>
  <button class="alternador__btn" data-vista="mapa">Mapa</button>
</div>
```

- [ ] **Passo 2: Adicionar CSS responsivo ao final de `css/estilos.css`**

```css
.alternador { display: none; }

@media (max-width: 768px) {
  .app { flex-direction: column; }
  .app__lista { width: 100%; max-width: 100%; border-right: none; flex: 1; }
  .app__mapa { flex: 1; }
  /* #mapa continua com height:100% (da regra base) e agora preenche a coluna */

  .alternador {
    display: flex; gap: 6px; padding: 8px 12px;
    border-bottom: 1px solid #eee; background: #fff;
  }
  .alternador__btn {
    flex: 1; padding: 8px; border: 1px solid #ccc; background: #f7f7f7;
    border-radius: 999px; cursor: pointer; font-size: 14px;
  }
  .alternador__btn.ativo { background: #2f6fed; color: #fff; border-color: #2f6fed; }

  /* mostra só a coluna escolhida */
  .app.mostrar-lista .app__mapa { display: none; }
  .app.mostrar-mapa .app__lista { display: none; }
}
```

- [ ] **Passo 3: Adicionar `alternarVista` em `js/app.js`**

```js
function alternarVista(vista) {
  const app = document.getElementById('app');
  app.classList.toggle('mostrar-mapa', vista === 'mapa');
  app.classList.toggle('mostrar-lista', vista === 'lista');
  document.querySelectorAll('.alternador__btn').forEach(function (b) {
    b.classList.toggle('ativo', b.dataset.vista === vista);
  });
  if (vista === 'mapa' && map) setTimeout(function () { map.invalidateSize(); }, 0);
}
```

- [ ] **Passo 4: Ligar os botões e definir a vista inicial no `iniciar`**

Substitua a função `iniciar` por:

```js
function iniciar() {
  iniciarMapa();
  aplicarFiltros();
  document.querySelectorAll('.filtros input[type="checkbox"]').forEach(function (cb) {
    cb.addEventListener('change', aplicarFiltros);
  });
  document.querySelectorAll('.alternador__btn').forEach(function (b) {
    b.addEventListener('click', function () { alternarVista(b.dataset.vista); });
  });
  alternarVista('lista');
}
```

- [ ] **Passo 5: Verificar no navegador**

No desktop (janela larga): tudo igual — lista e mapa lado a lado; o alternador fica
escondido.

Estreite a janela para ~375px de largura (ou F12 → modo dispositivo/celular e recarregue).
Esperado: aparecem os botões **"Lista / Mapa"** no topo. Começa na **Lista**. Clicar em
**Mapa** mostra o mapa **preenchido corretamente** (não cinza). Clicar em **Lista**
volta para os cards. Os filtros continuam funcionando nas duas vistas.

- [ ] **Passo 6: Commit (opcional)**

```bash
git add index.html js/app.js css/estilos.css
git commit -m "feat: layout responsivo com alternador mapa/lista"
```

---

## Resultado final

Ao terminar as 9 tarefas, abrir o `index.html` entrega o protótipo completo da spec:
mapa de Palmas com pinos, lista de cards sincronizada, detalhe de cada quadra, filtros
combináveis, botão de sugestão (Google Forms) e layout que funciona no celular — tudo
grátis, sem backend e sem instalar nada. Depois é só trocar os dados de exemplo pelos
reais e publicar (ex.: GitHub Pages).
