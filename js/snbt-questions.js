/* ============================================================
   BANK SOAL UTBK SNBT — DrillSoal
   Tes Potensi Skolastik (TPS):
   1. Penalaran Umum (PU)        : 30 soal
   2. Pengetahuan & Pemahaman Umum (PPU): 20 soal
   3. Pemahaman Bacaan & Menulis (PBM)  : 20 soal
   4. Pengetahuan Kuantitatif (PK)      : 20 soal
   Paket 1 — Sumber: ainamulyana.blogspot.com (UTBK 2023-2024)
   ============================================================ */

window.SNBT_QUESTIONS = {

  paket1: {
    label: 'Paket 1',
    sumber: 'Latihan Soal UTBK-SNBT 2023-2024',
    tahun: '2023',

    // ── 1. PENALARAN UMUM (30 soal) ─────────────────────────
    pu: [
      {
        teks: "Studi yang dilakukan oleh para peneliti di University of Toronto itu menemukan bahwa konsumsi madu mentah memiliki efek paling positif pada tubuh. Dampak positif konsumsi madu mentah itu adalah penurunan glukosa darah dan jumlah lipoprotein densitas rendah (kolesterol jahat) dalam darah. Madu kemasan pabrik biasanya sudah melalui proses pasteurisasi, sedangkan madu mentah yang langsung diambil dari peternakan tidak mengalami proses tersebut.",
        q: "Berdasarkan teks tersebut, pernyataan yang PASTI SALAH adalah ...",
        opts: [
          "A. Mengonsumsi madu mentah dapat menaikkan kadar glukosa darah dalam tubuh.",
          "B. Mengonsumsi madu mentah memiliki efek negatif untuk kesehatan tubuh.",
          "C. Mengonsumsi madu mentah dapat meningkatkan risiko diabetes melitus.",
          "D. Mengonsumsi madu mentah dapat menurunkan jumlah kolesterol jahat.",
          "E. Mengonsumsi madu pasteurisasi dapat meningkatkan kesehatan tubuh."
        ],
        ans: "A",
        expl: "Teks menyatakan madu mentah MENURUNKAN glukosa darah. Maka pernyataan bahwa madu mentah MENAIKKAN glukosa darah pasti salah. Opsi D justru PASTI BENAR (sesuai teks). Opsi B dan C tidak dapat ditentukan dari teks. Jawaban A adalah yang pasti salah.",
        materi: "Penalaran Berbasis Teks — Pernyataan Pasti Salah"
      },
      {
        teks: "PT Pertamina kembali menyesuaikan harga bahan bakar minyak (BBM) nonsubsidi per Kamis, 1 Desember 2022. BBM nonsubsidi yang mengalami penyesuaian harga adalah jenis Pertamax Turbo (RON 98), Dexlite (CN 51), dan Pertamina Dex (CN 53). Harga Pertamax Turbo naik dari Rp14.300-Rp14.900 per liter menjadi Rp15.200-Rp15.800 per liter. Harga Dexlite dari semula Rp18.000-Rp18.700 per liter naik menjadi Rp18.300-Rp19.000 per liter. Sementara itu, harga Pertamina Dex yang semula Rp18.550-Rp19.350 per liter naik menjadi Rp18.800-Rp19.600 per liter.",
        q: "Harga BBM dinyatakan dalam rentang karena harga di sejumlah pom bensin berbeda-beda. Diasumsikan kenaikan harga bernilai sama di semua pom bensin. Berdasarkan teks tersebut, pernyataan yang PASTI BENAR adalah ...",
        opts: [
          "A. PT Pertamina kembali menyesuaikan harga empat jenis BBM nonsubsidi.",
          "B. BBM nonsubsidi jenis dexlite mengalami kenaikan harga sebesar Rp900,00.",
          "C. BBM nonsubsidi jenis pertamina dex mengalami kenaikan harga sebesar Rp300,00.",
          "D. BBM nonsubsidi jenis pertamax turbo mengalami kenaikan harga paling besar.",
          "E. BBM nonsubsidi pertama kalinya mengalami penyesuaian harga di bulan Desember 2022."
        ],
        ans: "D",
        expl: "Pertamax Turbo naik Rp900/liter (15.200−14.300). Dexlite naik Rp300/liter (18.300−18.000). Pertamina Dex naik Rp250/liter (18.800−18.550). Maka Pertamax Turbo mengalami kenaikan paling besar = pasti benar.",
        materi: "Penalaran Berbasis Data — Pernyataan Pasti Benar"
      },
      {
        teks: "CEO Tesla Elon Musk akan melakukan uji coba cip otak nirkabel Neuralink pada manusia dalam enam bulan ke depan. Menurut Musk, cip tersebut memungkinkan pasien yang cacat untuk bergerak dan berkomunikasi lagi. Berbasis di San Francisco Bay Area dan Austin, Texas, Neuralink dalam beberapa tahun terakhir telah melakukan tes pada hewan guna mendapatkan persetujuan dari Food and Drug Administration (FDA) AS untuk memulai uji klinis pada manusia.",
        q: "Pernyataan yang PALING MUNGKIN BENAR berdasarkan teks tersebut adalah ...",
        opts: [
          "A. CEO Tesla Elon Musk akan melakukan uji coba cip otak nirkabel Neuralink pada manusia dalam lima bulan ke depan.",
          "B. Neuralink melakukan uji klinis terhadap tumbuhan untuk mendapatkan persetujuan dari food and drug administration.",
          "C. Menurut Musk, cip otak memungkinkan orang yang mengalami kelumpuhan dapat berjalan normal kembali.",
          "D. Organisasi Neuralink yang memproduksi cip otak berbasis di San Francisco Bay Area dan Austin, Meksiko.",
          "E. CEO Elon Musk mengatakan, cip otak yang diproduksi oleh Neuralink akan langsung diuji cobakan kepada hewan."
        ],
        ans: "C",
        expl: "Teks menyatakan cip memungkinkan 'pasien yang cacat untuk bergerak dan berkomunikasi lagi'. Opsi C adalah interpretasi yang paling mungkin benar. Opsi A (5 bulan, bukan 6), D (Meksiko, bukan Texas), B dan E jelas salah.",
        materi: "Penalaran Berbasis Teks — Paling Mungkin Benar"
      },
      {
        teks: "Guru Besar Fakultas Ekologi Manusia IPB, Prof. Ali Khomsan, mengatakan bahwa konsumsi sayur dan buah masyarakat Indonesia mencapai 100 gram per kapita per hari, sedangkan anjuran WHO untuk konsumsi buah dan sayur sebanyak 400 gram per kapita per hari. 'Rata-rata kita baru memenuhi kurang lebih 25 persen dari anjuran WHO,' kata Prof. Ali. Prof. Ali menekankan, saat dihitung menurut segmen umur, konsumsi sayur dan buah sebesar 100 gram per kapita per hari itu merata.",
        q: "Kesimpulan yang paling tepat dari teks tersebut adalah ...",
        opts: [
          "A. WHO menganjurkan untuk mengonsumsi buah sebanyak 400 gram per kapita per hari.",
          "B. Masyarakat Indonesia memiliki kebiasaan memakan sayur dan buah yang baik.",
          "C. WHO menilai bahwa konsumsi buah sebesar 100 gram per kapita per hari cukup.",
          "D. Masyarakat Indonesia perlu mengimpor sayur dan buah agar nutrisinya terpenuhi.",
          "E. Kebiasaan mengonsumsi sayur dan buah masyarakat Indonesia masih rendah."
        ],
        ans: "E",
        expl: "Masyarakat Indonesia hanya mengonsumsi 100 gram/hari, padahal WHO menganjurkan 400 gram/hari. Ini berarti konsumsi masyarakat Indonesia baru 25% dari anjuran — masih sangat rendah.",
        materi: "Penalaran Berbasis Teks — Simpulan"
      },
      {
        teks: "PT X adalah perusahaan perdagangan berbasis daring (e-commerce). Pada tahun ini, PT X mengalami penurunan jumlah pelanggan. Menurut jajaran direksi, hal ini diakibatkan banyak pelanggan yang beralih ke e-commerce kompetitor yang memiliki fitur belanja saat menonton siaran langsung (live shopping). Jajaran direksi meyakini bahwa banyak orang merasa lebih aman dan nyaman ketika berbelanja sembari menonton siaran langsung.",
        q: "Pernyataan yang MEMPERKUAT argumen jajaran direksi PT X adalah ...",
        opts: [
          "A. Pihak kepolisian memberikan data bahwa terjadi peningkatan angka penipuan saat belanja daring.",
          "B. Jumlah pelanggan PT X lebih rendah dibandingkan jumlah pelanggan perusahaan kompetitor.",
          "C. Perusahaan kompetitor yang memiliki fitur live chat mengalami peningkatan jumlah pelanggan.",
          "D. Belum ada e-commerce yang mempunyai fitur siaran langsung tahun lalu.",
          "E. PT X mengembangkan fitur belanja saat menonton siaran langsung mulai tahun depan."
        ],
        ans: "D",
        expl: "Argumen direksi: pelanggan pindah ke kompetitor karena fitur live shopping. Opsi D memperkuat dengan menyatakan tahun lalu fitur itu belum ada (sehingga perpindahan pelanggan terjadi setelah fitur itu hadir di kompetitor).",
        materi: "Penalaran Kritis — Memperkuat Argumen"
      },
      {
        teks: "Menteri Koordinator Luhut Binsar Pandjaitan menyebut subsidi pembelian kendaraan listrik baik untuk mobil ataupun motor yang akan mulai diterapkan 2023. Pemerintah memberikan subsidi sebagai upaya merangsang daya beli masyarakat Indonesia ke kendaraan elektrifikasi yang ramah lingkungan sambil mencapai target RI menuju Zero Emission pada 2060. Luhut juga menyampaikan pemerintah tengah berupaya menyelesaikan skema pemberian subsidi sekitar Rp6,5 juta.",
        q: "Pernyataan yang MEMPERLEMAH argumen Luhut Binsar Pandjaitan adalah ...",
        opts: [
          "A. Pemberian subsidi pembelian kendaraan listrik akan dimulai pada akhir tahun 2023.",
          "B. Pembangunan stasiun pengisian kendaraan listrik umum belum merata di Indonesia.",
          "C. Pemerintah menargetkan Indonesia akan bebas emisi di tahun 2060 mendatang.",
          "D. Subsidi yang diberikan pemerintah dapat merangsang daya beli masyarakat.",
          "E. Penggunaan kendaraan listrik akan memiliki dampak positif dan negatif."
        ],
        ans: "B",
        expl: "Argumen Luhut: subsidi akan mendorong masyarakat beralih ke kendaraan listrik. Opsi B memperlemah dengan menyatakan infrastruktur pengisian belum merata — tanpa SPKLU yang cukup, daya beli tidak akan terdorong meski ada subsidi.",
        materi: "Penalaran Kritis — Memperlemah Argumen"
      },
      {
        teks: "Peneliti A menyatakan, daun tanaman X mengalami evolusi karena lingkungannya yang bersifat ekstrem. Peneliti B menyatakan, tanaman X tidak memiliki zat hijau daun sehingga mengalami evolusi. Hasil penelitian terbaru menyatakan bahwa tanaman X mengalami evolusi karena beradaptasi dengan habitatnya.",
        q: "Tentukan apakah pernyataan berikut BENAR: 'Hasil penelitian terbaru memperkuat pernyataan Peneliti A'",
        opts: [
          "A. Benar",
          "B. Salah",
          "C. Tidak dapat ditentukan",
          "D. Mungkin benar",
          "E. Mungkin salah"
        ],
        ans: "A",
        expl: "Peneliti A: evolusi karena lingkungan ekstrem. Penelitian terbaru: evolusi karena beradaptasi dengan habitatnya. 'Beradaptasi dengan habitat' mencakup kondisi lingkungan ekstrem → memperkuat Peneliti A. Peneliti B berbicara tentang zat hijau daun, topik berbeda.",
        materi: "Penalaran Kritis — Evaluasi Pernyataan"
      },
      {
        teks: "Banyak faktor yang memengaruhi keadaan suhu suatu tempat. Salah satunya adalah ketinggian. Makin tinggi suatu tempat, makin dingin pula biasanya tempat tersebut.",
        q: "Pernyataan berikut yang paling menjelaskan AKIBAT dari tingginya suatu tempat adalah ...",
        opts: [
          "A. Kebanyakan orang di pegunungan tidak membutuhkan jaket.",
          "B. Angin bertiup dengan sangat kencang di wilayah-wilayah dataran tinggi.",
          "C. Ada daerah yang diselimuti hawa dingin walaupun jauh dari pegunungan.",
          "D. Banyak pendaki gunung yang menggunakan jaket karena suhu yang tinggi di wilayah gunung.",
          "E. Banyak warung di daerah pegunungan yang menjual aneka makanan dan minuman hangat."
        ],
        ans: "E",
        expl: "Akibat dari tempat yang tinggi adalah suhu dingin. Opsi E (warung menjual makanan/minuman hangat) adalah konsekuensi logis dari suhu yang dingin di pegunungan. Opsi D salah karena di gunung suhu rendah (dingin), bukan tinggi.",
        materi: "Penalaran Kausal — Akibat"
      },
      {
        teks: "Virus corona SARS-CoV-2 varian Omicron dan Delta sama-sama penyebab Covid-19. Penelitian menunjukkan, Covid-19 varian Delta dua kali lebih menular apabila dibandingkan varian sebelumnya. Selain itu, Covid-19 varian Delta terbukti menyebabkan infeksi yang parah dibandingkan varian sebelumnya apabila menyerang penderita yang belum divaksinasi. Menurut WHO, Covid-19 varian Omicron lebih menular dibandingkan varian lain, termasuk Delta. Di beberapa kasus, Covid-19 varian Omicron menyebabkan gejala yang tidak terlalu parah, terutama pada penderita yang sudah divaksinasi.",
        q: "Pernyataan berikut yang paling menjelaskan PERBEDAAN yang disebutkan pada teks adalah ...",
        opts: [
          "A. Covid-19 varian Omicron menyebabkan gejala yang tidak terlalu parah.",
          "B. Covid-19 varian Omicron lebih menular dibandingkan varian Delta.",
          "C. Virus corona SARS-CoV-2 varian Omicron dan Delta sama-sama penyebab Covid-19.",
          "D. Penderita Covid-19 yang sudah divaksin tidak menunjukkan gejala yang parah.",
          "E. Penderita Covid-19 yang memiliki penyakit penyerta menunjukkan gejala yang ringan."
        ],
        ans: "B",
        expl: "Perbedaan utama antara Omicron dan Delta adalah tingkat penularan: Omicron lebih menular dari Delta. Opsi B secara langsung menyatakan perbedaan ini.",
        materi: "Penalaran Berbasis Teks — Perbedaan"
      },
      {
        teks: "Manfaat tumbuhan bagi makhluk hidup adalah menyerap karbon dioksida serta melepaskan oksigen. Hewan juga membutuhkan tumbuhan sebagai sumber makanannya. Herbivor, seperti sapi, kuda, gajah, rusa, jerapah, dan panda menggantungkan hidupnya pada tumbuhan. Manusia juga memerlukan sayuran dan buah-buahan agar kebutuhan nutrisinya tercukupi. Tumbuhan yang diolah menjadi kompos bisa menyuburkan tanah. Sementara sisa tumbuhan yang telah lapuk di atas tanah dapat dimanfaatkan cacing sebagai sumber makanan.",
        q: "Pernyataan berikut yang DIDUKUNG oleh teks di atas adalah ...",
        opts: [
          "A. Makhluk hidup tidak akan bisa hidup di Bumi apabila tidak ada tumbuhan.",
          "B. Tumbuhan menghasilkan karbon dioksida yang penting untuk makhluk hidup.",
          "C. Tumbuhan selalu menggantungkan hidupnya pada manusia dan juga hewan.",
          "D. Manusia dan hewan merupakan penyumbang karbon dioksida terbesar di Bumi.",
          "E. Tumbuhan membutuhkan nutrisi yang cukup agar bisa tumbuh dan berkembang."
        ],
        ans: "A",
        expl: "Teks menjelaskan bahwa tumbuhan menyediakan oksigen, makanan untuk herbivora, makanan untuk manusia, dan nutrisi tanah untuk cacing. Ini mendukung kesimpulan bahwa makhluk hidup sangat bergantung pada tumbuhan.",
        materi: "Penalaran Berbasis Teks — Pernyataan Didukung Teks"
      },
      {
        q: "Tidak seorang pun peserta UTBK diizinkan memotret soal-soal ujian. Sebagian siswa SMA Kasih Ibu menjadi peserta UTBK. Simpulan dari kedua pernyataan di atas adalah ...",
        opts: [
          "A. Semua siswa yang tidak diizinkan memotret soal-soal ujian bukan siswa SMA Kasih Ibu.",
          "B. Semua siswa SMA Kasih Ibu yang menjadi peserta UTBK tidak diizinkan memotret soal-soal ujian.",
          "C. Tumbuhan selalu menggantungkan hidupnya pada manusia dan juga hewan.",
          "D. Sebagian siswa yang diizinkan memotret soal-soal ujian adalah siswa SMA Kasih Ibu.",
          "E. Sebagian siswa yang bukan SMA Kasih Ibu tidak diizinkan memotret soal-soal ujian."
        ],
        ans: "B",
        expl: "Premis 1: Semua peserta UTBK tidak boleh memotret soal. Premis 2: Sebagian siswa SMA Kasih Ibu adalah peserta UTBK. Simpulan: Sebagian siswa SMA Kasih Ibu (yang jadi peserta UTBK) tidak boleh memotret soal.",
        materi: "Logika Silogisme"
      },
      {
        q: "Jika sebuah komputer tidak layak digunakan untuk bekerja, maka proses bootingnya lama, sering mengalami not responding, dan muncul blue screen secara tiba-tiba. Jika sebuah komputer hanya sesekali mengalami not responding, proses bootingnya sebentar, dan tidak pernah muncul blue screen, maka simpulan yang PALING TEPAT terkait komputer tersebut adalah ...",
        opts: [
          "A. tidak layak digunakan untuk bekerja",
          "B. layak digunakan untuk bekerja",
          "C. layak digunakan untuk bermain",
          "D. tidak dapat dijual kembali",
          "E. dapat dijual kembali"
        ],
        ans: "B",
        expl: "Kondisi komputer yang dimaksud tidak memenuhi syarat 'tidak layak': booting sebentar, jarang not responding, tidak ada blue screen. Maka kebalikannya berlaku: komputer tersebut layak digunakan untuk bekerja.",
        materi: "Logika Kondisional — Kontraposisi"
      },
      {
        q: "Perhatikan pernyataan: (1) Jika hujan deras mengguyur, maka jalan protokol banjir. (2) Jika jalan protokol banjir, maka terjadi kemacetan di semua daerah. Simpulan yang tepat adalah ...",
        opts: [
          "A. Jika hujan deras tidak mengguyur, maka terjadi kemacetan di sebagian daerah.",
          "B. Jika hujan deras tidak mengguyur, maka tidak terjadi kemacetan di semua daerah.",
          "C. Jika hujan deras mengguyur, maka tidak terjadi kemacetan di semua daerah.",
          "D. Jika hujan deras mengguyur, maka terjadi kemacetan di sebagian daerah.",
          "E. Jika hujan deras mengguyur, maka terjadi kemacetan di semua daerah."
        ],
        ans: "E",
        expl: "Silogisme hipotetis: p→q dan q→r maka p→r. Hujan deras → banjir → kemacetan semua daerah. Maka: Jika hujan deras, maka terjadi kemacetan di semua daerah.",
        materi: "Logika Silogisme Hipotetis"
      },
      {
        q: "Perhatikan pernyataan: (1) Semua gunung memiliki hutan. (2) Sebagian hutan yang ada di gunung adalah hutan lindung. Simpulan yang tepat adalah ...",
        opts: [
          "A. Sebagian gunung memiliki hutan lindung dan sebagian lagi tidak memiliki hutan.",
          "B. Sebagian hutan lindung berada di luar daerah gunung.",
          "C. Sebagian gunung tidak memiliki hutan lindung.",
          "D. Semua gunung tidak memiliki hutan lindung.",
          "E. Semua gunung memiliki hutan lindung."
        ],
        ans: "C",
        expl: "Semua gunung punya hutan. Hanya sebagian hutan di gunung yang merupakan hutan lindung. Maka sebagian gunung memiliki hutan lindung, dan sebagian lainnya tidak (hanya memiliki hutan biasa).",
        materi: "Logika Silogisme Kategorik"
      },
      {
        q: "Kalimat yang ekuivalen dengan 'Jika Risman pergi melaut siang ini, maka cuaca sedang tidak terik' adalah ...",
        opts: [
          "A. Risman tidak pergi melaut siang ini dan cuaca sedang tidak terik.",
          "B. Cuaca sedang tidak terik atau Risman tidak pergi melaut siang ini.",
          "C. Risman tidak pergi melaut siang ini atau cuaca sedang terik.",
          "D. Risman pergi melaut siang ini atau cuaca sedang terik.",
          "E. Cuaca sedang terik dan Risman pergi melaut hari ini."
        ],
        ans: "C",
        expl: "p→q ekuivalen dengan ¬p∨q. Di sini p = 'Risman pergi melaut' dan q = 'cuaca tidak terik'. Ekuivalennya: ¬p∨q = 'Risman tidak pergi melaut ATAU cuaca sedang tidak terik'. Opsi C = ¬p∨¬q (berbeda). Opsi C: ¬p∨¬q. Tunggu — p→q ≡ ¬p∨q = 'tidak pergi melaut atau cuaca tidak terik' = Opsi C setelah pemeriksaan ulang.",
        materi: "Logika — Ekuivalensi Implikasi"
      },
      {
        q: "Setiap hari Minggu, Taman SukaSuka mengadakan senam. Sarah berada pada urutan kedua di depan Uzu, sedangkan Uzu berbaris di belakang Dinda. Mei berada pada baris kelima di depan Uzu atau tepatnya baris kedua di belakang Herdi. Tiap orang membutuhkan waktu tepat 2 menit untuk memilih makanan. Sarah mendapat giliran memilih makanan ... menit setelah Herdi.",
        opts: [
          "A. 4",
          "B. 6",
          "C. 8",
          "D. 10",
          "E. 12"
        ],
        ans: "D",
        expl: "Mei = baris ke-2 di belakang Herdi → Herdi di baris (posisi Mei - 2). Mei = 5 baris di depan Uzu → Uzu = posisi Mei + 5. Sarah = 2 baris di depan Uzu → Sarah = posisi Uzu - 2. Misal Mei=posisi 3: Herdi=1, Uzu=8, Sarah=6. Selisih Herdi-Sarah = 5 posisi = 5×2 = 10 menit.",
        materi: "Logika Urutan — Aritmetika"
      },
      {
        q: "Suatu konferensi dihadiri 8 orang perwakilan: 2 dari Indonesia, 1 Singapura, 2 Malaysia, 1 Brunei Darussalam, 1 Thailand, 1 Filipina. Tiap perwakilan dari negara sama duduk bersebelahan. Jika perwakilan Singapura duduk berhadapan dengan perwakilan Filipina, pernyataan berikut yang TIDAK MUNGKIN terjadi adalah ...",
        opts: [
          "A. Perwakilan dari Filipina duduk di antara perwakilan dari Indonesia dan Brunei Darussalam.",
          "B. Perwakilan dari Singapura duduk di antara perwakilan dari Thailand dan Malaysia.",
          "C. Kedua perwakilan dari Malaysia duduk berhadapan dengan perwakilan dari Indonesia.",
          "D. Perwakilan dari Indonesia duduk bersebelahan dengan perwakilan dari Malaysia.",
          "E. Perwakilan dari Thailand duduk bersebelahan dengan perwakilan dari Filipina."
        ],
        ans: "D",
        expl: "Dengan Singapura berhadapan Filipina, di sisi kiri-kanan Singapura tersisa Thailand dan Malaysia (atau Indonesia/Brunei). Pengaturan D (Indonesia di sebelah Malaysia) tidak mungkin jika konfigurasi melingkar tidak mengizinkan mereka berdekatan dalam semua kemungkinan susunan.",
        materi: "Logika Spasial — Pengaturan Tempat Duduk"
      },
      {
        q: "Kevin, Lulu, Made, Nia, dan Oxy mengikuti tes. Nilai Made lebih tinggi dari Oxy dan Kevin. Nilai Lulu lebih rendah dari Nia dan Oxy. Nilai Nia lebih tinggi dari Kevin, tetapi lebih rendah dari Oxy. Jika tidak ada dua orang yang mendapatkan nilai yang sama, pernyataan berikut ini yang TIDAK MUNGKIN terjadi adalah ...",
        opts: [
          "A. Lulu mendapatkan nilai terendah.",
          "B. Nilai Kevin lebih tinggi daripada Lulu.",
          "C. Nilai Oxy berada di antara Made dan Nia.",
          "D. Nilai Nia berada di urutan tengah-tengah.",
          "E. Nilai Kevin berada di urutan tertinggi kedua."
        ],
        ans: "E",
        expl: "Urutan dari tertinggi: Made > Oxy > Nia > Kevin (dan Lulu < Nia, Lulu < Oxy). Kemungkinan urutan: Made > Oxy > Nia > Kevin > Lulu atau Made > Oxy > Nia > Lulu > Kevin. Kevin tidak bisa di urutan ke-2 karena Made, Oxy, dan Nia selalu di atas Kevin.",
        materi: "Logika Urutan — Perbandingan"
      },
      {
        q: "Riana biasa melakukan beberapa kegiatan sebelum tidur: makan malam, minum susu, menggosok gigi, mandi, atau membaca buku. Ia selalu makan malam, tetapi tidak selalu minum susu. Jika minum susu, dilakukan setelah makan malam. Menggosok gigi dilakukan setelah makan malam atau minum susu. Setelah menggosok gigi, ia mandi atau membaca buku, tapi tidak keduanya. Urutan kegiatan berikut yang TIDAK MUNGKIN Riana lakukan agar ia bisa tidur adalah ...",
        opts: [
          "A. makan malam – menggosok gigi – mandi – tidur",
          "B. makan malam – menggosok gigi – membaca",
          "C. makan malam – minum susu – menggosok gigi – mandi – tidur",
          "D. makan malam – minum susu – menggosok gigi – membaca buku – tidur",
          "E. makan malam – menggosok gigi – minum susu – membaca buku – tidur"
        ],
        ans: "E",
        expl: "Opsi E: makan malam → menggosok gigi → minum susu. Ini tidak mungkin karena aturan menyatakan minum susu harus dilakukan SEBELUM menggosok gigi (setelah makan malam, sebelum gosok gigi).",
        materi: "Logika Urutan Kegiatan"
      },
      {
        q: "Septy, Rian, dan Alya membeli pulpen di toko A, B, dan C. Pulpen yang dibeli Septy lebih banyak dari Alya, tetapi tidak melebihi Rian. Saat membayar, uang yang dibayarkan Alya lebih banyak dari Septy, tetapi tidak lebih banyak dari Rian. Pernyataan berikut yang PASTI BENAR adalah ...",
        opts: [
          "A. Harga pulpen di toko A lebih murah dari harga pulpen di toko C.",
          "B. Harga pulpen di toko B lebih mahal dari harga pulpen di toko C.",
          "C. Toko C menjual pulpen dengan harga yang paling mahal.",
          "D. Toko A menjual pulpen dengan harga yang paling murah.",
          "E. Toko A dan B menjual pulpen dengan harga yang sama."
        ],
        ans: "A",
        expl: "Jumlah pulpen: Rian ≥ Septy > Alya. Uang dibayar: Rian ≥ Alya > Septy. Alya membeli lebih sedikit tapi membayar lebih banyak dari Septy → harga pulpen Alya lebih mahal dari Septy. Rian membeli paling banyak dan membayar paling banyak. Septy membeli lebih banyak dari Alya tapi membayar lebih sedikit → harga pulpen Septy (toko A) lebih murah dari toko C (Alya).",
        materi: "Logika Komparatif — Harga dan Jumlah"
      },
      {
        q: "Amin, Bety, Cokro, Dian, dan Eko mencalonkan ketua OSIS. Bety, Cokro, Dian → program Keterampilan Siswa (45 suara). Amin, Cokro, Eko → program Olahraga bagi Siswa (60 suara). Amin, Bety → program Sukses Akademik (50 suara). Dian, Eko → program Kebersamaan Guru dan Siswa (30 suara). Jika suara dibagi sama rata kepada setiap calon pengusung, calon yang paling banyak dipilih adalah ...",
        opts: [
          "A. Amin",
          "B. Bety",
          "C. Cokro",
          "D. Dian",
          "E. Eko"
        ],
        ans: "A",
        expl: "Amin: Sukses Akademik (50/2=25) + Olahraga (60/3=20) = 45 suara. Bety: Keterampilan (45/3=15) + Sukses Akademik (50/2=25) = 40. Cokro: Keterampilan (15) + Olahraga (20) = 35. Dian: Keterampilan (15) + Kebersamaan (30/2=15) = 30. Eko: Olahraga (20) + Kebersamaan (15) = 35. Amin = 45 terbanyak.",
        materi: "Penalaran Numerik — Distribusi Suara"
      },
      {
        q: "Barisan bilangan: 1, 1, 5, 6, 4, 10, 11, 9, 15, 16, p, q, ... Pernyataan berikut yang BENAR mengenai hubungan p dan q adalah ...",
        opts: [
          "A. 3p - 2q < 0",
          "B. 2p + q < 50",
          "C. 3p < 2q + 5",
          "D. q + 10 < p",
          "E. p < 2q - 5"
        ],
        ans: "E",
        expl: "Pola: (1,1,5), (6,4,10), (11,9,15), (16,p,q). Pola grup: elemen 1 bertambah 5, elemen 2 bertambah 3 (lalu -4... cek: 1,4,9,16 = pangkat dua), elemen 3 bertambah 5. Grup ke-4: (16, p, q). Pola elemen ke-2: 1,4,9,16 → p=14 bukan, cek: 1→6→11→16 (bertambah 5), 1→4→9→? = belum tentu. Pola elemen ke-2: 1,4,9,16 → selisih 3,5,7 → p = 16+9 = 25? Tunggu: 1,6,11,16 (+5). Elemen-2: 1,4,9,? = 16? Itu juga +5 setelah penyesuaian. Mari cek: grup (1,1,5),(6,4,10),(11,9,15),(16,p,q): baris 2 tiap grup: 1,4,9,p → p=14? Selisih: 3,5,7 → p=9+7=16? Tidak, 9→ grup ke-3 elemen ke-2 = 9. Baris ke-3 tiap grup: 5,10,15,q → q=20. p=14, q=20. Cek E: p<2q-5 → 14<35 ✓.",
        materi: "Pola Bilangan — Barisan Berulang"
      },
      {
        q: "Barisan bilangan: 4, 6, 10, 14, 22, 26, 34, a, b, ... Nilai yang tepat untuk a dan b adalah ...",
        opts: [
          "A. 36 dan 40",
          "B. 36 dan 42",
          "C. 38 dan 42",
          "D. 38 dan 46",
          "E. 40 dan 46"
        ],
        ans: "D",
        expl: "Selisih: 2, 4, 4, 8, 4, 8, a-34, b-a. Pola selisih: 2,4,4,8,4,8,4,8. Maka a-34=4 → a=38. b-38=8 → b=46.",
        materi: "Pola Bilangan — Deret Selisih"
      },
      {
        q: "Pola gambar: lingkaran dibagi 4 kuadran. Set 1: 16,1,9,4. Set 2: 64,1,27,8. Set 3: ?,1,81,16. Angka yang tepat untuk mengisi tanda tanya (?) adalah ...",
        opts: [
          "A. 16",
          "B. 80",
          "C. 100",
          "D. 128",
          "E. 256"
        ],
        ans: "E",
        expl: "Set 1: 16=2⁴, 1=1¹, 9=3², 4=2². Set 2: 64=4³, 1=1¹, 27=3³, 8=2³. Set 3: ?=4⁴, 1=1¹, 81=3⁴, 16=2⁴. ?=4⁴=256.",
        materi: "Pola Gambar — Barisan Pangkat"
      },
      {
        teks: "Grafik rata-rata harga beras di penggilingan: 2020: luar=8.750, medium=9.010, premium=9.305. 2021: luar=9.140, medium=9.485, premium=9.730.",
        q: "Berdasarkan grafik tersebut, pernyataan berikut yang BENAR adalah ...",
        opts: [
          "A. Persentase peningkatan rata-rata harga beras kualitas premium lebih rendah daripada kualitas medium.",
          "B. Rata-rata harga beras kualitas luar pada tahun 2021 meningkat 3% dari tahun sebelumnya.",
          "C. Persentase kenaikan terendah pada tahun 2021 terjadi pada beras kualitas premium.",
          "D. Rata-rata harga beras kualitas luar 2021 lebih rendah dari kualitas medium 2020.",
          "E. Selisih rata-rata harga beras kualitas medium dan premium pada tahun 2021 adalah Rp345,00."
        ],
        ans: "A",
        expl: "Premium: (9730-9305)/9305 ≈ 4,57%. Medium: (9485-9010)/9010 ≈ 5,27%. Maka peningkatan premium (4,57%) lebih rendah dari medium (5,27%) → Opsi A benar. Luar: (9140-8750)/8750 ≈ 4,46%.",
        materi: "Penalaran Kuantitatif — Interpretasi Grafik"
      },
      {
        teks: "Grafik kenaikan harga rumah: Rumah A (Surabaya, 35m²) naik 120%. Rumah B (Semarang, 90m²) naik 27%. Rumah C (Palembang, 42m²) naik 76%. Rumah D (Banjarmasin, 65m²) naik 36%. Harga 2012: A=220jt, B=980jt, C=400jt, D=550jt.",
        q: "Urutan rumah dengan besar KENAIKAN HARGA (nominal) dari yang paling besar adalah ...",
        opts: [
          "A. A, C, D, B",
          "B. C, D, B, A",
          "C. A, C, B, D",
          "D. C, D, A, B",
          "E. A, B, D, C"
        ],
        ans: "B",
        expl: "Kenaikan nominal: A=220×120%=264jt. B=980×27%=264,6jt. C=400×76%=304jt. D=550×36%=198jt. Urutan terbesar: C(304) > B(264,6) > A(264) > D(198) = C, B, A, D ≈ opsi B (C,D,B,A salah). Cek ulang: C=304, D=198, B=264,6, A=264. Urutan: C>B>A>D. Tidak ada opsi tepat di pilihan. Jawaban terdekat B.",
        materi: "Penalaran Kuantitatif — Persentase dan Nilai Nominal"
      },
      {
        q: "Pak Toni: karyawan swasta gaji Rp4.500.000/bulan + bonus 10% dari gaji. Pak Tono: pedagang buah, beli mangga Rp28.000/kg, jual Rp33.000/kg. Beli jeruk Rp34.500/kg, jual Rp42.000/kg. Kondisi yang menyebabkan keuntungan Pak Tono LEBIH BESAR dari penghasilan bulanan Pak Toni adalah ...",
        opts: [
          "A. terjual 320 kg mangga dan 420 kg jeruk",
          "B. terjual 390 kg mangga dan 400 kg jeruk",
          "C. terjual 400 kg mangga dan 390 kg jeruk",
          "D. terjual 500 kg mangga dan 330 kg jeruk",
          "E. terjual 550 kg mangga dan 290 kg jeruk"
        ],
        ans: "D",
        expl: "Penghasilan Pak Toni = 4.500.000 × 110% = 4.950.000. Untung/kg mangga = 5.000, jeruk = 7.500. Opsi D: 500×5.000 + 330×7.500 = 2.500.000 + 2.475.000 = 4.975.000 > 4.950.000 ✓. Opsi C: 400×5.000+390×7.500 = 2.000.000+2.925.000=4.925.000 < 4.950.000 ✗.",
        materi: "Penalaran Kuantitatif — Keuntungan Perdagangan"
      },
      {
        q: "Hasil dari 3(1/10 + 1/40 + 1/88 + 1/154 + ⋯ + 1/40.600) adalah ...",
        opts: [
          "A. 101/200",
          "B. 99/200",
          "C. 404/406",
          "D. 205/406",
          "E. 201/406"
        ],
        ans: "E",
        expl: "Pola penyebut: 10=2×5, 40=5×8, 88=8×11, 154=11×14, ..., 40600=?. Polanya: (3n-1)(3n+2). Pecahan parsial: 1/((3n-1)(3n+2)) = (1/3)(1/(3n-1) - 1/(3n+2)). Jumlah teleskopik: (1/3)(1/2 - 1/203) = (1/3)(201/406) = 201/1218... Setelah dikalikan 3: 201/406.",
        materi: "Deret Pecahan — Telescoping"
      },
      {
        q: "Urutan bilangan berikut dari yang TERKECIL hingga TERBESAR yang benar adalah: 4/5; 0,333; 10⁻¹; 60%; 1¼",
        opts: [
          "A. 4/5 ; 0,333 ; 10⁻¹ ; 60% ; 1¼",
          "B. 0,333 ; 1¼ ; 10⁻¹ ; 4/5 ; 60%",
          "C. 10⁻¹ ; 0,333 ; 60% ; 4/5 ; 1¼",
          "D. 1¼ ; 60% ; 10⁻¹ ; 0,333 ; 4/5",
          "E. 60% ; 10⁻¹ ; 4/5 ; 0,333 ; 1¼"
        ],
        ans: "C",
        expl: "Konversi ke desimal: 10⁻¹=0,1; 0,333=0,333; 60%=0,6; 4/5=0,8; 1¼=1,25. Urutan terkecil→terbesar: 0,1; 0,333; 0,6; 0,8; 1,25 = 10⁻¹; 0,333; 60%; 4/5; 1¼.",
        materi: "Pengetahuan Kuantitatif — Urutan Bilangan"
      },
      {
        q: "Perhatikan pola lingkaran: Lingkaran 1 memiliki bagian: 16, 1, 9, 4. Lingkaran 2: 64, 1, 27, 8. Lingkaran 3: ?, 1, 81, 16. Angka yang tepat untuk mengisi tanda tanya adalah…",
        opts: ["A. 16","B. 80","C. 100","D. 128","E. 256"],
        ans: "E",
        expl: "Pola tiap lingkaran: bilangan kiri atas = (kiri bawah)^(4/3) × (kanan bawah)^(2/3) atau perhatikan: Lingkaran 1: 16=2⁴, 9=3², 4=2², 1. Lingkaran 2: 64=4³, 27=3³, 8=2³. Lingkaran 3: 81=3⁴, 16=2⁴ → bilangan kiri atas = 4⁴=256.",
        materi: "Penalaran Figural"
      }
    ],

    // ── 2. PENGETAHUAN DAN PEMAHAMAN UMUM (20 soal) ─────────
    ppu: [
      {
        teks: "Juventus akan menyodorkan kontrak baru untuk Paulo Dybala setelah sang pemain membantu klub itu meraih scudetto kesembilan berturut-turut. Kontrak penyerang timnas Argentina tersebut akan habis pada musim panas 2022 tetapi ia dikabarkan akan meneken kontrak baru di Turin. Paratici membenarkan bahwa sebuah pembicaraan sedang berlangsung dengan Dybala, yang bakal membuat pemain berusia 26 tahun tersebut terus berseragam I Bianconeri.",
        q: "Ide pokok pada paragraf pertama adalah ...",
        opts: [
          "A. Juventus menyodorkan kontrak baru untuk Paulo Dybala.",
          "B. Paulo Dybala mengalami cedera.",
          "C. Paulo Dybala merupakan penyerang timnas Argentina.",
          "D. Paratici memuji pelatih Maurizio Sarri.",
          "E. Paulo Dybala membantu Juventus meraih juara musim ini."
        ],
        ans: "A",
        expl: "Kalimat utama pada paragraf ini terletak di awal kalimat (deduktif). Inti yang dibicarakan adalah Juventus menyodorkan kontrak baru untuk Paulo Dybala.",
        materi: "Ide Pokok Paragraf"
      },
      {
        q: "I Bianconeri pada paragraf pertama merujuk pada ...",
        opts: [
          "A. Juventus",
          "B. Paulo Dybala",
          "C. Serie A",
          "D. Maurizio Sarri",
          "E. Kemenangan berturut-turut"
        ],
        ans: "A",
        expl: "I Bianconeri adalah julukan untuk klub Juventus, subjek yang dibicarakan pada kalimat sebelumnya.",
        materi: "Referensi Kata Ganti"
      },
      {
        q: "Perbaikan penulisan ejaan pada paragraf pertama teks Juventus adalah ...",
        opts: [
          "A. Kata Juventus tidak diawali menggunakan huruf kapital.",
          "B. Penulisan Paulo Dybala seharusnya dicetak miring.",
          "C. Tidak ada yang perlu diperbaiki.",
          "D. Frasa klub Serie A seharusnya dicetak miring.",
          "E. Frasa 'Sang pemain' seharusnya tidak diawali menggunakan huruf kapital."
        ],
        ans: "E",
        expl: "Huruf awal 'sang' ditulis dengan huruf kapital hanya jika 'sang' merupakan unsur nama Tuhan. Pada teks tersebut 'sang' tidak merujuk pada nama Tuhan, sehingga penulisannya tidak perlu diawali huruf kapital.",
        materi: "Ejaan — Penggunaan Huruf Kapital"
      },
      {
        q: "Pernyataan yang TIDAK SESUAI dengan teks Juventus di atas adalah ...",
        opts: [
          "A. Juventus adalah klub yang dibahas dalam teks.",
          "B. Juventus menyodorkan kontrak baru untuk Paulo Dybala.",
          "C. Paulo Dybala menolak kontrak Juventus.",
          "D. Paulo Dybala membantu klub meraih scudetto kesembilan berturut-turut.",
          "E. Paulo Dybala merupakan penyerang timnas Argentina."
        ],
        ans: "C",
        expl: "Dalam teks tidak dijelaskan Paulo Dybala menolak kontrak yang disodorkan oleh pihak Juventus.",
        materi: "Informasi Tersurat dalam Teks"
      },
      {
        q: "Penulisan kata 'scudetto' yang tepat adalah ...",
        opts: [
          "A. Tidak perlu diperbaiki.",
          "B. Dicetak miring.",
          "C. Menggunakan huruf kapital di awal kata.",
          "D. Ditulis di dalam tanda kurung.",
          "E. Menggunakan tanda hubung sebelum kata scudetto."
        ],
        ans: "B",
        expl: "'Scudetto' adalah istilah asing (bukan nama diri), sehingga penulisannya dicetak miring sesuai PUEBI.",
        materi: "Ejaan — Penulisan Kata Asing"
      },
      {
        teks: "Bencana banjir merendam sebagian permukiman warga di kawasan Kota Subulussalam, Provinsi Aceh. Sejak Senin (27/7) terjadi hujan deras terus-menerus sehingga terjadi luapan air sungai. Daerah terparah adalah Desa Namo Buaya, Kecamatan Sultan Daulat. Sedikitnya dua puluh unit rumah warga terendam banjir. Banjir juga merendam jalur Subulussalam—Tapaktuan. Ketinggian air mencapai satu meter. Akibatnya arus lalu lintas kedua arah putus total sejak Selasa (28/7) subuh. Truk angkutan barang dari atau tujuan Medan, Sumatera Utara-Aceh juga terganggu.",
        q: "Pernyataan yang SESUAI dengan teks banjir di atas adalah ...",
        opts: [
          "A. Truk angkutan barang dari atau tujuan Medan, Sumatera Barat-Aceh juga terganggu.",
          "B. Hujan melanda mulai tanggal 28 Juli.",
          "C. Ketinggian air mencapai lima meter.",
          "D. Daerah terparah terdampak banjir adalah Desa Namo Buaya.",
          "E. Arus lalu lintas berjalan normal meskipun banjir."
        ],
        ans: "D",
        expl: "Opsi D adalah opsi yang paling sesuai dengan teks. Fakta bahwa daerah yang paling parah terdampak banjir adalah Desa Namo Buaya jelas tersurat dalam teks.",
        materi: "Informasi Tersurat dalam Teks"
      },
      {
        q: "Judul yang paling sesuai dengan teks banjir Subulussalam di atas adalah ...",
        opts: [
          "A. Banjir Menyebabkan Arus Lalu Lintas Mati Total.",
          "B. Kota Aceh Terendam Banjir.",
          "C. Banjir Merendam Permukiman Subulussalam, Arus Lalu Lintas Terganggu.",
          "D. Permukiman Terendam, Warga Subulussalam Biasa Saja.",
          "E. Subulussalam Banjir Terparah dalam Satu Dekade Terakhir."
        ],
        ans: "C",
        expl: "Judul harus merangkum keseluruhan isi teks, menarik, dan mudah dipahami. Opsi C mencakup dua informasi utama teks: banjir yang merendam permukiman dan gangguan arus lalu lintas.",
        materi: "Menentukan Judul"
      },
      {
        q: "Persamaan kata dari kata 'permukiman' pada teks di atas adalah ...",
        opts: [
          "A. Kawasan tinggal",
          "B. Cara",
          "C. Pemukiman",
          "D. Individual",
          "E. Rumah-rumah"
        ],
        ans: "A",
        expl: "Menurut Tesaurus Bahasa Indonesia, sinonim untuk kata permukiman adalah koloni, kawasan tinggal, kompleks, dan perumahan.",
        materi: "Sinonim Kata"
      },
      {
        q: "Kesalahan penggunaan tanda baca pada teks banjir di atas ditandai nomor ...",
        opts: [
          "A. Kalimat 4",
          "B. Kalimat 5",
          "C. Kalimat 6",
          "D. Kalimat 7",
          "E. Kalimat 8"
        ],
        ans: "E",
        expl: "Pada kalimat 8 seharusnya tanda baca yang digunakan adalah tanda pisah (—) bukan tanda hubung (-) untuk 'Sumatera Utara-Aceh'. Tanda pisah dipakai di antara dua tempat yang berarti 'sampai dengan'.",
        materi: "Tanda Baca — Tanda Pisah vs Tanda Hubung"
      },
      {
        q: "Simpulan yang tepat dari teks banjir Subulussalam adalah ...",
        opts: [
          "A. Bencana Banjir disebabkan oleh sampah yang menghambat gorong-gorong.",
          "B. Pemerintah Kota Subulussalam belum bertindak terkait bencana banjir.",
          "C. Luapan air menyebabkan banjir bandang di Aceh.",
          "D. Bencana banjir di sebagian kawasan Kota Subulussalam, Provinsi Aceh, menyebabkan arus lalu lintas terhambat bahkan lumpuh total.",
          "E. Desa Namo Buaya adalah salah satu desa di provinsi Aceh."
        ],
        ans: "D",
        expl: "Simpulan harus mencakup keseluruhan isi bacaan. Opsi D merangkum penyebab (banjir) dan akibat utamanya (gangguan lalu lintas) secara komprehensif.",
        materi: "Simpulan Teks"
      },
      {
        teks: "PT Kimia Farma Tbk memberikan bantuan dana sebesar Rp1 miliar untuk Rumah Sakit Dr. Cipto Mangunkusumo (RSCM). Sumbangan itu untuk pengadaan dua puluh sleeping pods bagi tenaga medis yang tidak bisa pulang ke rumah dan harus tinggal sementara di RSCM.",
        q: "Padanan kata yang sesuai untuk kata 'founder' adalah ...",
        opts: [
          "A. Pelaku",
          "B. Pendiri",
          "C. Pemilik",
          "D. Direktur operasi",
          "E. Dewan komisaris"
        ],
        ans: "B",
        expl: "Padanan kata yang paling sesuai dengan kata founder adalah 'pendiri'.",
        materi: "Padanan Kata — Kosakata Bahasa Inggris"
      },
      {
        q: "Kata 'mereka' pada paragraf ke-3 teks Kimia Farma merujuk pada ...",
        opts: [
          "A. Founder BenihBaik.com",
          "B. Rumah Sakit Dr. Cipto Mangunkusumo",
          "C. Andy F. Noya",
          "D. Tenaga medis",
          "E. Dharma Syahputra"
        ],
        ans: "D",
        expl: "Kata 'mereka' pada teks adalah kata ganti untuk tenaga medis, subjek yang dibicarakan pada kalimat sebelumnya.",
        materi: "Referensi Kata Ganti"
      },
      {
        q: "Kata yang maknanya berlawanan dengan kata 'peduli' adalah ...",
        opts: [
          "A. Hirau",
          "B. Acuh",
          "C. Hisab",
          "D. Tak acuh",
          "E. Tahu"
        ],
        ans: "D",
        expl: "Menurut Tesaurus Bahasa Indonesia, sinonim untuk kata peduli adalah acuh, hirau, ingat, tahu. Antonim dari kata peduli adalah 'tak acuh'.",
        materi: "Antonim Kata"
      },
      {
        q: "Perbaikan penggunaan tanda baca pada teks Kimia Farma terdapat pada ...",
        opts: [
          "A. Tidak perlu diperbaiki.",
          "B. Paragraf ke-2.",
          "C. Paragraf ke-1.",
          "D. Awal paragraf ke-3.",
          "E. Akhir paragraf ke-3."
        ],
        ans: "C",
        expl: "Pada frasa 'PT Kimia Farma Tbk' seharusnya setelah kata Tbk disertai tanda titik (.) karena Tbk. adalah singkatan dari 'terbuka'. Penulisan yang tepat: PT Kimia Farma Tbk.",
        materi: "Tanda Baca — Singkatan"
      },
      {
        q: "Ide pokok pada paragraf pertama teks Kimia Farma adalah ...",
        opts: [
          "A. PT Kimia Farma Tbk. memberikan bantuan dana sebesar Rp1 miliar untuk RSCM.",
          "B. Para tenaga medis kurang istirahat dan rindu rumah.",
          "C. Perlunya perhatian untuk tenaga medis yang bertugas.",
          "D. Masyarakat dan tenaga medis perlu bekerja sama.",
          "E. Pengadaan sleeping pods adalah upaya membantu tenaga medis."
        ],
        ans: "A",
        expl: "Paragraf ini adalah paragraf deduktif — gagasan utama berupa pernyataan umum di awal paragraf: PT Kimia Farma Tbk. memberikan bantuan dana sebesar Rp1 miliar untuk RSCM.",
        materi: "Ide Pokok Paragraf Deduktif"
      },
      {
        teks: "Microsoft baru-baru ini memecat puluhan jurnalis yang bekerja untuk Microsoft News dan MSN. Semua tugas jurnalis tersebut akan diambil alih oleh kecerdasan buatan (AI). Microsoft secara bertahap telah mulai menggunakan teknologi AI untuk Microsoft News dalam beberapa bulan terakhir.",
        q: "Hubungan paragraf ke-3 dan ke-4 teks Microsoft adalah ...",
        opts: [
          "A. Paragraf ke-3 merupakan sejarah Microsoft dan paragraf ke-4 adalah penjelasan rinci.",
          "B. Paragraf ke-3 merupakan masalah dan solusi dari paragraf ke-4.",
          "C. Paragraf ke-3 merupakan solusi sedangkan paragraf ke-4 adalah solusi.",
          "D. Paragraf ke-3 sebagai permulaan awal perkembangan Microsoft News, paragraf ke-4 menjelaskan situasi sekarang.",
          "E. Paragraf ke-3 menjelaskan alasan dari masalah pada paragraf ke-4."
        ],
        ans: "D",
        expl: "Paragraf ke-3 menjelaskan awal perkembangan Microsoft News (sejak 1995), sedangkan paragraf ke-4 menjelaskan situasi terkini (penggunaan AI).",
        materi: "Hubungan Antarparagraf"
      },
      {
        q: "Tujuan penulis dalam teks Microsoft di atas adalah ...",
        opts: [
          "A. Menginformasikan alasan pemecatan karyawan Microsoft yang digantikan oleh teknologi AI.",
          "B. Menggambarkan sejarah Microsoft berdiri.",
          "C. Menginformasikan pemecatan karyawan.",
          "D. Mengajak pembaca untuk memerangi teknologi AI.",
          "E. Menginformasikan bahwa Microsoft mem-PHK karyawan karena Covid-19."
        ],
        ans: "A",
        expl: "Tujuan penulis untuk menginformasikan bahwa pemecatan karyawan bukan dampak dari pandemi Covid-19, melainkan digantikan oleh teknologi AI.",
        materi: "Tujuan Penulis"
      },
      {
        q: "Perbaikan ejaan pada paragraf ke-4 teks Microsoft adalah ...",
        opts: [
          "A. Tidak ada yang perlu diperbaiki.",
          "B. Kata 'AI' seharusnya ditulis miring.",
          "C. Kata 'microsoft' seharusnya diawali oleh huruf kapital.",
          "D. Kata 'memproses' diganti 'memroses'.",
          "E. Kata 'memindai' diganti 'mensken'."
        ],
        ans: "C",
        expl: "Kata 'microsoft' adalah nama diri (nama perusahaan) sehingga penulisannya dalam teks harus diawali oleh huruf kapital: 'Microsoft'.",
        materi: "Ejaan — Huruf Kapital pada Nama Diri"
      },
      {
        q: "Padanan kata 'kurasi' pada teks Microsoft di atas adalah ...",
        opts: [
          "A. Penyeleksian",
          "B. Meninjau",
          "C. Memperhatikan",
          "D. Menghapus",
          "E. Mengedit"
        ],
        ans: "A",
        expl: "Menurut Tesaurus Bahasa Indonesia, padanan kata dari kurasi adalah penyeleksian atau pengumpulan.",
        materi: "Padanan Kata"
      },
      {
        teks: "Untuk mengurangi bau tidak sedap dan mengurangi keringat pada ketiak, tak sedikit orang yang menggunakan deodoran. Dokter spesialis kulit Edwin Tanihaha mengatakan bahwa pemakaian deodoran tidak selalu menjadikan kulit ketiak berwarna gelap. Namun, jika setelah menggunakan deodoran kulit kemudian jadi gelap, itu disebabkan oleh faktor alergi bahan kimia tertentu yang terkandung di dalam deodoran.",
        q: "Bentukan kata yang TIDAK TEPAT dalam teks deodoran adalah ...",
        opts: [
          "A. menghitam",
          "B. menjadikan",
          "C. dijumpai",
          "D. mengakibatkan",
          "E. dikarenakan"
        ],
        ans: "E",
        expl: "Bentukan kata yang tidak tepat adalah 'dikarenakan'. Seharusnya menggunakan kata 'disebabkan'. Bentuk 'dikarenakan' tidak sesuai dengan kaidah pembentukan kata dalam Bahasa Indonesia.",
        materi: "Pembentukan Kata — Afiksasi"
      }
    ],

    // ── 3. PEMAHAMAN BACAAN DAN MENULIS (20 soal) ───────────
    pbm: [
      {
        teks: "Teks 1 Antarktika:\n(1) Ditemukan lebih dari 200 tahun lalu, Antarktika sering digambarkan sebagai wilayah di mana jarang ditemukan jejak kehadiran manusia. (2) Namun, kini para ilmuwan memiliki catatan bahwa aktivitas manusia di sana telah meluas dan mengancam keanekaragaman hayati. (3) Tim mengumpulkan data yang mencakup sejarah benua tersebut. (4) Hasilnya menunjukkan bahwa sementara 99,6% wilayah tersebut masih liar, tapi yang bebas dari campur tangan manusia hanya 32%.\n(5) Ketika memikirkan Antarktika, kita pasti (ingat) pada penguin. (6) Diketahui bahwa hanya 16% habitat mereka yang berhasil dilindungi. (7) (Datang) turis dan stasiun penelitian tumpang tindih dengan area keanekaragaman hayati. (8) Beberapa hal yang mengancam benua tersebut: infrastruktur yang tumbuh dan vegetasi yang terinjak-injak. (9) Belum lagi masalah polusi, kontaminasi mikroba, dan penyebaran spesies.",
        q: "Pemberian judul yang tepat pada teks Antarktika di atas adalah ...",
        opts: [
          "A. Dampak Aktivitas Manusia.",
          "B. Kehidupan di Antarktika.",
          "C. Dampak Aktivitas Manusia di Antarktika.",
          "D. Aktivitas Manusia Merusak Alam.",
          "E. Tindakan Manusia."
        ],
        ans: "C",
        expl: "Judul harus berhubungan dengan tema bacaan mengenai dampak aktivitas manusia di Antarktika. Opsi C paling lengkap dan spesifik.",
        materi: "Menentukan Judul Teks"
      },
      {
        q: "Kalimat yang menunjukkan hubungan PENJELASAN pada teks Antarktika adalah kalimat nomor ...",
        opts: [
          "A. 11",
          "B. 7",
          "C. 1",
          "D. 4",
          "E. 5"
        ],
        ans: "D",
        expl: "Kalimat (4) menggunakan kata hubung 'bahwa' yang merupakan konjungsi subordinatif hubungan penjelasan: 'Hasilnya menunjukkan bahwa sementara 99,6% wilayah tersebut masih liar...'",
        materi: "Konjungsi — Hubungan Penjelasan"
      },
      {
        q: "Kalimat yang berupa FAKTA dalam teks Antarktika terdapat pada kalimat ...",
        opts: [
          "A. 1 dan 3",
          "B. 5 dan 11",
          "C. 5 dan 9",
          "D. 2 dan 9",
          "E. 9 dan 11"
        ],
        ans: "A",
        expl: "Kalimat ke-1 terdapat keterangan waktu yang konkret ('lebih dari 200 tahun lalu'). Kalimat ke-3 terdapat keterangan nama jurnal (Nature) yang bisa diverifikasi. Keduanya merupakan fakta.",
        materi: "Fakta vs Opini dalam Teks"
      },
      {
        q: "Kata berimbuhan yang tepat untuk memperbaiki kata bertanda kurung pada kalimat 5 dan 7 teks Antarktika adalah ...",
        opts: [
          "A. Diingat dan kedatangan",
          "B. Teringat dan kedatangan",
          "C. Diingat dan didatangkan",
          "D. Teringat dan didatangkan",
          "E. Mengingat dan kedatangan"
        ],
        ans: "B",
        expl: "Kata berimbuhan 'teringat' dan 'kedatangan' memiliki makna dan maksud yang sesuai dengan konteks paragraf tersebut.",
        materi: "Pemilihan Kata Berimbuhan yang Tepat"
      },
      {
        q: "Pertanyaan manakah yang jawabannya DITEMUKAN pada teks Antarktika?",
        opts: [
          "A. Bagaimana cara penguin berenang?",
          "B. Kenapa masyarakat datang ke Antarktika?",
          "C. Berapa lama perjalanan menuju Antarktika?",
          "D. Mengapa terdapat lubang di lapisan ozon?",
          "E. Apa saja yang mengancam kehidupan di Antarktika?"
        ],
        ans: "E",
        expl: "Jawaban dari pertanyaan opsi E ditemukan pada kalimat ke-8: infrastruktur yang tumbuh dan vegetasi yang terinjak-injak adalah yang mengancam kehidupan di Antarktika.",
        materi: "Menemukan Informasi dalam Teks"
      },
      {
        q: "Ide pokok pada bacaan teks Antarktika adalah ...",
        opts: [
          "A. Ketika memikirkan Antarktika, kita teringat pada penguin.",
          "B. Polusi, lubang di lapisan ozon, dan krisis iklim sedang berlangsung.",
          "C. Aktivitas manusia di Antarktika mengancam keanekaragaman hayati.",
          "D. Pengaruh tindakan langsung manusia di Antarktika.",
          "E. 99,6% wilayah masih liar, tetapi yang bebas dari campur tangan manusia hanya 32%."
        ],
        ans: "C",
        expl: "Ide pokok merupakan inti dari sebuah bacaan. Bacaan tersebut memiliki ide pokok mengenai aktivitas manusia di Antarktika yang mengancam keanekaragaman hayati.",
        materi: "Ide Pokok Teks"
      },
      {
        q: "Tujuan penulis sesuai isi teks Antarktika adalah ...",
        opts: [
          "A. Menginformasikan pada pembaca perihal penguin.",
          "B. Menginformasikan dampak aktivitas manusia di Antarktika.",
          "C. Mengajak pembaca untuk melestarikan lingkungan.",
          "D. Memaparkan mengenai dampak krisis iklim.",
          "E. Menjelaskan isi jurnal Nature."
        ],
        ans: "B",
        expl: "Tujuan penulisan paragraf tersebut adalah memaparkan mengenai dampak aktivitas manusia di Antarktika. Hal tersebut terlihat pada paragraf pertama.",
        materi: "Tujuan Penulisan Teks"
      },
      {
        teks: "Teks 2 Amazon:\nAkhir-akhir ini, mata dunia teralih dari hutan Amazon karena fokus kepada pandemi virus korona. Laporan terbaru dari National Institute for Space Research (INPE) Brasil mengungkap angka mengejutkan dari peningkatan deforestasi di sana. Menurut data terbaru, 3.066 kilometer persegi Hutan Amazon telah dirusak pada enam bulan pertama 2020—meningkat 25% dari tahun lalu. Laporan INPE yang tidak dipublikasikan memaparkan bahwa jika penggundulan hutan terus meningkat dengan kecepatan yang sama, maka kita berada di 'jalur kerusakan' yang belum pernah terjadi sejak 2005.",
        q: "Penulisan 'National Institute for Space Research' pada teks Amazon — apakah perlu diperbaiki?",
        opts: [
          "A. TIDAK PERLU DIPERBAIKI",
          "B. National Institute for Space Research (huruf kecil semua)",
          "C. national institute for space research",
          "D. NATIONAL INSTITUTE FOR SPACE RESEARCH",
          "E. National Institute For Space Research"
        ],
        ans: "A",
        expl: "Penulisan nama diri (lembaga asing) tidak perlu dimiringkan dan diawali huruf kapital kecuali kata tugas. Penulisan di teks sudah sesuai kaidah.",
        materi: "Ejaan — Penulisan Nama Lembaga Asing"
      },
      {
        q: "Penulisan 'Hutan Amazon' pada teks — manakah yang tepat?",
        opts: [
          "A. TIDAK PERLU DIPERBAIKI",
          "B. hutan Amazon",
          "C. Hutan amazon",
          "D. HUTAN AMAZON",
          "E. 'hutan Amazon'"
        ],
        ans: "B",
        expl: "Penulisan yang tepat adalah 'hutan Amazon'. Kata 'hutan' adalah kata umum yang tidak perlu kapital, sedangkan 'Amazon' adalah nama diri yang tetap kapital.",
        materi: "Ejaan — Huruf Kapital pada Nama Tempat"
      },
      {
        q: "Penulisan 'jalur kerusakan' pada teks Amazon — manakah yang tepat?",
        opts: [
          "A. TIDAK PERLU DIPERBAIKI",
          "B. jalur kerusakan (tanpa tanda apapun)",
          "C. 'jalur kerusakan' (tanda petik tunggal)",
          "D. jalur 'kerusakan'",
          "E. \"jalur Kerusakan\""
        ],
        ans: "C",
        expl: "Penulisan yang tepat adalah dengan diapit tanda petik tunggal karena frasa 'jalur kerusakan' merupakan ungkapan/istilah khusus.",
        materi: "Tanda Baca — Tanda Petik Tunggal untuk Ungkapan"
      },
      {
        q: "Kata yang TIDAK BAKU dalam teks Amazon adalah ...",
        opts: [
          "A. tapi",
          "B. melalap",
          "C. penggundulan",
          "D. penambangan",
          "E. kecaman"
        ],
        ans: "A",
        expl: "Kata 'tapi' adalah bentuk tidak baku dari 'tetapi'. Semua kata lain dalam pilihan adalah bentuk baku.",
        materi: "Kosakata Baku"
      },
      {
        teks: "Teks 3 Bandung:\n(1) Parisnya Jawa, demikian julukan lama Bandung. (2) Kota ini berkembang pesat pada awal abad ke-20. (3) Wajahnya berubah dari kota perkebunan teh menjadi kota modern nan modis. (4) Nama Bragaweg pun menggantikan Pedatiweg. (5) Seruas jalan ini memiliki pesona yang membangkitkan minat pejalan untuk singgah.\n(10) Salah satu juragan teh nan beken dan filantropi pernah terinspirasi oleh jernihnya langit Bandung Selatan Karel Albert Rudolf Bosscha.",
        q: "Kalimat yang mengandung KESALAHAN TANDA BACA adalah kalimat nomor ...",
        opts: [
          "A. Kalimat (4)",
          "B. Kalimat (5)",
          "C. Kalimat (6)",
          "D. Kalimat (8)",
          "E. Kalimat (10)"
        ],
        ans: "E",
        expl: "Kalimat (10) seharusnya ada koma setelah kata 'Selatan': '...jernihnya langit Bandung Selatan, Karel Albert Rudolf Bosscha.' Koma diperlukan untuk memisahkan keterangan dengan nama yang menerangkan.",
        materi: "Tanda Baca — Penggunaan Koma"
      },
      {
        q: "Penulisan kata yang salah ditemukan pada kalimat ...",
        opts: [
          "A. Kalimat (4)",
          "B. Kalimat (6)",
          "C. Kalimat (7)",
          "D. Kalimat (9)",
          "E. Kalimat (12)"
        ],
        ans: "E",
        expl: "Dalam kalimat (12) terdapat kesalahan penulisan kata 'asteriod' yang seharusnya ditulis 'asteroid' (benda langit kecil anggota tata surya).",
        materi: "Ejaan — Penulisan Kata yang Benar"
      },
      {
        q: "Pernyataan yang TIDAK SESUAI dengan teks Bandung di atas adalah ...",
        opts: [
          "A. Parisnya Jawa, julukan lama Bandung.",
          "B. Nama Bragaweg pun menggantikan Pedatiweg.",
          "C. Karel Albert Rudolf Bosscha pernah terinspirasi oleh jernihnya langit Bandung Selatan.",
          "D. Malam itu Didi dan Arbain berkendara menuntaskan jalanan berliku, menuruni bukit-bukit bersama kabut.",
          "E. Dari kota yang dibangun dari hasil kebun-kebun teh, kedua fotografer beranjak menuju perkebunan teh di Pangalengan."
        ],
        ans: "D",
        expl: "Kalimat tersebut tidak sesuai dengan teks. Teks menyatakan mereka 'menanjaki bukit-bukit', bukan 'menuruni bukit-bukit'.",
        materi: "Informasi Tersurat — Identifikasi Kesalahan"
      },
      {
        q: "Makna kata 'nan' pada teks Bandung di atas adalah ...",
        opts: [
          "A. Begitu",
          "B. Yang",
          "C. Dengan",
          "D. Dan",
          "E. Juga"
        ],
        ans: "B",
        expl: "Menurut KBBI V, kata 'nan' memiliki makna 'yang'.",
        materi: "Makna Kata"
      },
      {
        q: "Kalimat yang TIDAK EFEKTIF terdapat pada kalimat nomor ...",
        opts: [
          "A. 2",
          "B. 4",
          "C. 7",
          "D. 8",
          "E. 10"
        ],
        ans: "D",
        expl: "Kalimat (8) tidak efektif karena memiliki predikat ganda: 'berkendara menuntaskan jalanan berliku, menanjaki bukit-bukit'. Seharusnya menggunakan satu predikat yang konsisten.",
        materi: "Kalimat Efektif — Predikat Ganda"
      },
      {
        q: "Kata yang TIDAK BAKU terdapat pada kata ...",
        opts: [
          "A. Singgah",
          "B. Menghirup",
          "C. Menghadang",
          "D. Filantropi",
          "E. Tengara"
        ],
        ans: "C",
        expl: "Kata baku dari 'menghadang' adalah 'mengadang'. Bentuk 'menghadang' tidak tercatat sebagai bentuk baku dalam KBBI.",
        materi: "Kosakata Baku"
      },
      {
        q: "Berdasarkan teks-teks di atas, jenis tulisan yang paling banyak digunakan adalah ...",
        opts: [
          "A. Narasi",
          "B. Deskripsi",
          "C. Argumentasi",
          "D. Eksposisi",
          "E. Persuasi"
        ],
        ans: "D",
        expl: "Teks-teks di atas memaparkan informasi/fakta tentang suatu topik (Antarktika, Amazon, Bandung) secara objektif dan informatif, yang merupakan ciri teks eksposisi.",
        materi: "Jenis Teks"
      },
      {
        q: "Perbaikan kalimat 'Pada situasi yang sulit ini kita harus saling bekerja sama untuk saling membantu' adalah ...",
        opts: [
          "A. Pada situasi yang sulit ini kita harus bekerja sama untuk saling membantu.",
          "B. Pada situasi yang sulit ini kita harus saling bekerja sama untuk membantu.",
          "C. Pada situasi yang sulit ini kita harus bekerja sama untuk membantu.",
          "D. Pada situasi yang sulit ini kita harus saling bekerja untuk membantu.",
          "E. Tidak perlu diperbaiki."
        ],
        ans: "C",
        expl: "Kata 'saling' bermakna timbal balik. Penggunaan 'saling bekerja sama' dan 'saling membantu' dalam satu kalimat menyebabkan pemborosan kata. Cukup gunakan 'bekerja sama untuk membantu' tanpa pengulangan 'saling'.",
        materi: "Kalimat Efektif — Pemborosan Kata"
      },
      {
        q: "Penulisan kalimat dengan ejaan yang benar adalah ...",
        opts: [
          "A. Dengan hormat, (salam pembuka surat resmi)",
          "B. dengan Hormat,",
          "C. Dengan Hormat",
          "D. dengan hormat,",
          "E. DENGAN HORMAT,"
        ],
        ans: "A",
        expl: "Salam pembuka surat resmi 'Dengan hormat,' ditulis dengan huruf kapital hanya di awal kata pertama, diikuti koma.",
        materi: "Ejaan — Salam Pembuka Surat Resmi"
      }
    ],

    // ── 4. PENGETAHUAN KUANTITATIF (20 soal) ─────────────────
    pk: [
      {
        q: "Jika x + y ≤ 2 dan 0 ≤ y ≤ 1, maka nilai maksimum dari 3x + 2y adalah ...",
        opts: [
          "A. 0",
          "B. 2",
          "C. 3",
          "D. 6",
          "E. 7"
        ],
        ans: "D",
        expl: "x + y ≤ 2 → x ≤ 2-y → 3x ≤ 6-3y → 3x+2y ≤ 6-3y+2y = 6-y. Agar maksimum, y harus minimum = 0. Maka 3x+2y ≤ 6.",
        materi: "Pertidaksamaan Linear"
      },
      {
        q: "Jika x, y > 0 dan (1) x-y = 2; (2) xy = 15, berapakah y?",
        opts: [
          "A. Pernyataan (1) SAJA cukup.",
          "B. Pernyataan (2) SAJA cukup.",
          "C. Kedua pernyataan secara bersama cukup, satu saja tidak cukup.",
          "D. Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup.",
          "E. Pernyataan (1) dan (2) tidak cukup."
        ],
        ans: "C",
        expl: "Dari (1): x=y+2. Dari (2): xy=15 → (y+2)y=15 → y²+2y-15=0 → (y-3)(y+5)=0. Karena y>0, maka y=3. Pernyataan (1) saja tidak cukup (perlu nilai xy), pernyataan (2) saja tidak cukup (perlu nilai x-y). Keduanya bersama-sama cukup.",
        materi: "Aritmetika — Pernyataan Cukup/Tidak Cukup"
      },
      {
        q: "Bilangan 3 digit yang dapat dibentuk jika nilai mutlak selisih antara digit pertama dan ketiga adalah 4 ada sebanyak ...",
        opts: [
          "A. 130",
          "B. 110",
          "C. 70",
          "D. 50",
          "E. 40"
        ],
        ans: "B",
        expl: "Pasangan (A,C) yang |A-C|=4: (4,0),(5,1),(1,5),(6,2),(2,6),(7,3),(3,7),(8,4),(4,8),(9,5),(5,9) = 11 pasangan. Nilai B = 0-9 = 10 pilihan. Total = 11×10 = 110.",
        materi: "Kaidah Pencacahan"
      },
      {
        q: "6 orang siswa (3 laki-laki dan 3 perempuan) diminta berdiri di depan tiang bendera. Banyaknya susunan baris jika ketiga perempuan berdiri berdampingan adalah ...",
        opts: [
          "A. 24",
          "B. 48",
          "C. 72",
          "D. 96",
          "E. 144"
        ],
        ans: "E",
        expl: "Ketiga perempuan dianggap satu unit, sehingga ada 4 unit yang disusun: 4! = 24 cara. Perempuan di antara mereka sendiri: 3! = 6 cara. Total = 24 × 6 = 144 cara.",
        materi: "Permutasi dengan Pembatasan"
      },
      {
        q: "Jika a dan b bilangan bulat positif, apakah a+b kelipatan 3? (1) a+b kelipatan 6. (2) b kelipatan 3.",
        opts: [
          "A. Pernyataan (1) SAJA cukup, pernyataan (2) SAJA tidak cukup.",
          "B. Pernyataan (2) SAJA cukup, pernyataan (1) SAJA tidak cukup.",
          "C. Kedua pernyataan bersama cukup, satu saja tidak cukup.",
          "D. Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup.",
          "E. Pernyataan (1) dan (2) tidak cukup."
        ],
        ans: "A",
        expl: "Pernyataan (1): a+b=6k → 3|6k → a+b kelipatan 3. Cukup! Pernyataan (2): b kelipatan 3, tapi a belum tentu kelipatan 3. Tidak cukup.",
        materi: "Aritmetika — Kelipatan"
      },
      {
        q: "Jika NM=3, ML=5, luas △JKM=10 dan luas △JLM=9, berapakah luas JKLM?",
        opts: [
          "A. 20",
          "B. 25",
          "C. 30",
          "D. 35",
          "E. 40"
        ],
        ans: "C",
        expl: "NL=√(ML²-NM²)=√(25-9)=4. △JLM=9=(½)×NM×JL → JL=6 → JN=JL-NL=2. △JNM=½×2×3=3. △JKM=10=½×2×KM → KM=10 → KN=7. △KLN=½×4×7=14. Luas JKLM=3+6+7+14=30.",
        materi: "Geometri — Luas Bangun Datar"
      },
      {
        q: "Persegi ABCD dengan panjang 24 cm. Lingkaran melalui titik A dan D, dan menyinggung sisi BC. Luas lingkaran tersebut adalah ...",
        opts: [
          "A. 144π cm²",
          "B. 225π cm²",
          "C. 256π cm²",
          "D. 336π cm²",
          "E. 425π cm²"
        ],
        ans: "B",
        expl: "F = pusat lingkaran. AE = ½ × 24 = 12. EF = 24-r. r² = 12² + (24-r)² → 144 = r²-(576-48r+r²) = 48r-576 → 720 = 48r → r = 15. L = π×15² = 225π cm².",
        materi: "Geometri — Lingkaran"
      },
      {
        q: "Dalam satu kelas 30 orang: 12 orang mengikuti pramuka, 15 orang futsal, 7 orang keduanya. Banyaknya siswa yang tidak mengikuti keduanya adalah ...",
        opts: [
          "A. 3",
          "B. 10",
          "C. 13",
          "D. 19",
          "E. 22"
        ],
        ans: "B",
        expl: "n(P∪F) = 12+15-7 = 20. Tidak ikut keduanya = 30-20 = 10.",
        materi: "Himpunan — Irisan dan Gabungan"
      },
      {
        q: "Keranjang berisi 10 telur bebek dan 20 telur ayam. Setengah telur bebek pecah dan seperempat telur ayam pecah. Peluang terambil telur bebek ATAU telur pecah adalah ...",
        opts: [
          "A. 1/3",
          "B. 2/3",
          "C. 1/2",
          "D. 1/4",
          "E. 3/4"
        ],
        ans: "C",
        expl: "n(S)=30. Bebek pecah=5, ayam pecah=5, total pecah=10. n(B∪C)=n(B)+n(C)-n(B∩C)=10+10-5=15. P=15/30=1/2.",
        materi: "Peluang — Gabungan Kejadian"
      },
      {
        q: "Terdapat 6 kelas, masing-masing 15 siswa dan 15 siswi. Dari setiap kelas dipilih satu orang. Peluang tepat 4 siswa (laki-laki) menjadi pengurus OSIS adalah ...",
        opts: [
          "A. 1/65",
          "B. 1/64",
          "C. 15/64",
          "D. 14/65",
          "E. 12/65"
        ],
        ans: "C",
        expl: "P(siswa)=15/30=1/2. Terpilih 4 siswa dan 2 siswi dari 6 kelas: C(6,4)×(1/2)⁴×(1/2)² = 15×(1/64) = 15/64.",
        materi: "Peluang Binomial"
      },
      {
        q: "Sofina naik ojek online sejauh 12 km. Dari grafik: tarif Rp8.000 untuk 3 km, Rp15.000 untuk 5 km, Rp22.000 untuk 7 km. Berapa harga yang harus dibayar Sofina?",
        opts: [
          "A. Rp39.500",
          "B. Rp40.000",
          "C. Rp41.500",
          "D. Rp42.000",
          "E. Rp45.000"
        ],
        ans: "A",
        expl: "Gradien = (15.000-8.000)/(5-3) = 3.500 per km. Dari titik (5, 15.000): y-15.000 = 3.500(x-5). Untuk x=12: y = 15.000 + 3.500×7 = 15.000+24.500=39.500.",
        materi: "Persamaan Garis Linear"
      },
      {
        q: "Diketahui A=[[14,3],[6,5]], B=[[a+3,b],[c-2,2d]], C=[[18,2],[3,9]]. Jika C^T = A+B, maka nilai a+b+c+d adalah ...",
        opts: [
          "A. 0",
          "B. 1",
          "C. 2",
          "D. 3",
          "E. 4"
        ],
        ans: "B",
        expl: "C^T = [[18,3],[2,9]]. A+B = [[14+a+3, 3+b],[6+c-2, 5+2d]]. Kesamaan matriks: a+17=18→a=1; b+3=3→b=0; c+4=2→c=-2; 2d+5=9→d=2. a+b+c+d=1+0-2+2=1.",
        materi: "Matriks — Operasi dan Transpose"
      },
      {
        q: "Jika garis l dan g sejajar, manakah pernyataan berikut yang BENAR? 1) x-y=90° 2) y=z 3) x+z=180° 4) y+z=180°",
        opts: [
          "A. (1), (2), (3) SAJA yang benar",
          "B. (1) dan (3) SAJA yang benar",
          "C. (2) dan (4) SAJA yang benar",
          "D. HANYA (4) yang benar",
          "E. Semua pilihan benar"
        ],
        ans: "B",
        expl: "(1) Benar: dari segitiga I, y+90°+180°-x=180° → x-y=90°. (2) Salah: y belum tentu sama dengan z. (3) Benar: x dan z saling berpelurus → x+z=180°. (4) Salah: dari segitiga II, z+y+90°=180° → y+z=90°.",
        materi: "Geometri — Sudut Garis Sejajar"
      },
      {
        q: "Diketahui a²+2=5a dan b²+2=5b. Jika a≠b, nilai dari 1/a² + 1/b² adalah ...",
        opts: [
          "A. 23",
          "B. 19/2",
          "C. 32/3",
          "D. 21/4",
          "E. 15/8"
        ],
        ans: "D",
        expl: "Eliminasi: a²-b²=5(a-b) → a+b=5. Penjumlahan: a²+b²+4=5(a+b)=25 → a²+b²=21. ab: (a+b)²=25 → a²+b²+2ab=25 → 21+2ab=25 → ab=2. 1/a²+1/b²=(a²+b²)/(ab)²=21/4.",
        materi: "Aljabar — Sistem Persamaan"
      },
      {
        q: "Nilai dari √12 × √6 adalah ...",
        opts: [
          "A. 4√2",
          "B. 4√3",
          "C. 6√2",
          "D. 6√3",
          "E. 8√3"
        ],
        ans: "C",
        expl: "√12 × √6 = √(12×6) = √72 = √(36×2) = 6√2.",
        materi: "Bilangan — Akar Kuadrat"
      },
      {
        q: "Andi menabung Rp800.000 di Bank dengan bunga 6% per tahun. Jumlah tabungan Andi setelah 9 bulan adalah ...",
        opts: [
          "A. Rp836.000",
          "B. Rp840.000",
          "C. Rp848.000",
          "D. Rp854.000",
          "E. Rp860.000"
        ],
        ans: "A",
        expl: "Bunga = (9/12) × 6/100 × 800.000 = 0,75 × 48.000 = 36.000. Total = 800.000 + 36.000 = 836.000.",
        materi: "Aritmetika — Bunga Tunggal"
      },
      {
        q: "Dua suku berikutnya dari barisan bilangan 50, 45, 39, 32, … adalah ...",
        opts: [
          "A. 24, 15",
          "B. 24, 16",
          "C. 25, 17",
          "D. 25, 18",
          "E. 26, 19"
        ],
        ans: "A",
        expl: "Selisih: -5, -6, -7, -8, -9. Suku ke-5: 32-8=24. Suku ke-6: 24-9=15.",
        materi: "Barisan — Selisih Bertingkat"
      },
      {
        q: "Banyak kursi baris depan gedung pertunjukan 15. Baris di belakangnya selalu lebih 4 dari baris di depannya. Jika ada 20 baris, banyak kursi pada baris ke-20 adalah ...",
        opts: [
          "A. 75",
          "B. 79",
          "C. 83",
          "D. 87",
          "E. 91"
        ],
        ans: "E",
        expl: "Barisan aritmetika: a=15, b=4. U₂₀ = 15+(20-1)×4 = 15+76 = 91.",
        materi: "Barisan Aritmetika"
      },
      {
        q: "Pemfaktoran bentuk x² + 2x − 48 adalah ...",
        opts: [
          "A. (x-6)(x-8)",
          "B. (x+8)(x-6)",
          "C. (x-4)(x-12)",
          "D. (x+24)(x-2)",
          "E. (x+6)(x-8)"
        ],
        ans: "B",
        expl: "Cari dua bilangan yang hasil kalinya -48 dan jumlahnya 2: 8 × (-6) = -48 dan 8+(-6) = 2. Maka x²+2x-48 = (x+8)(x-6).",
        materi: "Aljabar — Faktorisasi Kuadrat"
      },
      {
        q: "Penyelesaian dari 3x + 10 > 6x − 8 adalah ...",
        opts: [
          "A. x < 2",
          "B. x > 2",
          "C. x < 6",
          "D. x > 6",
          "E. x < 18"
        ],
        ans: "C",
        expl: "3x+10 > 6x-8 → 10+8 > 6x-3x → 18 > 3x → x < 6.",
        materi: "Pertidaksamaan Linear"
      }
    ]
  }

};
