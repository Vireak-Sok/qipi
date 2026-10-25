-- Uploads are private to their owner; the bucket itself is public-read so feed
-- images and profile photos can render without exposing an authenticated URL.
-- Create the qipi-images public bucket in Storage with a 5 MiB size limit and
-- image/jpeg, image/png, and image/webp as the allowed MIME types.

drop policy if exists qipi_images_insert_own_folder on storage.objects;
create policy qipi_images_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'qipi-images'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (storage.foldername(name))[3] in ('profile', 'trips')
);
