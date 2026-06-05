INSERT INTO storage.buckets
  (id, name, public, file_size_limit,
  allowed_mime_types)
VALUES
(
  'company-files',
  'company-files',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
),
(
  'client-documents',
  'client-documents',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
),
(
  'employee-documents',
  'employee-documents',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ]
),
(
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml'
  ]
);

CREATE POLICY "Company members can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-files');

CREATE POLICY "Company members can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company-files');

CREATE POLICY "Company members can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-files');
