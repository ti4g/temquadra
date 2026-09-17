# Conectando o Quadras de Palmas no Supabase

Guia para quem for ligar o site no banco de dados de verdade.

## Onde as coisas estão hoje

O site inteiro **já funciona**, só que em **modo demonstração**: tudo o que as pessoas
enviam fica guardado no navegador (localStorage). Por isso o admin só enxerga o que foi
enviado **no mesmo navegador**.

Todo acesso a dados passa por **um arquivo só**: `js/api.js`. As telas (`app.js`,
`sugerir.js`, `doar.js`, `admin.js`) não sabem se do outro lado tem localStorage ou
Supabase. Conectar é **trocar o miolo das funções do `api.js`**, mantendo nomes,
parâmetros e retornos.

| Arquivo | O que é |
|---|---|
| `supabase/schema.sql` | tabelas, regras de segurança (RLS) e buckets de fotos — **rascunho, ainda não rodado** |
| `supabase/carga-inicial.sql` | as 3 quadras reais (gerado a partir de `js/dados.js`) |
| `js/api.js` | a porta de dados — é aqui que entra o Supabase |
| `js/config.js` | onde vão a URL e a chave `anon` |
| `docs/superpowers/specs/2026-09-16-formularios-doacoes-design.md` | a proposta completa (seções 6.1 e 10 são as suas) |

Rodando os testes: `npm test` (Node 22, sem instalar nada).

---

## Passo a passo

### 1. Criar o projeto
1. Entre em [supabase.com](https://supabase.com) e crie um projeto (região **South America (São Paulo)**).
2. Guarde a senha do banco num lugar seguro.

### 2. Criar as tabelas
1. **SQL Editor → New query**, cole `schema.sql` e rode.
2. Numa nova query, cole `carga-inicial.sql` e rode.
3. Em **Table Editor**, confira se `quadras` tem 3 linhas.

### 3. Travar o cadastro e criar os logins da equipe
1. **Authentication → Sign In / Providers → Email**: **desligue** "Allow new users to sign up".
   Sem isso qualquer pessoa cria conta.
2. **Authentication → Users → Add user**: crie um login para cada pessoa da equipe.
3. **SQL Editor**, trocando pelos e-mails de vocês:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users
   where email in ('pessoa1@exemplo.com', 'pessoa2@exemplo.com');
   ```
   Só quem está na tabela `admins` enxerga sugestões e doações. Estar logado não basta.

### 4. Pegar as chaves
**Project Settings → API**: copie **Project URL** e a chave **anon public** para
`js/config.js`:
```js
supabase: {
  url: 'https://xxxxx.supabase.co',
  chaveAnon: 'eyJ...'
}
```
> A chave `anon` pode ficar no site: quem protege os dados são as regras do `schema.sql`.
> A chave **`service_role` NUNCA** vai para o código nem para o GitHub.

### 5. Carregar a biblioteca
Em `index.html` **e** `admin.html`, antes de `js/api.js` (fixe a versão que você testar):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 6. Trocar o `api.js`
Sugestão de organização, para o modo demonstração continuar existindo:
- manter `criarApiMock()` como está (os testes em `tests/api.test.js` usam ele);
- criar `criarApiSupabase(cliente)` com as mesmas funções;
- no final do arquivo, usar o Supabase quando `CONFIG.supabase.url` estiver preenchido,
  senão o mock. **Com o Supabase, `modo` deve ser `'supabase'`** (isso esconde a faixa
  amarela e a dica da senha `demo` no admin).

Os esboços abaixo estão na seção **Esboço das funções**.

### 7. Testar
Use a checklist do fim deste arquivo. Só depois disso faça o merge da branch
`feat/formularios-doacoes` no `main` (o GitHub Pages publica o `main`).

---

## Nomes: site ↔ banco

O site usa camelCase; o banco usa snake_case.

| No site (`api.js`) | No banco |
|---|---|
| `quadra.coordenadas.lat / lng` | `quadras.lat / lng` |
| `sugestao.quadraId` | `sugestoes.quadra_id` |
| `sugestao.nome, localizacao, referencia, piso, modalidades, equipamentos, estrutura, coberta, conservacao` | dentro de `sugestoes.dados` (jsonb) |
| `sugestao.foto` (data URL da foto já reduzida) | arquivo no bucket `fotos-sugestoes` + `sugestoes.foto_path` |
| `sugestao.contatoNome / contatoWhatsapp` | `sugestoes.contato_nome / contato_whatsapp` |
| `criadoEm / decididoEm` | `criado_em / decidido_em` |
| `doacao.quadraId` | `doacoes.quadra_id` |

---

## Esboço das funções

> **Não testado** — é um ponto de partida escrito sem um projeto Supabase de verdade.
> Confira cada chamada na documentação do `supabase-js` v2.

```js
function criarApiSupabase(sb) {
  // Contrato: erros sempre com mensagem em português (as telas mostram a mensagem).
  function falhou(error, mensagem) {
    if (error) { console.error(error); throw new Error(mensagem); }
  }
  async function exigirSessao() {
    const { data } = await sb.auth.getSession();
    // admin.js volta para o login quando a mensagem contém "login"
    if (!data.session) throw new Error('Faça login novamente.');
  }
  function linhaParaQuadra(l) {
    return Regras.normalizarQuadra({
      id: l.id, nome: l.nome, regiao: l.regiao, coordenadas: { lat: l.lat, lng: l.lng },
      piso: l.piso, modalidades: l.modalidades, equipamentos: l.equipamentos,
      estrutura: l.estrutura, coberta: l.coberta, conservacao: l.conservacao,
      fotos: l.fotos, maps: l.maps, precisa: l.precisa, demo: l.demo
    });
  }

  return {
    modo: 'supabase',

    async listarQuadras() {
      const { data, error } = await sb.from('quadras').select('*').eq('publicada', true).order('nome');
      falhou(error, 'Não foi possível carregar as quadras.');
      return data.map(linhaParaQuadra);
    },

    async enviarSugestao(s) {
      let foto_path = null;
      if (s.foto) {
        const blob = await (await fetch(s.foto)).blob();      // data URL → arquivo
        foto_path = crypto.randomUUID() + '.jpg';               // nome único, SEM upsert
        const up = await sb.storage.from('fotos-sugestoes').upload(foto_path, blob, { contentType: 'image/jpeg' });
        falhou(up.error, 'Não foi possível enviar a foto. Tente sem foto.');
      }
      const contato = { contato_nome: s.contatoNome, contato_whatsapp: s.contatoWhatsapp };
      const linha = s.tipo === 'nova'
        ? Object.assign({ tipo: 'nova', foto_path: foto_path, dados: {
            nome: s.nome, localizacao: s.localizacao, referencia: s.referencia, piso: s.piso,
            modalidades: s.modalidades, equipamentos: s.equipamentos, estrutura: s.estrutura,
            coberta: s.coberta, conservacao: s.conservacao } }, contato)
        : Object.assign({ tipo: 'correcao', quadra_id: s.quadraId, descricao: s.descricao }, contato);
      // SEM .select() depois do insert: o visitante não tem permissão de leitura
      const { error } = await sb.from('sugestoes').insert(linha);
      falhou(error, 'Não foi possível enviar a sugestão.');
      return Object.assign({}, s, { status: 'pendente' });
    },

    async enviarDoacao(d) {
      const { error } = await sb.from('doacoes').insert({
        materiais: d.materiais, quantidade: d.quantidade, estado: d.estado,
        quadra_id: d.quadraId, entrega: d.entrega, nome: d.nome, whatsapp: d.whatsapp
      });
      falhou(error, 'Não foi possível registrar a doação.');
      return Object.assign({}, d, { status: 'nova' });
    },

    async contarDoacoesEntregues() {
      const { data, error } = await sb.rpc('total_materiais_entregues');
      falhou(error, 'Não foi possível carregar o contador.');
      return data;
    },

    async entrar(email, senha) {
      const { data, error } = await sb.auth.signInWithPassword({ email: email, password: senha });
      if (error) throw new Error('E-mail ou senha incorretos.');
      const admin = await sb.rpc('is_admin');
      if (!admin.data) { await sb.auth.signOut(); throw new Error('Este login não tem acesso ao painel.'); }
      return { email: data.user.email };
    },

    async sair() { await sb.auth.signOut(); },

    async sessaoAtual() {
      const { data } = await sb.auth.getSession();
      return data.session ? { email: data.session.user.email } : null;
    },

    async listarSugestoes(status) {
      await exigirSessao();
      let consulta = sb.from('sugestoes').select('*').order('criado_em', { ascending: false });
      if (status) consulta = consulta.eq('status', status);
      const { data, error } = await consulta;
      falhou(error, 'Não foi possível carregar as sugestões.');
      return Promise.all(data.map(async function (l) {
        let foto = null;
        if (l.foto_path) {   // bucket privado: link temporário
          const r = await sb.storage.from('fotos-sugestoes').createSignedUrl(l.foto_path, 3600);
          foto = r.data ? r.data.signedUrl : null;
        }
        return Object.assign({
          id: l.id, tipo: l.tipo, quadraId: l.quadra_id, descricao: l.descricao,
          contatoNome: l.contato_nome, contatoWhatsapp: l.contato_whatsapp,
          status: l.status, criadoEm: l.criado_em, decididoEm: l.decidido_em,
          foto: foto, fotoPath: l.foto_path
        }, l.dados);
      }));
    },

    // Duas escritas seguidas. Mais robusto depois: uma função SQL que faça tudo numa
    // transação (sb.rpc('aprovar_sugestao', { id })).
    async aprovarSugestao(id) {
      await exigirSessao();
      const { data: s, error } = await sb.from('sugestoes').select('*').eq('id', id).single();
      falhou(error, 'Sugestão não encontrada.');
      if (s.tipo === 'nova') {
        const d = s.dados;
        if (!d.localizacao) throw new Error('Sem coordenadas — complete no Supabase.');
        const ids = (await sb.from('quadras').select('id')).data.map(function (q) { return q.id; });
        const novaId = Regras.gerarIdQuadra(d.nome, ids);
        let fotos = [];
        if (s.foto_path) {   // copia a foto do bucket privado para o público
          const baixada = await sb.storage.from('fotos-sugestoes').download(s.foto_path);
          falhou(baixada.error, 'Não foi possível copiar a foto.');
          const destino = novaId + '-' + s.foto_path;
          const up = await sb.storage.from('fotos-quadras').upload(destino, baixada.data, { contentType: 'image/jpeg' });
          falhou(up.error, 'Não foi possível copiar a foto.');
          fotos = [sb.storage.from('fotos-quadras').getPublicUrl(destino).data.publicUrl];
        }
        const ins = await sb.from('quadras').insert({
          id: novaId, nome: d.nome, lat: d.localizacao.lat, lng: d.localizacao.lng, piso: d.piso,
          modalidades: d.modalidades, equipamentos: d.equipamentos, estrutura: d.estrutura,
          coberta: d.coberta, conservacao: d.conservacao || 'regular', fotos: fotos
        });
        falhou(ins.error, 'Não foi possível publicar a quadra.');
      }
      const up = await sb.from('sugestoes').update({ status: 'aprovada', decidido_em: new Date().toISOString() }).eq('id', id);
      falhou(up.error, 'Não foi possível salvar.');
    },

    async recusarSugestao(id) {
      await exigirSessao();
      const { error } = await sb.from('sugestoes').update({ status: 'recusada', decidido_em: new Date().toISOString() }).eq('id', id);
      falhou(error, 'Não foi possível salvar.');
    },

    async listarDoacoes() {
      await exigirSessao();
      const { data, error } = await sb.from('doacoes').select('*').order('criado_em', { ascending: false });
      falhou(error, 'Não foi possível carregar as doações.');
      return data.map(function (l) {
        return { id: l.id, materiais: l.materiais, quantidade: l.quantidade, estado: l.estado,
          quadraId: l.quadra_id, entrega: l.entrega, nome: l.nome, whatsapp: l.whatsapp,
          status: l.status, criadoEm: l.criado_em };
      });
    },

    async mudarStatusDoacao(id, status) {
      await exigirSessao();
      if (!Regras.STATUS_DOACAO.some(function (s) { return s.valor === status; })) throw new Error('Status inválido.');
      const { error } = await sb.from('doacoes').update({ status: status }).eq('id', id);
      falhou(error, 'Não foi possível salvar.');
    }
  };
}
```

Fotos de quadras aprovadas passam a ser uma URL completa (`https://…/fotos-quadras/…`).
As quadras antigas continuam com `imgs/…`, que funciona porque o site fica no GitHub
Pages. Os dois formatos já funcionam no `<img>`.

---

## Problemas que podem aparecer

| Sintoma | Provável causa |
|---|---|
| Envio de sugestão/doação dá "permission denied" | `.select()` depois do `.insert()` (visitante não lê), ou a política de insert. Se persistir, teste trocar o `with check (status = 'pendente' …)` por `with check (true)`: as permissões por coluna do `schema.sql` já impedem o visitante de mexer no status. |
| Admin loga mas vê listas vazias | o usuário não está na tabela `admins` |
| Foto não sobe | arquivo acima de 5 MB ou formato fora de JPEG/PNG/WEBP (o site já reduz para JPEG) |
| Contador da doação some | função `total_materiais_entregues` não foi criada ou falta o `grant execute` |

---

## Checklist antes de publicar

**Segurança** — no console do navegador, **deslogado**, com o site aberto:
```js
const sb = supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.chaveAnon);
(await sb.from('doacoes').select('*')).data      // tem que vir vazio ou erro
(await sb.from('sugestoes').select('*')).data    // tem que vir vazio ou erro
(await sb.from('doacoes').insert({ materiais: ['Cones'], quantidade: 1, estado: 'novo', entrega: 'combinar', nome: 'Teste', whatsapp: '63999990000', status: 'entregue' })).error
// ↑ tem que dar erro (visitante não escolhe o status)
```
- [ ] RLS ligada nas 4 tabelas (Table Editor mostra "RLS enabled")
- [ ] Cadastro público desligado
- [ ] Nenhuma chave `service_role` no código

**Funcionamento** — seção 12 da proposta (`docs/superpowers/specs/2026-09-16-formularios-doacoes-design.md`),
agora com dois navegadores diferentes (um visitante, outro admin):
- [ ] Sugestão enviada no celular aparece no admin do computador
- [ ] Aprovar publica a quadra no mapa, com foto
- [ ] Doação marcada como entregue aumenta o contador na tela de doação
- [ ] Faixa amarela "Modo demonstração" **não** aparece mais no admin
- [ ] `npm test` passando
