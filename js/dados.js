// Base de dados das quadras (a "fonte da verdade" cadastrada pela dupla).
// Coordenadas são APROXIMADAS — refinar com o local real de cada quadra.
// demo:true = quadra de demonstração (sem foto real ainda).
const QUADRAS = [
  {
    id: "303-sul",
    nome: "Praça 303 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.203135, lng: -48.340401 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-303-sul.jpg"],
    maps: "https://maps.app.goo.gl/qMDSttLb7mqZ8qfG6",
    demo: false
  },
  {
    id: "507-sul",
    nome: "Praça 507 Sul",
    regiao: "Plano Diretor Sul",
    coordenadas: { lat: -10.213890, lng: -48.353970 },
    piso: "cimento",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: ["imgs/praca-507-sul.jpeg"],
    maps: "https://maps.app.goo.gl/G1Dc27cubbPKhJBu7",
    demo: false
  },
  {
    id: "demo-areia",
    nome: "Quadra de Areia (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2200, lng: -48.3400 },
    piso: "areia",
    modalidades: ["volei"],
    equipamentos: { redeVolei: true, aroBasquete: false, traves: false, iluminacao: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    demo: true
  },
  {
    id: "demo-society",
    nome: "Campo Society (exemplo)",
    regiao: "Exemplo — Norte",
    coordenadas: { lat: -10.2050, lng: -48.3450 },
    piso: "gramado",
    modalidades: ["society"],
    equipamentos: { redeVolei: false, aroBasquete: false, traves: true, iluminacao: true },
    coberta: false,
    conservacao: "boa",
    fotos: [],
    demo: true
  },
  {
    id: "demo-ginasio",
    nome: "Ginásio Coberto (exemplo)",
    regiao: "Exemplo — Centro",
    coordenadas: { lat: -10.2450, lng: -48.3280 },
    piso: "emborrachado",
    modalidades: ["futsal", "basquete", "volei"],
    equipamentos: { redeVolei: true, aroBasquete: true, traves: true, iluminacao: true },
    coberta: true,
    conservacao: "boa",
    fotos: [],
    demo: true
  },
  {
    id: "demo-basquete",
    nome: "Quadra de Basquete (exemplo)",
    regiao: "Exemplo — Sul",
    coordenadas: { lat: -10.2900, lng: -48.3250 },
    piso: "cimento",
    modalidades: ["basquete"],
    equipamentos: { redeVolei: false, aroBasquete: true, traves: false, iluminacao: false },
    coberta: false,
    conservacao: "regular",
    fotos: [],
    demo: true
  }
];
