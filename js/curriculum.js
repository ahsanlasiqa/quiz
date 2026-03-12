// ── DrillSoal Curriculum Database ─────────────────────────────
// K13 Revisi + Kurikulum Merdeka | SD, SMP, SMA
// ──────────────────────────────────────────────────────────────

const CURRICULUM = {
  // ── SD ──────────────────────────────────────────────────────
  "SD Kelas 1": {
    mapel: {
      "Matematika": ["Bilangan 1–10","Penjumlahan & Pengurangan","Bangun Datar Sederhana","Pengukuran Panjang","Waktu & Jam"],
      "Bahasa Indonesia": ["Membaca Huruf & Suku Kata","Menulis Nama & Kalimat Sederhana","Cerita Pendek","Kosakata Sehari-hari"],
      "IPAS / IPA": ["Anggota Tubuh","Lingkungan Sekitar","Siang & Malam","Hewan & Tumbuhan di Sekitar"],
      "PPKn": ["Aturan di Rumah","Kebiasaan Baik","Identitas Diri","Kebersamaan"]
    }
  },
  "SD Kelas 2": {
    mapel: {
      "Matematika": ["Bilangan sampai 500","Perkalian & Pembagian Awal","Pengukuran Berat","Bangun Datar","Uang"],
      "Bahasa Indonesia": ["Membaca Teks Pendek","Menulis Kalimat","Kosakata Tema","Cerita & Dongeng"],
      "IPAS / IPA": ["Pertumbuhan Hewan & Tumbuhan","Benda Padat & Cair","Cuaca","Kebersihan Lingkungan"],
      "PPKn": ["Aturan di Sekolah","Hak & Kewajiban Anak","Gotong Royong","Lambang Negara"]
    }
  },
  "SD Kelas 3": {
    mapel: {
      "Matematika": ["Bilangan sampai 1000","Perkalian & Pembagian","Pecahan Sederhana","Keliling Bangun Datar","Pengukuran Waktu"],
      "Bahasa Indonesia": ["Membaca Pemahaman","Paragraf & Ide Pokok","Surat Sederhana","Puisi Anak"],
      "IPA": ["Ciri Makhluk Hidup","Perubahan Wujud Benda","Sumber Daya Alam","Lingkungan Sehat"],
      "IPS": ["Denah & Peta Sederhana","Jenis Pekerjaan","Kegiatan Ekonomi","Kerjasama"],
      "PPKn": ["Norma di Masyarakat","Sumpah Pemuda","Keragaman Budaya","Hak & Kewajiban"]
    }
  },
  "SD Kelas 4": {
    mapel: {
      "Matematika": ["Bilangan Bulat","Kelipatan & Faktor (KPK/FPB)","Pecahan","Bangun Datar & Luas","Statistik Sederhana"],
      "Bahasa Indonesia": ["Teks Narasi","Teks Deskripsi","Pantun","Wawancara","Laporan Pengamatan"],
      "IPA": ["Rangka & Otot","Organ Pencernaan","Tumbuhan & Perkembangbiakannya","Gaya & Gerak","Energi"],
      "IPS": ["Peta & Atlas","Sumber Daya Alam Indonesia","Kegiatan Ekonomi","Sejarah Kerajaan Nusantara"],
      "PPKn": ["Pancasila","Keberagaman Suku & Budaya","Hak & Kewajiban Warga","Persatuan Indonesia"]
    }
  },
  "SD Kelas 5": {
    mapel: {
      "Matematika": ["Bilangan Bulat & Operasinya","Pecahan & Desimal","Persen","Volume Bangun Ruang","Debit & Kecepatan"],
      "Bahasa Indonesia": ["Teks Eksplanasi","Teks Persuasi","Iklan & Poster","Cerpen","Pidato"],
      "IPA": ["Sistem Organ Manusia","Adaptasi Makhluk Hidup","Ekosistem","Cahaya & Sifatnya","Campuran & Larutan"],
      "IPS": ["ASEAN","Jenis Usaha & Kegiatan Ekonomi","Proklamasi Kemerdekaan","Tokoh Pahlawan"],
      "PPKn": ["Nilai-nilai Pancasila","Hak Asasi Manusia","Pemilu & Demokrasi","NKRI"]
    }
  },
  "SD Kelas 6": {
    mapel: {
      "Matematika": ["Bilangan Bulat & Operasi Hitung","Rasio & Proporsi","Bangun Datar & Ruang","Statistik & Peluang","Operasi Hitung Campuran"],
      "Bahasa Indonesia": ["Teks Argumentasi","Surat Resmi","Ringkasan & Kesimpulan","Resensi","Debat"],
      "IPA": ["Perkembangbiakan Makhluk Hidup","Listrik & Elektronika","Tata Surya","Perubahan Alam","Bioteknologi Sederhana"],
      "IPS": ["Globalisasi","Kerjasama Internasional","Sejarah Kemerdekaan Indonesia","Pembangunan Nasional"],
      "PPKn": ["Sistem Pemerintahan Indonesia","UUD 1945","Bela Negara","Budaya Demokrasi"]
    }
  },

  // ── SMP ─────────────────────────────────────────────────────
  "SMP Kelas 7": {
    mapel: {
      "Matematika": ["Bilangan Bulat I","Bilangan Bulat II","Pecahan I","Pecahan II","Himpunan","Aljabar","Persamaan & Pertidaksamaan Linear Satu Variabel","Perbandingan","Aritmetika Sosial","Garis & Sudut","Segi Empat","Segitiga","Statistika","Peluang"],
      "IPA": ["Objek IPA & Pengamatannya","Klasifikasi Makhluk Hidup","Zat & Karakteristiknya","Suhu & Kalor","Energi dalam Sistem Kehidupan","Sistem Organisasi Kehidupan","Ekosistem","Pencemaran Lingkungan","Pemanasan Global","Lapisan Bumi"],
      "IPS": ["Manusia, Tempat & Lingkungan","Interaksi Sosial & Lembaga Sosial","Aktivitas Manusia dalam Memenuhi Kebutuhan","Kehidupan Masyarakat Indonesia Masa Praaksara","Kehidupan Masyarakat Indonesia Masa Hindu-Buddha","Kehidupan Masyarakat Indonesia Masa Islam"],
      "Bahasa Indonesia": ["Teks Deskripsi","Teks Cerita Imajinasi","Teks Prosedur","Teks Laporan Hasil Observasi","Teks Eksposisi","Teks Puisi Rakyat","Teks Fabel & Legenda","Teks Berita","Teks Iklan","Teks Persuasi"],
      "Bahasa Inggris": ["Greetings & Introduction","Describing People & Things","Daily Activities","Time & Numbers","Asking & Giving Information","Descriptive Text","Recount Text","Narrative Text"],
      "PPKn": ["Pancasila","Norma & Keadilan","Keberagaman Masyarakat Indonesia","Kerjasama dalam Berbagai Bidang Kehidupan"],
      "Seni Budaya": ["Seni Rupa 2D","Seni Rupa 3D","Bernyanyi Unisono","Ansambel Musik","Seni Tari","Seni Teater"]
    }
  },
  "SMP Kelas 8": {
    mapel: {
      "Matematika": ["Pola Bilangan","Koordinat Kartesius","Relasi & Fungsi","Persamaan Garis Lurus","Sistem Persamaan Linear Dua Variabel","Teorema Pythagoras","Lingkaran","Bangun Ruang Sisi Datar","Statistika","Peluang"],
      "IPA": ["Gerak Benda & Makhluk Hidup","Usaha & Pesawat Sederhana","Struktur & Fungsi Tumbuhan","Sistem Pencernaan","Zat Aditif & Adiktif","Sistem Peredaran Darah","Tekanan Zat","Sistem Ekskresi","Getaran, Gelombang & Bunyi","Cahaya & Alat Optik"],
      "IPS": ["Interaksi Keruangan dalam Kehidupan di Negara-negara ASEAN","Pengaruh Interaksi Sosial terhadap Kehidupan Sosial & Budaya","Keunggulan & Keterbatasan Antarruang","Perubahan Masyarakat Indonesia pada Masa Penjajahan","Pergerakan Kebangsaan Indonesia","Pendudukan Jepang"],
      "Bahasa Indonesia": ["Teks Berita","Teks Iklan","Teks Eksposisi","Teks Puisi","Teks Eksplanasi","Teks Ulasan","Teks Persuasi","Teks Drama","Teks Literasi Fiksi"],
      "Bahasa Inggris": ["Expressing Ability & Willingness","Asking & Giving Opinion","Comparison","Advertisement","Procedure Text","Report Text","Analytical Exposition","Narrative Text"],
      "PPKn": ["Kedudukan & Fungsi Pancasila","Konstitusi & Rule of Law","Tata Urutan Perundang-undangan","Kebangkitan Nasional","Sumpah Pemuda","Semangat Persatuan & Kesatuan"]
    }
  },
  "SMP Kelas 9": {
    mapel: {
      "Matematika": ["Perpangkatan & Bentuk Akar","Persamaan Kuadrat","Fungsi Kuadrat","Transformasi Geometri","Kesebangunan & Kekongruenan","Bangun Ruang Sisi Lengkung","Statistika","Peluang"],
      "IPA": ["Sistem Reproduksi Manusia","Sistem Reproduksi Tumbuhan & Hewan","Pewarisan Sifat (Genetika)","Listrik Statis","Listrik Dinamis","Kemagnetan","Bioteknologi","Partikel Penyusun Benda","Tanah & Keberlangsungan Kehidupan","Proses & Produk Teknologi Ramah Lingkungan"],
      "IPS": ["Interaksi Antarnegara Asia & Dunia","Perubahan Sosial Budaya","Ketergantungan Antarruang","Perang Dunia II","Perjuangan Kemerdekaan Indonesia","Perkembangan Iptek"],
      "Bahasa Indonesia": ["Teks Laporan Percobaan","Teks Pidato Persuasif","Teks Cerpen","Teks Tanggapan","Teks Diskusi","Teks Novel","Teks Puisi","Teks Drama"],
      "Bahasa Inggris": ["Expressing Hopes & Dreams","Congratulating & Complimenting","Passive Voice","Reported Speech","Procedure Text","Discussion Text","Review Text","Short Story"],
      "PPKn": ["Dinamika Perwujudan Pancasila","Pokok Pikiran Pembukaan UUD","Kedaulatan Negara","Makna Kebhinekaan"]
    }
  },

  // ── SMA ─────────────────────────────────────────────────────
  "SMA Kelas 10": {
    mapel: {
      "Matematika": ["Eksponen & Logaritma","Persamaan & Fungsi Kuadrat","Sistem Persamaan Linear","Pertidaksamaan Linear & Kuadrat","Fungsi Komposisi & Invers","Trigonometri Dasar","Vektor","Statistika & Peluang","Barisan & Deret"],
      "Fisika": ["Besaran & Satuan","Gerak Lurus","Gerak Parabola","Hukum Newton","Usaha & Energi","Impuls & Momentum","Elastisitas & Getaran","Fluida Statis","Suhu & Kalor"],
      "Kimia": ["Struktur Atom","Tabel Periodik","Ikatan Kimia","Tata Nama Senyawa","Stoikiometri","Larutan Elektrolit","Reaksi Redoks","Hidrokarbon","Termokimia"],
      "Biologi": ["Sel","Jaringan Tumbuhan","Jaringan Hewan","Sistem Gerak","Sistem Peredaran Darah","Sistem Pencernaan","Sistem Pernapasan","Sistem Ekskresi","Sistem Koordinasi","Reproduksi"],
      "Sejarah Indonesia": ["Kehidupan Manusia Purba","Kerajaan Hindu-Buddha","Kerajaan Islam di Indonesia","Masa Kolonialisme","Pergerakan Nasional","Proklamasi Kemerdekaan"],
      "Geografi": ["Pengetahuan Dasar Geografi","Peta & Penginderaan Jauh","Langkah Penelitian Geografi","Dinamika Planet Bumi","Hubungan Manusia & Lingkungan"],
      "Ekonomi": ["Konsep Dasar Ekonomi","Masalah Ekonomi","Sistem Ekonomi","Permintaan & Penawaran","Elastisitas","Pasar"],
      "Bahasa Indonesia": ["Teks LHO","Teks Eksposisi","Teks Anekdot","Teks Negosiasi","Teks Debat","Biografi"],
      "Bahasa Inggris": ["Simple, Compound & Complex Sentences","Narrative Text","Analytical Exposition","Descriptive Text","Report Text","Hortatory Exposition"]
    }
  },
  "SMA Kelas 11 IPA": {
    mapel: {
      "Matematika": ["Induksi Matematika","Program Linear","Matriks","Transformasi Geometri","Barisan & Deret","Limit Fungsi","Turunan Fungsi","Integral"],
      "Fisika": ["Getaran Harmonis","Gelombang","Bunyi","Cahaya & Optik","Listrik Statis","Listrik Dinamis","Magnet","Induksi Elektromagnetik","Radiasi Benda Hitam"],
      "Kimia": ["Laju Reaksi","Kesetimbangan Kimia","Larutan Asam Basa","Hidrolisis Garam","Larutan Penyangga","Titrasi Asam Basa","Ksp","Sistem Koloid","Sifat Koligatif"],
      "Biologi": ["Sel & Transpor Membran","Metabolisme","Reproduksi Sel","Pewarisan Sifat (Mendel)","Mutasi","Evolusi","Bioteknologi","Ekosistem & Lingkungan"]
    }
  },
  "SMA Kelas 11 IPS": {
    mapel: {
      "Matematika": ["Induksi Matematika","Program Linear","Matriks","Barisan & Deret","Limit Fungsi","Turunan","Integral"],
      "Ekonomi": ["Pendapatan Nasional","Pertumbuhan & Pembangunan Ekonomi","Ketenagakerjaan","Inflasi","Kebijakan Moneter & Fiskal","APBN & APBD","Pasar Modal","Perdagangan Internasional"],
      "Sosiologi": ["Kelompok Sosial","Permasalahan Sosial","Konflik & Integrasi","Mobilitas Sosial","Lembaga Sosial"],
      "Geografi": ["Posisi Strategis Indonesia","Persebaran Flora & Fauna","Kependudukan","Ketahanan Pangan","Potensi & Pengelolaan Sumber Daya","Mitigasi Bencana"],
      "Sejarah": ["Indonesia Zaman Pendudukan Jepang","Revolusi Indonesia","Perkembangan IPTEK","Perang Dingin","Organisasi Global & Regional"]
    }
  },
  "SMA Kelas 12 IPA": {
    mapel: {
      "Matematika": ["Integral Lanjutan","Peluang","Statistika Lanjutan","Vektor 3D","Dimensi Tiga"],
      "Fisika": ["Inti Atom & Radioaktivitas","Relativitas","Fisika Kuantum","Teknologi Digital","Review UN"],
      "Kimia": ["Senyawa Karbon","Benzena & Turunannya","Makromolekul","Kimia Unsur","Review UN"],
      "Biologi": ["Pertumbuhan & Perkembangan","Substansi Genetik","Bioteknologi Modern","Evolusi","Review UN"]
    }
  },
  "SMA Kelas 12 IPS": {
    mapel: {
      "Ekonomi": ["Akuntansi Perusahaan Jasa","Akuntansi Perusahaan Dagang","Manajemen","Koperasi","Review UN"],
      "Sosiologi": ["Perubahan Sosial","Globalisasi","Pemberdayaan Komunitas","Review UN"],
      "Geografi": ["Negara Maju & Berkembang","Kerjasama Internasional","Review UN"],
      "Sejarah": ["Indonesia Masa Reformasi","Perkembangan Dunia Kontemporer","Review UN"]
    }
  },
  "SMA Kelas 10 Kurikulum Merdeka": {
    mapel: {
      "Matematika": ["Eksponen & Logaritma","Barisan & Deret","Fungsi","Trigonometri","Vektor","Statistika"],
      "Fisika": ["Pengukuran","Gerak Lurus & Melingkar","Dinamika Partikel","Energi & Momentum","Fluida","Suhu & Kalor"],
      "Kimia": ["Struktur Atom & SPU","Ikatan Kimia","Stoikiometri","Larutan Elektrolit","Reaksi Redoks"],
      "Biologi": ["Keanekaragaman Hayati","Sel","Biologi Molekuler","Ekologi","Perubahan Lingkungan"],
      "Bahasa Indonesia": ["Teks Laporan","Teks Argumentasi","Teks Fiksi","Teks Prosedur","Teks Diskusi"],
      "Bahasa Inggris": ["Identity & Greetings","Descriptive & Recount","Procedure & Instructions","Report & Explanation"],
      "Informatika": ["Berpikir Komputasional","Algoritma & Pemrograman","Struktur Data","Sistem Komputer","Jaringan & Internet","Dampak Sosial Informatika"],
      "IPAS": ["Hakikat Ilmu Sains","Bumi & Alam Semesta","Zat & Perubahannya","Energi & Perubahannya","Makhluk Hidup"]
    }
  },
  "SMA Kelas 11 Kurikulum Merdeka": {
    mapel: {
      "Matematika": ["Induksi Matematika","Limit & Turunan","Integral","Program Linear","Matriks","Peluang & Statistika"],
      "Fisika": ["Getaran & Gelombang","Listrik & Magnet","Optika","Fisika Modern"],
      "Kimia": ["Laju & Kesetimbangan Reaksi","Asam Basa & Titrasi","Kimia Karbon","Polimer & Biomolekul"],
      "Biologi": ["Metabolisme Sel","Reproduksi & Pewarisan","Evolusi","Bioteknologi"],
      "Ekonomi": ["Ketenagakerjaan & Inflasi","Kebijakan Ekonomi","Perdagangan Internasional","Pasar Uang & Modal"]
    }
  },
  "SMA Kelas 12 Kurikulum Merdeka": {
    mapel: {
      "Matematika": ["Vektor & Dimensi Tiga","Statistika Inferensial","Kalkulus Lanjutan"],
      "Fisika": ["Inti Atom","Relativitas & Kuantum","Teknologi Modern"],
      "Kimia": ["Kimia Unsur","Elektrokimia","Kimia Analitik"],
      "Biologi": ["Pertumbuhan & Regulasi","Bioteknologi Modern","Ekosistem Global"]
    }
  }
};

// Helper: get all jenjang options
function getCurriculumJenjang() {
  return Object.keys(CURRICULUM);
}

// Helper: get mapel for a jenjang
function getMapelForJenjang(jenjang) {
  return CURRICULUM[jenjang] ? Object.keys(CURRICULUM[jenjang].mapel) : [];
}

// Helper: get topik for a jenjang + mapel
function getTopikForMapel(jenjang, mapel) {
  return CURRICULUM[jenjang]?.mapel?.[mapel] || [];
}
