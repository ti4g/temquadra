/* Quadras de Palmas — configurações do projeto.
   Os "A definir" aparecem assim na tela de propósito: dependem da faculdade. */
const CONFIG = {
  // Onde as doações podem ser entregues
  pontoColeta: {
    nome: 'A definir com o professor',
    endereco: 'A definir',
    horario: 'A definir',
    maps: ''            // link do Google Maps; vazio = esconde o botão "Como chegar"
  },

  // WhatsApp do projeto: DDI + DDD + número, só dígitos (ex.: 5563999990000).
  // Vazio = esconde os botões "Enviar pelo WhatsApp".
  whatsappProjeto: '',

  // Preenchido na conexão com o Supabase (ver supabase/LEIA-ME.md).
  // A chave "anon" pode ficar aqui; a "service_role" NUNCA.
  supabase: {
    url: '',
    chaveAnon: ''
  }
};
