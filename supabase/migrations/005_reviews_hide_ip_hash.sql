-- A policy reviews_read_public libera linhas aprovadas, mas devolvia TODAS as colunas, inclusive ip_hash.
-- Com sal fraco/público o hash de IP seria reversível por força bruta. Limita o que o anon pode ler (por coluna).
revoke select on reviews from anon;
grant select (id, professional_id, author_name, rating, comment, status, created_at) on reviews to anon;
-- authenticated (admin, via RLS is_admin) continua lendo tudo, inclusive ip_hash, para moderação.
