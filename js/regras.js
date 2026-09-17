/* Quadras de Palmas — catálogos e regras sem tela.
   Funciona no navegador (window.Regras) e no Node (require), onde é testado:
   npm test */
(function (raiz) {
  'use strict';

  // ===== Catálogos ({ valor, label }) =====
  const PISOS = [
    { valor: 'areia', label: 'Areia' },
    { valor: 'gramado', label: 'Gramado' },
    { valor: 'cimento', label: 'Cimento' },
    { valor: 'emborrachado', label: 'Emborrachado' }
  ];
  const MODALIDADES = [
    { valor: 'volei', label: 'Vôlei' },
    { valor: 'basquete', label: 'Basquete' },
    { valor: 'futsal', label: 'Futsal' },
    { valor: 'society', label: 'Society' },
    { valor: 'peteca', label: 'Peteca' }
  ];
  const EQUIPAMENTOS = [
    { valor: 'postesVolei', label: 'Postes de vôlei' },
    { valor: 'redeVolei', label: 'Rede de vôlei' },
    { valor: 'aroBasquete', label: 'Aro de basquete' },
    { valor: 'traves', label: 'Traves' },
    { valor: 'iluminacao', label: 'Iluminação' }
  ];
  const ESTRUTURAS = [
    { valor: 'bebedouro', label: 'Bebedouro' },
    { valor: 'banheiro', label: 'Banheiro' }
  ];
  const COBERTURAS = [
    { valor: 'coberta', label: 'Coberta' },
    { valor: 'descoberta', label: 'Descoberta' }
  ];
  const CONSERVACOES = [
    { valor: 'boa', label: 'Boa' },
    { valor: 'regular', label: 'Regular' },
    { valor: 'ruim', label: 'Ruim' }
  ];
  const MATERIAIS = [
    { valor: 'bola-volei', label: 'Bola de vôlei' },
    { valor: 'bola-futsal', label: 'Bola de futsal' },
    { valor: 'bola-basquete', label: 'Bola de basquete' },
    { valor: 'rede-volei', label: 'Rede de vôlei' },
    { valor: 'peteca', label: 'Peteca' },
    { valor: 'coletes', label: 'Coletes' },
    { valor: 'cones', label: 'Cones' },
    { valor: 'outro', label: 'Outro' }
  ];
  const ESTADOS_DOACAO = [
    { valor: 'novo', label: 'Novo' },
    { valor: 'usado-bom', label: 'Usado, bom estado' },
    { valor: 'usado-desgaste', label: 'Usado, com desgaste' }
  ];
  const ENTREGAS = [
    { valor: 'ponto-coleta', label: 'Levo no ponto de coleta' },
    { valor: 'combinar', label: 'Prefiro combinar' }
  ];
  const STATUS_DOACAO = [
    { valor: 'nova', label: 'Nova' },
    { valor: 'combinada', label: 'Combinada' },
    { valor: 'recebida', label: 'Recebida' },
    { valor: 'entregue', label: 'Entregue' }
  ];

  function rotulo(catalogo, valor) {
    const item = catalogo.find(function (i) { return i.valor === valor; });
    return item ? item.label : valor;
  }

  function texto(v) { return String(v == null ? '' : v).trim(); }
  function lista(v) { return Array.isArray(v) ? v : []; }

  // { chave: true|false } para todas as chaves do catálogo
  function booleanosDeObjeto(catalogo, origem) {
    const obj = {};
    catalogo.forEach(function (i) { obj[i.valor] = !!(origem && origem[i.valor] === true); });
    return obj;
  }
  function booleanosDeLista(catalogo, chaves) {
    const obj = {};
    catalogo.forEach(function (i) { obj[i.valor] = lista(chaves).indexOf(i.valor) !== -1; });
    return obj;
  }

  // ===== Quadras =====
  function normalizarQuadra(q) {
    q = q || {};
    return Object.assign({}, q, {
      regiao: q.regiao || '',
      modalidades: lista(q.modalidades).slice(),
      equipamentos: booleanosDeObjeto(EQUIPAMENTOS, q.equipamentos),
      estrutura: booleanosDeObjeto(ESTRUTURAS, q.estrutura),
      coberta: q.coberta === true,
      conservacao: q.conservacao || '',
      fotos: lista(q.fotos).slice(),
      maps: q.maps || '',
      precisa: lista(q.precisa).slice(),
      demo: q.demo === true
    });
  }

  function quadraTemValor(q, grupo, valor) {
    switch (grupo) {
      case 'piso': return q.piso === valor;
      case 'modalidade': return lista(q.modalidades).indexOf(valor) !== -1;
      case 'equipamento': return !!(q.equipamentos && q.equipamentos[valor] === true);
      case 'estrutura': return !!(q.estrutura && q.estrutura[valor] === true);
      case 'cobertura': return valor === 'coberta' ? q.coberta === true : q.coberta !== true;
      default: return false;
    }
  }

  // OU dentro de um grupo, E entre grupos. Grupo vazio não filtra.
  function filtrarQuadras(quadras, grupos) {
    grupos = grupos || {};
    const ativos = Object.keys(grupos).filter(function (g) { return lista(grupos[g]).length; });
    return quadras.filter(function (q) {
      return ativos.every(function (g) {
        return grupos[g].some(function (v) { return quadraTemValor(q, g, v); });
      });
    });
  }

  // "-10.2083, -48.3281", "…/@-10.20,-48.34,18z" ou "…/search/-10.21,+-48.35"
  function extrairCoordenada(entrada) {
    if (!entrada) return null;
    const re = /(?<![\d.])(-?\d{1,2}\.\d+)\s*,\s*\+?(-?\d{1,3}\.\d+)(?![\d.])/g;
    let m;
    while ((m = re.exec(String(entrada))) !== null) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: lat, lng: lng };
    }
    return null;
  }

  function gerarIdQuadra(nome, idsExistentes) {
    const base = String(nome || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'quadra';
    const usados = new Set(lista(idsExistentes));
    if (!usados.has(base)) return base;
    let n = 2;
    while (usados.has(base + '-' + n)) n++;
    return base + '-' + n;
  }

  // ===== WhatsApp =====
  function apenasDigitos(s) { return String(s == null ? '' : s).replace(/\D/g, ''); }

  // "(63) 99999-0000" (celular) ou "(63) 3215-0000" (fixo), formatando enquanto digita
  function formatarWhatsapp(s) {
    const d = apenasDigitos(s).slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    const ddd = d.slice(0, 2);
    const resto = d.slice(2);
    if (resto.length <= 4) return '(' + ddd + ') ' + resto;
    const corte = resto.length > 8 ? 5 : 4;
    return '(' + ddd + ') ' + resto.slice(0, corte) + '-' + resto.slice(corte);
  }

  function whatsappValido(s) {
    const n = apenasDigitos(s).length;
    return n === 10 || n === 11;
  }

  // ===== Sugestão =====
  const MSG_CONSENTIMENTO = 'Marque a autorização para usarmos seu contato.';

  function validarSugestao(f) {
    f = f || {};
    const erros = {};
    if (f.tipo === 'nova') {
      if (texto(f.nome).length < 3) erros.nome = 'Informe o nome ou uma referência da quadra.';
      if (!f.localizacao && !texto(f.referencia)) {
        erros.localizacao = 'Use sua localização ou cole um link / ponto de referência.';
      }
      if (!f.piso) erros.piso = 'Escolha o tipo de piso.';
      if (!lista(f.modalidades).length) erros.modalidades = 'Escolha pelo menos uma modalidade.';
    } else if (f.tipo === 'correcao') {
      if (!f.quadraId) erros.quadraId = 'Escolha a quadra.';
      if (texto(f.descricao).length < 10) erros.descricao = 'Conte o que está errado (pelo menos 10 caracteres).';
    } else {
      erros.tipo = 'Escolha o que você quer fazer.';
      return erros;
    }
    const zap = texto(f.contatoWhatsapp);
    if (zap && !whatsappValido(zap)) erros.contatoWhatsapp = 'WhatsApp inválido. Use DDD + número.';
    if ((texto(f.contatoNome) || zap) && f.consentimento !== true) erros.consentimento = MSG_CONSENTIMENTO;
    return erros;
  }

  function montarSugestao(f) {
    const contato = { contatoNome: texto(f.contatoNome), contatoWhatsapp: apenasDigitos(f.contatoWhatsapp) };
    if (f.tipo === 'correcao') {
      return Object.assign({ tipo: 'correcao', quadraId: f.quadraId, descricao: texto(f.descricao) }, contato);
    }
    return Object.assign({
      tipo: 'nova',
      nome: texto(f.nome),
      localizacao: f.localizacao ? { lat: Number(f.localizacao.lat), lng: Number(f.localizacao.lng) } : null,
      referencia: texto(f.referencia),
      piso: f.piso,
      modalidades: lista(f.modalidades).slice(),
      equipamentos: booleanosDeLista(EQUIPAMENTOS, f.equipamentos),
      estrutura: booleanosDeLista(ESTRUTURAS, f.estrutura),
      coberta: f.coberta === 'sim',
      conservacao: f.conservacao || null,
      foto: f.foto || null
    }, contato);
  }

  // ===== Doação =====
  function validarDoacao(f) {
    f = f || {};
    const erros = {};
    const materiais = lista(f.materiais);
    if (!materiais.length) erros.materiais = 'Escolha pelo menos um material.';
    if (materiais.indexOf('outro') !== -1 && !texto(f.outro)) erros.outro = 'Diga qual é o outro material.';
    const qtd = Number(f.quantidade);
    if (!Number.isInteger(qtd) || qtd < 1 || qtd > 99) erros.quantidade = 'Informe uma quantidade de 1 a 99.';
    if (!ESTADOS_DOACAO.some(function (e) { return e.valor === f.estado; })) erros.estado = 'Escolha o estado do material.';
    if (!ENTREGAS.some(function (e) { return e.valor === f.entrega; })) erros.entrega = 'Escolha como prefere entregar.';
    if (texto(f.nome).length < 2) erros.nome = 'Informe seu nome.';
    if (!whatsappValido(f.whatsapp)) erros.whatsapp = 'Informe um WhatsApp com DDD.';
    if (f.consentimento !== true) erros.consentimento = MSG_CONSENTIMENTO;
    return erros;
  }

  function montarDoacao(f) {
    return {
      materiais: lista(f.materiais).map(function (v) {
        return v === 'outro' ? 'Outro: ' + texto(f.outro) : rotulo(MATERIAIS, v);
      }),
      quantidade: Number(f.quantidade),
      estado: f.estado,
      quadraId: f.quadraId || null,
      entrega: f.entrega,
      nome: texto(f.nome),
      whatsapp: apenasDigitos(f.whatsapp)
    };
  }

  // ===== Plano B: mensagem pronta para o WhatsApp =====
  function mensagemWhatsapp(tipo, r, nomeQuadra) {
    const linhas = [];
    if (tipo === 'doacao') {
      linhas.push('Olá! Quero doar materiais esportivos pelo Quadras de Palmas:');
      linhas.push('• Materiais: ' + r.materiais.join(', '));
      linhas.push('• Quantidade: ' + r.quantidade);
      linhas.push('• Estado: ' + rotulo(ESTADOS_DOACAO, r.estado));
      linhas.push('• Quadra: ' + (nomeQuadra || r.quadraId || 'Onde precisar mais'));
      linhas.push('• Entrega: ' + rotulo(ENTREGAS, r.entrega));
      linhas.push('• Nome: ' + r.nome);
    } else if (r.tipo === 'correcao') {
      linhas.push('Olá! Quero corrigir uma quadra no Quadras de Palmas:');
      linhas.push('• Quadra: ' + (nomeQuadra || r.quadraId));
      linhas.push('• O que está errado: ' + r.descricao);
    } else {
      linhas.push('Olá! Quero sugerir uma quadra no Quadras de Palmas:');
      linhas.push('• Nome: ' + r.nome);
      const onde = r.localizacao ? r.localizacao.lat + ', ' + r.localizacao.lng : '';
      linhas.push('• Onde: ' + [onde, r.referencia].filter(Boolean).join(' — '));
      linhas.push('• Piso: ' + rotulo(PISOS, r.piso));
      linhas.push('• Modalidades: ' + r.modalidades.map(function (m) { return rotulo(MODALIDADES, m); }).join(', '));
      const eq = EQUIPAMENTOS.filter(function (e) { return r.equipamentos[e.valor]; }).map(function (e) { return e.label; });
      const es = ESTRUTURAS.filter(function (e) { return r.estrutura[e.valor]; }).map(function (e) { return e.label; });
      linhas.push('• Equipamentos: ' + (eq.join(', ') || 'nenhum'));
      linhas.push('• Estrutura: ' + (es.join(', ') || 'nenhuma'));
      if (r.foto) linhas.push('(Tenho foto e mando aqui na conversa.)');
    }
    return linhas.join('\n');
  }

  const Regras = {
    PISOS: PISOS, MODALIDADES: MODALIDADES, EQUIPAMENTOS: EQUIPAMENTOS, ESTRUTURAS: ESTRUTURAS,
    COBERTURAS: COBERTURAS, CONSERVACOES: CONSERVACOES, MATERIAIS: MATERIAIS,
    ESTADOS_DOACAO: ESTADOS_DOACAO, ENTREGAS: ENTREGAS, STATUS_DOACAO: STATUS_DOACAO,
    rotulo: rotulo,
    normalizarQuadra: normalizarQuadra,
    quadraTemValor: quadraTemValor,
    filtrarQuadras: filtrarQuadras,
    extrairCoordenada: extrairCoordenada,
    gerarIdQuadra: gerarIdQuadra,
    apenasDigitos: apenasDigitos,
    formatarWhatsapp: formatarWhatsapp,
    whatsappValido: whatsappValido,
    validarSugestao: validarSugestao,
    montarSugestao: montarSugestao,
    validarDoacao: validarDoacao,
    montarDoacao: montarDoacao,
    mensagemWhatsapp: mensagemWhatsapp
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Regras;
  else raiz.Regras = Regras;
})(typeof window !== 'undefined' ? window : globalThis);
