# NetMon Güç Sistemi İzleme Uygulaması

Türkçe ve İngilizce dil desteği ile donanım entegrasyonlu güç sistemi izleme uygulaması.

## Özellikler

### Web Arayüzü
- **Çok Dilli Destek**: Türkçe ve İngilizce dil seçenekleri
- **Modern UI**: Responsive tasarım, gerçek zamanlı veriler
- **Hierarchical Navigation**: Ana tab'lar ve detaylı alt menüler
- **Güvenli Giriş**: Kullanıcı kimlik doğrulama sistemi

### Donanım Entegrasyonu
- **C/C++ Backend**: Donanım ile direkt iletişim
- **Real-time Data**: Canlı güç modülü, pil ve sistem verileri
- **Hardware Control**: Uzaktan kontrol ve yapılandırma
- **Alarm Management**: Gerçek zamanlı alarm sistemi

### Sistem Modülleri
- **Güç Sistemi**: 4 doğrultucu modülü izleme ve kontrolü
- **Pil Yönetimi**: 4 pil grubu analizi ve test sistemi
- **AC/DC Dağıtım**: 3 faz AC giriş, 6 DC çıkış kontrolü
- **GPS/Konum**: Koordinat ve zaman senkronizasyonu
- **Alarm Sistemi**: Çok seviyeli alarm yönetimi
- **Ağ Yapılandırması**: IP, SNMP, Modbus TCP ayarları

## Teknik Yapı

### Frontend (React + TypeScript)
```
client/
├── src/
│   ├── components/     # UI bileşenleri
│   ├── pages/         # Sayfa bileşenleri
│   ├── hooks/         # React hooks (auth, language)
│   └── lib/           # Yardımcı fonksiyonlar
```

### Backend (Node.js + Express)
```
server/
├── index.ts           # Ana sunucu
├── routes.ts          # API endpoints
├── hardware-bridge.ts # C++ donanım köprüsü
└── storage.ts         # Veri depolama
```

### Hardware Interface (C/C++)
```
hardware/
├── hardware_interface.h    # API tanımları
├── hardware_sim.c         # Simülatör implementasyonu
├── test_hardware.c        # Test programı
└── Makefile              # Derleme scripti
```

### Shared
```
shared/
├── schema.ts     # Tip tanımları
└── i18n.ts       # Dil desteği
```

## Kurulum

### Gereksinimler
- **Node.js**: v18 veya üstü
- **GCC/G++**: C/C++ derleyici
- **Git**: Versiyon kontrolü

### 1. Proje İndirme
```bash
git clone <repository-url>
cd netmon-power-monitoring
```

### 2. Node.js Bağımlılıkları
```bash
npm install
```

### 3. Hardware Library Derleme
```bash
cd hardware
make all
make test
cd ..
```

### 4. Uygulama Başlatma
```bash
npm run dev
```

Tarayıcıda: `http://localhost:5000`

**Giriş Bilgileri:**
- Kullanıcı: `netmon`
- Şifre: `netmon`

Not: Varsayılan kullanıcı parolası hash'lenmiştir; demo giriş bilgileri yukarıdaki gibidir.

## Hardware API

### Güç Modülleri
```bash
# Modül verilerini al
GET /api/hardware/power-modules

# Modül durumunu değiştir
POST /api/hardware/power-modules/1/state
Content-Type: application/json
{"enabled": true}
```

### Pil Sistemi
```bash
# Pil bilgilerini al
GET /api/hardware/batteries

# Pil testi başlat
POST /api/hardware/batteries/1/test
Content-Type: application/json
{"testType": 0}
```

### Alarm Sistemi
```bash
# Aktif alarmları al
GET /api/hardware/alarms

# Alarm onayla
POST /api/hardware/alarms/123/acknowledge
```

### Sistem Kontrolü
```bash
# Sistem durumunu al
GET /api/hardware/system-status

# Çalışma modunu değiştir
POST /api/hardware/system/operation-mode
Content-Type: application/json
{"mode": 1}
```

## Dil Desteği

### Dil Değiştirme
Uygulama header'ındaki dil menüsünden Türkçe/İngilizce geçiş yapabilirsiniz.

### Yeni Dil Ekleme
1. `shared/i18n.ts` dosyasına yeni dil ekleyin
2. Translation interface'ini genişletin
3. Tüm çevirileri ekleyin

```typescript
export const translations: Record<Language, Translation> = {
  tr: { /* Türkçe çeviriler */ },
  en: { /* İngilizce çeviriler */ },
  de: { /* Almanca çeviriler - yeni */ }
};
```

## Hardware Integration

### Gerçek Donanım Bağlantısı
Simülasyon yerine gerçek donanım kullanmak için:

1. **hardware_sim.c** yerine gerçek implementasyon yazın
2. Donanım sürücülerini ekleyin (RS485, Modbus, etc.)
3. **hardware-bridge.ts** dosyasında C library çağrılarını aktifleştirin

### Örnek Gerçek Implementasyon
```c
hw_status_t hw_get_power_modules(power_module_t* modules, uint8_t* count) {
    // Gerçek donanımdan Modbus ile veri oku
    for (int i = 0; i < 4; i++) {
        modbus_read_registers(ctx, VOLTAGE_REGISTER + i*10, 1, &voltage);
        modbus_read_registers(ctx, CURRENT_REGISTER + i*10, 1, &current);
        
        modules[i].voltage = voltage / 10.0f;
        modules[i].current = current / 10.0f;
        modules[i].power = modules[i].voltage * modules[i].current / 1000.0f;
    }
    
    *count = 4;
    return HW_STATUS_OK;
}
```

## Ölçüm Formülleri ve Uygulama Noktaları

Bu proje, donanım ölçümlerini aşağıdaki formüllerle hesaplar. İlgili implementasyon dosya/satırları belirtilmiştir.

- DC Gerilim (Voltage Divider)
  - Formül: \(V_{adc} = ADC/4095 \times V_{ref}\), \(V_{in} = V_{adc} \times (R1+R2)/R2\)
  - Uygulama: `hardware/sensor_library.c` → `voltage_divider_read_voltage_mv`
  - Kalibrasyon: `voltage_divider_calibrate`

- DC Akım (ACS712)
  - Formül: \(I = (V_{adc} - V_{ref}/2)/Sensitivity\) (Sensitivity: 185/100/66 mV/A sensör modeline göre)
  - Uygulama: `hardware/sensor_library.c` → `acs712_read_current_ma`
  - Kalibrasyon: `acs712_calibrate`

- Sıcaklık (LM35)
  - Formül: \(T(°C) = V/0.01\)
  - Uygulama: `hardware/sensor_library.c` → `lm35_read_temperature`
  - Kalibrasyon: `lm35_calibrate`

- DC Güç
  - Formül: \(P_{dc} = V \times I\)
  - Uygulama: `hardware/power_monitor.c` → `read_power_module_data` (mW olarak hesaplanır)

- Limit/Alarm Kontrolleri
  - Gerilim/Akım/Sıcaklık/Güç limitleri ve hata bayrakları
  - Uygulama: `hardware/power_monitor.c` → `check_voltage_faults`, `check_current_faults`, `check_temperature_faults`, `check_power_faults`

Notlar:
- ADC referansı 3.3V ve 12-bit varsayılmıştır (gerektiğinde `ADC_REFERENCE_VOLTAGE_MV` ile değiştirin).
- Ölçümler için offset/scale kalibrasyon alanları mevcuttur (sensor library fonksiyonları).
- AC RMS/frekans/PF ölçümleri donanım geldiğinde eklenmek üzere ayrılmıştır (placeholder).

## Deployment

### Production Build
```bash
npm run build
npm run start:prod
```
### NGINX + SSL
`docs/NGINX_SSL_EXAMPLE.conf` dosyasını örnek olarak kullanın. Let's Encrypt ile sertifika alıp 5000'e reverse proxy yapar.

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

# Hardware library derle
COPY hardware/ ./hardware/
RUN cd hardware && make all

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "run", "start"]
```

### Sistem Servisi (Linux)
```bash
sudo tee /etc/systemd/system/netmon.service > /dev/null <<EOF
[Unit]
Description=NetMon Power Monitoring
After=network.target

[Service]
Type=simple
User=netmon
WorkingDirectory=/opt/netmon
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable netmon
sudo systemctl start netmon
```

## Windows Desteği

Windows üzerinde çalıştırmak için `README-Windows.md` dosyasına bakınız.

## Güvenlik

### Üretim Ortamı
- HTTPS kullanın
- Güçlü şifreler ayarlayın
- Firewall kuralları uygulayın
- Düzenli güvenlik güncellemeleri yapın

### Network Security
- VPN ile uzaktan erişim
- IP kısıtlamaları
- SNMP community string'leri değiştirin

## Sorun Giderme

### Common Issues

**1. Hardware library derleme hatası**
```bash
cd hardware
make clean
make all
```

**2. Port kullanımda hatası**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

**3. Node.js modül hatası**
```bash
rm -rf node_modules package-lock.json
npm install
```

**4. TypeScript compile hatası**
```bash
npm run check
```

### Log Kontrolü
```bash
# Uygulama logları
tail -f logs/netmon.log

# Sistem logları
journalctl -u netmon -f

# Hardware debug
cd hardware
./test_hardware
```

## Geliştiriciler İçin

### Development Server
```bash
npm run dev          # Frontend + Backend hot reload
npm run check        # TypeScript kontrolü
npm run build        # Production build
```

### Hardware Test
```bash
cd hardware
make test
./test_hardware
```

### API Test
```bash
# cURL ile test
curl -X GET http://localhost:5000/api/hardware/power-modules \
  -H "Cookie: sessionId=<session_id>"
```

### Database Schema
```bash
npm run db:push      # Schema güncellemesi
```

## Lisans

Bu proje NetMon Technologies tarafından geliştirilmiştir.
Tüm hakları saklıdır.

## İletişim

- **Teknik Destek**: support@netmon.com.tr
- **Dokümantasyon**: docs.netmon.com.tr
- **GitHub**: github.com/netmon/power-monitoring

## Changelog

### v2.1.4 (2024-01-11)
- ✅ Çok dilli destek eklendi (TR/EN)
- ✅ C++ donanım entegrasyonu
- ✅ Real-time veri güncellemeleri
- ✅ Windows uyumluluk iyileştirmeleri
- ✅ Modern UI tasarım güncellemesi

### v2.1.3 (2023-12-15)
- ✅ Pil test sistemi geliştirildi
- ✅ Alarm yönetimi iyileştirildi
- ✅ Performance optimizasyonları

### v2.1.2 (2023-11-01)
- ✅ GPS entegrasyonu
- ✅ SNMP destek eklendi
- ✅ Ağ yapılandırma modülü