# Formulários no sistema, doações e estrutura — Plano de implementação

> **Execução:** feito inline na mesma sessão em que foi escrito, tarefa por tarefa, com um
> commit por tarefa na branch `feat/formularios-doacoes`. Os testes das tarefas de lógica
> estão escritos aqui na íntegra (eles *são* a especificação); o código de implementação e
> das telas fica nos commits de cada tarefa. Checkbox (`- [ ]`) para acompanhar.

**Goal:** Colocar os formulários de sugestão e doação dentro do site, criar a tela de doação
e o painel de admin, e adicionar bebedouro/banheiro, postes de vôlei, peteca e a quadra 404
Sul — tudo funcionando com dados de mentira e pronto pra ligar no Supabase.

**Architecture:** Toda a lógica sem tela fica em `js/regras.js` (testada no Node). Todo
acesso a dados passa por `js/api.js`, que hoje é um mock sobre `localStorage` criado por
`criarApiMock()`. As telas (`app.js`, `sugerir.js`, `doar.js`, `admin.js`) só conversam com
`Regras`, `Api`, `Icones`, `Form` e `Nav`.

**Tech Stack:** HTML/CSS/JS puro com scripts clássicos, Leaflet 1.9.4, testes com
`node:test` (Node 22, sem dependências).

## Global Constraints

- Pasta: `C:\Users\tiago\OneDrive\Documentos\Meus Projetos\Quadra`. Branch `feat/formularios-doacoes`. **Não** mexer no `main` nem dar push sem pedir.
- Scripts clássicos, sem build. Cada arquivo novo de JS é uma IIFE que publica **um** objeto global (`Regras`, `Api`, `Icones`, `Form`, `Nav`, `Sugerir`, `Doar`) e, no Node, `module.exports`.
- Textos da interface em português; mensagens de erro em português.
- Visual segue `css/estilos.css` (tokens `--ink`, `--teal`, `--sun`, `--coral`…, fontes Bricolage/Figtree/Space Mono, chips `.chip`).
- Tudo funciona em 375 px de largura.
- Mock: prefixo `quadras:` no localStorage; espera de 600 ms; `?falhar=1` na URL faz toda chamada falhar; senha do admin `demo`.
- Mensagens exatas da spec (`docs/superpowers/specs/2026-09-16-formularios-doacoes-design.md`, seções 7, 8 e 11) usadas sem alteração.

## Mapa de arquivos

| Arquivo | Responsabilidade | Tarefa |
|---|---|---|
| `package.json` | `npm test` | 1 |
| `js/regras.js` | catálogos + regras puras | 1 |
| `tests/regras.test.js` | testes de regras | 1 |
| `js/config.js` | `CONFIG` | 2 |
| `js/dados.js` | quadras (404 + campos novos) | 2 |
| `js/api.js` | `criarApiMock` + `window.Api` | 2 |
| `tests/api.test.js` | testes do mock | 2 |
| `js/icones.js` | SVGs e cores dos pisos | 3 |
| `js/navegacao.js` | telas, painéis, histórico | 3 |
| `js/app.js` | mapa, lista, filtros, detalhe | 3 |
| `index.html`, `css/estilos.css` | estrutura e estilos do site | 3, 4, 5 |
| `js/formularios.js` | peças comuns dos formulários | 4 |
| `js/sugerir.js` | painel Sugerir | 4 |
| `js/doar.js` | tela Doar | 5 |
| `admin.html`, `css/admin.css`, `js/admin.js` | painel de admin | 6 |
| `supabase/schema.sql`, `supabase/LEIA-ME.md` | entrega para o Supabase | 7 |

---

### Task 1: Regras e catálogos (`js/regras.js`)

**Files:** Create `package.json`, `js/regras.js`, `tests/regras.test.js`

**Interfaces — Produces (`Regras`):**
- Catálogos (arrays de `{ valor, label }`): `PISOS`, `MODALIDADES`, `EQUIPAMENTOS`, `ESTRUTURAS`, `COBERTURAS`, `CONSERVACOES`, `MATERIAIS`, `ESTADOS_DOACAO`, `ENTREGAS`, `STATUS_DOACAO`
- `rotulo(catalogo, valor) → string` (valor se não achar)
- `normalizarQuadra(q) → quadra` com todos os campos (defaults da spec 4.1)
- `quadraTemValor(q, grupo, valor) → boolean`; grupos `piso | modalidade | equipamento | estrutura | cobertura`
- `filtrarQuadras(quadras, grupos) → quadras` (OU dentro do grupo, E entre grupos)
- `extrairCoordenada(texto) → { lat, lng } | null`
- `gerarIdQuadra(nome, idsExistentes) → string`
- `apenasDigitos(s)`, `formatarWhatsapp(s)`, `whatsappValido(s) → boolean`
- `validarSugestao(form) → { campo: mensagem }` e `montarSugestao(form) → registro`
- `validarDoacao(form) → { campo: mensagem }` e `montarDoacao(form) → registro`
- `mensagemWhatsapp(tipo, registro, nomeQuadra) → string`; `tipo` = `'sugestao' | 'doacao'`

Formato dos dados de formulário:
```js
// sugestão
{ tipo: 'nova'|'correcao'|'', nome, localizacao: {lat,lng}|null, referencia, piso,
  modalidades: [], equipamentos: [chave], estrutura: [chave], coberta: 'sim'|'nao'|'',
  conservacao, foto: dataURL|null, quadraId, descricao, contatoNome, contatoWhatsapp,
  consentimento: bool }
// doação
{ materiais: [valor], outro, quantidade, estado, quadraId: ''|id, entrega, nome, whatsapp,
  consentimento: bool }
```

- [ ] **Step 1: Escrever os testes** — `tests/regras.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/regras.js');

const sugestaoOk = () => ({
  tipo: 'nova', nome: 'Praça da 404 Sul', localizacao: { lat: -10.2, lng: -48.3 },
  referencia: '', piso: 'cimento', modalidades: ['volei'], equipamentos: ['postesVolei'],
  estrutura: ['bebedouro'], coberta: 'nao', conservacao: 'regular', foto: null,
  quadraId: '', descricao: '', contatoNome: '', contatoWhatsapp: '', consentimento: false
});
const doacaoOk = () => ({
  materiais: ['bola-volei'], outro: '', quantidade: '2', estado: 'novo', quadraId: '',
  entrega: 'ponto-coleta', nome: 'Ana', whatsapp: '(63) 99999-0000', consentimento: true
});

test('rotulo devolve label ou o próprio valor', () => {
  assert.equal(R.rotulo(R.MODALIDADES, 'peteca'), 'Peteca');
  assert.equal(R.rotulo(R.MODALIDADES, 'xadrez'), 'xadrez');
});

test('catálogos novos existem', () => {
  assert.ok(R.EQUIPAMENTOS.some(e => e.valor === 'postesVolei'));
  assert.deepEqual(R.ESTRUTURAS.map(e => e.valor), ['bebedouro', 'banheiro']);
});

test('normalizarQuadra preenche campos que faltam', () => {
  const q = R.normalizarQuadra({ id: 'x', nome: 'X', coordenadas: { lat: 1, lng: 2 },
    piso: 'areia', modalidades: ['volei'], equipamentos: { redeVolei: true } });
  assert.equal(q.equipamentos.redeVolei, true);
  assert.equal(q.equipamentos.postesVolei, false);
  assert.deepEqual(q.estrutura, { bebedouro: false, banheiro: false });
  assert.deepEqual(q.precisa, []);
  assert.deepEqual(q.fotos, []);
  assert.equal(q.demo, false);
});

test('quadraTemValor cobre estrutura e cobertura', () => {
  const q = R.normalizarQuadra({ piso: 'cimento', modalidades: ['peteca'],
    equipamentos: { postesVolei: true }, estrutura: { bebedouro: true }, coberta: false });
  assert.equal(R.quadraTemValor(q, 'estrutura', 'bebedouro'), true);
  assert.equal(R.quadraTemValor(q, 'estrutura', 'banheiro'), false);
  assert.equal(R.quadraTemValor(q, 'equipamento', 'postesVolei'), true);
  assert.equal(R.quadraTemValor(q, 'modalidade', 'peteca'), true);
  assert.equal(R.quadraTemValor(q, 'cobertura', 'descoberta'), true);
});

test('filtrarQuadras: OU dentro do grupo, E entre grupos', () => {
  const a = R.normalizarQuadra({ id: 'a', piso: 'areia', modalidades: ['volei'] });
  const b = R.normalizarQuadra({ id: 'b', piso: 'cimento', modalidades: ['futsal'], estrutura: { bebedouro: true } });
  const ids = (l) => l.map(q => q.id);
  assert.deepEqual(ids(R.filtrarQuadras([a, b], {})), ['a', 'b']);
  assert.deepEqual(ids(R.filtrarQuadras([a, b], { piso: ['areia', 'cimento'] })), ['a', 'b']);
  assert.deepEqual(ids(R.filtrarQuadras([a, b], { piso: ['cimento'], estrutura: ['bebedouro'] })), ['b']);
  assert.deepEqual(ids(R.filtrarQuadras([a, b], { piso: ['areia'], estrutura: ['bebedouro'] })), []);
});

test('extrairCoordenada reconhece "lat, lng" e links longos', () => {
  assert.deepEqual(R.extrairCoordenada('-10.2083, -48.3281'), { lat: -10.2083, lng: -48.3281 });
  assert.deepEqual(R.extrairCoordenada('-10.2083,-48.3281'), { lat: -10.2083, lng: -48.3281 });
  assert.deepEqual(
    R.extrairCoordenada('https://www.google.com/maps/place/X/@-10.2026301,-48.3401751,18z'),
    { lat: -10.2026301, lng: -48.3401751 });
  assert.equal(R.extrairCoordenada('https://maps.app.goo.gl/jV779GF8txtxBp9o6'), null);
  assert.equal(R.extrairCoordenada('perto da padaria'), null);
  assert.equal(R.extrairCoordenada('95.1, 10.2'), null);
  assert.equal(R.extrairCoordenada(''), null);
});

test('gerarIdQuadra cria slug sem acento e único', () => {
  assert.equal(R.gerarIdQuadra('Praça da 404 Sul', []), 'praca-da-404-sul');
  assert.equal(R.gerarIdQuadra('Praça da 404 Sul', ['praca-da-404-sul']), 'praca-da-404-sul-2');
  assert.equal(R.gerarIdQuadra('  !!  ', []), 'quadra');
});

test('WhatsApp: dígitos, máscara e validação', () => {
  assert.equal(R.apenasDigitos('(63) 99999-0000'), '63999990000');
  assert.equal(R.formatarWhatsapp('63999990000'), '(63) 99999-0000');
  assert.equal(R.formatarWhatsapp('6332150000'), '(63) 3215-0000');
  assert.equal(R.formatarWhatsapp('639'), '(63) 9');
  assert.equal(R.formatarWhatsapp('6399999000012345'), '(63) 99999-0000');
  assert.equal(R.whatsappValido('(63) 99999-0000'), true);
  assert.equal(R.whatsappValido('9999-0000'), false);
});

test('validarSugestao nova: ok e erros por campo', () => {
  assert.deepEqual(R.validarSugestao(sugestaoOk()), {});
  const f = Object.assign(sugestaoOk(), { nome: ' ', localizacao: null, referencia: '', piso: '', modalidades: [] });
  const e = R.validarSugestao(f);
  assert.deepEqual(Object.keys(e).sort(), ['localizacao', 'modalidades', 'nome', 'piso']);
  assert.ok(R.validarSugestao(Object.assign(sugestaoOk(), { localizacao: null, referencia: 'perto da escola' })).localizacao === undefined);
});

test('validarSugestao: sem tipo, correção e consentimento', () => {
  assert.ok(R.validarSugestao(Object.assign(sugestaoOk(), { tipo: '' })).tipo);
  const c = Object.assign(sugestaoOk(), { tipo: 'correcao', quadraId: '', descricao: 'curto' });
  assert.deepEqual(Object.keys(R.validarSugestao(c)).sort(), ['descricao', 'quadraId']);
  const comContato = Object.assign(sugestaoOk(), { contatoNome: 'Bia' });
  assert.ok(R.validarSugestao(comContato).consentimento);
  assert.deepEqual(R.validarSugestao(Object.assign(comContato, { consentimento: true })), {});
  assert.ok(R.validarSugestao(Object.assign(sugestaoOk(), { contatoWhatsapp: '123', consentimento: true })).contatoWhatsapp);
});

test('montarSugestao nova converte listas em objetos e limpa', () => {
  const r = R.montarSugestao(Object.assign(sugestaoOk(), { nome: '  Praça X ', contatoWhatsapp: '(63) 99999-0000' }));
  assert.equal(r.tipo, 'nova');
  assert.equal(r.nome, 'Praça X');
  assert.equal(r.coberta, false);
  assert.equal(r.equipamentos.postesVolei, true);
  assert.equal(r.equipamentos.redeVolei, false);
  assert.deepEqual(r.estrutura, { bebedouro: true, banheiro: false });
  assert.equal(r.contatoWhatsapp, '63999990000');
  assert.equal('descricao' in r, false);
});

test('montarSugestao correção só leva o necessário', () => {
  const r = R.montarSugestao(Object.assign(sugestaoOk(), { tipo: 'correcao', quadraId: '303-sul', descricao: '  Não tem mais aro de basquete  ' }));
  assert.deepEqual(Object.keys(r).sort(), ['contatoNome', 'contatoWhatsapp', 'descricao', 'quadraId', 'tipo']);
  assert.equal(r.descricao, 'Não tem mais aro de basquete');
});

test('validarDoacao: ok e erros', () => {
  assert.deepEqual(R.validarDoacao(doacaoOk()), {});
  const e = R.validarDoacao({ materiais: [], outro: '', quantidade: '0', estado: '', quadraId: '', entrega: '', nome: '', whatsapp: '12', consentimento: false });
  assert.deepEqual(Object.keys(e).sort(), ['consentimento', 'entrega', 'estado', 'materiais', 'nome', 'quantidade', 'whatsapp']);
  assert.ok(R.validarDoacao(Object.assign(doacaoOk(), { materiais: ['outro'], outro: ' ' })).outro);
  assert.ok(R.validarDoacao(Object.assign(doacaoOk(), { quantidade: '100' })).quantidade);
});

test('montarDoacao resolve rótulos e "Outro"', () => {
  const r = R.montarDoacao(Object.assign(doacaoOk(), { materiais: ['bola-volei', 'outro'], outro: ' cones ', quadraId: '404-sul' }));
  assert.deepEqual(r.materiais, ['Bola de vôlei', 'Outro: cones']);
  assert.equal(r.quantidade, 2);
  assert.equal(r.quadraId, '404-sul');
  assert.equal(r.whatsapp, '63999990000');
  assert.equal(R.montarDoacao(doacaoOk()).quadraId, null);
});

test('mensagemWhatsapp monta texto legível', () => {
  const d = R.montarDoacao(doacaoOk());
  const m = R.mensagemWhatsapp('doacao', d, null);
  assert.match(m, /Quero doar/);
  assert.match(m, /Bola de vôlei/);
  assert.match(m, /Onde precisar mais/);
  assert.match(m, /Levo no ponto de coleta/);
  const s = R.mensagemWhatsapp('sugestao', R.montarSugestao(sugestaoOk()), null);
  assert.match(s, /Praça da 404 Sul/);
  assert.match(s, /-10.2, -48.3/);
  const c = R.mensagemWhatsapp('sugestao', R.montarSugestao(Object.assign(sugestaoOk(), { tipo: 'correcao', quadraId: '303-sul', descricao: 'Sem aro agora' })), 'Praça 303 Sul');
  assert.match(c, /corrigir/);
  assert.match(c, /Praça 303 Sul/);
});
```

- [ ] **Step 2:** Criar `package.json` (`{"private": true, "scripts": {"test": "node --test tests/"}}`) e rodar `npm test` → **FAIL** (`Cannot find module '../js/regras.js'`).
- [ ] **Step 3:** Implementar `js/regras.js` (IIFE → `window.Regras` / `module.exports`) com as funções da interface.
- [ ] **Step 4:** `npm test` → **PASS** em todos.
- [ ] **Step 5:** Commit `feat: regras e catálogos testados (regras.js)`.

---

### Task 2: Dados, config e API de mentira

**Files:** Create `js/config.js`, `js/api.js`, `tests/api.test.js`; Modify `js/dados.js`

**Interfaces:**
- Consumes: `Regras.normalizarQuadra`, `Regras.gerarIdQuadra`, `Regras.STATUS_DOACAO`
- Produces: `criarApiMock({ storage, quadrasBase, atraso = 600, falhar = false, agora, novoId }) → Api` com os métodos da spec 6.1; no navegador `window.Api` (+ `Api.modo === 'demonstracao'`). `CONFIG` global.

- [ ] **Step 1: Escrever os testes** — `tests/api.test.js`

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { criarApiMock } = require('../js/api.js');

function memoria() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _m: m
  };
}
const base = [{ id: '404-sul', nome: 'Praça 404 Sul', coordenadas: { lat: -10.2, lng: -48.3 },
  piso: 'cimento', modalidades: ['volei'], equipamentos: {} }];
let seq = 0;
const nova = (extra) => criarApiMock(Object.assign({ storage: memoria(), quadrasBase: base, atraso: 0,
  agora: () => '2026-09-17T12:00:00.000Z', novoId: () => 'id' + (++seq) }, extra));

const sugestaoNova = () => ({ tipo: 'nova', nome: 'Praça da 105 Norte', localizacao: { lat: -10.18, lng: -48.33 },
  referencia: '', piso: 'areia', modalidades: ['volei'], equipamentos: { redeVolei: true },
  estrutura: { bebedouro: false, banheiro: true }, coberta: false, conservacao: 'boa', foto: null,
  contatoNome: '', contatoWhatsapp: '' });

test('listarQuadras devolve a base normalizada', async () => {
  const api = nova();
  const q = await api.listarQuadras();
  assert.equal(q.length, 1);
  assert.deepEqual(q[0].estrutura, { bebedouro: false, banheiro: false });
});

test('enviarSugestao grava pendente com id e data', async () => {
  const api = nova();
  const r = await api.enviarSugestao(sugestaoNova());
  assert.equal(r.status, 'pendente');
  assert.ok(r.id);
  assert.equal(r.criadoEm, '2026-09-17T12:00:00.000Z');
});

test('admin exige sessão e senha demo', async () => {
  const api = nova();
  await assert.rejects(api.listarSugestoes('pendente'), /login/);
  await assert.rejects(api.entrar('a@b.com', 'errada'), /incorretos/);
  await api.entrar('a@b.com', 'demo');
  assert.deepEqual(await api.sessaoAtual(), { email: 'a@b.com' });
  await api.sair();
  assert.equal(await api.sessaoAtual(), null);
});

test('aprovar sugestão nova publica a quadra', async () => {
  const api = nova();
  const s = await api.enviarSugestao(sugestaoNova());
  await api.entrar('a@b.com', 'demo');
  assert.equal((await api.listarSugestoes('pendente')).length, 1);
  await api.aprovarSugestao(s.id);
  assert.equal((await api.listarSugestoes('pendente')).length, 0);
  assert.equal((await api.listarSugestoes('aprovada')).length, 1);
  const quadras = await api.listarQuadras();
  const criada = quadras.find(q => q.nome === 'Praça da 105 Norte');
  assert.ok(criada);
  assert.equal(criada.id, 'praca-da-105-norte');
  assert.deepEqual(criada.coordenadas, { lat: -10.18, lng: -48.33 });
  assert.equal(criada.equipamentos.redeVolei, true);
  assert.equal(criada.estrutura.banheiro, true);
});

test('aprovar sugestão sem coordenadas falha', async () => {
  const api = nova();
  const s = await api.enviarSugestao(Object.assign(sugestaoNova(), { localizacao: null, referencia: 'perto da escola' }));
  await api.entrar('a@b.com', 'demo');
  await assert.rejects(api.aprovarSugestao(s.id), /Sem coordenadas/);
});

test('correção aprovada não cria quadra; recusar marca recusada', async () => {
  const api = nova();
  const c = await api.enviarSugestao({ tipo: 'correcao', quadraId: '404-sul', descricao: 'Tem banheiro agora', contatoNome: '', contatoWhatsapp: '' });
  const n = await api.enviarSugestao(sugestaoNova());
  await api.entrar('a@b.com', 'demo');
  await api.aprovarSugestao(c.id);
  await api.recusarSugestao(n.id);
  assert.equal((await api.listarQuadras()).length, 1);
  assert.equal((await api.listarSugestoes('recusada')).length, 1);
});

test('doações: status inicial, mudança e contador de peças entregues', async () => {
  const api = nova();
  const d1 = await api.enviarDoacao({ materiais: ['Bola de vôlei'], quantidade: 3, estado: 'novo', quadraId: null, entrega: 'combinar', nome: 'Ana', whatsapp: '63999990000' });
  await api.enviarDoacao({ materiais: ['Cones'], quantidade: 5, estado: 'novo', quadraId: null, entrega: 'combinar', nome: 'Bia', whatsapp: '63999990001' });
  assert.equal(d1.status, 'nova');
  assert.equal(await api.contarDoacoesEntregues(), 0);
  await api.entrar('a@b.com', 'demo');
  await api.mudarStatusDoacao(d1.id, 'entregue');
  assert.equal(await api.contarDoacoesEntregues(), 3);
  await assert.rejects(api.mudarStatusDoacao(d1.id, 'sumiu'), /Status inválido/);
  assert.equal((await api.listarDoacoes()).length, 2);
});

test('falhar=true rejeita tudo; storage cheio dá mensagem clara', async () => {
  await assert.rejects(nova({ falhar: true }).listarQuadras(), /Não foi possível/);
  const cheio = memoria();
  cheio.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(nova({ storage: cheio }).enviarSugestao(sugestaoNova()), /Espaço do navegador cheio/);
});
```

- [ ] **Step 2:** `npm test` → FAIL (`Cannot find module '../js/api.js'`).
- [ ] **Step 3:** Criar `js/config.js` (spec 4.4), atualizar `js/dados.js` (spec 5: 404 Sul, postes, estrutura, peteca, precisa; exemplos com campos novos vazios) e implementar `js/api.js`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: api de mentira, config e quadra 404 Sul`.

---

### Task 3: Site — navegação, filtros, cards e detalhe novos

**Files:** Create `js/icones.js`, `js/navegacao.js`; Modify `js/app.js`, `index.html`, `css/estilos.css`

**Interfaces:**
- Consumes: `Regras.*`, `Api.listarQuadras`
- Produces:
  - `Icones.svg(chave) → string` (chaves: todos os `valor` de EQUIPAMENTOS e ESTRUTURAS + `doar, mais, gps, foto, whatsapp, voltar, check, x, direcao`); `Icones.corDoPiso(piso)`; `Icones.LINHAS_QUADRA`
  - `Nav.registrarPainel(nome, { el, aoFechar })`, `Nav.abrirPainel(nome)`, `Nav.pedirFechar()`, `Nav.irParaDoar()`, `Nav.voltarParaMapa()`, `Nav.telaAtual() → 'mapa'|'doar'`, `Nav.aoMostrarTela = fn(tela)`, `Nav.iniciar()` — regras da spec 9, estado do histórico `{ tela, painel }`
  - `App.quadras` (array carregado), `App.abrirDetalhe(id)`, `App.aoCarregar(fn(quadras))`
- DOM: `#tela-mapa` (filtros + `.app`), `#tela-doar`, `aside#detalhe.painel.detalhe`, `aside#sugerir.painel`, botões `#btn-doar` e `#btn-sugerir` no topbar; filtros renderizados em `#filtros` a partir dos catálogos.

- [ ] **Step 1:** Extrair SVGs e cores para `js/icones.js` (+ ícones postes, bebedouro, banheiro e de interface).
- [ ] **Step 2:** Criar `js/navegacao.js`; trocar o controle de histórico do `app.js` por `Nav`.
- [ ] **Step 3:** `app.js`: carregar com `Api.listarQuadras()` (estados "Carregando quadras…" / erro com **Tentar de novo**), filtros gerados dos catálogos (grupos Piso, Modalidade, Equipamentos, Estrutura, Cobertura), filtrar com `Regras.filtrarQuadras`.
- [ ] **Step 4:** Card: ícones de estrutura após divisor, selo "Precisa de doação". Detalhe: ordem da spec 7.3 (estrutura com Tem/Não tem, aviso da rede, bloco "Precisa de doação" + **Quero doar**, link **Algo errado? Sugerir correção**, rodapé Como chegar).
- [ ] **Step 5:** `index.html`: topbar com **Doar materiais** e **Sugerir quadra** (só ícone no celular), `#tela-mapa`, `#tela-doar` (vazia por enquanto), `aside#sugerir`; scripts na ordem `config, dados, regras, api, icones, navegacao, formularios, sugerir, doar, app`.
- [ ] **Step 6: Verificar no navegador (servidor local):**
  - 7 quadras, 404 no lugar; filtro Bebedouro → só a 404; Peteca → só a 404; Postes → 303, 507, 404.
  - Card da 404 com selo; detalhe com aviso "Tem postes de vôlei — leve sua rede.", Estrutura (Bebedouro Tem / Banheiro Não tem) e "Precisa de doação: Rede de vôlei".
  - `?falhar=1` → mensagem de erro + Tentar de novo.
  - Voltar do navegador com detalhe aberto → fecha; sem erros no console; 375 px ok.
- [ ] **Step 7:** `npm test` → PASS. Commit `feat: estrutura, postes, peteca e navegação com histórico`.

---

### Task 4: Painel "Sugerir quadra"

**Files:** Create `js/formularios.js`, `js/sugerir.js`; Modify `index.html`, `css/estilos.css`

**Interfaces:**
- Consumes: `Regras.validarSugestao/montarSugestao/extrairCoordenada/mensagemWhatsapp`, `Api.enviarSugestao`, `Nav`, `CONFIG.whatsappProjeto`
- Produces:
  - `Form.renderChips(container, { nome, opcoes, multiplo, comCor })`, `Form.lerChips(raiz, nome) → string|string[]`, `Form.marcarChips(raiz, nome, valores)`
  - `Form.mostrarErros(raiz, erros)`, `Form.limparErros(raiz)`
  - `Form.enviando(botao, sim)`, `Form.mostrarSucesso(raiz, { titulo, texto, aoEnviarOutra })`, `Form.mostrarFalha(raiz, { aoTentar, textoWhatsapp })`, `Form.esconderFalha(raiz)`
  - `Form.reduzirFoto(arquivo) → Promise<dataURL>` (≤1600 px, JPEG, recusa > 10 MB)
  - `Form.ligarMascaraWhatsapp(input)`, `Form.linkWhatsapp(texto) → url|null`, `Form.ehRobo(form) → boolean`
  - `Sugerir.abrir({ tipo, quadraId })`, `Sugerir.definirQuadras(quadras)`

- [ ] **Step 1:** `js/formularios.js` + estilos de formulário (`.campo`, `.campo--erro`, `.campo__erro`, `.form-falha`, `.form-sucesso`, `.hp`).
- [ ] **Step 2:** Marcação de `aside#sugerir` (cabeçalho com ×, corpo com os campos da spec 7.4, rodapé com **Enviar sugestão**) e `js/sugerir.js` (tipo nova/correção, GPS, coordenada colada, foto com prévia, LGPD condicional, envio, sucesso/falha).
- [ ] **Step 3: Verificar no navegador:**
  - Topbar **Sugerir quadra** abre; × / Esc / voltar fecham.
  - Enviar vazio → escolher tipo; "nova" vazio → erros em nome, localização, piso, modalidades e foco no primeiro.
  - Colar `-10.2100, -48.3300` → "📍 Coordenada reconhecida"; enviar → sucesso; "Enviar outra" limpa.
  - Preencher nome de contato sem marcar a caixinha → erro de consentimento.
  - Detalhe → "Algo errado? Sugerir correção" → abre em correção com a quadra escolhida.
  - `?falhar=1` → falha com Tentar de novo, dados preservados.
  - GPS negado → mensagem e foco no campo de referência.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: painel sugerir quadra dentro do site`.

---

### Task 5: Tela "Doar materiais"

**Files:** Create `js/doar.js`; Modify `index.html`, `css/estilos.css`

**Interfaces:**
- Consumes: `Regras.validarDoacao/montarDoacao/mensagemWhatsapp/MATERIAIS/ESTADOS_DOACAO/ENTREGAS`, `Api.enviarDoacao/contarDoacoesEntregues`, `Nav`, `Form`, `CONFIG.pontoColeta`, `Icones`
- Produces: `Doar.definirQuadras(quadras)`, `Doar.abrirComQuadra(id)`, `Doar.aoMostrar()`

- [ ] **Step 1:** Marcação de `#tela-doar` (spec 7.5: cabeçalho + contador, Como funciona, Ponto de coleta, Quadras que precisam, formulário) e `js/doar.js`.
- [ ] **Step 2:** Ligar **Quero doar** do detalhe → `Doar.abrirComQuadra(id)`; topbar **Doar materiais** → `Nav.irParaDoar()`.
- [ ] **Step 3: Verificar no navegador:**
  - Topbar abre a tela; "Voltar para o mapa" e voltar do navegador voltam; mapa volta sem ficar cinza.
  - Abrir `/#doar` direto → tela Doar; "Voltar para o mapa" não sai do site.
  - Cartões de 303, 507 e 404 com os itens; **Doar pra esta** preenche a quadra e rola até o formulário.
  - Detalhe da 404 → **Quero doar** → tela Doar com 404 escolhida; voltar → mapa (sem passo morto).
  - Ponto de coleta mostra "A definir"; sem botão Como chegar (maps vazio).
  - Enviar vazio → erros; "Outro" sem texto → erro; enviar ok → "Obrigado! Vamos te chamar no WhatsApp pra combinar a entrega."
  - Contador escondido com 0.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: tela de doação de materiais`.

---

### Task 6: Painel de admin

**Files:** Create `admin.html`, `css/admin.css`, `js/admin.js`

**Interfaces:** Consumes `Api.entrar/sair/sessaoAtual/listarSugestoes/aprovarSugestao/recusarSugestao/listarDoacoes/mudarStatusDoacao/listarQuadras`, `Regras` (rótulos), `Form.linkWhatsapp` não (admin abre `wa.me/55…` do contato).

- [ ] **Step 1:** `admin.html` (noindex, faixa "Modo demonstração — dados só neste navegador." quando `Api.modo === 'demonstracao'`), login, abas Sugestões (Pendentes/Aprovadas/Recusadas) e Doações, botão Sair.
- [ ] **Step 2:** `js/admin.js`: render dos itens (spec 7.6), confirmar antes de aprovar/recusar, Aprovar desabilitado sem coordenadas com a dica, seletor de status das doações, aviso "Não foi possível salvar. Tente de novo." em falha.
- [ ] **Step 3: Verificar no navegador:**
  - Senha errada → erro; `demo` → entra; recarregar mantém sessão; Sair volta ao login.
  - Sugestão da Task 4 em Pendentes com "ver no mapa" e contato; **Aprovar** → some de Pendentes; site mostra a quadra nova no lugar da coordenada.
  - Doação da Task 5: mudar para `entregue` → contador da tela Doar mostra "2 materiais já entregues" (ou a quantidade enviada).
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: painel de admin em modo demonstração`.

---

### Task 7: Entrega para o Supabase

**Files:** Create `supabase/schema.sql`, `supabase/LEIA-ME.md`

- [ ] **Step 1:** `schema.sql` (spec 10.1–10.2): tabelas `quadras`, `sugestoes`, `doacoes`, `admins` com `check`s alinhados a `Regras`; `is_admin()`; RLS; `total_materiais_entregues()`; buckets `fotos-sugestoes` e `fotos-quadras` com políticas.
- [ ] **Step 2:** `LEIA-ME.md` (spec 10.3) com mapa de nomes (camelCase ↔ snake_case), passo a passo, esboço de cada função do `api.js` com `supabase-js` e a checklist de teste.
- [ ] **Step 3:** Revisar o SQL contra os `check`s de `Regras` (valores de catálogo iguais).
- [ ] **Step 4:** Commit `docs: rascunho do banco Supabase e guia de conexão`.

---

### Task 8: Verificação final

- [ ] Rodar a checklist completa da spec seção 12 (site + admin) em desktop e 375 px.
- [ ] `npm test` → PASS.
- [ ] Console sem erros em `index.html` e `admin.html`.
- [ ] Commit de correções que aparecerem; perguntar ao Tiago antes de dar push da branch.
