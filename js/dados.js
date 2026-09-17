// Quadras cadastradas pela dupla.
// - Quadras reais: coordenadas tiradas do Google Maps (botão direito no ponto → copiar).
// - demo:true = quadra de exemplo, com dados fictícios.
// No modo demonstração o js/api.js lê esta lista. Com o Supabase, ela vira só a carga
// inicial da tabela "quadras".
//
// Campos: veja docs/superpowers/specs/2026-09-16-formularios-doacoes-design.md (seção 4.1).
const QUADRAS = [
  {
    id: "303-sul",
    nome: "Praça 303 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.203135, lng: -48.340401 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { postesVolei: true, redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-303-sul.jpg"],
    maps: "https://maps.app.goo.gl/qMDSttLb7mqZ8qfG6",
    precisa: ["Bola de vôlei", "Rede de vôlei"],
    demo: false
  },
  {
    id: "507-sul",
    nome: "Praça 507 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.213890, lng: -48.353970 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { postesVolei: true, redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-507-sul.jpeg"],
    maps: "https://maps.app.goo.gl/G1Dc27cubbPKhJBu7",
    precisa: ["Bola de vôlei", "Rede de vôlei"],
    demo: false
  },
  {
    id: "404-sul",
    nome: "Praça 404 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.208290, lng: -48.328092 },
    piso: "cimento",
    modalidades: ["volei", "futsal", "peteca"],
    equipamentos: { postesVolei: true, redeVolei: false, aroBasquete: false, traves: false, iluminacao: true },
    estrutura: { bebedouro: true, banheiro: false },
    coberta: false,
    conservacao: "regular",
    fotos: ["imgs/praca-404-sul.jpeg"],
    maps: "https://maps.app.goo.gl/jV779GF8txtxBp9o6",
    precisa: ["Rede de vôlei"],
    demo: false
  },
  {
    id: "demo-areia",
    nome: "Quadra de Areia (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2200, lng: -48.3400 },
    piso: "areia",
    modalidades: ["volei"],
    equipamentos: { postesVolei: false, redeVolei: true, aroBasquete: false, traves: false, iluminacao: false },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    precisa: [],
    demo: true
  },
  {
    id: "demo-society",
    nome: "Campo Society (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2050, lng: -48.3450 },
    piso: "gramado",
    modalidades: ["society"],
    equipamentos: { postesVolei: false, redeVolei: false, aroBasquete: false, traves: true, iluminacao: true },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: false,
    conservacao: "boa",
    fotos: [],
    precisa: [],
    demo: true
  },
  {
    id: "demo-ginasio",
    nome: "Ginásio Coberto (exemplo)",
    regiao: "Exemplo — Centro",
    coordenadas: { lat: -10.2450, lng: -48.3280 },
    piso: "emborrachado",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { postesVolei: false, redeVolei: true, aroBasquete: true, traves: true, iluminacao: true },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: true,
    conservacao: "boa",
    fotos: [],
    precisa: [],
    demo: true
  },
  {
    id: "demo-basquete",
    nome: "Quadra de Basquete (exemplo)",
    regiao: "Exemplo — Sul",
    coordenadas: { lat: -10.2900, lng: -48.3250 },
    piso: "cimento",
    modalidades: ["basquete"],
    equipamentos: { postesVolei: false, redeVolei: false, aroBasquete: true, traves: false, iluminacao: false },
    estrutura: { bebedouro: false, banheiro: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    precisa: [],
    demo: true
  }
];
