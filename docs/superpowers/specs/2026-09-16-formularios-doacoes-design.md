# Quadras de Palmas — Formulários no sistema, doações e estrutura

**Data:** 2026-09-16
**Tipo:** Evolução do projeto de extensão (pedidos do professor)
**Base:** `docs/superpowers/specs/2026-09-01-quadras-palmas-design.md`

---

## 1. Contexto

O professor pediu três mudanças:

1. **Formulário funcionando no sistema.** Hoje o botão "Sugerir quadra" leva a pessoa para
   fora do site, para um Google Forms.
2. **Doação de materiais esportivos.**
3. **Ícones de bebedouro e banheiro.**

Junto com isso entra a **Praça 404 Sul**, a terceira quadra real.

## 2. Decisões

| Tema | Decisão |
|---|---|
| Onde ficam os dados | **Supabase** (banco de dados grátis): quadras, sugestões e doações |
| Logística da doação | **Ponte + ponto de coleta**: o doador preenche o formulário, a dupla entra em contato, e a entrega é no ponto de coleta ou combinada. *Proposta a validar com o professor.* |
| Divisão do trabalho | **Agora:** todas as telas e formulários funcionando com **dados de mentira**. **Depois (amigo do Tiago):** conectar no Supabase (login, banco, fotos). |
| Painel de admin | Entra agora, com login e dados de mentira |
| Banco | Entra um **rascunho** do banco (`supabase/schema.sql`) com as regras de segurança |
| Publicação | Tudo na branch `feat/formularios-doacoes`. O `main` (site no ar) só recebe quando o Supabase estiver conectado, para não publicar formulário que finge enviar. |

## 3. Escopo

### Entra agora
- Camada de dados `js/api.js` com implementação **de mentira** (mock), pronta para trocar por Supabase.
- Quadras: campos novos (postes de vôlei, estrutura, peteca, "precisa de") e a quadra 404 Sul.
- Mapa/lista/detalhe: filtros e ícones novos, aviso "leve sua rede", bloco "precisa de doação".
- Painel **Sugerir quadra** (nova ou correção) dentro do site, com GPS e foto.
- Tela **Doar materiais** com formulário.
- Página **`admin.html`**: aprovar/recusar sugestões e acompanhar doações.
- `supabase/schema.sql` + `supabase/LEIA-ME.md` (guia de conexão para o amigo).

### Fica para depois
- Conexão real com o Supabase (feita pelo amigo, seguindo `supabase/LEIA-ME.md`).
- Editar quadras publicadas pelo painel (por enquanto usa o editor de tabelas do Supabase).
- Estado "tem, mas está quebrado" para bebedouro/banheiro.
- Comunidades/grupos que frequentam cada quadra (ideia já registrada).

## 4. Modelo de dados

### 4.1 Quadra
```js
{
  id: "404-sul",
  nome: "Praça 404 Sul",
  regiao: "Plano Diretor Sul",
  coordenadas: { lat: -10.208290, lng: -48.328092 },
  piso: "cimento",                      // areia | gramado | cimento | emborrachado
  modalidades: ["volei", "futsal", "peteca"],  // + basquete | society
  equipamentos: {
    postesVolei: true,                  // NOVO
    redeVolei: false,
    aroBasquete: false,
    traves: false,
    iluminacao: true
  },
  estrutura: { bebedouro: true, banheiro: false },  // NOVO
  coberta: false,
  conservacao: "regular",               // boa | regular | ruim
  fotos: ["imgs/praca-404-sul.jpeg"],
  maps: "https://maps.app.goo.gl/jV779GF8txtxBp9o6",
  precisa: ["Rede de vôlei"],           // NOVO — materiais que faltam
  demo: false
}
```
Quadras sem os campos novos são tratadas como: `postesVolei: false`, `estrutura` toda
`false`, `precisa: []`.

### 4.2 Sugestão
```js
{
  id, tipo: "nova" | "correcao",
  quadraId: null | "303-sul",           // só em correção
  // tipo "nova":
  nome, localizacao: { lat, lng } | null, referencia: "texto/link" | "",
  piso, modalidades: [], equipamentos: {...}, estrutura: {...}, coberta, conservacao,
  foto: null | <arquivo>,
  // tipo "correcao":
  descricao: "o que está errado",
  // comum:
  contatoNome: "", contatoWhatsapp: "",
  status: "pendente" | "aprovada" | "recusada",
  criadoEm
}
```

### 4.3 Doação
```js
{
  id,
  materiais: ["Bola de vôlei", "Outro: cones"],
  quantidade: 2,
  estado: "novo" | "usado-bom" | "usado-desgaste",
  quadraId: null | "404-sul",           // null = onde precisar mais
  entrega: "ponto-coleta" | "combinar",
  nome, whatsapp,
  status: "nova" | "combinada" | "recebida" | "entregue",
  criadoEm
}
```

### 4.4 Configuração do projeto (`js/config.js`)
```js
const CONFIG = {
  pontoColeta: {
    nome: "A definir com o professor",
    endereco: "A definir",
    horario: "A definir",
    maps: ""
  },
  whatsappProjeto: ""   // número com DDI+DDD, só dígitos. Vazio = esconde botões de WhatsApp.
};
```
Os valores "A definir" aparecem assim na tela de propósito — são dados que dependem da
faculdade.

## 5. Dados das quadras reais

| Campo | 303 Sul | 507 Sul | **404 Sul (nova)** |
|---|---|---|---|
| Coordenadas | -10.203135, -48.340401 | -10.213890, -48.353970 | -10.208290, -48.328092 |
| Piso | cimento | cimento | cimento |
| Modalidades | futsal, basquete, vôlei | futsal, basquete, vôlei | vôlei, futsal, peteca |
| Postes / rede de vôlei | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ |
| Aro / traves | ✅ / ✅ | ✅ / ✅ | ❌ / ❌ |
| Iluminação | ✅ | ✅ | ✅ (da praça) |
| Bebedouro / banheiro | ❌ / ❌ | ❌ / ❌ | ✅ / ❌ |
| Conservação | boa | boa | regular |
| Precisa | bola de vôlei, rede de vôlei | bola de vôlei, rede de vôlei | rede de vôlei |
| Foto | praca-303-sul.jpg | praca-507-sul.jpeg | praca-404-sul.jpeg |

As 4 quadras de exemplo continuam, com os campos novos em `false`/vazio.

## 6. Arquitetura

Continua HTML/CSS/JS puro, com scripts clássicos (sem módulos, sem build).

```
index.html            → site público (mapa/lista, detalhe, sugerir, doar)
admin.html            → painel da dupla (não aparece em nenhum link do site)
css/estilos.css       → estilos atuais + componentes novos
css/admin.css         → estilos só do painel
js/config.js          → CONFIG (ponto de coleta, WhatsApp)
js/dados.js           → quadras de exemplo usadas pelo MOCK
js/api.js             → ÚNICA porta de acesso a dados (mock hoje, Supabase depois)
js/regras.js          → catálogos (pisos, modalidades, materiais…) e regras sem tela:
                        validação, coordenada colada, WhatsApp, montar registros
js/icones.js          → ícones SVG e cores dos pisos (saem do app.js)
js/navegacao.js       → telas, painéis e botão voltar
js/app.js             → mapa, lista, filtros, detalhe (já existe)
js/formularios.js     → peças comuns: chips, validação, estados, WhatsApp, foto
js/sugerir.js         → painel "Sugerir quadra"
js/doar.js            → tela "Doar materiais"
js/admin.js           → lógica do admin.html
supabase/schema.sql   → rascunho das tabelas e regras de segurança
supabase/LEIA-ME.md   → passo a passo da conexão
tests/*.test.js       → testes automáticos de regras.js e api.js (node --test)
package.json          → só o atalho `npm test` (sem dependências)
```

### 6.1 Contrato do `js/api.js`
Todas as funções são **assíncronas** (devolvem Promise), porque no Supabase serão.

| Função | Faz | Mock |
|---|---|---|
| `Api.listarQuadras()` | quadras publicadas | `QUADRAS` de `dados.js` + quadras aprovadas no admin (localStorage) |
| `Api.enviarSugestao(sugestao)` | grava sugestão com status `pendente` | salva no localStorage, espera 600 ms |
| `Api.enviarDoacao(doacao)` | grava doação com status `nova` | salva no localStorage, espera 600 ms |
| `Api.contarDoacoesEntregues()` | total de **peças** (soma de `quantidade`) das doações com status `entregue` | soma no localStorage |
| `Api.entrar(email, senha)` | login do admin | aceita qualquer e-mail com senha `demo` |
| `Api.sair()` / `Api.sessaoAtual()` | sessão do admin | localStorage |
| `Api.listarSugestoes(status)` | só admin | localStorage |
| `Api.aprovarSugestao(id)` | nova → cria quadra publicada; correção → marca aprovada | localStorage |
| `Api.recusarSugestao(id)` | marca recusada | localStorage |
| `Api.listarDoacoes()` | só admin | localStorage |
| `Api.mudarStatusDoacao(id, status)` | só admin | localStorage |

Erros são lançados como `Error` com mensagem em português. Para testar o estado de erro, o
mock falha quando a URL tem `?falhar=1`.

O mock usa um prefixo único no localStorage (`quadras:`), então o que é enviado no navegador
só aparece no admin **do mesmo navegador**. Isso é esperado na demonstração.

No mock, a foto da sugestão é guardada já reduzida, como texto (data URL). Se o
localStorage encher, `enviarSugestao` lança "Espaço do navegador cheio — tente sem foto."

### 6.2 Mudança no `app.js`
Hoje o `app.js` lê `QUADRAS` direto. Passa a carregar uma vez com
`await Api.listarQuadras()` e guardar numa variável `quadras`. Enquanto carrega, a lista
mostra "Carregando quadras…". Se falhar: "Não foi possível carregar as quadras." com botão
**Tentar de novo**.

## 7. Telas

### 7.1 Topbar
Dois botões: **Doar materiais** (secundário, contorno) e **Sugerir quadra** (primário, escuro).
No celular os dois viram botões só com ícone, com `aria-label`.

### 7.2 Mapa, lista e filtros
- Filtro **Modalidade** ganha `Peteca`.
- Filtro **Equipamentos** ganha `Postes de vôlei`.
- Grupo novo **Estrutura**: `Bebedouro`, `Banheiro`.
- **Card:** ícones de equipamento, um divisor fino, ícones de estrutura. Quando `precisa`
  não está vazio, aparece o selo **"Precisa de doação"** (fundo amarelo-sol, texto escuro).

### 7.3 Detalhe da quadra
Ordem do conteúdo:
1. Cobertura / conservação (já existe)
2. Modalidades (já existe)
3. Equipamentos (já existe, com postes)
4. **Aviso** quando `postesVolei` e não `redeVolei`: "Tem postes de vôlei — leve sua rede."
5. **Estrutura:** bebedouro e banheiro, cada um com ✓ ou ✗ (aqui mostra os dois, porque
   saber que **não** tem banheiro também ajuda).
6. **Precisa de doação:** lista dos itens + botão **Quero doar** → abre a tela Doar com a
   quadra já escolhida. Só aparece se `precisa` não estiver vazio.
7. Link discreto **"Algo errado? Sugerir correção"** → abre Sugerir em modo correção com a
   quadra escolhida.
8. Rodapé fixo **Como chegar** (já existe).

### 7.4 Painel "Sugerir quadra"
Painel lateral igual ao detalhe (tela cheia no celular).

**Topo:** "O que você quer fazer?" `Sugerir quadra nova` · `Corrigir uma quadra`

**Quadra nova**
| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome ou referência | texto | sim |
| Localização | botão **"Estou na quadra — usar minha localização"** (mostra "📍 Localização capturada") **ou** campo "Link do Google Maps ou ponto de referência" | um dos dois |
| Piso | chips, um só | sim |
| Modalidades | chips, vários (vôlei, basquete, futsal, society, peteca) | pelo menos 1 |
| Equipamentos | chips, vários | não |
| Estrutura | chips, vários | não |
| Coberta | `Sim` · `Não` | não |
| Conservação | `Boa` · `Regular` · `Ruim` | não |
| Foto | escolher arquivo/câmera, com prévia | não |
| Seu nome / WhatsApp | texto | não |

**Correção**
| Campo | Tipo | Obrigatório |
|---|---|---|
| Qual quadra | lista das quadras | sim |
| O que está errado | texto longo | sim (mín. 10 caracteres) |
| Seu nome / WhatsApp | texto | não |

**GPS:** usa `navigator.geolocation`. Se a pessoa negar ou falhar, mostra "Não conseguimos
pegar sua localização — cole o link do Google Maps" e foca o campo de texto.

**Coordenada colada:** se o campo de texto contiver uma coordenada no formato `lat, lng`
(ex.: `-10.2083, -48.3281`, copiada com o botão direito no Google Maps), ela vira a
`localizacao` da sugestão e aparece "📍 Coordenada reconhecida". Links curtos
(`maps.app.goo.gl`) **não** são lidos: ficam só como `referencia`.

**Foto:** antes de guardar/enviar, é reduzida no navegador para no máximo 1600 px no maior
lado, em JPEG. Limite de 10 MB no arquivo original. Formatos: JPG, PNG, WEBP, HEIC quando o
navegador ler.

### 7.5 Tela "Doar materiais"
Troca a área de mapa/lista (o topbar continua). Endereço `#doar`.

1. **Cabeçalho:** "Doe materiais esportivos" + frase curta + contador
   **"X materiais já entregues"** (esconde se for 0).
2. **Como funciona**, em 3 passos:
   1. Diga o que você quer doar
   2. A gente te chama no WhatsApp
   3. Entregue no ponto de coleta ou combine com a gente
3. **Ponto de coleta:** nome, endereço, horário e **Como chegar** (esconde o botão se
   `maps` estiver vazio).
4. **Quadras que precisam:** um cartão por quadra com `precisa` não vazio, com foto pequena,
   nome, itens e botão **Doar pra esta** (preenche a quadra no formulário e rola até ele).
5. **Formulário "Quero doar"**

| Campo | Tipo | Obrigatório |
|---|---|---|
| O que vai doar | chips, vários: bola de vôlei, bola de futsal, bola de basquete, rede de vôlei, peteca, coletes, cones, **outro** (abre texto) | pelo menos 1 |
| Quantidade total de peças | número (1–99), somando todos os materiais | sim |
| Estado | `Novo` · `Usado, bom estado` · `Usado, com desgaste` | sim |
| Pra qual quadra | lista das quadras + "Onde precisar mais" (padrão) | sim |
| Como prefere entregar | `Levo no ponto de coleta` · `Prefiro combinar` | sim |
| Nome | texto | sim |
| WhatsApp | texto com máscara `(63) 99999-9999` | sim |

Um botão **"Voltar para o mapa"** fica no topo da tela.

### 7.6 Painel de admin (`admin.html`)
- **Login:** e-mail e senha. No mock, qualquer e-mail com a senha `demo`, e uma faixa amarela
  fixa: "Modo demonstração — dados só neste navegador."
- **Aba Sugestões** (padrão): filtro `Pendentes` · `Aprovadas` · `Recusadas`. Cada item
  mostra tipo, data, dados enviados, foto, link "ver no mapa" (quando tem localização) e
  contato com botão WhatsApp. Botões **Aprovar** e **Recusar** (pedem confirmação).
  - Aprovar sugestão **nova** cria a quadra com `id` gerado do nome, `regiao` vazia, `demo:
    false` e `precisa: []`. Sem `localizacao` (nem GPS nem coordenada colada), o botão
    **Aprovar** fica desabilitado com a dica "Sem coordenadas — complete no Supabase".
- **Aba Doações:** lista com materiais, quantidade, estado, quadra, forma de entrega, contato
  e um seletor de status (`nova → combinada → recebida → entregue`).
- Botão **Sair**.
- `admin.html` tem `<meta name="robots" content="noindex">` e não é linkado no site. Isso
  **não é segurança**: a segurança real vem do login e das regras do Supabase (seção 9).

## 8. Comportamentos comuns dos formulários

- **Validação** ao enviar: campos com problema ficam com borda coral e mensagem embaixo; o
  foco vai para o primeiro erro.
- **Enviando:** botão vira "Enviando…" e fica desabilitado.
- **Sucesso:** o formulário é trocado por uma mensagem:
  - Sugestão: "Recebemos sua sugestão! Vamos revisar e, se estiver tudo certo, ela aparece
    no mapa."
  - Doação: "Obrigado! Vamos te chamar no WhatsApp pra combinar a entrega."
  - Botão "Enviar outra" limpa o formulário.
- **Erro:** mensagem "Não conseguimos enviar agora." + **Tentar de novo** (mantém tudo
  preenchido) + **Enviar pelo WhatsApp** (só se `CONFIG.whatsappProjeto` estiver
  preenchido; abre `wa.me` com a mensagem montada a partir dos campos, sem a foto).
- **Anti-spam:** campo `site` escondido; se vier preenchido, finge sucesso e não grava.
- **LGPD:** caixinha "Autorizo o uso do meu contato apenas para falar sobre esta
  sugestão/doação." Ela é obrigatória:
  - na **doação**, sempre;
  - na **sugestão**, só quando a pessoa preencher nome ou WhatsApp (sem contato, a caixinha
    fica escondida).
  Sem marcar quando obrigatória, não envia.

## 9. Navegação e botão voltar

`js/navegacao.js` passa a controlar o histórico (o `app.js` hoje faz isso só para o detalhe).

| Ação | Histórico |
|---|---|
| Abrir detalhe | empilha `{ painel: "detalhe" }` |
| Abrir sugerir | empilha `{ painel: "sugerir" }` |
| Ir para Doar | empilha `{ tela: "doar" }` + `#doar` |
| Voltar (navegador, celular, ×, Esc, "Voltar para o mapa") | `history.back()`; o `popstate` fecha o painel ou volta ao mapa |

Abrir `…/#doar` direto já mostra a tela Doar. Nesse caso não há nada empilhado, então
"Voltar para o mapa" **não** usa `history.back()` (sairia do site): troca para o mapa com
`history.replaceState` e remove o `#doar`.

Só existe **um** painel aberto por vez: abrir um fecha o outro sem empilhar de novo.

## 10. Supabase (entrega para o amigo)

### 10.1 `supabase/schema.sql` — tabelas
- `quadras` — colunas do item 4.1 (`equipamentos` e `estrutura` como `jsonb`, `modalidades`,
  `fotos` e `precisa` como `text[]`) + `publicada boolean default true` + `criado_em`.
- `sugestoes` — item 4.2 (`dados jsonb` para os campos da quadra, `foto_path text`).
- `doacoes` — item 4.3.
- `admins` — `user_id` dos logins da dupla.
- Bucket `fotos-sugestoes` (privado, até 5 MB, só JPEG/PNG/WEBP) e bucket `fotos-quadras`
  (leitura pública, escrita só admin).

### 10.2 Regras de segurança (RLS) — obrigatórias
"Admin" = usuário logado **que está na tabela `admins`** (função `is_admin()`). Só estar logado
não basta — proteção extra caso alguém esqueça de desligar o cadastro público.

| Tabela | Visitante (anon) | Admin |
|---|---|---|
| `quadras` | **ler** só `publicada = true` | tudo |
| `sugestoes` | **só inserir**, com `status = 'pendente'` | tudo |
| `doacoes` | **só inserir**, com `status = 'nova'` | tudo |
| bucket `fotos-sugestoes` | **só enviar** | ler e apagar |

- O contador público usa uma função `total_materiais_entregues()` com `security definer`, que
  devolve **só o número**. Visitante nunca lê a tabela `doacoes` (tem WhatsApp das pessoas).
- **Desligar cadastro público** no Auth do Supabase e criar os logins da dupla na mão. Senão
  qualquer um cria conta e vira "admin".
- A chave `anon` pode ficar no site; a `service_role` **nunca**.

### 10.3 `supabase/LEIA-ME.md`
Passo a passo: criar projeto → rodar `schema.sql` → desligar cadastro → criar usuários e
colocar os ids na tabela `admins` →
importar as quadras de `dados.js` → preencher URL e chave `anon` em `js/config.js` → trocar
o miolo de cada função do `api.js` → testar com a checklist da seção 12.

## 11. Estados de carregamento e erro

| Situação | O que aparece |
|---|---|
| Quadras carregando | "Carregando quadras…" na lista; mapa sem pinos |
| Quadras falharam | mensagem + **Tentar de novo** |
| Contador de doações falhou | contador some (a tela funciona sem ele) |
| Admin sem sessão | tela de login |
| Admin: ação falhou | aviso no topo "Não foi possível salvar. Tente de novo." e o item continua como estava |

## 12. Como verificar (checklist manual)

**Site**
1. Aparecem 3 quadras reais + 4 de exemplo; a 404 fica no lugar certo.
2. Filtros Peteca, Postes de vôlei, Bebedouro e Banheiro funcionam (Bebedouro → só a 404).
3. Card da 404 mostra o selo "Precisa de doação"; detalhe mostra o aviso da rede.
4. "Quero doar" no detalhe → tela Doar com a 404 escolhida; o botão voltar do celular volta pro mapa.
5. Sugerir quadra nova sem nome → erro no campo; com tudo certo e a coordenada
   `-10.2100, -48.3300` colada no campo de referência → "Coordenada reconhecida" e mensagem
   de sucesso.
6. Negar o GPS → mensagem e foco no campo de link.
7. `?falhar=1` → erro com "Tentar de novo", e os dados continuam preenchidos.
8. Formulários sem a caixinha LGPD não enviam.
9. Tudo funciona em 375 px de largura.

**Admin**
1. Senha errada → erro; `demo` → entra.
2. A sugestão enviada no item 5 aparece em Pendentes; **Aprovar** → a quadra aparece no mapa
   do site (mesmo navegador), no lugar da coordenada colada.
3. Mudar doação para `entregue` → contador da tela Doar sobe.

## 13. Dados a preencher (não travam o desenvolvimento)
- Ponto de coleta (nome, endereço, horário, link) — depende da faculdade.
- Número de WhatsApp do projeto.
- URL e chave `anon` do Supabase — com o amigo.
