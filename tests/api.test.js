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
