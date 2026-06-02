# 🏍️ MotoBlitz GP — Racing Legends

> **Game balap motor 3D premium yang bisa dimainkan langsung di browser — tanpa instal apapun!**

[![Play Now](https://img.shields.io/badge/PLAY%20NOW-Live%20Demo-ff3300?style=for-the-badge)](https://your-username.github.io/motoblitz-gp)
[![Three.js](https://img.shields.io/badge/Three.js-r128-00d4ff?style=for-the-badge)](https://threejs.org)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20%7C%20PC-success?style=for-the-badge)]()

---

## 📂 Struktur Folder

```
motoblitz-gp/
├── index.html              ← Entry point utama
├── README.md
├── css/
│   ├── style.css           ← Base styles & loading screen
│   ├── menu.css            ← Semua layar menu
│   └── hud.css             ← Heads-Up Display dalam game
└── js/
    ├── config.js           ← Konstanta & konfigurasi game
    ├── data.js             ← Data pembalap, motor, sirkuit
    ├── storage.js          ← LocalStorage save/load system
    ├── audio.js            ← Web Audio API engine
    ├── track.js            ← Three.js track builder
    ├── bike.js             ← Player bike physics & 3D model
    ├── ai.js               ← AI opponent system
    ├── weather.js          ← Sistem cuaca (hujan, malam, dll)
    ├── hud.js              ← HUD Manager
    ├── menu.js             ← Menu screens & UI logic
    └── game.js             ← Main game engine & render loop
```

---

## 🎮 Cara Bermain

### Kontrol Keyboard (PC)
| Tombol | Fungsi |
|--------|--------|
| `W` / `↑` / `Space` | Gas |
| `S` / `↓` | Rem |
| `A` / `←` | Belok Kiri |
| `D` / `→` | Belok Kanan |
| `P` / `Escape` | Pause |

### Kontrol Sentuh (HP / Tablet)
- **Kiri bawah:** Tombol Belok Kiri & Kanan
- **Kanan bawah:** Tombol GAS & BRAKE
- **Kanan atas:** Pause

### Gamepad (PS4/Xbox)
- **R2:** Gas
- **L2:** Rem
- **Stick Kiri:** Kemudi

---

## 🌟 Fitur

| Fitur | Detail |
|-------|--------|
| 🏍️ Pembalap | 12 pembalap dengan statistik unik |
| 🏎️ Motor | 8 motor berbeda (Ducati, Honda, Yamaha, dll) |
| 🏁 Sirkuit | 8 sirkuit ala MotoGP dunia |
| 🌦️ Cuaca | Cerah, Mendung, Hujan, Senja, Malam |
| 🤖 AI | 11 lawan AI dengan 4 tingkat kesulitan |
| 🏆 Mode | Quick Race, Championship, Time Trial, Career |
| 🪙 Koin | Sistem hadiah & beli/upgrade motor |
| 💾 Save | Auto-save dengan LocalStorage |

---

## 🚀 Hosting Gratis — Step by Step

### ✅ CARA 1: GitHub Pages (Recommended — GRATIS & Cepat)

#### Langkah 1: Buat Akun GitHub
1. Buka [github.com](https://github.com) → klik **Sign up**
2. Isi username, email, password → verifikasi email

#### Langkah 2: Buat Repository Baru
1. Klik tombol **"+"** (pojok kanan atas) → **New repository**
2. Isi **Repository name**: `motoblitz-gp`
3. Pilih **Public**
4. Klik **Create repository**

#### Langkah 3: Upload Files

**Cara A — Via Browser (Mudah):**
1. Di halaman repository, klik **"uploading an existing file"**
2. Drag & drop folder `motoblitz-gp` atau upload satu per satu:
   - `index.html`
   - Folder `css/` → upload ketiga file CSS
   - Folder `js/` → upload semua file JS
3. Scroll ke bawah → klik **Commit changes**

**Cara B — Via Git (Cepat):**
```bash
# Di terminal / command prompt
git clone https://github.com/username/motoblitz-gp.git
cd motoblitz-gp

# Copy semua file game ke folder ini, lalu:
git add .
git commit -m "🏍️ MotoBlitz GP - Initial Release"
git push origin main
```

#### Langkah 4: Aktifkan GitHub Pages
1. Di repository → klik tab **Settings**
2. Scroll ke bagian **Pages** (sidebar kiri)
3. Di **Source** → pilih **Deploy from a branch**
4. Branch: pilih **main** → folder: **/ (root)**
5. Klik **Save**
6. Tunggu 1-2 menit → muncul link:

```
https://username.github.io/motoblitz-gp
```

**🎉 Link ini bisa dibuka siapa saja di seluruh dunia!**

---

### ✅ CARA 2: Netlify (Drag & Drop — Paling Mudah!)

1. Buka [netlify.com](https://netlify.com) → **Sign up gratis**
2. Di dashboard → temukan kotak **"Drag & drop your site folder here"**
3. Drag folder `motoblitz-gp` ke sana
4. Langsung dapat link seperti:
   ```
   https://amazing-game-abc123.netlify.app
   ```
5. Bisa custom domain gratis seperti `motoblitzgp.netlify.app`

---

### ✅ CARA 3: Vercel

1. Buka [vercel.com](https://vercel.com) → **Sign up dengan GitHub**
2. Klik **"New Project"** → Import repository GitHub
3. Klik **Deploy**
4. Dapat link:
   ```
   https://motoblitz-gp.vercel.app
   ```

---

### ✅ CARA 4: Google Sites (Embed)

> ⚠️ Google Sites tidak support file JS langsung. Gunakan cara ini:

1. Deploy dulu ke GitHub Pages / Netlify
2. Buat halaman Google Sites
3. Insert → **Embed** → paste URL game Anda
4. Atur ukuran embed ke full width

---

### ✅ CARA 5: Itch.io (Gaming Platform)

1. Buka [itch.io](https://itch.io) → **Register**
2. Dashboard → **Upload new project**
3. Kind of project: **HTML**
4. Upload ZIP file berisi semua file game
5. Centang **This file will be played in the browser**
6. Atur **Viewport dimensions**: 1280 x 720
7. Publish → dapat link permanen!

---

## 📱 Optimasi Mobile

Game sudah dioptimasi untuk:
- ✅ Android Chrome / Samsung Browser
- ✅ iPhone Safari / iOS Chrome  
- ✅ Mode Landscape (disarankan)
- ✅ Tablet (iPad, Android tablet)
- ✅ Screen orientasi auto

**Tips performa HP:**
- Aktifkan mode hemat baterai OFF saat main
- Tutup aplikasi lain
- Di Settings game → pilih **Graphics: Low** untuk HP lama
- Game otomatis menyesuaikan resolusi

---

## ⚙️ Kustomisasi

### Menambah Pembalap Baru
Edit `js/data.js`, tambahkan entry di array `RIDERS_DATA`:
```javascript
{
  id: 13, name: "Nama Pembalap", short: "ABR", number: 99,
  country: "Indonesia", flag: "🇮🇩", team: "Tim Kamu",
  teamColor: "#ff0000", helmetColor: "#0000ff", bikeId: 1,
  emoji: "🏍️",
  stats: { speed: 85, acceleration: 88, handling: 90, braking: 87 },
  bio: "Deskripsi pembalap"
}
```

### Menambah Sirkuit Baru
Di `js/data.js`, tambahkan ke `CIRCUITS_DATA`:
```javascript
{
  id: 9, name: "Mandalika Circuit", country: "Indonesia", flag: "🇮🇩",
  length: "4.319 km", corners: 17,
  defaultWeather: "sunny", environment: "coastal",
  waypoints: [
    [0,0],[30,-2],[60,0],[80,10],[85,25],...
    // Tambahkan titik waypoint sesuai layout sirkuit
  ],
  startLine: [0, 0], startDirection: 1, laps: 5, bestLap: "1:31.414"
}
```

### Mengubah Statistik Motor
Di `js/data.js`, edit bagian `BIKES_DATA`:
```javascript
stats: { speed: 97, acceleration: 93, handling: 85, braking: 92 }
// Nilai 0-100 untuk setiap statistik
```

---

## 🔧 Troubleshooting

### Game tidak mau jalan di browser?
- Pastikan membuka via HTTP/HTTPS, bukan via `file://`
- Gunakan browser modern: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Aktifkan JavaScript di browser

### FPS rendah / lag?
1. Settings → Graphics Quality → Low
2. Tutup tab browser lain
3. Restart browser
4. HP lama: coba di PC/laptop

### Suara tidak keluar?
- Klik/sentuh layar dulu (browser butuh interaksi user)
- Cek volume di Settings
- Pastikan HP tidak mode senyap

### Kontrol sentuh tidak responsif?
- Pastikan mode landscape
- Coba zoom out browser (Ctrl/Cmd + -)
- Refresh halaman

### GitHub Pages tidak muncul linknya?
- Tunggu 2-5 menit setelah save settings
- Pastikan repository **Public** (bukan Private)
- Cek di Settings → Pages apakah sudah "Your site is live"

---

## 📊 Sistem Koin & Reward

| Posisi | Koin Didapat |
|--------|-------------|
| 🥇 1st | 500 🪙 |
| 🥈 2nd | 350 🪙 |
| 🥉 3rd | 250 🪙 |
| 4th | 180 🪙 |
| 5th | 140 🪙 |
| 6th-12th | 30-110 🪙 |
| Fastest Lap Bonus | +100 🪙 |

### Harga Motor
| Motor | Harga |
|-------|-------|
| Ducati Desmosedici | GRATIS |
| Honda RC213V | GRATIS |
| Yamaha YZR-M1 | GRATIS |
| Suzuki GSX-RR | 2.500 🪙 |
| Aprilia RS-GP24 | 3.500 🪙 |
| KTM RC16 | 4.000 🪙 |
| Kawasaki ZX-RR | 6.000 🪙 |
| BMW M1000RR | 9.000 🪙 |

---

## 🎨 Tech Stack

| Teknologi | Fungsi |
|-----------|--------|
| **Three.js r128** | Rendering 3D |
| **Web Audio API** | Suara engine & efek |
| **Vanilla JS ES6+** | Game logic |
| **CSS3 / Custom Properties** | UI/UX |
| **LocalStorage** | Save game |
| **Canvas API** | Minimap & preview |
| **Touch Events API** | Kontrol mobile |
| **Gamepad API** | Controller support |

---

## 📜 Lisensi

© 2025 MotoBlitz GP — Racing Legends  
Dibuat dengan ❤️ menggunakan teknologi web modern.

*Game ini dibuat untuk tujuan hiburan. Nama pembalap dan tim adalah fiktif.*

---

**🏍️ SELAMAT BALAPAN! 🏁**
