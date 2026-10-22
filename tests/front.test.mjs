// Testes das funções puras do front novo (js/core).
import test from 'node:test';
import assert from 'node:assert/strict';
import { escaparHtml, normalizarTexto, extrairCoordenada, formatarWhatsapp } from '../js/core/utils.js';
import { normalizarQuadra, extrasDaApi, infoPiso, distanciaKm, formatarDistancia, linkRota, imagemPadrao } from '../js/core/quadra.js';

const respostaApi = {
    idQuadra: 'abc',
    nome: 'Praça 303 Sul',
    descricao: null,
    endereco: 'Praça da 303 Sul',
    latitude: -10.203135,
    longitude: -48.340401,
    bairroRegiao: '303 Sul',
    tipoPiso: 'CIMENTO',
    cobertura: 'DESCOBERTA',
    iluminacao: true,
    acessibilidade: false,
    ativa: true,
    fotos: [{ idQuadraImage: 'f1', urlMinio: 'http://localhost:9000/quadras/f1.jpg' }]
};

test('escaparHtml neutraliza tags e aspas', () => {
    assert.equal(escaparHtml('<img src="x" onerror=\'y\'>'), '&lt;img src=&quot;x&quot; onerror=&#39;y&#39;&gt;');
    assert.equal(escaparHtml(null), '');
});

test('normalizarTexto ignora acento e caixa', () => {
    assert.equal(normalizarTexto('  Ginásio PRAÇA '), 'ginasio praca');
});

test('extrairCoordenada lê par solto e link do Google Maps', () => {
    assert.deepEqual(extrairCoordenada('-10.2083, -48.3281'), { lat: -10.2083, lng: -48.3281 });
    assert.deepEqual(extrairCoordenada('https://maps.google.com/@-10.21389,-48.35397,17z'), { lat: -10.21389, lng: -48.35397 });
    assert.equal(extrairCoordenada('sem coordenada'), null);
});

test('formatarWhatsapp aplica a máscara enquanto digita', () => {
    assert.equal(formatarWhatsapp('63'), '(63');
    assert.equal(formatarWhatsapp('6399999'), '(63) 9999-9');
    assert.equal(formatarWhatsapp('63999998888'), '(63) 99999-8888');
});

test('normalizarQuadra traduz a resposta da API', () => {
    const q = normalizarQuadra(respostaApi);
    assert.equal(q.id, 'abc');
    assert.equal(q.bairro, '303 Sul');
    assert.equal(q.lat, -10.203135);
    assert.equal(q.capa, 'http://localhost:9000/quadras/f1.jpg');
    assert.equal(q.banheiro, false);
    assert.equal('acessibilidade' in q, false);
});

test('quadra sem foto usa a ilustração e sem coordenada fica fora do mapa', () => {
    const q = normalizarQuadra({ ...respostaApi, fotos: [], latitude: null });
    assert.equal(q.capa, imagemPadrao('CIMENTO'));
    assert.equal(q.lat, null);
    assert.equal(q.lng, null);
});

test('extrasDaApi só liga o que a API manda', () => {
    assert.deepEqual(extrasDaApi([respostaApi]), []);
    assert.deepEqual(extrasDaApi([respostaApi, { ...respostaApi, bebedouro: false }]), ['bebedouro']);
    assert.deepEqual(extrasDaApi(null), []);
});

test('piso desconhecido cai em "Outro piso"', () => {
    assert.equal(infoPiso('LAMA').nome, 'Outro piso');
    assert.equal(infoPiso('AREIA').nome, 'Areia');
});

test('distância entre as praças 303 e 507 Sul é de uns 2 km', () => {
    const km = distanciaKm({ lat: -10.203135, lng: -48.340401 }, { lat: -10.21389, lng: -48.35397 });
    assert.ok(km > 1.7 && km < 2.0, `deu ${km}`);
    assert.equal(formatarDistancia(0.4321), '430 m');
    assert.equal(formatarDistancia(1.84), '1,8 km');
    assert.equal(formatarDistancia(null), '');
});

test('linkRota aponta pro destino no Google Maps', () => {
    assert.equal(linkRota({ lat: -10.2, lng: -48.3 }), 'https://www.google.com/maps/dir/?api=1&destination=-10.2,-48.3');
});
