insert into categories (name, slug, icon, registry_label, is_health) values
  ('Personal trainer',  'personal-trainer', 'dumbbell',   'CREF',  true),
  ('Psicólogo(a)',      'psicologo',        'brain',      'CRP',   true),
  ('Nutricionista',     'nutricionista',    'apple',      'CRN',   true),
  ('Fisioterapeuta',    'fisioterapeuta',   'activity',   'CREFITO', true),
  ('Dentista',          'dentista',         'smile',      'CRO',   true),
  ('Barbeiro',          'barbeiro',         'scissors',   null,    false),
  ('Cabeleireiro(a)',   'cabeleireiro',     'sparkles',   null,    false),
  ('Tatuador(a)',       'tatuador',         'pen-tool',   null,    false),
  ('Fotógrafo(a)',      'fotografo',        'camera',     null,    false),
  ('Advogado(a)',       'advogado',         'scale',      'OAB',   false),
  ('Coach',             'coach',            'target',     null,    false)
on conflict (slug) do nothing;
