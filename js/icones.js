/* Quadras de Palmas — ícones SVG (traço) e cores dos pisos. */
(function (raiz) {
  'use strict';

  const SVG = {
    // Equipamentos
    postesVolei: '<svg viewBox="0 0 24 24"><path d="M6 21V4M18 21V4"/><path d="M4 21h4M16 21h4"/><path d="M6 7h12" stroke-dasharray="2 2.2"/></svg>',
    redeVolei: '<svg viewBox="0 0 24 24"><path d="M3 8h18v9H3z"/><path d="M3 12h18M3 15h18M8 8v9M13 8v9M18 8v9M3 5v3M21 5v3"/></svg>',
    aroBasquete: '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="8" rx="1"/><path d="M9 11c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M10 13.5 9 21M14 13.5 15 21M12 14v7"/></svg>',
    traves: '<svg viewBox="0 0 24 24"><path d="M3 20V7h18v13"/><path d="M3 7l3-3h12l3 3"/><path d="M7 20v-6h10v6"/></svg>',
    iluminacao: '<svg viewBox="0 0 24 24"><circle cx="12" cy="11" r="4"/><path d="M12 2v2M12 18v2M3 11h2M19 11h2M5.6 4.6l1.4 1.4M17 17l1.4 1.4M18.4 4.6 17 6M7 17l-1.4 1.4"/></svg>',
    // Estrutura
    bebedouro: '<svg viewBox="0 0 24 24"><path d="M12 3.5s6 6.3 6 10.5a6 6 0 0 1-12 0c0-4.2 6-10.5 6-10.5z"/><path d="M9.3 14.3a2.8 2.8 0 0 0 2.7 2.9"/></svg>',
    banheiro: '<svg viewBox="0 0 24 24"><circle cx="6.5" cy="4.5" r="1.6"/><path d="M4.5 21v-5.5H3.8V10a1.6 1.6 0 0 1 1.6-1.6h2.2A1.6 1.6 0 0 1 9.2 10v5.5h-.7V21"/><path d="M12 3v18"/><circle cx="17.5" cy="4.5" r="1.6"/><path d="M16 21v-4.5h-2.3l1.9-6.9a1.5 1.5 0 0 1 1.5-1.2h.8a1.5 1.5 0 0 1 1.5 1.2l1.9 6.9H19V21"/></svg>',
    // Interface
    doar: '<svg viewBox="0 0 24 24"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
    mais: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    gps: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>',
    foto: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M3.5 20.5l1.3-4.1A8.5 8.5 0 1 1 8 19.4z"/><path d="M9.2 8.2c-.4 2.8 3.7 6.9 6.6 6.6l.9-1.6-2-1.1-1 .9a4.5 4.5 0 0 1-2.7-2.7l.9-1-1.1-2z"/></svg>',
    voltar: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    direcao: '<svg viewBox="0 0 24 24"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5v.5"/></svg>',
    caixa: '<svg viewBox="0 0 24 24"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/></svg>',
    relogio: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    sair: '<svg viewBox="0 0 24 24"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h11"/></svg>'
  };

  const COR_PISO = {
    areia: '#E0A94E',
    gramado: '#37A96A',
    cimento: '#17B0BD',
    emborrachado: '#FF6A4D'
  };

  // Marcações de quadra usadas como marca-d'água
  const LINHAS_QUADRA =
    '<svg class="detalhe__linhas" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<g fill="none" stroke="#fff" stroke-width="2">' +
    '<rect x="6" y="6" width="188" height="108" rx="2"/>' +
    '<line x1="100" y1="6" x2="100" y2="114"/>' +
    '<circle cx="100" cy="60" r="22"/>' +
    '<rect x="6" y="38" width="34" height="44"/>' +
    '<rect x="160" y="38" width="34" height="44"/></g></svg>';

  const Icones = {
    // SVG cru, para dentro de .ic (que já define traço e tamanho)
    svg: function (chave) { return SVG[chave] || ''; },
    // SVG com a classe .i (ícone solto em botão/texto), decorativo
    i: function (chave, classeExtra) {
      const s = SVG[chave] || '';
      return s.replace('<svg ', '<svg class="i' + (classeExtra ? ' ' + classeExtra : '') + '" aria-hidden="true" focusable="false" ');
    },
    corDoPiso: function (piso) { return COR_PISO[piso] || COR_PISO.cimento; },
    LINHAS_QUADRA: LINHAS_QUADRA
  };

  raiz.Icones = Icones;
})(window);
