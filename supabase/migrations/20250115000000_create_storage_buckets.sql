-- ============================================
-- ストレージバケット作成とポリシー設定
-- ============================================

-- lp-images バケットを作成（存在しない場合のみ）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lp-images',
  'lp-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage RLS Policies
-- ============================================

-- 認証済みユーザーは自分のフォルダにアップロード可能
DROP POLICY IF EXISTS "Users can upload images to their own folder" ON storage.objects;
CREATE POLICY "Users can upload images to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lp-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 認証済みユーザーは自分の画像を更新可能
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lp-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 認証済みユーザーは自分の画像を削除可能
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lp-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 全てのユーザーが画像を閲覧可能（publicバケットのため）
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'lp-images');
