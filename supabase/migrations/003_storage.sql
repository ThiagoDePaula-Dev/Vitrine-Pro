-- Fase 1: bucket de mídia (leitura pública, escrita só admin)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy media_objects_read on storage.objects for select
  using (bucket_id = 'media');
create policy media_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_admin());
create policy media_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and is_admin());
create policy media_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and is_admin());
