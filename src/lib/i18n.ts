// Custom minimal i18n. Trade-off vs paraglide-js: zero deps, no compile step.
// Type-safety via `as const` lock + `keyof typeof id` union — kalau tambah key di
// `id` tapi lupa di `en`, TypeScript langsung error di `Record<MessageKey, string>`.
//
// Re-evaluate kalau messages catalog growth >200 keys atau butuh plurals/interpolation.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Source-of-truth catalog. Key style: `<feature>.<element>` lowercase-kebab.
const id = {
  'app.name': 'Arutala',
  'app.tagline':
    'Period & cycle tracker untuk pasangan. Privacy-first, partner mode bawaan.',
  'app.smoke-test': 'Smoke test, design tokens loaded.',

  // Auth — fields
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.field.password-confirm': 'Konfirmasi password',
  'auth.field.display-name': 'Nama panggilan',
  'auth.field.date-of-birth': 'Tanggal lahir',
  'auth.field.date-of-birth.hint': 'Verifikasi umur ≥18 (UU PDP Pasal 25)',
  'auth.password.help':
    'Min 12 karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol.',
  'auth.password.pwned':
    'Password ini muncul di {count} breach data publik. Pilih password yang lebih unik.',
  'auth.password.checking': 'Cek keamanan password...',
  'auth.consent.heading': 'Persetujuan pemrosesan data',
  'auth.consent.intro':
    'Sebelum daftar, berikan persetujuan eksplisit sesuai UU PDP Pasal 22. Tanpa centang yang WAJIB, pendaftaran tidak bisa dilanjutkan.',
  'auth.consent.privacy-link': 'Baca Privacy Notice',
  'auth.consent.core-processing.title':
    'WAJIB: Pemrosesan data kesehatan',
  'auth.consent.core-processing.body':
    'Saya memberikan persetujuan eksplisit kepada Arutala untuk memproses data kesehatan saya (haid, gejala, mood, catatan) demi fungsi inti pelacakan siklus. Identitas pengendali data tertera di halaman Privacy.',
  'auth.consent.cross-border.title':
    'WAJIB: Transfer ke luar negeri',
  'auth.consent.cross-border.body':
    'Saya memberikan persetujuan untuk transfer data ke server di luar Indonesia (Supabase Tokyo dan Cloudflare global).',
  'auth.consent.partner-sharing.title':
    'OPSIONAL: Berbagi data ke pasangan',
  'auth.consent.partner-sharing.body':
    'Saya memberikan persetujuan untuk berbagi data kesehatan ke akun pasangan yang saya tautkan (couple mode). Bisa dimatikan kapan saja di Settings.',

  // Auth — login
  'auth.login.title': 'Login',
  'auth.login.description': 'Masuk pakai email + password.',
  'auth.login.submit': 'Masuk',
  'auth.login.submitting': 'Masuk…',
  'auth.login.no-account': 'Belum punya akun?',

  // Auth — signup
  'auth.signup.title': 'Daftar',
  'auth.signup.description': 'Bikin akun baru di Arutala.',
  'auth.signup.submit': 'Daftar',
  'auth.signup.submitting': 'Mendaftar…',
  'auth.signup.has-account': 'Udah punya akun?',
  'auth.signup.success-title': 'Akun ke-bikin!',
  'auth.signup.success-body':
    'Cek email Kamu untuk verifikasi link. Klik link tersebut untuk bisa login.',
  'auth.signup.success-back-login': 'Balik ke login',

  'not-found.title': '404',
  'not-found.message': 'Halaman tidak ditemukan. Mungkin link-nya salah ketik?',
  'not-found.back-home': 'Balik ke beranda',

  // Common
  'common.loading': 'Memuat…',

  // Home (protected)
  'home.signed-in-as': 'Login sebagai',
  'home.sign-out': 'Keluar',
  'home.signing-out': 'Keluar…',

  // Couple — setup page
  'couple.setup.title': 'Hubungkan akun pasangan',
  'couple.setup.description':
    'Sebelum mulai tracking, kamu perlu hubungkan akun ke pasanganmu via code 6 karakter.',

  // Couple — invitation create
  'couple.invite.title': 'Bikin invitation',
  'couple.invite.description':
    'Generate code 6 karakter, share ke pasangan kamu (WhatsApp, dll).',
  'couple.invite.create-button': 'Bikin code baru',
  'couple.invite.creating': 'Bikin code…',
  'couple.invite.your-code': 'Code kamu:',
  'couple.invite.copy': 'Salin',
  'couple.invite.copied': 'Tersalin!',
  'couple.invite.expires': 'Code aktif 7 hari.',
  'couple.invite.cancel': 'Batalkan',
  'couple.invite.cancelling': 'Membatalkan…',
  'couple.invite.cancel-confirm':
    'Yakin batalkan kode ini? Pasangan Kamu tidak bisa memakai kode lama lagi.',

  // Couple — accept invitation
  'couple.accept.title': 'Punya code?',
  'couple.accept.description':
    'Masukin code dari pasangan kamu di sini buat hubungkan akun.',
  'couple.accept.code-label': 'Code 6 karakter',
  'couple.accept.submit': 'Hubungkan',
  'couple.accept.submitting': 'Menghubungkan…',

  // Couple — status (home display)
  'couple.partner-prefix': 'Bareng',
  'couple.unlink': 'Lepas hubungan',

  // Cycles — idle state (no active period)
  'cycles.idle.title': 'Belum sedang haid',
  'cycles.idle.description': 'Ketuk tombol di bawah saat haid mulai.',

  // Cycles — active state (period berlangsung)
  'cycles.active.title': 'Sedang haid',
  'cycles.active.since': 'Mulai',
  'cycles.active.day-prefix': 'Hari ke-',

  // Cycles — actions
  'cycles.action.start-today': 'Period Mulai Hari Ini',
  'cycles.action.starting': 'Memulai…',
  'cycles.action.end-today': 'Period Selesai',
  'cycles.action.ending': 'Menyelesaikan…',

  // Cycles — history list
  'cycles.history.title': 'Riwayat',
  'cycles.history.empty': 'Belum ada riwayat haid. Setelah Kamu mencatat pertama kali, akan muncul di sini.',
  'cycles.history.ongoing': '(berlangsung)',
  'cycles.history.days-suffix': 'hari',
  'cycles.history.arrow': '→',

  // Prediction
  'prediction.title': 'Prediksi',
  'prediction.insufficient-data':
    'Butuh minimal 2 catatan haid untuk prediksi. Catat haid Kamu dulu ya.',
  'prediction.next-start': 'Periode berikutnya',
  'prediction.ovulation': 'Ovulasi',
  'prediction.fertile': 'Window subur',
  'prediction.avg-cycle': 'Rata-rata siklus',
  'prediction.days-suffix': 'hari',
  'prediction.based-on': 'Berdasarkan',
  'prediction.cycles-suffix': 'siklus terakhir',
  'prediction.confidence-prefix': '±',

  // Calendar
  'calendar.title': 'Kalender',
  'calendar.day.full-format': 'EEEE, d MMM yyyy',
  'calendar.day.period': 'Hari periode',
  'calendar.day.no-period': 'Bukan hari periode',
  'calendar.day.today-suffix': '(hari ini)',
  'calendar.day.edit-cycle': 'Edit periode ini',
  'calendar.day.start-here': 'Catat periode mulai tanggal ini',
  'calendar.day.close': 'Tutup',

  // Charts
  'chart.cycle-trend.title': 'Tren panjang siklus',
  'chart.cycle-trend.empty': 'Butuh ≥2 siklus untuk lihat tren.',
  'chart.cycle-trend.tooltip-length': 'Panjang siklus',
  'chart.cycle-trend.avg-line': 'Rata-rata',
  'chart.symptom-freq.title': 'Gejala tersering',
  'chart.symptom-freq.empty': 'Belum ada gejala ke-log. Catat di daily log untuk lihat tren.',
  'chart.symptom-freq.count-suffix': 'x',

  // Insights
  'insights.title': 'Insights',
  'insights.avg-cycle': 'Rata-rata siklus',
  'insights.variability': 'Variasi',
  'insights.regularity': 'Keteraturan',
  'insights.regular': 'Teratur',
  'insights.irregular': 'Tidak teratur',
  'insights.regular-hint': 'Variasi <7 hari = teratur per definisi medis.',
  'insights.irregular-hint': 'Variasi lebih dari 7 hari. Konsultasikan ke dokter jika Kamu khawatir.',
  'insights.days-suffix': 'hari',

  // Cycle wheel
  'wheel.day-prefix': 'Hari ke-',
  'wheel.of': 'dari',
  'wheel.phase.period': 'Periode',
  'wheel.phase.follicular': 'Folikuler',
  'wheel.phase.fertile': 'Subur',
  'wheel.phase.ovulation': 'Ovulasi',
  'wheel.phase.luteal': 'Luteal',
  'wheel.empty': 'Belum ada data siklus. Catat haid pertama Kamu untuk memulai.',

  // Daily log form
  'daily-log.section.cycle': 'Siklus',
  'daily-log.section.flow': 'Aliran haid',
  'daily-log.section.symptoms': 'Gejala',
  'daily-log.section.moods': 'Mood',
  'daily-log.section.notes': 'Catatan',
  'daily-log.notes.placeholder': 'Apa yang kamu rasakan hari ini? (opsional)',
  'daily-log.flow.0': 'Tidak ada',
  'daily-log.flow.1': 'Bercak',
  'daily-log.flow.2': 'Ringan',
  'daily-log.flow.3': 'Sedang',
  'daily-log.flow.4': 'Banyak',
  'daily-log.save': 'Simpan log',
  'daily-log.saving': 'Menyimpan…',
  'daily-log.delete': 'Hapus log',
  'daily-log.delete-confirm': 'Hapus log untuk hari ini?',
  'daily-log.empty-state': 'Belum ada log untuk hari ini.',

  // Logs page (search + filter)
  'logs.title': 'Semua log',
  'logs.search.placeholder': 'Cari di notes…',
  'logs.filter.symptoms': 'Filter gejala',
  'logs.filter.clear': 'Reset filter',
  'logs.results-count': 'log ditemukan',
  'logs.empty': 'Tidak ada log yang cocok.',
  'logs.view-all': 'Lihat semua log',

  // Data export
  'export.title': 'Export data',
  'export.description': 'Download semua log + siklus sebagai CSV (compatible drip).',
  'export.button': 'Download CSV',
  'export.exporting': 'Mengexport…',

  // PWA install
  'install.title': 'Install Arutala',
  'install.description':
    'Pasang ke home screen agar terbuka seperti aplikasi native, siap offline, dan full-screen.',
  'install.button': 'Install app',
  'install.installed': 'Sudah terpasang ✓',
  'install.ios.title': 'Install di iOS',
  'install.ios.body':
    'Buka di Safari, tap tombol Share, lalu pilih "Tambahkan ke Layar Utama".',

  // Bottom tab navigation
  'nav.home': 'Hari Ini',
  'nav.calendar': 'Kalender',
  'nav.insights': 'Insights',
  'nav.settings': 'Saya',

  // Page-level titles for new tab pages
  'page.calendar.title': 'Kalender',
  'page.insights.title': 'Insights',

  // Home — slim prediction snapshot
  'home.snapshot.next-period-in': 'Haid berikutnya',
  'home.snapshot.days-suffix': 'hari lagi',
  'home.snapshot.starts-on': 'mulai',
  'home.snapshot.see-insights': 'Lihat semua insights',
  'home.snapshot.no-data': 'Belum cukup data prediksi',

  // Home — quick log card (today)
  'home.today-log.title': 'Log hari ini',
  'home.today-log.empty': 'Belum ada catatan untuk hari ini.',
  'home.today-log.has-flow': 'Flow tercatat',
  'home.today-log.symptoms-count': 'gejala',
  'home.today-log.moods-count': 'mood',
  'home.today-log.has-notes': '+ catatan',
  'home.today-log.button.add': 'Catat sekarang',
  'home.today-log.button.edit': 'Edit log',

  // Onboarding role selection (Phase 5 J2)
  'onboarding.role.title': 'Pilih peranmu di Arutala',
  'onboarding.role.subtitle':
    'Kamu bisa ganti pilihan ini kapan saja di Settings.',
  'onboarding.role.tracker.title': 'Tracker',
  'onboarding.role.tracker.body':
    'Saya yang mengalami haid dan mencatat siklus, gejala, serta mood. Bisa sendiri atau dengan pasangan.',
  'onboarding.role.supporter.title': 'Supporter',
  'onboarding.role.supporter.body':
    'Saya pasangan yang membantu pelacakan. Lebih banyak membaca dan memberi dukungan saat pasangan membutuhkan.',
  'onboarding.role.next': 'Lanjut',
  'onboarding.solo.title': 'Bagaimana Kamu mau memakai Arutala?',
  'onboarding.solo.subtitle':
    'Solo: simpan data sendiri. Pasangan: tautkan akun pasangan agar bisa berbagi data.',
  'onboarding.solo.solo.title': 'Solo dulu',
  'onboarding.solo.solo.body':
    'Pelacakan pribadi tanpa pasangan. Kamu bisa tautkan pasangan nanti kapan saja.',
  'onboarding.solo.couple.title': 'Bersama pasangan',
  'onboarding.solo.couple.body':
    'Kamu akan diarahkan ke setup kode undangan agar pasangan bisa terhubung.',
  'onboarding.error': 'Ada error, coba lagi ya',
  'onboarding.saving': 'Menyimpan...',

  // Home greeting (Phase 5)
  'home.greeting.morning': 'Selamat pagi',
  'home.greeting.afternoon': 'Selamat siang',
  'home.greeting.evening': 'Selamat sore',
  'home.greeting.night': 'Selamat malam',
  'home.role.tracker': 'tracker siklus',
  'home.role.supporter': 'supporter pasangan',
  'home.role.solo': 'mode solo',
  'home.partner-pill.linked': 'Terhubung dengan',
  'home.partner-pill.solo': 'Tracking solo',

  // Toast notifications (Phase 4 Track D)
  'toast.period.started': 'Haid berhasil dicatat',
  'toast.period.ended': 'Haid selesai dicatat',
  'toast.daily-log.saved': 'Catatan tersimpan',
  'toast.daily-log.deleted': 'Catatan dihapus',
  'toast.cycle.saved': 'Haid tersimpan',
  'toast.cycle.deleted': 'Haid dihapus',
  'toast.profile.saved': 'Profil tersimpan',
  'toast.couple.unlinked': 'Pasangan terlepas',
  'toast.error.generic': 'Terjadi kesalahan, silakan coba lagi.',

  // Sexual activity (E2EE-gated)
  'sexual-activity.section.title': 'Aktivitas intim (E2EE)',
  'sexual-activity.gate.not-setup':
    'Field ini di-encrypt end-to-end. Aktifkan E2EE di Settings dulu sebelum mulai tracking.',
  'sexual-activity.gate.locked':
    'E2EE terkunci. Buka kunci di Settings dulu untuk akses field ini.',
  'sexual-activity.gate.go-to-settings': 'Ke Settings',
  'sexual-activity.field.active': 'Ada aktivitas hari ini?',
  'sexual-activity.field.type': 'Pakai kontrasepsi?',
  'sexual-activity.type.protected': 'Pakai (protected)',
  'sexual-activity.type.unprotected': 'Tanpa (unprotected)',
  'sexual-activity.field.intensity': 'Tingkat intensitas',
  'sexual-activity.intensity.1': 'Ringan',
  'sexual-activity.intensity.2': 'Sedang',
  'sexual-activity.intensity.3': 'Tinggi',
  'sexual-activity.field.notes': 'Catatan tambahan (opsional)',
  'sexual-activity.error.decrypt': 'Gagal decrypt. Passphrase salah?',

  // Push notifications
  'push.title': 'Notifikasi push',
  'push.description':
    'Pengingat otomatis di lock screen sebelum haid berikutnya. Akan dikirim ke perangkat ini setelah Kamu aktifkan.',
  'push.status.subscribed': 'Aktif',
  'push.status.not-subscribed': 'Belum aktif',
  'push.status.permission-denied': 'Izin diblokir',
  'push.status.unsupported': 'Tidak didukung browser ini',
  'push.status.no-key': 'Belum diset (admin config)',
  'push.button.enable': 'Aktifkan notifikasi',
  'push.button.enabling': 'Mengaktifkan...',
  'push.button.disable': 'Matikan notifikasi',
  'push.permission-denied.help':
    'Kamu pernah memblokir notifikasi. Buka pengaturan browser, Site permissions, arutala.pages.dev, lalu Allow notifications.',
  'push.no-key.help':
    'VAPID public key belum di-set di env. Lihat docs/push-setup.md.',
  'push.privacy-note':
    'Privasi: payload notifikasi tidak berisi data sensitif. Hanya "haid berikutnya N hari lagi".',

  // E2EE / passphrase flow
  'e2ee.title': 'Enkripsi end-to-end (E2EE)',
  'e2ee.description':
    'Lapisan keamanan tambahan. Data sensitif (aktivitas intim) dienkripsi di perangkat Kamu sebelum dikirim ke server. Developer pun tidak bisa membaca isinya.',
  'e2ee.status.not-setup': 'Belum diaktifkan',
  'e2ee.status.locked': 'Terkunci',
  'e2ee.status.unlocked': 'Aktif',
  'e2ee.button.setup': 'Aktifkan E2EE',
  'e2ee.button.unlock': 'Buka kunci',
  'e2ee.button.lock': 'Kunci sekarang',
  'e2ee.button.change-passphrase': 'Ganti passphrase',
  'e2ee.button.disable': 'Matikan E2EE (hapus data E2EE)',
  'e2ee.setup.title': 'Setup passphrase E2EE',
  'e2ee.setup.warning':
    'PENTING: Jika Kamu lupa passphrase, data E2EE tidak bisa dipulihkan (no backdoor). Pastikan passphrase Kamu kuat dan disimpan di password manager.',
  'e2ee.setup.passphrase-label': 'Passphrase (min 12 karakter)',
  'e2ee.setup.confirm-label': 'Konfirmasi passphrase',
  'e2ee.setup.acknowledge':
    'Saya paham: kalau lupa passphrase, data E2EE saya hilang permanent.',
  'e2ee.setup.submit': 'Setup E2EE',
  'e2ee.setup.processing': 'Setting up... (PBKDF2 600k iterations)',
  'e2ee.unlock.title': 'Buka kunci E2EE',
  'e2ee.unlock.passphrase-label': 'Passphrase E2EE',
  'e2ee.unlock.submit': 'Buka',
  'e2ee.unlock.processing': 'Membuka...',
  'e2ee.unlock.error': 'Passphrase salah. Coba lagi.',
  'e2ee.disable.confirm':
    'Yakin matikan E2EE? Semua data aktivitas intim yang terenkripsi akan dihapus permanen. Aksi ini tidak bisa dibatalkan.',

  // Delete account flow
  'delete-account.title': 'Hapus akun',
  'delete-account.description':
    'Hapus akun dan semua data Kamu (siklus, catatan harian, profil) dari Arutala. Soft delete 30 hari, lalu hard delete permanen. Hak hapus sesuai UU PDP Pasal 8.',
  'delete-account.button': 'Hapus akun saya',
  'delete-account.dialog.title': 'Yakin hapus akun?',
  'delete-account.dialog.body':
    'Aksi ini menghapus sementara semua data Kamu (haid, gejala, mood, catatan, link pasangan). Setelah 30 hari, data dihapus permanen dan tidak bisa dipulihkan. Pasangan Kamu (jika ada) akan kehilangan akses ke data couple kalian.',
  'delete-account.dialog.confirm-label':
    'Ketik "HAPUS" untuk konfirmasi:',
  'delete-account.dialog.confirm-keyword': 'HAPUS',
  'delete-account.dialog.confirm': 'Ya, hapus akun saya',
  'delete-account.dialog.cancel': 'Batal',
  'delete-account.deleting': 'Menghapus...',

  // MFA / 2FA
  'mfa.title': 'Verifikasi 2 langkah (2FA)',
  'mfa.description':
    'Tambah lapisan keamanan dengan TOTP authenticator app (Google Authenticator, Authy, 1Password).',
  'mfa.status.enrolled': 'Aktif',
  'mfa.status.not-enrolled': 'Belum aktif',
  'mfa.button.enroll': 'Aktifkan 2FA',
  'mfa.button.unenroll': 'Nonaktifkan 2FA',
  'mfa.enroll.scan-instruction':
    'Scan QR di bawah pakai authenticator app, lalu masukin 6-digit kode untuk verify.',
  'mfa.enroll.secret-fallback': 'Atau masukin secret manual:',
  'mfa.enroll.code-label': 'Kode 6-digit dari app',
  'mfa.enroll.verify': 'Verify & Aktifkan',
  'mfa.enroll.verifying': 'Verify...',
  'mfa.enroll.cancel': 'Batal',
  'mfa.enroll.success': '2FA aktif ✓',
  'mfa.error.invalid-code': 'Kode salah. Coba lagi.',
  'mfa.unenroll.confirm': 'Yakin nonaktifkan 2FA?',

  // Privacy notice page
  'privacy.title': 'Privasi & Data',
  'privacy.subtitle': 'Pemberitahuan privasi sesuai UU PDP Indonesia',
  'privacy.intro':
    'Arutala mengolah data kesehatan reproduksi yang termasuk data spesifik menurut UU PDP. Privacy notice ini mengatur bagaimana data Kamu diproses, disimpan, dan hak-hak Kamu sebagai subjek data.',
  'privacy.contact': 'Kontak pengendali data',
  'privacy.section.controller': 'Pengendali Data',
  'privacy.section.data-types': 'Jenis Data yang Diproses',
  'privacy.section.purposes': 'Tujuan Pemrosesan',
  'privacy.section.legal-basis': 'Dasar Hukum',
  'privacy.section.retention': 'Periode Retensi',
  'privacy.section.transfer': 'Transfer Luar Negeri',
  'privacy.section.rights': 'Hak Subjek Data',
  'privacy.section.contact': 'Kontak & Pertanyaan',
  'privacy.full-text-link': 'Baca privacy notice lengkap di GitHub repo',
  'privacy.consent-history': 'Riwayat persetujuan saya',
  'privacy.consent-purpose.core_processing': 'Pemrosesan inti (data kesehatan)',
  'privacy.consent-purpose.cross_border_transfer': 'Transfer ke luar negeri (Tokyo + global)',
  'privacy.consent-purpose.partner_sharing': 'Sharing data ke pasangan',
  'privacy.consent-purpose.sensitive_data_e2ee': 'Data sensitif dengan E2EE (Phase 4)',
  'privacy.consent.granted': 'Disetujui',
  'privacy.consent.withdrawn': 'Dicabut',
  'privacy.consent.never-set': 'Belum diatur',
  'privacy.consent.last-event': 'event terakhir',

  // Settings page
  'settings.title': 'Pengaturan',
  'settings.back': 'Kembali',
  'settings.theme.label': 'Tampilan',
  'settings.theme.dark': 'Mode gelap',
  'settings.theme.light': 'Mode terang',
  'settings.language.label': 'Bahasa',
  'settings.account.title': 'Akun',
  'settings.account.email': 'Email',
  'settings.couple.title': 'Pasangan',
  'settings.profile.title': 'Profil',

  // Profile form
  'profile.field.display-name': 'Nama panggilan',
  'profile.field.avatar-emoji': 'Avatar emoji',
  'profile.save': 'Simpan',
  'profile.saving': 'Menyimpan…',
  'profile.saved': 'Tersimpan ✓',

  // Couple unlink
  'couple.unlink.button': 'Lepas pasangan',
  'couple.unlink.unlinking': 'Melepas…',
  'couple.unlink.confirm-title': 'Yakin lepas pasangan?',
  'couple.unlink.confirm-body':
    'Setelah lepas, kalian tidak bisa lihat data masing-masing. Riwayat tetap tersimpan di database tetapi tidak bisa diakses dari app. Untuk terhubung lagi, salah satu perlu membuat kode undangan baru.',
  'couple.unlink.confirm': 'Ya, lepas',
  'couple.unlink.cancel': 'Batal',

  // Cycles — backdate link + dialog
  'cycles.action.backdate': 'atau backdate (tanggal lain)',
  'cycles.dialog.add-title': 'Catat periode',
  'cycles.dialog.add-description': 'Masukkan tanggal mulai dan tanggal selesai (opsional). Berguna jika lupa mencatat saat itu juga.',
  'cycles.dialog.edit-title': 'Edit periode',
  'cycles.dialog.edit-description': 'Update tanggal atau hapus entry.',
  'cycles.dialog.field.start-date': 'Tanggal mulai',
  'cycles.dialog.field.end-date': 'Tanggal selesai (opsional)',
  'cycles.dialog.field.notes': 'Catatan (opsional)',
  'cycles.dialog.save': 'Simpan',
  'cycles.dialog.saving': 'Menyimpan…',
  'cycles.dialog.delete': 'Hapus',
  'cycles.dialog.delete-confirm': 'Yakin hapus haid ini? Bisa dipulihkan dari history database, tetapi tidak melalui UI.',
} as const;

export type MessageKey = keyof typeof id;
export type Locale = 'id' | 'en';

// English mirror — `Record<MessageKey, string>` enforce semua key di-translate.
const en: Record<MessageKey, string> = {
  'app.name': 'Arutala',
  'app.tagline':
    'Period & cycle tracker for couples. Privacy-first, partner mode by default.',
  'app.smoke-test': 'Smoke test, design tokens loaded.',

  // Auth — fields
  'auth.field.email': 'Email',
  'auth.field.password': 'Password',
  'auth.field.password-confirm': 'Confirm password',
  'auth.field.display-name': 'Display name',
  'auth.field.date-of-birth': 'Date of birth',
  'auth.field.date-of-birth.hint': 'Age verification ≥18 (UU PDP Article 25)',
  'auth.password.help':
    'Min 12 chars; mix of uppercase, lowercase, digit, and symbol required.',
  'auth.password.pwned':
    'This password appears in {count} public data breaches. Pick a more unique one.',
  'auth.password.checking': 'Checking password security...',
  'auth.consent.heading': 'Data processing consent',
  'auth.consent.intro':
    'Before signup, give explicit consent per UU PDP Article 22. Without the REQUIRED checkboxes, signup is blocked.',
  'auth.consent.privacy-link': 'Read Privacy Notice',
  'auth.consent.core-processing.title':
    '✋ REQUIRED — Health data processing',
  'auth.consent.core-processing.body':
    'I give explicit consent for Arutala to process my health data (cycle, symptoms, mood, notes) for core cycle-tracking functionality. The data controller identity is shown on the Privacy page.',
  'auth.consent.cross-border.title':
    '✋ REQUIRED — Cross-border transfer',
  'auth.consent.cross-border.body':
    'I give consent to transfer my data to servers outside Indonesia (Supabase Tokyo + Cloudflare global).',
  'auth.consent.partner-sharing.title':
    '💚 OPTIONAL — Partner sharing',
  'auth.consent.partner-sharing.body':
    'I give consent to share my health data with the partner account I link (couple mode). Toggleable from Settings.',

  // Auth — login
  'auth.login.title': 'Login',
  'auth.login.description': 'Sign in with email + password.',
  'auth.login.submit': 'Sign in',
  'auth.login.submitting': 'Signing in…',
  'auth.login.no-account': "Don't have an account?",

  // Auth — signup
  'auth.signup.title': 'Sign up',
  'auth.signup.description': 'Create a new Arutala account.',
  'auth.signup.submit': 'Sign up',
  'auth.signup.submitting': 'Signing up…',
  'auth.signup.has-account': 'Already have an account?',
  'auth.signup.success-title': 'Account created!',
  'auth.signup.success-body':
    'Check your inbox for a verification link. Click it, then sign in.',
  'auth.signup.success-back-login': 'Back to login',

  'not-found.title': '404',
  'not-found.message': 'Page not found. Wrong link?',
  'not-found.back-home': 'Back to home',

  // Common
  'common.loading': 'Loading…',

  // Home (protected)
  'home.signed-in-as': 'Signed in as',
  'home.sign-out': 'Sign out',
  'home.signing-out': 'Signing out…',

  // Couple — setup page
  'couple.setup.title': 'Link your partner account',
  'couple.setup.description':
    'Before tracking, link your account to your partner via a 6-char code.',

  // Couple — invitation create
  'couple.invite.title': 'Create invitation',
  'couple.invite.description':
    'Generate a 6-char code, share it with your partner (WhatsApp, etc.).',
  'couple.invite.create-button': 'Generate new code',
  'couple.invite.creating': 'Generating…',
  'couple.invite.your-code': 'Your code:',
  'couple.invite.copy': 'Copy',
  'couple.invite.copied': 'Copied!',
  'couple.invite.expires': 'Code valid for 7 days.',
  'couple.invite.cancel': 'Cancel',
  'couple.invite.cancelling': 'Cancelling…',
  'couple.invite.cancel-confirm':
    'Cancel this code? Your partner can’t use the old code anymore.',

  // Couple — accept invitation
  'couple.accept.title': 'Got a code?',
  'couple.accept.description':
    'Enter the code from your partner here to link accounts.',
  'couple.accept.code-label': '6-char code',
  'couple.accept.submit': 'Link',
  'couple.accept.submitting': 'Linking…',

  // Couple — status (home display)
  'couple.partner-prefix': 'With',
  'couple.unlink': 'Unlink',

  // Cycles — idle state
  'cycles.idle.title': 'Not on period',
  'cycles.idle.description': 'Tap the button below when your period starts.',

  // Cycles — active state
  'cycles.active.title': 'On period',
  'cycles.active.since': 'Since',
  'cycles.active.day-prefix': 'Day ',

  // Cycles — actions
  'cycles.action.start-today': 'Period started today',
  'cycles.action.starting': 'Starting…',
  'cycles.action.end-today': 'Period ended',
  'cycles.action.ending': 'Ending…',

  // Cycles — history list
  'cycles.history.title': 'History',
  'cycles.history.empty': "No period history yet. Once you log your first one, it'll show up here.",
  'cycles.history.ongoing': '(ongoing)',
  'cycles.history.days-suffix': 'days',
  'cycles.history.arrow': '→',

  // Prediction
  'prediction.title': 'Prediction',
  'prediction.insufficient-data':
    'Need ≥2 logged periods for prediction. Log a period first.',
  'prediction.next-start': 'Next period',
  'prediction.ovulation': 'Ovulation',
  'prediction.fertile': 'Fertile window',
  'prediction.avg-cycle': 'Avg cycle',
  'prediction.days-suffix': 'days',
  'prediction.based-on': 'Based on',
  'prediction.cycles-suffix': 'recent cycles',
  'prediction.confidence-prefix': '±',

  // Calendar
  'calendar.title': 'Calendar',
  'calendar.day.full-format': 'EEEE, MMM d, yyyy',
  'calendar.day.period': 'Period day',
  'calendar.day.no-period': 'Not a period day',
  'calendar.day.today-suffix': '(today)',
  'calendar.day.edit-cycle': 'Edit this cycle',
  'calendar.day.start-here': 'Log period starting on this date',
  'calendar.day.close': 'Close',

  // Charts
  'chart.cycle-trend.title': 'Cycle length trend',
  'chart.cycle-trend.empty': 'Need ≥2 cycles to see the trend.',
  'chart.cycle-trend.tooltip-length': 'Cycle length',
  'chart.cycle-trend.avg-line': 'Average',
  'chart.symptom-freq.title': 'Most frequent symptoms',
  'chart.symptom-freq.empty': 'No symptoms logged yet. Log them in daily entry to see trends.',
  'chart.symptom-freq.count-suffix': '×',

  // Insights
  'insights.title': 'Insights',
  'insights.avg-cycle': 'Avg cycle',
  'insights.variability': 'Variability',
  'insights.regularity': 'Regularity',
  'insights.regular': 'Regular',
  'insights.irregular': 'Irregular',
  'insights.regular-hint': 'Variability <7 days = regular per medical definition.',
  'insights.irregular-hint': "Variability >7 days—consult a doctor if you're concerned.",
  'insights.days-suffix': 'days',

  // Cycle wheel
  'wheel.day-prefix': 'Day ',
  'wheel.of': 'of',
  'wheel.phase.period': 'Period',
  'wheel.phase.follicular': 'Follicular',
  'wheel.phase.fertile': 'Fertile',
  'wheel.phase.ovulation': 'Ovulation',
  'wheel.phase.luteal': 'Luteal',
  'wheel.empty': 'No cycle data yet. Log your first period to start.',

  // Daily log form
  'daily-log.section.cycle': 'Cycle',
  'daily-log.section.flow': 'Flow intensity',
  'daily-log.section.symptoms': 'Symptoms',
  'daily-log.section.moods': 'Mood',
  'daily-log.section.notes': 'Notes',
  'daily-log.notes.placeholder': "What are you feeling today? (optional)",
  'daily-log.flow.0': 'None',
  'daily-log.flow.1': 'Spotting',
  'daily-log.flow.2': 'Light',
  'daily-log.flow.3': 'Medium',
  'daily-log.flow.4': 'Heavy',
  'daily-log.save': 'Save log',
  'daily-log.saving': 'Saving…',
  'daily-log.delete': 'Delete log',
  'daily-log.delete-confirm': 'Delete this day’s log?',
  'daily-log.empty-state': 'No log for this day yet.',

  // Logs page (search + filter)
  'logs.title': 'All logs',
  'logs.search.placeholder': 'Search in notes…',
  'logs.filter.symptoms': 'Filter symptoms',
  'logs.filter.clear': 'Clear filters',
  'logs.results-count': 'logs found',
  'logs.empty': 'No matching logs.',
  'logs.view-all': 'View all logs',

  // Data export
  'export.title': 'Export data',
  'export.description': 'Download all logs + cycles as CSV (drip-compatible).',
  'export.button': 'Download CSV',
  'export.exporting': 'Exporting…',

  // PWA install
  'install.title': 'Install Arutala',
  'install.description':
    'Install to your home screen for a native-app feel—offline-ready & full-screen.',
  'install.button': 'Install app',
  'install.installed': 'Already installed ✓',
  'install.ios.title': 'Install on iOS',
  'install.ios.body':
    'Open in Safari, tap the Share button, then choose "Add to Home Screen".',

  // Bottom tab navigation
  'nav.home': 'Today',
  'nav.calendar': 'Calendar',
  'nav.insights': 'Insights',
  'nav.settings': 'Me',

  // Page-level titles for new tab pages
  'page.calendar.title': 'Calendar',
  'page.insights.title': 'Insights',

  // Home — slim prediction snapshot
  'home.snapshot.next-period-in': 'Next period in',
  'home.snapshot.days-suffix': 'days',
  'home.snapshot.starts-on': 'starts',
  'home.snapshot.see-insights': 'See all insights',
  'home.snapshot.no-data': 'Not enough data for prediction yet',

  // Home — quick log card (today)
  'home.today-log.title': "Today's log",
  'home.today-log.empty': 'No entry yet for today.',
  'home.today-log.has-flow': 'Flow logged',
  'home.today-log.symptoms-count': 'symptoms',
  'home.today-log.moods-count': 'moods',
  'home.today-log.has-notes': '+ notes',
  'home.today-log.button.add': 'Log now',
  'home.today-log.button.edit': 'Edit log',

  // Onboarding role selection (Phase 5 J2)
  'onboarding.role.title': 'Pick your role in Arutala',
  'onboarding.role.subtitle':
    'You can change this in Settings anytime.',
  'onboarding.role.tracker.title': 'Tracker',
  'onboarding.role.tracker.body':
    "I'm the one who has periods + logs cycle, symptoms, mood. Can go solo or with a partner.",
  'onboarding.role.supporter.title': 'Supporter',
  'onboarding.role.supporter.body':
    "I'm a partner helping with tracking. Read-mostly, give support when needed.",
  'onboarding.role.next': 'Continue',
  'onboarding.solo.title': 'How do you want to use Arutala?',
  'onboarding.solo.subtitle':
    'Solo = your own private tracking. Partnered = link a partner account to share data.',
  'onboarding.solo.solo.title': 'Solo for now',
  'onboarding.solo.solo.body':
    'Personal tracking without a partner. You can link one anytime later.',
  'onboarding.solo.couple.title': 'With a partner',
  'onboarding.solo.couple.body':
    "Next: set up an invitation code so your partner can link.",
  'onboarding.error': 'Something went wrong, try again',
  'onboarding.saving': 'Saving...',

  // Home greeting (Phase 5)
  'home.greeting.morning': 'Good morning',
  'home.greeting.afternoon': 'Good afternoon',
  'home.greeting.evening': 'Good evening',
  'home.greeting.night': 'Good night',
  'home.role.tracker': 'cycle tracker',
  'home.role.supporter': 'partner supporter',
  'home.role.solo': 'solo mode',
  'home.partner-pill.linked': 'Linked with',
  'home.partner-pill.solo': 'Tracking solo',

  // Toast notifications (Phase 4 Track D)
  'toast.period.started': 'Period logged',
  'toast.period.ended': 'Period ended',
  'toast.daily-log.saved': 'Log saved',
  'toast.daily-log.deleted': 'Log deleted',
  'toast.cycle.saved': 'Cycle saved',
  'toast.cycle.deleted': 'Cycle deleted',
  'toast.profile.saved': 'Profile saved',
  'toast.couple.unlinked': 'Partner unlinked',
  'toast.error.generic': 'Something went wrong, please try again.',

  // Sexual activity (E2EE-gated)
  'sexual-activity.section.title': 'Intimate activity (E2EE)',
  'sexual-activity.gate.not-setup':
    'This field is end-to-end encrypted. Enable E2EE in Settings before tracking.',
  'sexual-activity.gate.locked':
    'E2EE is locked. Unlock in Settings to access this field.',
  'sexual-activity.gate.go-to-settings': 'Go to Settings',
  'sexual-activity.field.active': 'Activity today?',
  'sexual-activity.field.type': 'Used contraception?',
  'sexual-activity.type.protected': 'Yes (protected)',
  'sexual-activity.type.unprotected': 'No (unprotected)',
  'sexual-activity.field.intensity': 'Intensity',
  'sexual-activity.intensity.1': 'Light',
  'sexual-activity.intensity.2': 'Medium',
  'sexual-activity.intensity.3': 'High',
  'sexual-activity.field.notes': 'Additional notes (optional)',
  'sexual-activity.error.decrypt': 'Decryption failed — wrong passphrase?',

  // Push notifications
  'push.title': 'Push notifications',
  'push.description':
    'Auto reminders on lock screen before next period. Sent to this device after you enable.',
  'push.status.subscribed': 'Active',
  'push.status.not-subscribed': 'Not enabled',
  'push.status.permission-denied': 'Permission blocked',
  'push.status.unsupported': 'Not supported by this browser',
  'push.status.no-key': 'Not set (admin config)',
  'push.button.enable': 'Enable notifications',
  'push.button.enabling': 'Enabling...',
  'push.button.disable': 'Disable notifications',
  'push.permission-denied.help':
    "You blocked notifications earlier. Open browser settings → Site permissions → arutala.pages.dev → Allow notifications.",
  'push.no-key.help':
    'VAPID public key not set in env. See docs/push-setup.md.',
  'push.privacy-note':
    'Privacy: notification payload contains no sensitive data (just "Period in N days").',

  // E2EE / passphrase flow
  'e2ee.title': 'End-to-end encryption (E2EE)',
  'e2ee.description':
    'Extra layer: sensitive data (intimate activity) is encrypted on your device before sending to server. Even the developer can\'t read it.',
  'e2ee.status.not-setup': 'Not enabled',
  'e2ee.status.locked': 'Locked',
  'e2ee.status.unlocked': 'Active',
  'e2ee.button.setup': 'Enable E2EE',
  'e2ee.button.unlock': 'Unlock',
  'e2ee.button.lock': 'Lock now',
  'e2ee.button.change-passphrase': 'Change passphrase',
  'e2ee.button.disable': 'Disable E2EE (clear E2EE data)',
  'e2ee.setup.title': 'Setup E2EE passphrase',
  'e2ee.setup.warning':
    '⚠️ IMPORTANT: If you forget your passphrase, E2EE data CANNOT be recovered (no backdoor). Use a strong passphrase you can remember or save in a password manager.',
  'e2ee.setup.passphrase-label': 'Passphrase (min 12 chars)',
  'e2ee.setup.confirm-label': 'Confirm passphrase',
  'e2ee.setup.acknowledge':
    'I understand: if I forget the passphrase, my E2EE data is permanently lost.',
  'e2ee.setup.submit': 'Setup E2EE',
  'e2ee.setup.processing': 'Setting up... (PBKDF2 600k iterations)',
  'e2ee.unlock.title': 'Unlock E2EE',
  'e2ee.unlock.passphrase-label': 'E2EE passphrase',
  'e2ee.unlock.submit': 'Unlock',
  'e2ee.unlock.processing': 'Unlocking...',
  'e2ee.unlock.error': 'Wrong passphrase. Try again.',
  'e2ee.disable.confirm':
    'Disable E2EE? All encrypted intimate activity data will be permanently cleared. Cannot be undone.',

  // Delete account flow
  'delete-account.title': 'Delete account',
  'delete-account.description':
    'Delete your account + all data (cycles, daily logs, profile) from Arutala. Soft delete for 30 days → then permanent. Right to erasure per UU PDP Article 8.',
  'delete-account.button': 'Delete my account',
  'delete-account.dialog.title': 'Delete account?',
  'delete-account.dialog.body':
    'This action soft-deletes all your data (period, symptoms, mood, notes, partner link). After 30 days, data is permanently erased and unrecoverable. Your partner (if any) will lose access to your shared couple data.',
  'delete-account.dialog.confirm-label':
    'Type "DELETE" to confirm:',
  'delete-account.dialog.confirm-keyword': 'DELETE',
  'delete-account.dialog.confirm': 'Yes, delete my account',
  'delete-account.dialog.cancel': 'Cancel',
  'delete-account.deleting': 'Deleting...',

  // MFA / 2FA
  'mfa.title': '2-step verification (2FA)',
  'mfa.description':
    'Add an extra security layer with a TOTP authenticator app (Google Authenticator, Authy, 1Password).',
  'mfa.status.enrolled': 'Enabled',
  'mfa.status.not-enrolled': 'Not enabled',
  'mfa.button.enroll': 'Enable 2FA',
  'mfa.button.unenroll': 'Disable 2FA',
  'mfa.enroll.scan-instruction':
    'Scan the QR below with your authenticator app, then enter the 6-digit code to verify.',
  'mfa.enroll.secret-fallback': 'Or enter the secret manually:',
  'mfa.enroll.code-label': '6-digit code from app',
  'mfa.enroll.verify': 'Verify & Enable',
  'mfa.enroll.verifying': 'Verifying...',
  'mfa.enroll.cancel': 'Cancel',
  'mfa.enroll.success': '2FA enabled ✓',
  'mfa.error.invalid-code': 'Wrong code. Try again.',
  'mfa.unenroll.confirm': 'Disable 2FA?',

  // Privacy notice page
  'privacy.title': 'Privacy & Data',
  'privacy.subtitle': 'Privacy notice per Indonesia Personal Data Protection Law',
  'privacy.intro':
    'Arutala processes reproductive health data, classified as specific data under UU PDP. This privacy notice covers how your data is processed, stored, and your rights as a data subject.',
  'privacy.contact': 'Data controller contact',
  'privacy.section.controller': 'Data Controller',
  'privacy.section.data-types': 'Data Processed',
  'privacy.section.purposes': 'Processing Purposes',
  'privacy.section.legal-basis': 'Legal Basis',
  'privacy.section.retention': 'Retention Period',
  'privacy.section.transfer': 'Cross-Border Transfer',
  'privacy.section.rights': 'Data Subject Rights',
  'privacy.section.contact': 'Contact & Questions',
  'privacy.full-text-link': 'Read full privacy notice on GitHub repo',
  'privacy.consent-history': 'My consent history',
  'privacy.consent-purpose.core_processing': 'Core processing (health data)',
  'privacy.consent-purpose.cross_border_transfer': 'Cross-border transfer (Tokyo + global)',
  'privacy.consent-purpose.partner_sharing': 'Share data with partner',
  'privacy.consent-purpose.sensitive_data_e2ee': 'Sensitive data with E2EE (Phase 4)',
  'privacy.consent.granted': 'Granted',
  'privacy.consent.withdrawn': 'Withdrawn',
  'privacy.consent.never-set': 'Not set',
  'privacy.consent.last-event': 'last event',

  // Settings page
  'settings.title': 'Settings',
  'settings.back': 'Back',
  'settings.theme.label': 'Theme',
  'settings.theme.dark': 'Dark mode',
  'settings.theme.light': 'Light mode',
  'settings.language.label': 'Language',
  'settings.account.title': 'Account',
  'settings.account.email': 'Email',
  'settings.couple.title': 'Partner',
  'settings.profile.title': 'Profile',

  // Profile form
  'profile.field.display-name': 'Display name',
  'profile.field.avatar-emoji': 'Avatar emoji',
  'profile.save': 'Save',
  'profile.saving': 'Saving…',
  'profile.saved': 'Saved ✓',

  // Couple unlink
  'couple.unlink.button': 'Unlink partner',
  'couple.unlink.unlinking': 'Unlinking…',
  'couple.unlink.confirm-title': 'Unlink partner?',
  'couple.unlink.confirm-body':
    "Once unlinked, neither of you can see each other's data. History stays in the database but won't be accessible from the app. If you want to link again, one of you must create a new invitation code.",
  'couple.unlink.confirm': 'Yes, unlink',
  'couple.unlink.cancel': 'Cancel',

  // Cycles — backdate link + dialog
  'cycles.action.backdate': 'or backdate (custom date)',
  'cycles.dialog.add-title': 'Log a period',
  'cycles.dialog.add-description': 'Enter the start date (and optional end date). Useful when you forget to log in realtime.',
  'cycles.dialog.edit-title': 'Edit period',
  'cycles.dialog.edit-description': 'Update dates or delete this entry.',
  'cycles.dialog.field.start-date': 'Start date',
  'cycles.dialog.field.end-date': 'End date (optional)',
  'cycles.dialog.field.notes': 'Notes (optional)',
  'cycles.dialog.save': 'Save',
  'cycles.dialog.saving': 'Saving…',
  'cycles.dialog.delete': 'Delete',
  'cycles.dialog.delete-confirm': 'Delete this period? Restorable from DB history but not via UI.',
};

const catalog: Record<Locale, Record<MessageKey, string>> = { id, en };

export const supportedLocales: readonly Locale[] = ['id', 'en'];
export const defaultLocale: Locale = 'id';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Persisted ke localStorage (key: `arutala-locale`) supaya pilihan user persist
// across reload. Default `id` kalau belum ada entry.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: defaultLocale,
      setLocale: (locale: Locale) => set({ locale }),
    }),
    {
      name: 'arutala-locale',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Component-friendly hook. Returns `t` (lookup), `locale` (current), `setLocale` (switch).
export const useTranslation = () => {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const t = (key: MessageKey): string => catalog[locale][key];

  return { t, locale, setLocale };
};
