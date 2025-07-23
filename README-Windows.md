# NetMon Güç Sistemi İzleme - Windows Kurulum Rehberi

Bu rehber, NetMon güç sistemi izleme uygulamasını Windows'ta çalıştırmak için gerekli tüm adımları içerir.

## Gerekli Yazılımlar

### 1. Node.js (v18 veya üstü)
- **İndirme Linki:** https://nodejs.org/
- LTS (Long Term Support) sürümünü indirin
- Kurulum sırasında "Add to PATH" seçeneğini işaretlediğinizden emin olun
- Terminal/CMD'de `node --version` ile kontrol edin

### 2. Git
- **İndirme Linki:** https://git-scm.com/download/win
- Kurulum sırasında varsayılan ayarları kullanabilirsiniz
- Terminal/CMD'de `git --version` ile kontrol edin

### 3. Visual Studio Code
- **İndirme Linki:** https://code.visualstudio.com/
- Kurulum sırasında "Add to PATH" seçeneğini işaretleyin

## VSCode Eklentileri

VSCode'u açtıktan sonra Extensions (Ctrl+Shift+X) bölümünden şu eklentileri yükleyin:

### Zorunlu Eklentiler:
1. **TypeScript and JavaScript Language Features** (yerleşik gelir)
2. **ES7+ React/Redux/React-Native snippets** - dsznajder tarafından
3. **Tailwind CSS IntelliSense** - Tailwind Labs tarafından
4. **Auto Rename Tag** - Jun Han tarafından
5. **Bracket Pair Colorizer 2** - CoenraadS tarafından

### Önerilen Eklentiler:
6. **GitLens** - Eric Amodio tarafından
7. **Thunder Client** - RoachBait tarafından (API test için)
8. **Error Lens** - Alexander tarafından
9. **npm Intellisense** - Christian Kohler tarafından
10. **Path Intellisense** - Christian Kohler tarafından

## Proje Kurulumu

### Adım 1: Projeyi İndirin
1. Projenin zip dosyasını indirin
2. Bir klasöre çıkarın (örn: `C:\Projects\netmon-app`)

### Adım 2: VSCode'da Açın
1. VSCode'u açın
2. File → Open Folder
3. Proje klasörünü seçin

### Adım 3: Terminal Açın
- VSCode'da Terminal → New Terminal (Ctrl+`)
- Veya Windows PowerShell/Command Prompt kullanabilirsiniz

### Adım 4: Bağımlılıkları Yükleyin
```bash
npm install
```

Bu komut tüm gerekli paketleri yükleyecek (yaklaşık 2-3 dakika sürebilir).

### Adım 5: Uygulamayı Başlatın

**Windows PowerShell için:**
```bash
npm run dev
```

**Command Prompt (CMD) için:**
```bash
set NODE_ENV=development
npx tsx server/index.ts
```

**Windows'ta NODE_ENV hatası alırsanız:**
```bash
npm install -g cross-env
cross-env NODE_ENV=development npx tsx server/index.ts
```

## Tarayıcıda Açın
1. Uygulama başladıktan sonra tarayıcınızda şu adresi açın:
   ```
   http://localhost:5000
   ```

2. Giriş bilgileri:
   - **Kullanıcı Adı:** netmon
   - **Şifre:** netmon

## Geliştirme Komutları

### Temel Komutlar:
```bash
npm run dev          # Geliştirme modunda başlat
npm run build        # Üretim için derle
npm run start        # Üretim modunda başlat
npm run check        # TypeScript kontrolü
```

### Windows Özel Komutları:
```bash
# NODE_ENV sorunları için
set NODE_ENV=development && npx tsx server/index.ts

# Cross-env ile (önerilen)
npx cross-env NODE_ENV=development tsx server/index.ts
```

## Olası Sorunlar ve Çözümleri

### 1. NODE_ENV Hatası
**Hata:** `NODE_ENV is not recognized as an internal or external command`

**Çözüm:**
```bash
npm install -g cross-env
npm install cross-env --save-dev
```

### 2. Port Kullanımda Hatası
**Hata:** `Port 5000 is already in use`

**Çözüm:**
```bash
# Çalışan processı bul
netstat -ano | findstr :5000

# Process ID'yi öğrenip kapat
taskkill /PID <process_id> /F
```

### 3. npm install Hatası
**Hata:** Permission veya network hataları

**Çözüm:**
```bash
# NPM cache temizle
npm cache clean --force

# Yeniden dene
npm install
```

### 4. VSCode Terminal Hatası
**Hata:** Execution policy hatası

**Çözüm:**
PowerShell'i Administrator olarak açın:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Proje Yapısı

```
netmon-app/
├── client/          # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/  # UI bileşenleri
│   │   ├── pages/       # Sayfa bileşenleri
│   │   ├── hooks/       # React hooks
│   │   └── lib/         # Yardımcı fonksiyonlar
├── server/          # Backend (Express + TypeScript)
│   ├── index.ts     # Ana sunucu dosyası
│   ├── routes.ts    # API rotaları
│   └── storage.ts   # Veri depolama
├── shared/          # Ortak tip tanımları
└── package.json     # Bağımlılıklar
```

## Geliştirme İpuçları

### 1. Hot Reload
- Dosyaları kaydettiğinizde otomatik olarak yeniden yüklenir
- Frontend değişiklikleri anında görünür
- Backend değişiklikleri için sunucu yeniden başlar

### 2. Debugging
- Chrome DevTools kullanın (F12)
- VSCode'da breakpoint koyabilirsiniz
- Console.log kullanarak debug yapın

### 3. Git Kullanımı
```bash
# Değişiklikleri kaydet
git add .
git commit -m "Açıklama"

# Yedek branch oluştur
git branch feature/yeni-ozellik
git checkout feature/yeni-ozellik
```

## Performans Optimizasyonu

### 1. VSCode Ayarları
`File → Preferences → Settings` içinde:
- `typescript.preferences.includePackageJsonAutoImports`: `off`
- `typescript.suggest.autoImports`: `false`

### 2. Windows Defender
- Proje klasörünü Windows Defender'dan hariç tutun
- Bu build süresini hızlandırır

## Teknik Destek

### Sistem Gereksinimleri:
- **İşletim Sistemi:** Windows 10/11
- **RAM:** Minimum 4GB (8GB önerilen)
- **Disk:** 2GB boş alan
- **Node.js:** v18 veya üstü

### Log Dosyaları:
- VSCode terminal'inde hata mesajlarını kontrol edin
- Tarayıcı console'unda (F12) hataları görün
- Network tab'da API isteklerini izleyin

### Yararlı Komutlar:
```bash
# Sistem bilgisi
node --version
npm --version
git --version

# Port kontrol
netstat -ano | findstr :5000

# Process listesi
tasklist

# NPM global paketler
npm list -g --depth=0
```

Bu rehberi takip ederek NetMon güç sistemi izleme uygulamasını Windows'ta başarıyla çalıştırabilirsiniz.