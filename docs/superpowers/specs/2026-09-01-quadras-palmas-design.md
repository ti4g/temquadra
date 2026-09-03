# Quadras de Palmas — Proposta / Desenho do protótipo

**Data:** 2026-09-01
**Tipo:** Projeto de extensão — Sistemas para Internet
**Autores:** Tiago + parceiro de projeto

---

## 1. Contexto e objetivo

Muitas quadras esportivas de Palmas (TO) são diferentes entre si — algumas são de
areia, outras de gramado ou cimento, com ou sem rede de vôlei, com ou sem aro de
basquete — e a comunidade não tem onde consultar isso. Algumas praças/quadras nem
têm quadra poliesportiva.

O objetivo é **tornar esse conhecimento público e fácil de acessar**: um site onde
qualquer pessoa da comunidade abre, vê no mapa onde ficam as quadras e descobre o
que cada uma oferece (tipo de piso, equipamentos, modalidades).

Esta fase entrega um **protótipo navegável** para apresentar ao parceiro de projeto
e servir de base para o desenvolvimento seguinte.

## 2. Escopo

### Nesta fase (protótipo)
- Site de página única em **HTML + CSS + JavaScript puro** (sem framework, sem build).
- **Mapa interativo** de Palmas com pinos nas quadras (Leaflet + OpenStreetMap).
- **Lista de cards** das quadras, **sincronizada** com o mapa (estilo Airbnb).
- **Filtros** por tipo de piso, modalidade, equipamentos e coberta/descoberta.
- **Detalhe da quadra** ao clicar (foto, atributos, localização).
- Botão **"Sugerir quadra"** que abre um **Google Forms** (moderação manual pela dupla).
- Base de dados inicial em arquivo local (`js/dados.js`), incluindo as quadras reais
  da **Praça 303 Sul** e **Praça 507 Sul** + quadras de exemplo variadas.
- **Responsivo**: no celular, alterna entre "Mapa" e "Lista".

### Fora de escopo agora ("depois a gente ajusta")
- Banco de dados real e backend.
- Login e moderação/aprovação dentro do próprio site.
- Sugestão de quadra sem sair do site (hoje vai via Google Forms).
- Comunidades/grupos que frequentam a quadra (galera do basquete, link de grupo,
  Instagram) — **ideia futura registrada**.

## 3. Modelo de coleta de dados

Modelo **misto**: a dupla cadastra a base inicial (fonte da verdade, no `js/dados.js`);
a comunidade **sugere** quadras/correções pelo Google Forms; a dupla **revisa e aprova**
antes de adicionar à base. Nesta fase a aprovação é manual (editar o arquivo de dados).

## 4. Tecnologia (100% grátis, sem cadastro/cartão)

- **HTML5 + CSS3 + JavaScript (ES6) puro** — abre direto no navegador, sem instalar nada.
- **[Leaflet](https://leafletjs.com/)** + tiles do **OpenStreetMap** para o mapa
  (open source, sem API key, sem conta de faturamento).
- **Dados** num arquivo JS local (`js/dados.js`) — sem servidor.
- **Google Forms** para sugestões da comunidade.
- Hospedagem futura sugerida: **GitHub Pages** (grátis).

Motivo de não usar Google Maps: exige criar conta de faturamento com cartão de crédito.
Leaflet + OSM entrega o mesmo visual de pinos clicáveis sem essa fricção.

## 5. Estrutura de arquivos

```
Quadra/
├── index.html          → estrutura da página
├── css/
│   └── estilos.css     → todo o visual
├── js/
│   ├── dados.js        → array de quadras (a base inicial)
│   └── app.js          → mapa, filtros, lista, sincronização
├── imgs/
│   ├── Praça 303 sul.jpg
│   ├── praça 507sul.jpeg
│   └── placeholder.svg → imagem "sem foto" para dados de demonstração
└── docs/               → esta proposta
```

Arquivos separados para que o parceiro consiga mexer numa parte (ex.: só os dados,
ou só o visual) sem quebrar as outras.

## 6. Modelo de dados de cada quadra

Cada quadra é um objeto no array de `js/dados.js`:

```js
{
  id: "303-sul",                         // identificador único (slug)
  nome: "Praça 303 Sul",
  regiao: "Plano Diretor Sul",           // bairro / região de Palmas
  coordenadas: { lat: -10.2400, lng: -48.3300 }, // p/ o pino no mapa
  piso: "cimento",                       // areia | gramado | cimento | emborrachado
  modalidades: ["futsal", "basquete", "volei"],
  equipamentos: {
    redeVolei: false,
    aroBasquete: true,
    traves: true,                        // traves de gol/futsal
    iluminacao: true                     // dá pra jogar à noite
  },
  coberta: false,                        // coberta ou descoberta
  conservacao: "boa",                    // boa | regular | ruim
  fotos: ["imgs/Praça 303 sul.jpg"],
  demo: false                            // true = dado de demonstração (placeholder)
}
```

## 7. Dados de exemplo (seed do protótipo)

Quadras **reais** (com foto):

1. **Praça 303 Sul** — piso de cimento pintado, alambrada, descoberta; aro de basquete,
   trave de gol, iluminação; modalidades: futsal, basquete, vôlei; conservação boa.
   Foto: `imgs/Praça 303 sul.jpg`.
2. **Praça 507 Sul** — piso de cimento pintado, alambrada, descoberta; aro de basquete,
   trave de gol, iluminação; modalidades: futsal, basquete, vôlei; conservação boa.
   Foto: `imgs/praça 507sul.jpeg`.

Quadras de **demonstração** (marcadas `demo: true`, imagem placeholder até terem foto
real), só para exibir os filtros funcionando com variedade:

3. Quadra de **areia** — vôlei de praia, com rede.
4. Campo de **gramado / society** — futebol society, com traves.
5. **Ginásio coberto** — poliesportivo coberto.
6. Quadra **cimentada só com aro de basquete** (sem rede de vôlei).

> Coordenadas das quadras reais entram aproximadas e serão refinadas depois.

## 8. Telas e comportamento

### Desktop
- Cabeçalho com título, barra de **filtros** e botão **"Sugerir quadra"**.
- Coluna esquerda: **lista de cards** (foto, nome, região, ícones dos equipamentos).
- Coluna direita: **mapa** com pinos.
- **Sincronização**: passar o mouse num card destaca o pino correspondente; clicar no
  card ou no pino abre o **detalhe** da quadra (foto, todos os atributos, localização).
- Aplicar filtro atualiza **lista e pinos ao mesmo tempo**.

### Celular
- Botão para **alternar "Mapa" / "Lista"** (a maioria da comunidade abre no telefone).
- Filtros acessíveis no topo; detalhe abre em tela cheia / painel.

### Filtros
- **Piso**: areia / gramado / cimento / emborrachado.
- **Modalidade**: vôlei / basquete / futsal / society.
- **Equipamentos**: rede de vôlei / aro de basquete / traves / iluminação.
- **Cobertura**: coberta / descoberta.
- Combináveis (ex.: "cimento + aro de basquete"). Mostra contagem de resultados.

## 9. Sugestão da comunidade (Google Forms)

O botão "Sugerir quadra" abre, em nova aba, um Google Form criado na conta da dupla.
As respostas caem numa planilha do Google que a dupla revisa; quando aprovada, a quadra
é adicionada manualmente ao `js/dados.js`.

**Campos que o Google Form deve ter** (para bater com o modelo de dados):
- Nome / referência da quadra
- Região / bairro (e ponto de referência)
- Tipo de piso (areia / gramado / cimento / emborrachado)
- Modalidades possíveis (vôlei / basquete / futsal / society)
- Equipamentos (rede de vôlei? aro? traves? iluminação?)
- Coberta ou descoberta
- Estado de conservação (boa / regular / ruim)
- Foto (upload) — opcional
- Nome/contato de quem sugeriu — opcional

No protótipo o botão aponta para um **link placeholder** até a dupla criar o Form real.

## 10. Critérios de sucesso do protótipo

- Abrir o `index.html` no navegador mostra o mapa de Palmas com os pinos das quadras.
- É possível filtrar e ver lista + mapa reagindo juntos.
- Clicar numa quadra mostra foto e todos os atributos.
- Funciona bem no celular (alternar mapa/lista).
- O botão "Sugerir quadra" abre o formulário.
- Dá para apresentar tudo sem servidor, internet só para carregar o mapa.

## 11. Futuro (registrado, fora desta fase)

- Backend + banco de dados real (ex.: começar simples e evoluir).
- Login e painel de moderação dentro do site.
- Sugestão e envio de foto sem sair do site.
- Comunidades/grupos que frequentam cada quadra (basquete, vôlei), com link de grupo
  de WhatsApp e/ou Instagram.
- Publicação no GitHub Pages com domínio divulgável para a comunidade.
