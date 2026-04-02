-- ========================================
-- PrintBase - Supabase テーブル作成SQL
-- Supabase Dashboard の SQL Editor で実行してください
-- ========================================

-- 0. 既存テーブル・ポリシーを削除（再実行用）
DROP POLICY IF EXISTS "Allow all on files" ON files;
DROP POLICY IF EXISTS "Allow all on slots" ON slots;
DROP POLICY IF EXISTS "Allow all on students" ON students;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS students CASCADE;

-- 1. students テーブル
CREATE TABLE students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  grade      TEXT NOT NULL,
  subjects   TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. slots テーブル
CREATE TABLE slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  slot_number     INTEGER NOT NULL,
  upload_comment  TEXT DEFAULT '',
  uploaded_by     TEXT DEFAULT '',
  uploaded_at     TIMESTAMPTZ,
  evaluation      INTEGER CHECK (evaluation BETWEEN 1 AND 4),
  eval_comment    TEXT DEFAULT '',
  evaluated_by    TEXT DEFAULT '',
  evaluated_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'empty' CHECK (status IN ('empty','uploaded','evaluated')),
  UNIQUE(student_id, subject, slot_number)
);

-- 3. files テーブル（1スロットに複数ファイル対応）
CREATE TABLE files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id     UUID REFERENCES slots(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   BIGINT DEFAULT 0,
  uploaded_by TEXT DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS を無効化（簡易運用のため）
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on slots" ON slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on files" ON files FOR ALL USING (true) WITH CHECK (true);

-- 5. Storage バケット作成（Supabase Dashboard > Storage からも作成可能）
INSERT INTO storage.buckets (id, name, public) VALUES ('prints', 'prints', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (bucket_id = 'prints');
CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prints');
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'prints');

-- 6. 初期データ投入（CSVから）
INSERT INTO students (name, grade, subjects) VALUES
  ('中山紗那', '小5', ARRAY['数学','英語']),
  ('伊川朝陽', '中1', ARRAY['数学','英語']),
  ('丸岡千夏', '中1', ARRAY['数学','英語']),
  ('立石龍', '中1', ARRAY['数学','英語']),
  ('櫻井莉子', '中2', ARRAY['数学','英語']),
  ('野上奨真', '中2', ARRAY['数学','英語']),
  ('梶村心優', '中2', ARRAY['数学','英語']),
  ('岡田優衣', '中2', ARRAY['数学','英語']),
  ('武智泰樹', '中3', ARRAY['数学','英語']),
  ('小野寺律生', '中3', ARRAY['数学','英語']),
  ('正木ゆあ', '中3', ARRAY['数学','英語']),
  ('濱来吉', '中3', ARRAY['数学','英語']),
  ('大西雄翔', '中3', ARRAY['数学','英語']),
  ('多田百杏', '中3', ARRAY['数学','英語']),
  ('舛谷颯太', '中3', ARRAY['数学','英語']),
  ('松本悠弥', '高1', ARRAY['数学','英語']),
  ('尾崎結乃介', '高1', ARRAY['数学','英語']),
  ('吉岡ひかり', '高1', ARRAY['数学','英語']),
  ('能野慶次郎', '高1', ARRAY['数学','英語']),
  ('岩佐叡都', '高2', ARRAY['数学','英語']),
  ('福田将万', '高2', ARRAY['数学','英語']),
  ('舛谷花音', '高2', ARRAY['数学','英語']),
  ('佐々木美橙', '高3', ARRAY['数学','英語']),
  ('酒井梨緒', '高3', ARRAY['数学','英語']),
  ('松浦亮斗', '高3', ARRAY['数学','英語']),
  ('尾崎暖太郎', '高3', ARRAY['数学','英語']),
  ('野崎咲南', '高3', ARRAY['数学','英語']),
  ('能野清良', '高3', ARRAY['数学','英語']),
  ('小林健真', '高3', ARRAY['数学','英語']),
  ('瀧口沙良', '高3', ARRAY['数学','英語']),
  ('酒井煌人', '高3', ARRAY['数学','英語']),
  ('木川永翔', '高3', ARRAY['数学','英語']),
  ('村上聡嗣', '高3', ARRAY['数学','英語']),
  ('永吉希帆', '高3', ARRAY['数学','英語']);
