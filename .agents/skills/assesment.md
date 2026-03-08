# Arvela — Assessment Extension Spec
**Spec for Agent / Developer Reference**
`v2.1 · Module 4 Extension · Next.js + Supabase`

---

## Konteks & Tujuan

Dokumen ini adalah ekstensi dari **Module 4: Assessment Builder & Runner** di Arvela.

Tipe soal yang sudah ada saat ini:
- `multiple_choice` — pilihan ganda, 1 jawaban benar
- `essay` — teks bebas, review manual HR
- `scale_rating` — skala numerik (1–5 atau 1–10)
- `situational_scenario` — narasi skenario + essay response

Tujuan v2.1 ini mencakup empat area ekstensi yang dibangun sekarang:
1. **Tipe soal baru** — untuk mengakomodasi model asesmen yang lebih beragam
2. **Jenis tes (Assessment Type)** — kategorisasi asesmen berdasarkan tujuan psikometri
3. **Sistem interpretasi rule-based** — analisis karakter otomatis berbasis skor dimensi dan threshold
4. **Manual scoring untuk essay** — HR bisa input nilai secara manual

> **Catatan scope:** Fitur AI Narrative (generasi teks interpretasi otomatis via Claude API) **sengaja di-defer** ke pengembangan berikutnya. Arsitektur tabel `assessment_interpretations` sudah dirancang untuk mengakomodasi kolom AI di masa depan tanpa migration besar. Lihat Appendix A untuk detail rencana integrasi AI.

**Prinsip ekstensi:**
- Semua tipe soal baru tetap di tabel `questions` dan `answers` yang sudah ada
- Perubahan schema seminimal mungkin — extend `options JSONB` dan `correct_answer JSONB`
- Tidak ada storage besar: tidak ada file upload, tidak ada video recording
- Scoring logic per tipe harus terdefinisi jelas: auto-score atau manual
- Semua tipe harus bisa dirender di `/assessment/[token]` tanpa auth

---

## BAGIAN 1 — TIPE SOAL BARU

### Ringkasan

| # | Tipe | `question_type` value | Auto-score | Manual Score | Effort |
|---|---|---|---|---|---|
| 1 | Multiple Select | `multiple_select` | ✅ | ❌ | Rendah |
| 2 | Ranking / Ordering | `ranking` | ✅ | ❌ | Rendah |
| 3 | Numeric Input | `numeric_input` | ✅ | ❌ | Rendah |
| 4 | Matrix / Likert Grid | `matrix` | ✅ (dimensi) | ❌ | Sedang |
| 5 | Game-Based Task | `game_task` | ✅ | ❌ | Sedang–Tinggi |

Tipe `file_upload` dan `video_response` dari v1.0 **dihapus** untuk menghindari beban storage.

---

### 1. Multiple Select (`multiple_select`)

**Deskripsi**
Kandidat memilih **satu atau lebih** jawaban benar dari beberapa opsi. Berbeda dari `multiple_choice` yang hanya satu pilihan.

**Kapan digunakan**
- Soal pengetahuan dengan lebih dari satu jawaban benar
- SJT ringan: *"Pilih semua tindakan yang tepat dalam situasi ini"*

**Struktur `options`**
```json
{
  "choices": [
    { "id": "a", "label": "Segera delegasikan ke tim" },
    { "id": "b", "label": "Buat prioritas list terlebih dahulu" },
    { "id": "c", "label": "Abaikan hingga deadline mendekat" },
    { "id": "d", "label": "Komunikasikan hambatan ke atasan" }
  ],
  "min_select": 1,
  "max_select": 3
}
```

**Struktur `correct_answer`**
```json
{
  "correct_ids": ["a", "b", "d"],
  "scoring_method": "partial"
}
```

**Scoring Methods**
- `"exact"` — semua jawaban harus persis sama, satu beda = 0 poin
- `"partial"` — proporsional: `(benar dipilih − salah dipilih) / total benar × max_points`, minimum 0

**`answer_text`**
```json
["a", "b", "d"]
```

**Scoring Engine**
```typescript
function scoreMultipleSelect(
  answer: string[],
  correctIds: string[],
  method: "exact" | "partial",
  maxPoints: number
): number {
  if (method === "exact") {
    const exact = answer.length === correctIds.length &&
      answer.every(id => correctIds.includes(id));
    return exact ? maxPoints : 0;
  }
  const correct = answer.filter(id => correctIds.includes(id)).length;
  const wrong = answer.filter(id => !correctIds.includes(id)).length;
  return Math.max(0, Math.round(((correct - wrong) / correctIds.length) * maxPoints));
}
```

**UI Notes**
- Render sebagai checkbox group
- Tampilkan hint: *"Pilih 1–3 jawaban"*
- Tombol Next disabled jika pilihan < `min_select` atau > `max_select`

---

### 2. Ranking / Ordering (`ranking`)

**Deskripsi**
Kandidat mengurutkan daftar item sesuai penilaian atau preferensi mereka.

**Kapan digunakan**
- SJT prioritization: *"Urutkan tindakan berikut dari paling tepat ke paling tidak tepat"*
- Values assessment: *"Urutkan nilai-nilai ini dari yang paling penting bagimu"*

**Struktur `options`**
```json
{
  "items": [
    { "id": "1", "label": "Selesaikan laporan yang sudah terlambat" },
    { "id": "2", "label": "Hadiri rapat mendadak dari direktur" },
    { "id": "3", "label": "Balas email klien yang urgent" },
    { "id": "4", "label": "Review pekerjaan anggota tim" }
  ]
}
```

**Struktur `correct_answer`**
```json
{
  "ideal_order": ["2", "1", "3", "4"],
  "scoring_method": "spearman"
}
```
`correct_answer` boleh `null` jika soal murni untuk data psikometri tanpa scoring.

**Scoring Methods**
- `"exact"` — poin penuh hanya jika urutan identik
- `"spearman"` — skor berdasarkan Spearman rank correlation, range 0–max_points
- `null` — tidak di-score, jawaban disimpan sebagai data dimensi psikometri

**`answer_text`**
```json
["2", "3", "1", "4"]
```

**Scoring Engine (Spearman)**
```typescript
function scoreRanking(answer: string[], idealOrder: string[], maxPoints: number): number {
  const n = idealOrder.length;
  let dSq = 0;
  answer.forEach((id, rank) => {
    const idealRank = idealOrder.indexOf(id);
    dSq += Math.pow(rank - idealRank, 2);
  });
  const rs = 1 - (6 * dSq) / (n * (n * n - 1));
  return Math.max(0, Math.round(((rs + 1) / 2) * maxPoints));
}
```

**UI Notes**
- Render sebagai drag-and-drop list (`@dnd-kit/core`)
- Fallback mobile: tombol panah atas/bawah per item
- Nomor urutan ditampilkan real-time di kiri item
- Semua item wajib ditempatkan sebelum submit

---

### 3. Numeric Input (`numeric_input`)

**Deskripsi**
Kandidat memasukkan angka sebagai jawaban. Untuk soal hitung, estimasi, atau interpretasi data.

**Kapan digunakan**
- Numerical reasoning: *"Berapa persen kenaikan revenue dari Q1 ke Q2?"*
- Estimasi logis: *"Berapa kira-kira jumlah SPBU di Jakarta?"*
- Interpretasi tabel/grafik yang ditampilkan di soal (teks atau ASCII)

**Struktur `options`**
```json
{
  "unit": "%",
  "placeholder": "Masukkan angka...",
  "decimal_allowed": true,
  "min_value": 0,
  "max_value": 1000
}
```

**Struktur `correct_answer`**
```json
{
  "value": 23.5,
  "tolerance": 0.5,
  "scoring_method": "exact_with_tolerance"
}
```

**Scoring Methods**
- `"exact"` — harus persis sama
- `"exact_with_tolerance"` — benar jika `|answer − value| ≤ tolerance`
- `"range"` — benar jika `min ≤ answer ≤ max`

**`answer_text`**
```json
"23.0"
```

**Scoring Engine**
```typescript
function scoreNumericInput(
  answerStr: string,
  correct: { value?: number; tolerance?: number; min?: number; max?: number; scoring_method: string },
  maxPoints: number
): number {
  const answer = parseFloat(answerStr);
  if (isNaN(answer)) return 0;
  if (correct.scoring_method === "exact") return answer === correct.value ? maxPoints : 0;
  if (correct.scoring_method === "exact_with_tolerance")
    return Math.abs(answer - (correct.value ?? 0)) <= (correct.tolerance ?? 0) ? maxPoints : 0;
  if (correct.scoring_method === "range")
    return answer >= (correct.min ?? -Infinity) && answer <= (correct.max ?? Infinity) ? maxPoints : 0;
  return 0;
}
```

**UI Notes**
- `<input type="number">` dengan label unit di kanan
- Enforce `min_value` dan `max_value`
- Soal teks bisa menyertakan tabel/data dalam `question_text` menggunakan markdown

---

### 4. Matrix / Likert Grid (`matrix`)

**Deskripsi**
Satu set pernyataan yang masing-masing dinilai pada skala yang sama, dalam format tabel. Ini adalah **fondasi dari semua asesmen psikometri** — DISC, Big Five, Work Culture Fit, dll.

**Kapan digunakan**
- Self-assessment kepribadian
- Culture fit questionnaire
- Competency self-rating

**Struktur `options`**
```json
{
  "statements": [
    { "id": "s1", "text": "Saya nyaman memimpin diskusi dalam kelompok besar" },
    { "id": "s2", "text": "Saya lebih suka bekerja sendiri daripada dalam tim" },
    { "id": "s3", "text": "Saya mudah beradaptasi dengan perubahan mendadak" },
    { "id": "s4", "text": "Saya cenderung merencanakan sesuatu jauh-jauh hari" }
  ],
  "scale": {
    "min": 1,
    "max": 5,
    "labels": {
      "1": "Sangat Tidak Setuju",
      "3": "Netral",
      "5": "Sangat Setuju"
    }
  },
  "dimensions": {
    "s1": "extraversion",
    "s2": "introversion",
    "s3": "openness",
    "s4": "conscientiousness"
  },
  "reverse_scored": ["s2"]
}
```

Field `reverse_scored` berisi ID pernyataan yang skornya dibalik (nilai 5 jadi 1, dst). Umum di psikometri untuk menghindari response bias.

**Reverse Scoring Formula**
`reversed_value = (scale.max + scale.min) − original_value`

**Struktur `correct_answer`**
```json
null
```
Selalu null. Matrix tidak memiliki jawaban benar/salah.

**`answer_text`**
```json
{ "s1": 4, "s2": 2, "s3": 5, "s4": 3 }
```

**Dimensi Aggregation — dijalankan saat submit**
```typescript
function aggregateMatrixDimensions(
  answers: Record<string, Record<string, number>>,
  questions: Array<{ id: string; options: any }>
): Record<string, { total: number; count: number; average: number }> {
  const scores: Record<string, { total: number; count: number; average: number }> = {};

  questions.forEach(q => {
    const qAnswers = answers[q.id] ?? {};
    const { dimensions, reverse_scored, scale } = q.options;

    Object.entries(qAnswers).forEach(([sid, rawValue]) => {
      const dim = dimensions?.[sid];
      if (!dim) return;

      const value = reverse_scored?.includes(sid)
        ? (scale.max + scale.min) - (rawValue as number)
        : rawValue as number;

      if (!scores[dim]) scores[dim] = { total: 0, count: 0, average: 0 };
      scores[dim].total += value;
      scores[dim].count += 1;
    });
  });

  Object.keys(scores).forEach(dim => {
    scores[dim].average = scores[dim].total / scores[dim].count;
  });

  return scores;
}
```

**UI Notes**
- Desktop: tabel (baris = pernyataan, kolom = skala nilai)
- Mobile: card per pernyataan dengan horizontal radio group
- Semua pernyataan wajib dijawab sebelum bisa lanjut

---

### 5. Game-Based Task (`game_task`)

**Deskripsi**
Tugas berbasis interaksi browser ringan yang mengukur aspek kognitif atau psikometri secara implisit — kandidat tidak sadar sedang "dites". Tidak butuh storage, tidak ada file/video. Semua pure JavaScript interaction.

**Kapan digunakan**
- Mengukur cognitive traits (processing speed, attention, working memory)
- Mengukur behavioral traits (risk tolerance, impulsivity, persistence)
- Meningkatkan engagement kandidat — lebih menarik dari soal konvensional

**Sub-tipe Game yang Diimplementasi**

Game-based task menggunakan field `game_variant` di dalam `options` untuk menentukan jenis game. Masing-masing mengukur dimensi yang berbeda.

---

#### 5a. Stroop Task — Mengukur Cognitive Control & Attention

**Konsep:** Kandidat melihat kata nama warna (misal: "MERAH") yang ditulis dengan warna tinta berbeda (misal: warna biru). Kandidat harus mengklik warna TINTA-nya, bukan warna yang tertulis. Respons yang lambat atau salah mengindikasikan rendahnya cognitive control.

**Dimensi yang diukur:** `cognitive_control`, `attention_focus`

**Struktur `options`**
```json
{
  "game_variant": "stroop",
  "rounds": 20,
  "time_limit_per_round_ms": 3000,
  "color_options": ["merah", "biru", "hijau", "kuning"],
  "instructions": "Klik WARNA TINTA dari kata berikut, bukan arti katanya."
}
```

**`answer_text` — hasil agregat seluruh ronde**
```json
{
  "rounds_completed": 20,
  "correct": 16,
  "incorrect": 4,
  "avg_response_time_ms": 842,
  "congruent_accuracy": 0.95,
  "incongruent_accuracy": 0.75
}
```
`congruent` = kata dan warna sama (mudah). `incongruent` = kata dan warna beda (yang mengukur cognitive control sesungguhnya).

**Scoring**
```typescript
function scoreStroop(data: {
  incongruent_accuracy: number;
  avg_response_time_ms: number;
}, maxPoints: number): number {
  // Bobot: 70% akurasi incongruent, 30% kecepatan (normalized ke target 1000ms)
  const accuracyScore = data.incongruent_accuracy * 0.7;
  const speedScore = Math.min(1, 1000 / data.avg_response_time_ms) * 0.3;
  return Math.round((accuracyScore + speedScore) * maxPoints);
}
```

---

#### 5b. Dot Pattern Memory — Mengukur Working Memory

**Konsep:** Grid 4×4 muncul, beberapa kotak menyala selama 2 detik. Setelah hilang, kandidat harus mengklik kotak mana saja yang tadi menyala. Level kesulitan naik setiap ronde (lebih banyak kotak menyala).

**Dimensi yang diukur:** `working_memory`, `attention_to_detail`

**Struktur `options`**
```json
{
  "game_variant": "dot_memory",
  "grid_size": 4,
  "starting_dots": 3,
  "max_dots": 9,
  "display_duration_ms": 2000,
  "rounds": 8,
  "instructions": "Hafalkan posisi titik yang menyala, lalu klik kotak yang benar."
}
```

**`answer_text`**
```json
{
  "max_level_reached": 6,
  "rounds_correct": 5,
  "rounds_total": 8,
  "accuracy_by_level": { "3": 1.0, "4": 1.0, "5": 1.0, "6": 0.5, "7": 0.0 }
}
```

**Scoring**
```typescript
function scoreDotMemory(data: {
  max_level_reached: number;
  rounds_correct: number;
  rounds_total: number;
}, maxPoints: number): number {
  const levelScore = (data.max_level_reached / 9) * 0.6;
  const accuracyScore = (data.rounds_correct / data.rounds_total) * 0.4;
  return Math.round((levelScore + accuracyScore) * maxPoints);
}
```

---

#### 5c. Balloon Risk Task (BART) — Mengukur Risk Tolerance

**Konsep:** Kandidat memompa balon virtual. Setiap pompa menambah reward poin. Tapi balon bisa meledak secara random — jika meledak sebelum disimpan, semua poin ronde itu hilang. Kandidat memutuskan kapan berhenti dan simpan poin.

**Dimensi yang diukur:** `risk_tolerance`, `decision_making`, `impulsivity`

**Struktur `options`**
```json
{
  "game_variant": "bart",
  "balloons": 10,
  "max_pumps": 32,
  "reward_per_pump": 5,
  "explosion_probability_per_pump": 0.08,
  "instructions": "Pompa balon untuk menambah poin. Simpan sebelum balon meledak!"
}
```

**`answer_text`**
```json
{
  "total_earned": 380,
  "avg_pumps_before_save": 14.2,
  "explosions": 3,
  "adjusted_avg_pumps": 12.8
}
```
`adjusted_avg_pumps` = rata-rata pompa hanya dari balon yang tidak meledak. Ini adalah metrik BART yang paling valid secara psikometri.

**Scoring (untuk dimensi, bukan benar/salah)**
```typescript
// adjusted_avg_pumps tinggi = risk-seeking
// adjusted_avg_pumps rendah = risk-averse
// Tidak ada "benar/salah" — ini pure dimensi psikometri
// Nilai disimpan ke assessment_dimension_scores.dimension_name = "risk_tolerance"
// raw_score = adjusted_avg_pumps / max_pumps * 100
function scoreBart(adjustedAvgPumps: number, maxPumps: number): number {
  return Math.round((adjustedAvgPumps / maxPumps) * 100);
}
```

---

#### 5d. Task Switching — Mengukur Cognitive Flexibility

**Konsep:** Kandidat menjawab soal sederhana yang berganti aturan setiap beberapa detik. Contoh: giliran ganjil → klik angka lebih besar; giliran genap → klik angka lebih kecil. Mengukur kemampuan berpindah aturan secara cepat.

**Dimensi yang diukur:** `cognitive_flexibility`, `adaptability`

**Struktur `options`**
```json
{
  "game_variant": "task_switching",
  "rounds": 24,
  "switch_every_n_rounds": 3,
  "time_limit_per_round_ms": 2500,
  "rules": [
    { "id": "rule_a", "instruction": "Klik angka yang LEBIH BESAR", "type": "greater" },
    { "id": "rule_b", "instruction": "Klik angka yang LEBIH KECIL", "type": "lesser" }
  ],
  "instructions": "Ikuti aturan yang ditampilkan di atas. Aturan berganti setiap 3 soal."
}
```

**`answer_text`**
```json
{
  "accuracy_stay_trials": 0.92,
  "accuracy_switch_trials": 0.74,
  "switch_cost": 0.18,
  "avg_rt_stay_ms": 780,
  "avg_rt_switch_ms": 1120
}
```
`switch_cost` = selisih akurasi stay vs switch. Semakin kecil switch_cost, semakin fleksibel kognitifnya.

**Scoring**
```typescript
function scoreTaskSwitching(data: {
  accuracy_switch_trials: number;
  switch_cost: number;
}, maxPoints: number): number {
  const accuracyScore = data.accuracy_switch_trials * 0.6;
  const flexibilityScore = Math.max(0, 1 - data.switch_cost * 3) * 0.4;
  return Math.round((accuracyScore + flexibilityScore) * maxPoints);
}
```

---

**Schema untuk `game_task` — `answer_text`**

Semua sub-tipe menyimpan `answer_text` sebagai JSON string hasil agregat. Tidak ada recording, tidak ada file — hanya data numerik hasil interaksi.

**UI Notes untuk semua game**
- Render di `/assessment/[token]` dalam container penuh layar (full-width card)
- Tutorial singkat 1 layar sebelum game dimulai, dengan tombol *"Mulai"*
- Countdown 3 detik sebelum game benar-benar mulai
- Progress indicator (Ronde 3 dari 20)
- Setelah selesai: tampilkan layar *"Bagus! Lanjut ke soal berikutnya"* — **jangan tampilkan skor ke kandidat**
- Semua interaksi via `onClick` dan `onKeyDown` — tidak ada canvas/WebGL, murni DOM

---

## BAGIAN 2 — JENIS TES (ASSESSMENT TYPE)

### Konsep

"Jenis Tes" adalah label kategorisasi di level asesmen (tabel `assessments`), bukan di level soal. Satu asesmen bisa terdiri dari campuran tipe soal yang berbeda, tapi memiliki satu tujuan psikometri yang jelas.

### Kolom Baru di Tabel `assessments`

```sql
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS
  assessment_type TEXT DEFAULT 'custom'
  CHECK (assessment_type IN (
    'custom',           -- bebas, tidak ada kerangka psikometri khusus
    'cognitive',        -- tes kemampuan kognitif
    'personality',      -- tes kepribadian (DISC, Big Five, dll)
    'culture_fit',      -- kesesuaian dengan nilai perusahaan
    'sjt',              -- situational judgement test
    'game_based'        -- asesmen berbasis game task
  ));

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS
  dimension_config JSONB DEFAULT NULL;
  -- Konfigurasi dimensi untuk assessment_type yang menghasilkan profil
  -- Nullable untuk tipe 'custom'
```

---

### Spesifikasi Per Jenis Tes

---

#### Cognitive Test

**Tujuan:** Mengukur kemampuan intelektual — numerical reasoning, verbal reasoning, logical/abstract reasoning.

**`assessment_type`:** `cognitive`

**Tipe soal yang digunakan:** `multiple_choice`, `multiple_select`, `numeric_input`, `ranking`, `game_task` (Stroop, Dot Memory, Task Switching)

**`dimension_config` contoh**
```json
{
  "dimensions": [
    {
      "id": "numerical_reasoning",
      "label": "Numerical Reasoning",
      "description": "Kemampuan memahami dan mengolah informasi numerik",
      "question_ids": ["q1", "q2", "q3"],
      "weight": 0.4
    },
    {
      "id": "verbal_reasoning",
      "label": "Verbal Reasoning",
      "description": "Kemampuan memahami dan menganalisis informasi teks",
      "question_ids": ["q4", "q5", "q6"],
      "weight": 0.3
    },
    {
      "id": "logical_reasoning",
      "label": "Logical Reasoning",
      "description": "Kemampuan mengenali pola dan berpikir abstrak",
      "question_ids": ["q7", "q8", "q9"],
      "weight": 0.3
    }
  ],
  "output": "score_per_dimension"
}
```

**Output untuk HR:** Skor per dimensi (0–100) + skor total keseluruhan. Ditampilkan sebagai bar chart per dimensi.

---

#### Personality Test (Psikometri)

**Tujuan:** Memetakan profil kepribadian kandidat berdasarkan framework yang sudah dikenal (Big Five, DISC).

**`assessment_type`:** `personality`

**Tipe soal yang digunakan:** `matrix` (utama), `ranking` (untuk values), `game_task` (BART untuk risk dimension)

**`dimension_config` contoh — Big Five**
```json
{
  "framework": "big_five",
  "dimensions": [
    { "id": "openness", "label": "Openness to Experience", "description": "Ketertarikan pada ide baru, kreativitas, rasa ingin tahu" },
    { "id": "conscientiousness", "label": "Conscientiousness", "description": "Keteraturan, disiplin, orientasi pada tujuan" },
    { "id": "extraversion", "label": "Extraversion", "description": "Energi dari interaksi sosial, asertivitas" },
    { "id": "agreeableness", "label": "Agreeableness", "description": "Kooperatif, empati, orientasi pada harmoni" },
    { "id": "neuroticism", "label": "Emotional Stability", "description": "Stabilitas emosi di bawah tekanan" }
  ],
  "output": "profile_radar"
}
```

**`dimension_config` contoh — DISC**
```json
{
  "framework": "disc",
  "dimensions": [
    { "id": "dominance", "label": "Dominance (D)", "description": "Orientasi pada hasil, kompetitif, tegas" },
    { "id": "influence", "label": "Influence (I)", "description": "Persuasif, antusias, orientasi pada orang" },
    { "id": "steadiness", "label": "Steadiness (S)", "description": "Sabar, konsisten, reliable, team player" },
    { "id": "conscientiousness", "label": "Conscientiousness (C)", "description": "Akurat, analitis, mengikuti prosedur" }
  ],
  "output": "profile_radar"
}
```

**Output untuk HR:** Radar chart 4–5 dimensi + label tipe dominan (e.g., "Tipe D — Dominant") + narasi interpretasi.

---

#### Culture Fit Test

**Tujuan:** Mengukur seberapa selaras nilai dan cara kerja kandidat dengan budaya perusahaan yang didefinisikan HR.

**`assessment_type`:** `culture_fit`

**Tipe soal yang digunakan:** `matrix`, `ranking`, `multiple_choice` (untuk preferensi kerja)

**Keunikan:** HR mendefinisikan nilai-nilai perusahaan sendiri di `dimension_config`. Tidak ada framework baku — ini fully custom per perusahaan.

**`dimension_config` contoh**
```json
{
  "company_values": [
    {
      "id": "ownership",
      "label": "Ownership",
      "description": "Mengambil tanggung jawab penuh atas pekerjaan dan hasilnya",
      "ideal_score": 4.5
    },
    {
      "id": "speed",
      "label": "Bias for Speed",
      "description": "Bergerak cepat, tidak menunggu kondisi sempurna",
      "ideal_score": 4.0
    },
    {
      "id": "collaboration",
      "label": "Collaboration",
      "description": "Aktif membantu tim, berbagi informasi secara proaktif",
      "ideal_score": 4.5
    },
    {
      "id": "learning",
      "label": "Continuous Learning",
      "description": "Selalu mencari cara untuk berkembang dan belajar dari kesalahan",
      "ideal_score": 4.0
    }
  ],
  "output": "fit_score_per_value",
  "show_gap_analysis": true
}
```

**Fit Score Calculation**

Untuk setiap dimensi/nilai:
```typescript
function calculateFitScore(candidateAvg: number, idealScore: number): number {
  const gap = Math.abs(candidateAvg - idealScore);
  const maxGap = 4; // skala 1–5, max gap = 4
  return Math.round((1 - gap / maxGap) * 100);
}
```

**Output untuk HR:** Skor fit per value (0–100%) + overall culture fit score + gap analysis (nilai mana yang paling jauh dari ideal perusahaan).

---

#### SJT — Situational Judgement Test

**Tujuan:** Mengukur judgment dan decision-making kandidat dalam situasi kerja nyata.

**`assessment_type`:** `sjt`

**Tipe soal yang digunakan:** `multiple_choice` (pilih tindakan terbaik), `ranking` (urutkan tindakan), `multiple_select` (pilih semua tindakan tepat)

**`dimension_config` contoh**
```json
{
  "competencies": [
    { "id": "leadership", "label": "Leadership & Influence", "question_ids": ["q1", "q4"] },
    { "id": "problem_solving", "label": "Problem Solving", "question_ids": ["q2", "q5"] },
    { "id": "communication", "label": "Communication", "question_ids": ["q3", "q6"] },
    { "id": "adaptability", "label": "Adaptability", "question_ids": ["q7"] }
  ],
  "output": "score_per_competency"
}
```

**Output untuk HR:** Skor per kompetensi + overall SJT score.

---

#### Game-Based Assessment

**Tujuan:** Mengukur kognitif dan kepribadian melalui interaksi game — kandidat experience lebih engaging, hasil lebih authentic.

**`assessment_type`:** `game_based`

**Tipe soal yang digunakan:** `game_task` (semua sub-tipe)

**`dimension_config` contoh**
```json
{
  "traits": [
    { "id": "cognitive_control", "label": "Cognitive Control", "game_variant": "stroop" },
    { "id": "working_memory", "label": "Working Memory", "game_variant": "dot_memory" },
    { "id": "risk_tolerance", "label": "Risk Tolerance", "game_variant": "bart" },
    { "id": "cognitive_flexibility", "label": "Cognitive Flexibility", "game_variant": "task_switching" }
  ],
  "output": "trait_profile_radar"
}
```

**Output untuk HR:** Radar chart per trait + interpretasi naratif per trait.

---

## BAGIAN 3 — SISTEM INTERPRETASI KARAKTER

### Arsitektur: Hybrid Rule-Based + AI Narasi

Sistem interpretasi bekerja dalam dua layer:

**Layer 1 — Rule-Based (selalu jalan, tanpa API call)**
Menghasilkan label, klasifikasi tipe, dan insight berbasis threshold. Deterministik, cepat, tidak ada biaya tambahan.

**Layer 2 — AI Narasi (opsional, dipanggil sekali per kandidat)**
Claude API dipanggil setelah semua skor terkumpul untuk menghasilkan paragraf narasi yang lebih natural dan kontekstual. Ini adalah **fitur premium** (tier berbayar).

---

### Tabel Baru: `assessment_dimension_scores`

```sql
CREATE TABLE assessment_dimension_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_assignment_id UUID NOT NULL
    REFERENCES assessment_assignments(id) ON DELETE CASCADE,
  dimension_name TEXT NOT NULL,
  raw_score NUMERIC(5,2) NOT NULL,       -- nilai mentah (rata-rata skala atau skor game)
  normalized_score NUMERIC(5,2),         -- dinormalisasi ke 0–100
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_assignment_id, dimension_name)
);

ALTER TABLE assessment_dimension_scores ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT hanya hr/hiring_manager/boss dalam company yang sama
```

---

### Tabel Baru: `assessment_interpretations`

```sql
CREATE TABLE assessment_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_assignment_id UUID NOT NULL UNIQUE
    REFERENCES assessment_assignments(id) ON DELETE CASCADE,

  -- Rule-based output (diisi otomatis saat submit)
  dominant_type TEXT,               -- e.g., "DISC Type D", "High Openness", "Strong Culture Fit"
  type_label TEXT,                  -- label pendek untuk ditampilkan di pipeline card kandidat
  type_description TEXT,            -- deskripsi 1–2 kalimat dari rule-based engine
  dimension_insights JSONB,         -- insight per dimensi { "openness": "Tinggi — ...", ... }
  overall_score NUMERIC(5,2),       -- skor agregat 0–100

  -- Kolom reserved untuk AI Narrative (pengembangan berikutnya — jangan diisi sekarang)
  -- ai_narrative TEXT,
  -- ai_generated_at TIMESTAMPTZ,
  -- ai_model TEXT,
  -- Kolom-kolom di atas sengaja di-comment. Uncomment saat fitur AI siap diintegrasikan.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assessment_interpretations ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT hanya hr/hiring_manager/boss dalam company yang sama
```

---

### Layer 1 — Rule-Based Interpretation Engine

Dijalankan di API route `/api/assessment/interpret` setelah submit, menggunakan data dari `assessment_dimension_scores`.

**Personality / Big Five**
```typescript
function interpretBigFive(
  scores: Record<string, number> // normalized 0–100 per dimensi
): { dominantType: string; typeLabel: string; insights: Record<string, string> } {
  const insights: Record<string, string> = {};

  const thresholds = { high: 65, low: 35 };

  const labels: Record<string, { high: string; mid: string; low: string }> = {
    openness: {
      high: "Imajinatif dan terbuka terhadap ide baru. Cocok untuk peran kreatif dan inovatif.",
      mid: "Seimbang antara praktis dan terbuka terhadap pendekatan baru.",
      low: "Berorientasi pada hal yang sudah terbukti. Konsisten dan dapat diandalkan."
    },
    conscientiousness: {
      high: "Sangat terorganisir, disiplin, dan berorientasi pada hasil.",
      mid: "Cukup terstruktur namun fleksibel terhadap perubahan rencana.",
      low: "Spontan dan fleksibel. Lebih nyaman dengan pekerjaan yang tidak terlalu terstruktur."
    },
    extraversion: {
      high: "Energik dalam berinteraksi. Natural leader dalam setting sosial.",
      mid: "Ambivert — nyaman di kedua situasi sosial dan bekerja mandiri.",
      low: "Reflektif dan fokus. Bekerja paling baik dalam setting yang lebih tenang."
    },
    agreeableness: {
      high: "Sangat kooperatif, empati tinggi, dan berorientasi pada harmoni tim.",
      mid: "Dapat berkolaborasi namun juga tegas saat dibutuhkan.",
      low: "Kompetitif dan direct. Tidak segan menyampaikan perbedaan pendapat."
    },
    neuroticism: {
      high: "Sensitif terhadap tekanan. Membutuhkan lingkungan kerja yang stabil.",
      mid: "Umumnya stabil namun bisa terpengaruh oleh stres tinggi.",
      low: "Sangat stabil secara emosional. Tenang di bawah tekanan tinggi."
    }
  };

  Object.entries(scores).forEach(([dim, score]) => {
    if (!labels[dim]) return;
    const level = score >= thresholds.high ? "high" : score <= thresholds.low ? "low" : "mid";
    insights[dim] = labels[dim][level];
  });

  // Tentukan dominant type berdasarkan skor tertinggi
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const dominantLabels: Record<string, string> = {
    openness: "The Explorer",
    conscientiousness: "The Achiever",
    extraversion: "The Connector",
    agreeableness: "The Harmonizer",
    neuroticism: "The Sensitive Thinker"
  };

  return {
    dominantType: dominant,
    typeLabel: dominantLabels[dominant] ?? dominant,
    insights
  };
}
```

**DISC**
```typescript
function interpretDISC(
  scores: Record<string, number>
): { dominantType: string; typeLabel: string; description: string } {
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const secondary = Object.entries(scores).sort((a, b) => b[1] - a[1])[1][0];

  const profiles: Record<string, { label: string; description: string }> = {
    dominance: {
      label: "The Driver",
      description: "Berorientasi pada hasil, tegas, dan kompetitif. Bergerak cepat dan tidak segan mengambil keputusan sulit."
    },
    influence: {
      label: "The Inspirer",
      description: "Antusias, persuasif, dan berorientasi pada orang. Unggul dalam membangun relasi dan memotivasi tim."
    },
    steadiness: {
      label: "The Supporter",
      description: "Sabar, konsisten, dan reliable. Pilar stabilitas dalam tim — bekerja paling baik dalam lingkungan yang terstruktur."
    },
    conscientiousness: {
      label: "The Analyst",
      description: "Akurat, sistematis, dan berorientasi pada kualitas. Teliti dalam menganalisis sebelum mengambil keputusan."
    }
  };

  const profile = profiles[dominant];
  return {
    dominantType: `${dominant.toUpperCase()}/${secondary.toUpperCase()}`,
    typeLabel: profile.label,
    description: profile.description
  };
}
```

**Culture Fit**
```typescript
function interpretCultureFit(
  fitScores: Record<string, number> // 0–100 per value
): { overallFit: number; strongValues: string[]; developmentAreas: string[] } {
  const overall = Object.values(fitScores).reduce((a, b) => a + b, 0) / Object.values(fitScores).length;
  const strongValues = Object.entries(fitScores).filter(([, v]) => v >= 75).map(([k]) => k);
  const developmentAreas = Object.entries(fitScores).filter(([, v]) => v < 50).map(([k]) => k);
  return { overallFit: Math.round(overall), strongValues, developmentAreas };
}
```

---

### Layer 2 — AI Narrative *(Deferred — Pengembangan Berikutnya)*

Fitur ini **tidak diimplementasi sekarang**. Arsitektur sudah disiapkan agar integrasi di masa depan tidak membutuhkan perubahan schema. Lihat **Appendix A** untuk rencana lengkapnya.

---

### Tampilan di HR Dashboard

**Card Kandidat di Pipeline Kanban**
- Badge tipe: label pendek dari `type_label` (e.g., *"The Driver"*, *"High Culture Fit"*)
- Skor: overall score dalam lingkaran (e.g., 78/100)

**Halaman Detail Kandidat — Tab Asesmen**
- Radar chart dari `assessment_dimension_scores`
- Tabel insight per dimensi dari `dimension_insights`
- Deskripsi tipe dominan dari `type_description`

**Perbandingan Kandidat**
- HR bisa pilih 2–4 kandidat → tampilkan radar chart overlay per dimensi

---

## BAGIAN 4 — MANUAL SCORING UNTUK ESSAY

### Konteks

Tipe `essay` dan `situational_scenario` menghasilkan jawaban teks bebas yang tidak bisa di-score otomatis. Saat ini flow-nya: `is_reviewed = false` → masuk review queue → HR review manual tapi tidak ada mekanisme input nilai.

Ekstensi ini menambahkan flow lengkap: HR bisa input nilai dan catatan per jawaban essay dari dashboard.

### Perubahan Tabel `answers`

```sql
ALTER TABLE answers ADD COLUMN IF NOT EXISTS
  manual_score NUMERIC(5,2) DEFAULT NULL;
  -- Nilai yang diinput HR secara manual
  -- Nullable — null berarti belum dinilai

ALTER TABLE answers ADD COLUMN IF NOT EXISTS
  reviewer_notes TEXT DEFAULT NULL;
  -- Catatan HR terkait jawaban (tidak terlihat kandidat)

ALTER TABLE answers ADD COLUMN IF NOT EXISTS
  reviewed_by UUID DEFAULT NULL REFERENCES profiles(id);
  -- Profile ID HR yang melakukan review

ALTER TABLE answers ADD COLUMN IF NOT EXISTS
  reviewed_at TIMESTAMPTZ DEFAULT NULL;
  -- Timestamp saat HR submit nilai
```

### API Route Baru: `PATCH /api/assessment/answers/[answerId]/score`

```typescript
// Request body
interface ScoreEssayRequest {
  manual_score: number;     // wajib, 0 hingga questions.points
  reviewer_notes?: string;  // opsional
}

// Handler
export async function PATCH(req: Request, { params }: { params: { answerId: string } }) {
  const { manual_score, reviewer_notes } = await req.json();

  // Validasi: ambil max points dari soal terkait
  const { data: answer } = await supabase
    .from("answers")
    .select("question_id, questions(points)")
    .eq("id", params.answerId)
    .single();

  const maxPoints = answer?.questions?.points ?? 100;

  if (manual_score < 0 || manual_score > maxPoints) {
    return Response.json({ error: `Nilai harus antara 0 dan ${maxPoints}` }, { status: 400 });
  }

  // Update answer
  await supabase
    .from("answers")
    .update({
      manual_score,
      score: manual_score,          // sync ke kolom score yang digunakan scoring engine
      reviewer_notes,
      is_reviewed: true,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", params.answerId);

  // Recalculate total assessment score
  await recalculateAssessmentScore(answer.assessment_assignment_id);

  return Response.json({ success: true });
}
```

### `recalculateAssessmentScore` — Fungsi Rekalkulasi

Dipanggil setiap kali HR submit nilai essay, untuk mengupdate total skor asesmen.

```typescript
async function recalculateAssessmentScore(assignmentId: string) {
  // Ambil semua answers untuk assignment ini
  const { data: answers } = await supabase
    .from("answers")
    .select("score, questions(points, question_type)")
    .eq("assessment_assignment_id", assignmentId);

  // Hanya hitung soal yang sudah di-review atau auto-scored
  const scoredAnswers = answers?.filter(a => a.score !== null) ?? [];
  const totalEarned = scoredAnswers.reduce((sum, a) => sum + (a.score ?? 0), 0);
  const totalPossible = answers?.reduce((sum, a) => sum + (a.questions?.points ?? 0), 0) ?? 0;

  const percentage = totalPossible > 0
    ? Math.round((totalEarned / totalPossible) * 100)
    : 0;

  await supabase
    .from("assessment_assignments")
    .update({ total_score: percentage })
    .eq("id", assignmentId);
}
```

### UI di HR Dashboard — Essay Review Queue

**Halaman: `/dashboard/assessments/review`**

List semua jawaban essay yang belum di-review (`is_reviewed = false`), dikelompokkan per kandidat.

**Card Per Jawaban Essay**
```
┌─────────────────────────────────────────────────────┐
│ Nama Kandidat · Posisi · Nama Asesmen               │
│ ─────────────────────────────────────────────────── │
│ Soal: "Ceritakan pengalaman kamu menangani konflik  │
│ dalam tim. Apa yang kamu lakukan dan hasilnya?"     │
│                                                     │
│ Jawaban Kandidat:                                   │
│ "Pada satu proyek di perusahaan sebelumnya, saya   │
│ menghadapi situasi di mana dua anggota tim memiliki │
│ perbedaan pendapat yang cukup tajam..."             │
│                                                     │
│ Max Poin: 20                                        │
│ Nilai: [____] (input 0–20)                          │
│ Catatan (opsional): [______________________]        │
│                                                     │
│ [Simpan Nilai]                                      │
└─────────────────────────────────────────────────────┘
```

**Validasi UI**
- Input nilai: `type="number"`, `min="0"`, `max={question.points}`, step 0.5 (untuk nilai desimal)
- Tombol *"Simpan Nilai"* disabled jika input kosong atau di luar range
- Setelah simpan: card ditandai ✅ *"Sudah dinilai"* dan pindah ke bagian bawah list
- Badge counter di sidebar: *"Essay Belum Dinilai (12)"* — update real-time

**Filter & Sort**
- Filter by: Job, Status (Belum Dinilai / Sudah Dinilai), Tanggal Apply
- Sort: Terlama menunggu review (default), Terbaru

---

## BAGIAN 5 — PERUBAHAN SCHEMA LENGKAP

### Ringkasan Semua Perubahan

**Tabel yang dimodifikasi (ALTER)**
```sql
-- assessments: tambah 2 kolom
ALTER TABLE assessments
  ADD COLUMN assessment_type TEXT DEFAULT 'custom'
    CHECK (assessment_type IN ('custom','cognitive','personality','culture_fit','sjt','game_based')),
  ADD COLUMN dimension_config JSONB DEFAULT NULL;

-- questions: tambah 1 kolom
ALTER TABLE questions
  ADD COLUMN image_url TEXT DEFAULT NULL;
  -- Untuk soal yang ingin menyertakan gambar pendukung (teks soal, bukan untuk jawaban)
  -- Gambar disimpan di Supabase Storage bucket 'question-assets' (ukuran kecil, bukan video)

-- answers: tambah 4 kolom
ALTER TABLE answers
  ADD COLUMN manual_score NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN reviewer_notes TEXT DEFAULT NULL,
  ADD COLUMN reviewed_by UUID DEFAULT NULL REFERENCES profiles(id),
  ADD COLUMN reviewed_at TIMESTAMPTZ DEFAULT NULL;

-- question_type enum: tambah nilai baru
-- Jika question_type disimpan sebagai TEXT CHECK constraint, update constraint:
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN (
    'multiple_choice',
    'essay',
    'scale_rating',
    'situational_scenario',
    'multiple_select',    -- BARU
    'ranking',            -- BARU
    'numeric_input',      -- BARU
    'matrix',             -- BARU
    'game_task'           -- BARU
  ));
```

**Tabel baru (CREATE)**
```sql
-- Sudah didefinisikan detail di Bagian 3:
-- assessment_dimension_scores
-- assessment_interpretations
```

**Tidak ada perubahan pada:**
- `assessment_assignments` — tidak perlu
- `stage_history` — tidak perlu
- Semua tabel Module 0–3 dan 5–7 — tidak perlu

---

## BAGIAN 6 — PRIORITAS IMPLEMENTASI

### Sprint 1 — Fondasi (Effort: ~5 hari)
Tipe soal baru yang low-effort + manual scoring untuk essay.

1. `multiple_select` — ~1 hari
2. `numeric_input` — ~1 hari
3. `ranking` — ~2 hari (drag-and-drop)
4. Manual scoring essay (API + UI review queue) — ~1 hari

**Output Sprint 1:** Arvela bisa demo 3 tipe soal baru + HR bisa nilai essay secara manual.

### Sprint 2 — Psikometri & Interpretasi (Effort: ~6 hari)
Matrix sebagai fondasi psikometri + rule-based interpretation.

5. `matrix` dengan reverse scoring — ~2 hari
6. `assessment_type` + `dimension_config` di builder — ~1 hari
7. `assessment_dimension_scores` population saat submit — ~1 hari
8. Rule-based interpretation engine + `assessment_interpretations` — ~2 hari

**Output Sprint 2:** Arvela bisa jalankan Personality Test dan Culture Fit Test lengkap dengan output radar chart + label tipe.

### Sprint 3 — Game-Based Assessment (Effort: ~5 hari)
Differentiator utama untuk demo ke klien.

9. `game_task` — Stroop Task — ~1 hari
10. `game_task` — Dot Memory — ~1 hari
11. `game_task` — BART — ~1 hari
12. `game_task` — Task Switching — ~1 hari
13. Candidate comparison view (radar chart overlay) — ~1 hari

**Output Sprint 3:** Arvela bisa demo game-based assessment lengkap dan perbandingan kandidat secara visual.

### Deferred — AI Narrative *(Sprint berikutnya, setelah Sprint 1–3 selesai)*

Fitur AI narrative tidak masuk sprint sekarang. Detail rencana integrasi ada di **Appendix A**. Tidak ada pekerjaan yang perlu dilakukan untuk ini sekarang — schema sudah disiapkan.

---

## CATATAN UNTUK AGENT

1. **Jangan rombak tabel `questions` dan `answers`** — semua tipe soal baru menggunakan `options JSONB` dan `correct_answer JSONB` yang sudah ada. Hanya tambah `image_url` di `questions` dan 4 kolom di `answers`.

2. **Dua tabel baru** yang perlu di-CREATE: `assessment_dimension_scores` dan `assessment_interpretations`.

3. **Scoring engine** dijalankan di API route `/api/assessment/submit` — bukan di client, bukan di database trigger.

4. **`game_task` tidak butuh storage** — semua data yang disimpan adalah angka hasil interaksi (JSON di `answer_text`). Tidak ada file, tidak ada gambar gameplay.

5. **AI narrative TIDAK diimplementasi sekarang** — kolom `ai_narrative`, `ai_generated_at`, dan `ai_model` di tabel `assessment_interpretations` sengaja di-comment dalam migration SQL. Jangan uncomment atau implementasi sebelum ada instruksi eksplisit. Detail ada di Appendix A.

6. **Manual score untuk essay** disync ke kolom `score` yang sudah ada — scoring engine yang sudah ada tidak perlu diubah, hanya ditambah flow untuk HR input nilai.

7. **`image_url` di `questions`** hanya untuk gambar pendukung teks soal (grafik, tabel, ilustrasi). File kecil, bukan video. Upload ke bucket `question-assets` yang berbeda dari bucket CV.

8. **Tab switching detection** dan **timer berbasis server time** yang sudah ada berlaku untuk semua tipe soal baru — tidak ada perubahan.

9. **Game-based task tidak tampilkan skor ke kandidat** — kandidat hanya melihat *"Terima kasih, lanjut ke bagian berikutnya"*. Skor hanya visible di HR dashboard.

10. **Culture Fit Test adalah satu-satunya jenis tes yang fully custom per perusahaan** — HR mendefinisikan nilai perusahaan sendiri di `dimension_config`. Personality dan Cognitive menggunakan framework yang sudah ada (Big Five, DISC, dll).

---

## APPENDIX A — Rencana Integrasi AI Narrative *(Deferred)*

Bagian ini adalah referensi untuk pengembangan berikutnya. **Tidak ada yang perlu diimplementasi sekarang.**

### Tujuan

Setelah rule-based interpretation berjalan stabil dan tervalidasi oleh HR di pilot, langkah berikutnya adalah menambahkan narasi yang lebih kaya dan kontekstual menggunakan Claude API. Narasi AI akan melengkapi output rule-based — bukan menggantikannya.

### Posisi dalam Arsitektur

```
submit assessment
      │
      ▼
scoring engine          ← sudah ada sekarang
      │
      ▼
rule-based interpretation  ← Sprint 2 (sekarang)
      │
      ▼
assessment_interpretations  ← tabel sudah dibuat sekarang
      │
      ▼
[DEFERRED] AI narrative generation  ← tambah di pengembangan berikutnya
      │
      ▼
assessment_interpretations.ai_narrative  ← kolom sudah di-comment, tinggal uncomment
```

### Yang Perlu Dilakukan Saat Waktunya Tiba

**1. Migration — uncomment kolom AI**
```sql
ALTER TABLE assessment_interpretations
  ADD COLUMN ai_narrative TEXT DEFAULT NULL,
  ADD COLUMN ai_generated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN ai_model TEXT DEFAULT NULL;
```

**2. Buat API route baru**
`POST /api/assessment/generate-narrative`

Route ini dipanggil secara async setelah rule-based interpretation selesai ditulis. Input: `assessment_assignment_id`. Output: narasi teks yang disimpan ke `ai_narrative`.

**3. Prompt yang direkomendasikan**
```typescript
function buildNarrativePrompt(params: {
  assessmentType: string;
  dimensionScores: Record<string, number>;
  typeLabel: string;
  typeDescription: string;
  dimensionInsights: Record<string, string>;
  candidateName: string;
  positionApplied: string;
}): string {
  return `
Kamu adalah psikolog HR profesional yang menulis laporan asesmen kandidat.

Kandidat: ${params.candidateName}
Posisi yang dilamar: ${params.positionApplied}
Jenis asesmen: ${params.assessmentType}
Tipe dominan: ${params.typeLabel} — ${params.typeDescription}

Skor per dimensi (0–100):
${Object.entries(params.dimensionScores).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Insight per dimensi:
${Object.entries(params.dimensionInsights).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Tulis narasi interpretasi karakter dalam 3 paragraf:
1. Gambaran umum profil kandidat berdasarkan kombinasi dimensi
2. Kekuatan utama yang relevan untuk posisi ${params.positionApplied}
3. Area yang perlu diperhatikan atau dikembangkan, secara konstruktif

Syarat penulisan:
- Bahasa Indonesia profesional, mudah dipahami HR non-psikolog
- Tidak mengulang angka skor — fokus pada narasi perilaku
- Spesifik ke konteks posisi yang dilamar
- Maksimal 250 kata
- Nada objektif dan konstruktif, bukan judgmental
  `.trim();
}
```

**4. Pemanggilan API**
```typescript
// Server-side only — ANTHROPIC_API_KEY hanya di environment variable server
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  })
});

const data = await response.json();
const narrative = data.content[0]?.text ?? null;

await supabase
  .from("assessment_interpretations")
  .update({
    ai_narrative: narrative,
    ai_generated_at: new Date().toISOString(),
    ai_model: "claude-sonnet-4-20250514"
  })
  .eq("assessment_assignment_id", assignmentId);
```

**5. Error handling**
- Jika AI call gagal: log error, `ai_narrative` tetap `null`. HR tetap mendapat rule-based output yang lengkap — experience tidak terganggu.
- Tidak ada retry otomatis. Jika diperlukan, HR bisa trigger ulang manual dari dashboard.
- AI call **tidak blocking** submit response ke kandidat — dijalankan async setelah submit selesai.

### Pertimbangan Monetisasi

Fitur ini natural untuk dijadikan pembeda tier:
- **Free / Basic:** rule-based label + radar chart + dimension insights
- **Pro:** + AI narrative per kandidat
- **Enterprise:** + custom prompt per perusahaan (misalnya, narasi disesuaikan dengan competency framework internal klien)

### Validasi Sebelum Launch AI Narrative

Sebelum fitur ini di-launch ke pengguna, pastikan:
1. Rule-based output sudah divalidasi oleh minimal 3 HR dari perusahaan berbeda — apakah label dan insight terasa akurat?
2. Prompt sudah diuji dengan minimal 20 profil kandidat yang bervariasi — apakah narasi konsisten dan tidak generik?
3. Ada mekanisme feedback HR: tombol *"Narasi ini akurat"* / *"Narasi ini kurang tepat"* untuk iterasi prompt ke depannya.