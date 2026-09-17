// Confere o cadastro de js/dados.js: pega erro de digitação antes de ir pro ar.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = require('../js/regras.js');

const raiz = path.join(__dirname, '..');
const QUADRAS = vm.runInNewContext(fs.readFileSync(path.join(raiz, 'js/dados.js'), 'utf8') + ';QUADRAS');
const valores = (catalogo) => catalogo.map(i => i.valor);

test('ids são únicos', () => {
  const ids = QUADRAS.map(q => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

for (const q of QUADRAS) {
  test(`quadra ${q.id} está com o cadastro válido`, () => {
    assert.ok(q.nome && q.nome.trim(), 'nome vazio');
    assert.ok(valores(R.PISOS).includes(q.piso), `piso "${q.piso}" não existe`);
    assert.ok(q.modalidades.length > 0, 'sem modalidades');
    for (const m of q.modalidades) assert.ok(valores(R.MODALIDADES).includes(m), `modalidade "${m}" não existe`);
    assert.deepEqual(Object.keys(q.equipamentos).sort(), valores(R.EQUIPAMENTOS).sort(), 'equipamentos incompletos');
    assert.deepEqual(Object.keys(q.estrutura).sort(), valores(R.ESTRUTURAS).sort(), 'estrutura incompleta');
    assert.ok(valores(R.CONSERVACOES).includes(q.conservacao), `conservação "${q.conservacao}" não existe`);
    // Palmas fica por volta de -10.18 / -48.33
    assert.ok(q.coordenadas.lat < -9.9 && q.coordenadas.lat > -10.6, 'latitude fora de Palmas');
    assert.ok(q.coordenadas.lng < -48.1 && q.coordenadas.lng > -48.6, 'longitude fora de Palmas');
    for (const foto of q.fotos) assert.ok(fs.existsSync(path.join(raiz, foto)), `foto ${foto} não existe`);
    assert.ok(Array.isArray(q.precisa), 'precisa deve ser lista');
  });
}
