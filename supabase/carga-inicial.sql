-- =====================================================================
-- Quadras de Palmas — carga inicial (só as quadras reais de js/dados.js)
-- Gerado automaticamente a partir de js/dados.js. Rode DEPOIS do schema.sql.
-- As quadras de exemplo (demo) ficam de fora de propósito.
-- =====================================================================

insert into public.quadras
  (id, nome, regiao, lat, lng, piso, modalidades, equipamentos, estrutura, coberta, conservacao, fotos, maps, precisa, demo)
values
  ('303-sul',
   'Praça 303 Sul',
   'Plano Diretor Sul',
   -10.203135,
   -48.340401,
   'cimento',
   array['futsal', 'basquete', 'volei']::text[],
   '{"postesVolei":true,"redeVolei":false,"aroBasquete":true,"traves":true,"iluminacao":true}'::jsonb,
   '{"bebedouro":false,"banheiro":false}'::jsonb,
   false,
   'boa',
   array['imgs/praca-303-sul.jpg']::text[],
   'https://maps.app.goo.gl/qMDSttLb7mqZ8qfG6',
   array['Bola de vôlei', 'Rede de vôlei']::text[],
   false),

  ('507-sul',
   'Praça 507 Sul',
   'Plano Diretor Sul',
   -10.21389,
   -48.35397,
   'cimento',
   array['futsal', 'basquete', 'volei']::text[],
   '{"postesVolei":true,"redeVolei":false,"aroBasquete":true,"traves":true,"iluminacao":true}'::jsonb,
   '{"bebedouro":false,"banheiro":false}'::jsonb,
   false,
   'boa',
   array['imgs/praca-507-sul.jpeg']::text[],
   'https://maps.app.goo.gl/G1Dc27cubbPKhJBu7',
   array['Bola de vôlei', 'Rede de vôlei']::text[],
   false),

  ('404-sul',
   'Praça 404 Sul',
   'Plano Diretor Sul',
   -10.20829,
   -48.328092,
   'cimento',
   array['volei', 'futsal', 'peteca']::text[],
   '{"postesVolei":true,"redeVolei":false,"aroBasquete":false,"traves":false,"iluminacao":true}'::jsonb,
   '{"bebedouro":true,"banheiro":false}'::jsonb,
   false,
   'regular',
   array['imgs/praca-404-sul.jpeg']::text[],
   'https://maps.app.goo.gl/jV779GF8txtxBp9o6',
   array['Rede de vôlei']::text[],
   false)
on conflict (id) do nothing;
