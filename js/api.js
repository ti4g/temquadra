/* Quadras de Palmas — ÚNICA porta de acesso a dados.

   Hoje: MODO DEMONSTRAÇÃO. Tudo fica no localStorage do navegador, então o que é
   enviado aqui só aparece no admin deste mesmo navegador.
   Depois: trocar o miolo de cada função por chamadas ao Supabase, mantendo os mesmos
   nomes, parâmetros e retornos (ver supabase/LEIA-ME.md). Testes: tests/api.test.js.

   Todas as funções devolvem Promise. Erros vêm como Error com mensagem em português. */
(function (raiz) {
  'use strict';

  const Regras = raiz.Regras || require('./regras.js');
  const PREFIXO = 'quadras:';

  function criarApiMock(opcoes) {
    const storage = opcoes.storage;
    const quadrasBase = opcoes.quadrasBase || [];
    const atraso = opcoes.atraso == null ? 600 : opcoes.atraso;
    const falhar = !!opcoes.falhar;
    const agora = opcoes.agora || function () { return new Date().toISOString(); };
    const novoId = opcoes.novoId || function () {
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    };

    function ler(chave, padrao) {
      try {
        const t = storage.getItem(PREFIXO + chave);
        return t ? JSON.parse(t) : padrao;
      } catch (e) {
        return padrao;
      }
    }

    function gravar(chave, valor) {
      try {
        storage.setItem(PREFIXO + chave, JSON.stringify(valor));
      } catch (e) {
        throw new Error('Espaço do navegador cheio — tente sem foto.');
      }
    }

    // Simula a rede: demora um pouco e, com ?falhar=1, falha.
    function esperar() {
      return new Promise(function (ok, erro) {
        setTimeout(function () {
          if (falhar) erro(new Error('Não foi possível completar agora (modo de teste ?falhar=1).'));
          else ok();
        }, atraso);
      });
    }

    function exigirSessao() {
      if (!ler('sessao', null)) throw new Error('Faça login novamente.');
    }

    function quadrasPublicadas() {
      return quadrasBase.concat(ler('quadras-aprovadas', [])).map(Regras.normalizarQuadra);
    }

    function acharPorId(lista, id, nome) {
      const item = lista.find(function (i) { return i.id === id; });
      if (!item) throw new Error(nome + ' não encontrada.');
      return item;
    }

    return {
      modo: 'demonstracao',

      // ===== Público =====
      listarQuadras: async function () {
        await esperar();
        return quadrasPublicadas();
      },

      enviarSugestao: async function (sugestao) {
        await esperar();
        const registro = Object.assign({}, sugestao, { id: novoId(), status: 'pendente', criadoEm: agora() });
        const sugestoes = ler('sugestoes', []);
        sugestoes.unshift(registro);
        gravar('sugestoes', sugestoes);
        return registro;
      },

      enviarDoacao: async function (doacao) {
        await esperar();
        const registro = Object.assign({}, doacao, { id: novoId(), status: 'nova', criadoEm: agora() });
        const doacoes = ler('doacoes', []);
        doacoes.unshift(registro);
        gravar('doacoes', doacoes);
        return registro;
      },

      // Total de PEÇAS (soma das quantidades) das doações já entregues
      contarDoacoesEntregues: async function () {
        await esperar();
        return ler('doacoes', [])
          .filter(function (d) { return d.status === 'entregue'; })
          .reduce(function (total, d) { return total + (Number(d.quantidade) || 0); }, 0);
      },

      // ===== Admin =====
      entrar: async function (email, senha) {
        await esperar();
        const e = String(email || '').trim();
        if (!e || senha !== 'demo') throw new Error('E-mail ou senha incorretos.');
        const sessao = { email: e };
        gravar('sessao', sessao);
        return sessao;
      },

      sair: async function () {
        storage.removeItem(PREFIXO + 'sessao');
      },

      sessaoAtual: async function () {
        return ler('sessao', null);
      },

      listarSugestoes: async function (status) {
        await esperar();
        exigirSessao();
        return ler('sugestoes', []).filter(function (s) { return !status || s.status === status; });
      },

      // Nova → vira quadra publicada. Correção → só marca aprovada (ajuste é feito à mão).
      aprovarSugestao: async function (id) {
        await esperar();
        exigirSessao();
        const sugestoes = ler('sugestoes', []);
        const s = acharPorId(sugestoes, id, 'Sugestão');
        if (s.tipo === 'nova') {
          if (!s.localizacao) throw new Error('Sem coordenadas — complete no Supabase.');
          const aprovadas = ler('quadras-aprovadas', []);
          const ids = quadrasPublicadas().map(function (q) { return q.id; });
          aprovadas.push({
            id: Regras.gerarIdQuadra(s.nome, ids),
            nome: s.nome,
            regiao: '',
            coordenadas: { lat: s.localizacao.lat, lng: s.localizacao.lng },
            piso: s.piso,
            modalidades: s.modalidades,
            equipamentos: s.equipamentos,
            estrutura: s.estrutura,
            coberta: s.coberta,
            conservacao: s.conservacao || 'regular',
            fotos: s.foto ? [s.foto] : [],
            maps: '',
            precisa: [],
            demo: false
          });
          gravar('quadras-aprovadas', aprovadas);
        }
        s.status = 'aprovada';
        s.decididoEm = agora();
        gravar('sugestoes', sugestoes);
        return s;
      },

      recusarSugestao: async function (id) {
        await esperar();
        exigirSessao();
        const sugestoes = ler('sugestoes', []);
        const s = acharPorId(sugestoes, id, 'Sugestão');
        s.status = 'recusada';
        s.decididoEm = agora();
        gravar('sugestoes', sugestoes);
        return s;
      },

      listarDoacoes: async function () {
        await esperar();
        exigirSessao();
        return ler('doacoes', []);
      },

      mudarStatusDoacao: async function (id, status) {
        await esperar();
        exigirSessao();
        if (!Regras.STATUS_DOACAO.some(function (s) { return s.valor === status; })) {
          throw new Error('Status inválido.');
        }
        const doacoes = ler('doacoes', []);
        const d = acharPorId(doacoes, id, 'Doação');
        d.status = status;
        gravar('doacoes', doacoes);
        return d;
      }
    };
  }

  // Guarda em memória quando o navegador bloqueia o localStorage
  function armazenamentoEmMemoria() {
    const m = new Map();
    return {
      getItem: function (k) { return m.has(k) ? m.get(k) : null; },
      setItem: function (k, v) { m.set(k, String(v)); },
      removeItem: function (k) { m.delete(k); }
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { criarApiMock: criarApiMock };
  } else {
    let storage;
    try {
      storage = raiz.localStorage;
      storage.getItem(PREFIXO + 'teste');
    } catch (e) {
      storage = armazenamentoEmMemoria();
    }
    raiz.Api = criarApiMock({
      storage: storage,
      quadrasBase: typeof QUADRAS !== 'undefined' ? QUADRAS : [],
      falhar: new URLSearchParams(raiz.location.search).has('falhar')
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
