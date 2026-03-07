-- ============================================================
-- HOTFIX: Ubah trigger BEFORE → AFTER pada tabel applications
--
-- Masalah: BEFORE INSERT trigger mencoba INSERT ke stage_history
-- dengan FK ke applications(id), tapi row belum ada di tabel
-- karena trigger jalan SEBELUM row di-commit.
--
-- Solusi: Ganti menjadi AFTER trigger — row applications sudah
-- ada saat stage_history di-insert.
--
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1. Drop trigger lama
DROP TRIGGER IF EXISTS on_stage_change ON public.applications;

-- 2. Recreate dengan AFTER (bukan BEFORE)
CREATE TRIGGER on_stage_change
  AFTER INSERT OR UPDATE OF stage ON public.applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_stage_change();

-- 3. Verifikasi
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'applications'
  AND trigger_schema = 'public';
