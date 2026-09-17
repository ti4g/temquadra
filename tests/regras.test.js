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
  assert.deepEqual(R.extrairCoordenada('https://www.google.com/maps/search/-10.213890,+-48.353970?entry=tts'),
    { lat: -10.21389, lng: -48.35397 });
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
