// Garante que as listas permitidas no banco (supabase/schema.sql) são as mesmas do site (js/regras.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../js/regras.js');

const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');
const valores = (catalogo) => catalogo.map(i => i.valor).sort();

// pega os valores de "coluna in ('a', 'b')" dentro do create table indicado
function listaDoCheck(tabela, coluna) {
  const bloco = sql.match(new RegExp('create table public\\.' + tabela + ' \\(([\\s\\S]*?)\\n\\);'));
  assert.ok(bloco, 'tabela ' + tabela + ' não encontrada');
  const m = bloco[1].match(new RegExp('\\b' + coluna + " in \\(([^)]*)\\)"));
  assert.ok(m, 'check de ' + tabela + '.' + coluna + ' não encontrado');
  return m[1].split(',').map(v => v.trim().replace(/^'|'$/g, '')).sort();
}

test('pisos iguais', () => assert.deepEqual(listaDoCheck('quadras', 'piso'), valores(R.PISOS)));
test('conservação igual', () => assert.deepEqual(listaDoCheck('quadras', 'conservacao'), valores(R.CONSERVACOES)));
test('estados de doação iguais', () => assert.deepEqual(listaDoCheck('doacoes', 'estado'), valores(R.ESTADOS_DOACAO)));
test('formas de entrega iguais', () => assert.deepEqual(listaDoCheck('doacoes', 'entrega'), valores(R.ENTREGAS)));
test('status de doação iguais', () => assert.deepEqual(listaDoCheck('doacoes', 'status'), valores(R.STATUS_DOACAO)));

test('modalidades iguais', () => {
  const m = sql.match(/modalidades <@ array\[([^\]]*)\]/);
  assert.ok(m, 'check de modalidades não encontrado');
  assert.deepEqual(m[1].split(',').map(v => v.trim().replace(/^'|'$/g, '')).sort(), valores(R.MODALIDADES));
});

test('RLS ligada em todas as tabelas', () => {
  for (const tabela of ['quadras', 'sugestoes', 'doacoes', 'admins']) {
    assert.match(sql, new RegExp('alter table public\\.' + tabela + '\\s+enable row level security'));
  }
});
