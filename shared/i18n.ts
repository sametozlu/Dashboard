// Language support for Turkish and English
export type Language = 'tr' | 'en';

export interface Translation {
  // Header and Navigation
  systemTitle: string;
  logout: string;
  language: string;
  
  // Main Tabs
  mainPage: string;
  monitoring: string;
  query: string;
  systemSettings: string;
  maintenance: string;
  
  // Sidebar Menu Items
  controlPanel: string;
  monitoringMenu: string;
  gps: string;
  facilityUnit: string;
  collectorDevice: string;
  batteryGroup: string;
  
  // Content Pages
  dashboard: string;
  systemOverview: string;
  activeAlarms: string;
  alarmHistory: string;
  siteConfiguration: string;
  softwareUpgrade: string;
  performanceData: string;
  systemInformation: string;
  operationLog: string;
  locationInfo: string;
  timeSettings: string;
  versionInfo: string;
  digitalPower: string;
  acInputDistribution: string;
  dcOutputDistribution: string;
  configurationFile: string;
  operationInfo: string;
  operationControl: string;
  networkConfiguration: string;
  siteIdentity: string;
  batteryStatus: string;
  batteryTestRecords: string;
  totalBatteryCurrent: string;
  
  // Common Terms
  status: string;
  active: string;
  inactive: string;
  normal: string;
  critical: string;
  error: string;
  connected: string;
  disconnected: string;
  enabled: string;
  disabled: string;
  running: string;
  stopped: string;
  online: string;
  offline: string;

  
  // Hardware Terms
  voltage: string;
  current: string;
  power: string;
  temperature: string;
  frequency: string;
  capacity: string;
  load: string;
  efficiency: string;
  
  // Battery Terms
  batteryVoltage: string;
  batteryCurrent: string;
  batteryTemperature: string;
  batteryCapacity: string;
  chargingStatus: string;
  dischargingStatus: string;
  batteryTest: string;
  testResult: string;
  
  // Alarm Terms
  alarmLevel: string;
  alarmMessage: string;
  alarmTime: string;
  acknowledge: string;
  clear: string;
  resolved: string;
  
  // Actions
  save: string;
  cancel: string;
  apply: string;
  reset: string;
  start: string;
  stop: string;
  restart: string;
  test: string;
  update: string;
  refresh: string;
  export: string;
  import: string;
  
  // Login Page
  systemLogin: string;
  welcomeMessage: string;
  username: string;
  password: string;
  enterUsername: string;
  enterPassword: string;
  loggingIn: string;
  login: string;
  demoCredentials: string;
  loginSuccessTitle: string;
  loginSuccessMessage: string;
  loginErrorTitle: string;
  loginErrorMessage: string;
  
  // Additional UI Terms
  averageLoad: string;
  averageTemperature: string;
  systemEfficiency: string;
  noDataAvailable: string;
  
  // Page Descriptions
  powerSystemStatusSummary: string;
  gpsLocationSettings: string;
  systemSettingsConfig: string;
  
  // Grid and Power Terms
  gridStatus: string;
  acVoltage: string;
  totalPower: string;
  basicInformation: string;
  gridACVoltage: string;
  gridACCurrent: string;
  totalActivePower: string;
  acFrequency: string;
  gridQualityLevel: string;
  totalGridEnergyConsumption: string;
  totalGridPowerRecordTime: string;
  
  // Performance Page
  systemPerformanceMetrics: string;
  powerConsumption24Hours: string;
  voltageFluctuation: string;
  chartArea: string;
  
  // Alarm Terms
  activeSystemAlarms: string;
  criticalAlarm: string;
  warningAlarm: string;
  infoAlarm: string;
  dcOutputVoltageHigh: string;
  batteryTemperatureHigh: string;
  systemMaintenanceTime: string;
  activeStatus: string;
  acknowledgedStatus: string;
  acknowledgeButton: string;
  detailsButton: string;
  
  // GPS and Location
  gpsCoordinates: string;
  latitude: string;
  longitude: string;
  altitude: string;
  gpsStatus: string;
  gpsConnected: string;
  satellites: string;
  systemTime: string;
  timezone: string;
  timezoneValue: string;
  ntpServer: string;
  updateTime: string;
  
  // Battery Terms Extended  
  batteryNumber: string;
  warningStatus: string;
  totalVoltage: string;
  totalCurrent: string;
  batteryGroupSummary: string;
  
  // Time and Date
  lastUpdate: string;
  uptime: string;
  
  // Network
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsServer: string;
  dhcp: string;
  
  // Configuration
  configuration: string;
  general: string;
  network: string;
  security: string;
  advanced: string;
  
  // Units
  volts: string;
  amperes: string;
  watts: string;
  kilowatts: string;
  celsius: string;
  hertz: string;
  percent: string;
  hours: string;
  minutes: string;
  seconds: string;
  days: string;
  
  // Technical Terms
  staticIP: string;
  communityString: string;
  snmpPort: string;
  slaveID: string;
  port: string;
  ethernet: string;
  sshPort: string;
  https: string;
  connectionStatus: string;
  ipConfiguration: string;
  protocolSettings: string;
  snmpSettings: string;
  modbusTCPSettings: string;
  ethernetSettings: string;
  
  // Software Update Terms
  currentVersionInfo: string;
  systemVersion: string;
  buildDate: string;
  kernelVersion: string;
  updateOperations: string;
  newVersionCheck: string;
  checkForUpdates: string;
  manualUpdate: string;
  uploadAndRestart: string;
  updateWarning: string;
  
  // Hardware Information Terms  
  hardwareInformation: string;
  processor: string;
  memoryRAM: string;
  storage: string;
  serialPort: string;
  powerConsumption: string;
  operatingTemperature: string;
  
  // Alarm History Terms
  alarmHistoryDescription: string;
  alarmHistoryTitle: string;
  type: string;
  dateTime: string;
  duration: string;
  
  // Loading and Error Terms
  loading: string;
  
  // Software Information Terms
  softwareInformation: string;
  operatingSystem: string;
  applicationVersion: string;
  database: string;
  webServer: string;
  lastRestart: string;
  
  // System Resources Terms
  systemResources: string;
  cpuUsage: string;
  ramUsage: string;
  diskUsage: string;
  
  // Additional Technical Terms
  warning: string;
  rectifierCount: string;
  inputCurrent: string;
  outputCurrent: string;
  inputVoltage: string;
  outputVoltage: string;
  alarmThreshold: string;
  solarPanelCount: string;
  panelVoltage: string;
  panelCurrent: string;
  batteryCount: string;
  batteryTempThreshold: string;
  acInputVoltage: string;
  acInputCurrent: string;
  dcOutputVoltage: string;
  dcOutputCurrent: string;
  temperatureThreshold: string;
  humidityThreshold: string;
  min: string;
  max: string;
  emergency: string;
  info: string;
  rectifierSettings: string;
  solarPanelSettings: string;
  batteryGroupSettings: string;
  acInputSettings: string;
  dcOutputSettings: string;
  environmentSettings: string;
  
  // Operation Log Terms
  operationLogDescription: string;
  systemLogRecords: string;
  exportLog: string;
  user: string;
  configLevel: string;
  alertLevel: string;
  authLevel: string;
  autoLevel: string;
  powerOutageMainGridLost: string;
  highTempRectifier2: string;
  lowBatteryVoltageGroup1: string;
  alarmAcknowledged: string;
  detailsSoon: string;
  noAlarm: string;
  powerFactor: string;
  thdVoltage: string;
  thdCurrent: string;
  loadRatio: string;
  soh: string;
  energyEfficiency: string;
  avgPower: string;
  peakPower: string;
  batteryCycles: string;
}

export const translations: Record<Language, Translation> = {
  tr: {
    // Header and Navigation
    systemTitle: "Güç Sistemi İzleme",
    logout: "Çıkış",
    language: "Türkçe",
    
    // Main Tabs
    mainPage: "Ana Sayfa",
    monitoring: "İzleme",
    query: "Sorgu",
    systemSettings: "Sistem Ayarları",
    maintenance: "Bakım",
    
    // Sidebar Menu Items
    controlPanel: "Kontrol Paneli",
    monitoringMenu: "İzleme",
    gps: "GPS",
    facilityUnit: "Tesis Birimi",
    collectorDevice: "Toplayıcı Aygıt",
    batteryGroup: "Pil Grubu",
    
    // Content Pages
    dashboard: "Kontrol Paneli",
    systemOverview: "Sistem Genel Bakış",
    activeAlarms: "Aktif Alarmlar",
    alarmHistory: "Geçmiş Alarmlar",
    siteConfiguration: "Site Yapılandırması",
    softwareUpgrade: "Yazılım Yükseltme",
    performanceData: "Performans Verileri",
    systemInformation: "Sistem Bilgileri",
    operationLog: "İşlem Kaydı",
    locationInfo: "Konum Bilgileri",
    timeSettings: "Saat Ayarları",
    versionInfo: "Sürüm Bilgisi",
    digitalPower: "Dijital Güç",
    acInputDistribution: "AC Giriş Dağıtımı",
    dcOutputDistribution: "DC Çıkış Dağıtımı",
    configurationFile: "Yapılandırma Dosyası",
    operationInfo: "Çalışma Bilgileri",
    operationControl: "Çalışma Kontrolü",
    networkConfiguration: "Ağ Yapılandırması",
    siteIdentity: "Site Kimliği",
    batteryStatus: "Pil Durumu",
    batteryTestRecords: "Pil Test Kayıtları",
    totalBatteryCurrent: "Toplam Pil Akımı",
    
    // Common Terms
    status: "Durum",
    active: "Aktif",
    inactive: "Pasif",
    normal: "Normal",
    critical: "Kritik",
    error: "Hata",
    connected: "Bağlı",
    disconnected: "Bağlantı Kesildi",
    enabled: "Etkin",
    disabled: "Devre Dışı",
    running: "Çalışıyor",
    stopped: "Durduruldu",
    online: "Çevrimiçi",
    offline: "Çevrimdışı",
    warning: "Uyarı",
    
    // Hardware Terms
    voltage: "Voltaj",
    current: "Akım",
    power: "Güç",
    temperature: "Sıcaklık",
    frequency: "Frekans",
    capacity: "Kapasite",
    load: "Yük",
    efficiency: "Verimlilik",
    
    // Battery Terms
    batteryVoltage: "Pil Voltajı",
    batteryCurrent: "Pil Akımı",
    batteryTemperature: "Pil Sıcaklığı",
    batteryCapacity: "Pil Kapasitesi",
    chargingStatus: "Şarj Durumu",
    dischargingStatus: "Deşarj Durumu",
    batteryTest: "Pil Testi",
    testResult: "Test Sonucu",
    
    // Alarm Terms
    alarmLevel: "Alarm Seviyesi",
    alarmMessage: "Alarm Mesajı",
    alarmTime: "Alarm Zamanı",
    acknowledge: "Onayla",
    clear: "Temizle",
    resolved: "Çözüldü",
    
    // Actions
    save: "Kaydet",
    cancel: "İptal",
    apply: "Uygula",
    reset: "Sıfırla",
    start: "Başlat",
    stop: "Durdur",
    restart: "Yeniden Başlat",
    test: "Test",
    update: "Güncelle",
    refresh: "Yenile",
    export: "Dışa Aktar",
    import: "İçe Aktar",
    
    // Login Page
    systemLogin: "Sistem Girişi",
    welcomeMessage: "Güç sistemi izleme platformuna hoş geldiniz",
    username: "Kullanıcı Adı",
    password: "Şifre",
    enterUsername: "Kullanıcı adınızı girin",
    enterPassword: "Şifrenizi girin",
    loggingIn: "Giriş yapılıyor...",
    login: "Giriş Yap",
    demoCredentials: "Demo: netmon / netmon",
    loginSuccessTitle: "Giriş Başarılı",
    loginSuccessMessage: "Netmon sistemine hoş geldiniz",
    loginErrorTitle: "Giriş Hatası",
    loginErrorMessage: "Giriş yapılırken bir hata oluştu",
    
    // Additional UI Terms
    averageLoad: "Ortalama Yük",
    averageTemperature: "Ortalama Sıcaklık",
    systemEfficiency: "Sistem Verimliliği",
    noDataAvailable: "Veri mevcut değil",
    
    // Page Descriptions
    powerSystemStatusSummary: "Güç sistemi durumu ve performans özeti",
    gpsLocationSettings: "GPS koordinatları ve konum ayarları",
    systemSettingsConfig: "Sistem ayarları ve konfigürasyon",
    
    // Grid and Power Terms
    gridStatus: "Şebeke Durumu",
    acVoltage: "AC Voltajı",
    totalPower: "Toplam Güç",
    basicInformation: "Temel Bilgiler",
    gridACVoltage: "Şebeke AC Voltajı",
    gridACCurrent: "Şebeke AC Akımı",
    totalActivePower: "Toplam Aktif Güç",
    acFrequency: "AC Frekansı",
    gridQualityLevel: "Şebeke Kalite Seviyesi",
    totalGridEnergyConsumption: "Toplam Şebeke Enerji Tüketimi",
    totalGridPowerRecordTime: "Toplam Şebeke Güç Kayıt Zamanı",
    
    // Performance Page
    systemPerformanceMetrics: "Sistem performans metrikleri ve analizi",
    powerConsumption24Hours: "Güç Tüketimi (24 Saat)",
    voltageFluctuation: "Voltaj Dalgalanması",
    chartArea: "Grafik Alanı",
    
    // Alarm Terms
    activeSystemAlarms: "Sistemdeki aktif alarm ve uyarılar",
    criticalAlarm: "Kritik",
    warningAlarm: "Uyarı",
    infoAlarm: "Bilgi",
    dcOutputVoltageHigh: "DC Çıkış Voltajı Yüksek",
    batteryTemperatureHigh: "Pil Sıcaklığı Yüksek",
    systemMaintenanceTime: "Sistem Bakım Zamanı",
    activeStatus: "Aktif",
    acknowledgedStatus: "Onaylandı",
    acknowledgeButton: "Onayla",
    detailsButton: "Detay",
    
    // GPS and Location
    gpsCoordinates: "GPS Koordinatları",
    latitude: "Enlem (Latitude)",
    longitude: "Boylam (Longitude)",
    altitude: "Yükseklik",
    gpsStatus: "GPS Durumu",
    gpsConnected: "GPS Bağlı",
    satellites: "Uydu",
    systemTime: "Sistem Zamanı",
    timezone: "Zaman Dilimi",
    timezoneValue: "UTC+3 (Türkiye)",
    ntpServer: "NTP Sunucu",
    updateTime: "Zamanı Güncelle",
    
    // Battery Terms Extended
    batteryNumber: "Pil Numarası",
    warningStatus: "Uyarı Durumu",
    totalVoltage: "Toplam Voltaj",
    totalCurrent: "Toplam Akım",
    batteryGroupSummary: "Pil Grubu Özeti",
    
    // Time and Date
    lastUpdate: "Son Güncelleme",
    uptime: "Çalışma Süresi",
    
    // Network
    ipAddress: "IP Adresi",
    subnetMask: "Alt Ağ Maskesi",
    gateway: "Ağ Geçidi",
    dnsServer: "DNS Sunucu",
    dhcp: "DHCP",
    
    // Configuration
    configuration: "Konfigürasyon",
    general: "Genel",
    network: "Ağ",
    security: "Güvenlik",
    advanced: "Gelişmiş",
    
    // Units
    volts: "V",
    amperes: "A",
    watts: "W",
    kilowatts: "kW",
    celsius: "°C",
    hertz: "Hz",
    percent: "%",
    hours: "saat",
    minutes: "dakika",
    seconds: "saniye",
    days: "gün",
    
    // Technical Terms
    staticIP: "Statik IP",
    communityString: "Community String",
    snmpPort: "SNMP Portu",
    slaveID: "Slave ID",
    port: "Port",
    ethernet: "Ethernet",
    sshPort: "SSH Portu",
    https: "HTTPS",
    connectionStatus: "Bağlantı Durumu",
    ipConfiguration: "IP Konfigürasyonu",
    protocolSettings: "Protokol Ayarları",
    snmpSettings: "SNMP Ayarları",
    modbusTCPSettings: "Modbus TCP Ayarları",
    ethernetSettings: "Ethernet Ayarları",
    
    // Software Update Terms
    currentVersionInfo: "Mevcut Sürüm Bilgileri",
    systemVersion: "Sistem Sürümü",
    buildDate: "Derleme Tarihi",
    kernelVersion: "Kernel Sürümü",
    updateOperations: "Güncelleme İşlemleri",
    newVersionCheck: "Yeni Sürüm Kontrolü",
    checkForUpdates: "Güncellemeleri Kontrol Et",
    manualUpdate: "Manuel Güncelleme",
    uploadAndRestart: "Yazılım Yükle ve Yeniden Başlat",
    updateWarning: "Uyarı: Yazılım güncelleme sırasında sistem kısa süre erişilemez olacaktır.",
    
    // Hardware Information Terms
    hardwareInformation: "Donanım Bilgileri",
    processor: "İşlemci",
    memoryRAM: "Bellek (RAM)",
    storage: "Depolama",
    serialPort: "Seri Port",
    powerConsumption: "Güç Tüketimi",
    operatingTemperature: "Çalışma Sıcaklığı",
    
    // Alarm History Terms
    alarmHistoryDescription: "Çözülmüş alarm ve uyarı geçmişi",
    alarmHistoryTitle: "Alarm Geçmişi",
    type: "Tip",
    dateTime: "Tarih/Saat",
    duration: "Süre",
    
    // Loading and Error Terms
    loading: "Yükleniyor...",
    
    // Software Information Terms
    softwareInformation: "Yazılım Bilgileri",
    operatingSystem: "İşletim Sistemi",
    applicationVersion: "Uygulama Sürümü",
    database: "Veritabanı",
    webServer: "Web Sunucu",
    lastRestart: "Son Yeniden Başlatma",
    
    // System Resources Terms
    systemResources: "Sistem Kaynakları",
    cpuUsage: "CPU Kullanımı",
    ramUsage: "RAM Kullanımı",
    diskUsage: "Disk Kullanımı",
    
    // Additional Technical Terms
    rectifierCount: "Doğrultucu Sayısı",
    inputCurrent: "Giriş Akımı",
    outputCurrent: "Çıkış Akımı",
    inputVoltage: "Giriş Voltajı",
    outputVoltage: "Çıkış Voltajı",
    alarmThreshold: "Alarm Eşiği",
    solarPanelCount: "Solar Panel Sayısı",
    panelVoltage: "Panel Voltajı",
    panelCurrent: "Panel Akımı",
    batteryCount: "Pil Sayısı",
    batteryTempThreshold: "Pil Sıcaklık Eşiği",
    acInputVoltage: "AC Giriş Voltajı",
    acInputCurrent: "AC Giriş Akımı",
    dcOutputVoltage: "DC Çıkış Voltajı",
    dcOutputCurrent: "DC Çıkış Akımı",
    temperatureThreshold: "Sıcaklık Eşiği",
    humidityThreshold: "Nem Eşiği",
    min: "Min",
    max: "Maks",
    emergency: "Acil",
    info: "Bilgilendirme",
    rectifierSettings: "Doğrultucu Ayarları",
    solarPanelSettings: "Solar Panel Ayarları",
    batteryGroupSettings: "Pil Grubu Ayarları",
    acInputSettings: "AC Giriş Ayarları",
    dcOutputSettings: "DC Çıkış Ayarları",
    environmentSettings: "Ortam Ayarları",
    
    // Operation Log Terms
    operationLogDescription: "Sistem aktiviteleri ve kullanıcı işlemleri",
    systemLogRecords: "Sistem Log Kayıtları", 
    exportLog: "Log Dışa Aktar",
    user: "Kullanıcı",
    configLevel: "Yapılandırma",
    alertLevel: "Alarm",
    authLevel: "Kimlik Doğrulama",
    autoLevel: "Otomatik",
    powerOutageMainGridLost: "Güç kesintisi - Ana şebeke bağlantısı kayboldu",
    highTempRectifier2: "Yüksek sıcaklık uyarısı - Doğrultucu Modül 2",
    lowBatteryVoltageGroup1: "Pil voltajı düşük - Pil Grubu 1",
    alarmAcknowledged: "Alarm onaylandı",
    detailsSoon: "Detaylar yakında",
    noAlarm: "Alarm yok",
    powerFactor: "Güç Faktörü",
    thdVoltage: "THD (Gerilim)",
    thdCurrent: "THD (Akım)",
    loadRatio: "Yük Oranı",
    soh: "Pil Sağlık Endeksi (SOH)",
    energyEfficiency: "Enerji Verimliliği",
    avgPower: "Ortalama Güç",
    peakPower: "Pik Güç",
    batteryCycles: "Şarj/Deşarj Döngüsü"
  },
  
  en: {
    // Header and Navigation
    systemTitle: "Power System Monitoring",
    logout: "Logout",
    language: "English",
    
    // Main Tabs
    mainPage: "Main Page",
    monitoring: "Monitoring",
    query: "Query",
    systemSettings: "System Settings",
    maintenance: "Maintenance",
    
    // Sidebar Menu Items
    controlPanel: "Control Panel",
    monitoringMenu: "Monitoring",
    gps: "GPS",
    facilityUnit: "Facility Unit",
    collectorDevice: "Collector Device",
    batteryGroup: "Battery Group",
    
    // Content Pages
    dashboard: "Dashboard",
    systemOverview: "System Overview",
    activeAlarms: "Active Alarms",
    alarmHistory: "Alarm History",
    siteConfiguration: "Site Configuration",
    softwareUpgrade: "Software Upgrade",
    performanceData: "Performance Data",
    systemInformation: "System Information",
    operationLog: "Operation Log",
    locationInfo: "Location Information",
    timeSettings: "Time Settings",
    versionInfo: "Version Information",
    digitalPower: "Digital Power",
    acInputDistribution: "AC Input Distribution",
    dcOutputDistribution: "DC Output Distribution",
    configurationFile: "Configuration File",
    operationInfo: "Operation Information",
    operationControl: "Operation Control",
    networkConfiguration: "Network Configuration",
    siteIdentity: "Site Identity",
    batteryStatus: "Battery Status",
    batteryTestRecords: "Battery Test Records",
    totalBatteryCurrent: "Total Battery Current",
    
    // Common Terms
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    normal: "Normal",
    critical: "Critical",
    error: "Error",
    connected: "Connected",
    disconnected: "Disconnected",
    enabled: "Enabled",
    disabled: "Disabled",
    running: "Running",
    stopped: "Stopped",
    online: "Online",
    offline: "Offline",
    warning: "Warning",
    
    // Hardware Terms
    voltage: "Voltage",
    current: "Current",
    power: "Power",
    temperature: "Temperature",
    frequency: "Frequency",
    capacity: "Capacity",
    load: "Load",
    efficiency: "Efficiency",
    
    // Battery Terms
    batteryVoltage: "Battery Voltage",
    batteryCurrent: "Battery Current",
    batteryTemperature: "Battery Temperature",
    batteryCapacity: "Battery Capacity",
    chargingStatus: "Charging Status",
    dischargingStatus: "Discharging Status",
    batteryTest: "Battery Test",
    testResult: "Test Result",
    
    // Alarm Terms
    alarmLevel: "Alarm Level",
    alarmMessage: "Alarm Message",
    alarmTime: "Alarm Time",
    acknowledge: "Acknowledge",
    clear: "Clear",
    resolved: "Resolved",
    
    // Actions
    save: "Save",
    cancel: "Cancel",
    apply: "Apply",
    reset: "Reset",
    start: "Start",
    stop: "Stop",
    restart: "Restart",
    test: "Test",
    update: "Update",
    refresh: "Refresh",
    export: "Export",
    import: "Import",
    
    // Login Page
    systemLogin: "System Login",
    welcomeMessage: "Welcome to the power system monitoring platform",
    username: "Username",
    password: "Password",
    enterUsername: "Enter your username",
    enterPassword: "Enter your password",
    loggingIn: "Logging in...",
    login: "Login",
    demoCredentials: "Demo: netmon / netmon",
    loginSuccessTitle: "Login Successful",
    loginSuccessMessage: "Welcome to the Netmon system",
    loginErrorTitle: "Login Error",
    loginErrorMessage: "An error occurred during login",
    
    // Additional UI Terms
    averageLoad: "Average Load",
    averageTemperature: "Average Temperature",
    systemEfficiency: "System Efficiency",
    noDataAvailable: "No data available",
    
    // Page Descriptions
    powerSystemStatusSummary: "Power system status and performance summary",
    gpsLocationSettings: "GPS coordinates and location settings",
    systemSettingsConfig: "System settings and configuration",
    
    // Grid and Power Terms
    gridStatus: "Grid Status",
    acVoltage: "AC Voltage",
    totalPower: "Total Power",
    basicInformation: "Basic Information",
    gridACVoltage: "Grid AC Voltage",
    gridACCurrent: "Grid AC Current",
    totalActivePower: "Total Active Power",
    acFrequency: "AC Frequency",
    gridQualityLevel: "Grid Quality Level",
    totalGridEnergyConsumption: "Total Grid Energy Consumption",
    totalGridPowerRecordTime: "Total Grid Power Record Time",
    
    // Performance Page
    systemPerformanceMetrics: "System performance metrics and analysis",
    powerConsumption24Hours: "Power Consumption (24 Hours)",
    voltageFluctuation: "Voltage Fluctuation",
    chartArea: "Chart Area",
    
    // Alarm Terms
    activeSystemAlarms: "Active system alarms and warnings",
    criticalAlarm: "Critical",
    warningAlarm: "Warning",
    infoAlarm: "Info",
    dcOutputVoltageHigh: "DC Output Voltage High",
    batteryTemperatureHigh: "Battery Temperature High",
    systemMaintenanceTime: "System Maintenance Time",
    activeStatus: "Active",
    acknowledgedStatus: "Acknowledged",
    acknowledgeButton: "Acknowledge",
    detailsButton: "Details",
    
    // GPS and Location
    gpsCoordinates: "GPS Coordinates",
    latitude: "Latitude",
    longitude: "Longitude",
    altitude: "Altitude",
    gpsStatus: "GPS Status",
    gpsConnected: "GPS Connected",
    satellites: "Satellites",
    systemTime: "System Time",
    timezone: "Timezone",
    timezoneValue: "UTC+3 (Turkey)",
    ntpServer: "NTP Server",
    updateTime: "Update Time",
    
    // Battery Terms Extended
    batteryNumber: "Battery Number",
    warningStatus: "Warning Status",
    totalVoltage: "Total Voltage",
    totalCurrent: "Total Current",
    batteryGroupSummary: "Battery Group Summary",
    
    // Time and Date
    lastUpdate: "Last Update",
    uptime: "Uptime",
    
    // Network
    ipAddress: "IP Address",
    subnetMask: "Subnet Mask",
    gateway: "Gateway",
    dnsServer: "DNS Server",
    dhcp: "DHCP",
    
    // Configuration
    configuration: "Configuration",
    general: "General",
    network: "Network",
    security: "Security",
    advanced: "Advanced",
    
    // Units
    volts: "V",
    amperes: "A",
    watts: "W",
    kilowatts: "kW",
    celsius: "°C",
    hertz: "Hz",
    percent: "%",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
    days: "days",
    
    // Technical Terms
    staticIP: "Static IP",
    communityString: "Community String",
    snmpPort: "SNMP Port",
    slaveID: "Slave ID",
    port: "Port",
    ethernet: "Ethernet",
    sshPort: "SSH Port",
    https: "HTTPS",
    connectionStatus: "Connection Status",
    ipConfiguration: "IP Configuration",
    protocolSettings: "Protocol Settings",
    snmpSettings: "SNMP Settings",
    modbusTCPSettings: "Modbus TCP Settings",
    ethernetSettings: "Ethernet Settings",
    
    // Software Update Terms
    currentVersionInfo: "Current Version Information",
    systemVersion: "System Version",
    buildDate: "Build Date",
    kernelVersion: "Kernel Version",
    updateOperations: "Update Operations",
    newVersionCheck: "New Version Check",
    checkForUpdates: "Check for Updates",
    manualUpdate: "Manual Update",
    uploadAndRestart: "Upload Software and Restart",
    updateWarning: "Warning: System will be temporarily unavailable during software update.",
    
    // Hardware Information Terms
    hardwareInformation: "Hardware Information",
    processor: "Processor",
    memoryRAM: "Memory (RAM)",
    storage: "Storage",
    serialPort: "Serial Port",
    powerConsumption: "Power Consumption",
    operatingTemperature: "Operating Temperature",
    
    // Alarm History Terms
    alarmHistoryDescription: "Resolved alarm and warning history",
    alarmHistoryTitle: "Alarm History",
    type: "Type",
    dateTime: "Date/Time",
    duration: "Duration",
    
    // Loading and Error Terms
    loading: "Loading...",
    
    // Software Information Terms
    softwareInformation: "Software Information",
    operatingSystem: "Operating System",
    applicationVersion: "Application Version",
    database: "Database",
    webServer: "Web Server",
    lastRestart: "Last Restart",
    
    // System Resources Terms
    systemResources: "System Resources",
    cpuUsage: "CPU Usage",
    ramUsage: "RAM Usage",
    diskUsage: "Disk Usage",
    
    // Additional Technical Terms
    rectifierCount: "Rectifier Count",
    inputCurrent: "Input Current",
    outputCurrent: "Output Current",
    inputVoltage: "Input Voltage",
    outputVoltage: "Output Voltage",
    alarmThreshold: "Alarm Threshold",
    solarPanelCount: "Solar Panel Count",
    panelVoltage: "Panel Voltage",
    panelCurrent: "Panel Current",
    batteryCount: "Battery Count",
    batteryTempThreshold: "Battery Temp. Threshold",
    acInputVoltage: "AC Input Voltage",
    acInputCurrent: "AC Input Current",
    dcOutputVoltage: "DC Output Voltage",
    dcOutputCurrent: "DC Output Current",
    temperatureThreshold: "Temperature Threshold",
    humidityThreshold: "Humidity Threshold",
    min: "Min",
    max: "Max",
    emergency: "Emergency",
    info: "Info",
    rectifierSettings: "Rectifier Settings",
    solarPanelSettings: "Solar Panel Settings",
    batteryGroupSettings: "Battery Group Settings",
    acInputSettings: "AC Input Settings",
    dcOutputSettings: "DC Output Settings",
    environmentSettings: "Environment Settings",
    
    // Operation Log Terms
    operationLogDescription: "System activities and user operations",
    systemLogRecords: "System Log Records",
    exportLog: "Export Log", 
    user: "User",
    configLevel: "Configuration",
    alertLevel: "Alert",
    authLevel: "Authentication",
    autoLevel: "Automatic",
    powerOutageMainGridLost: "Power outage - Main grid connection lost",
    highTempRectifier2: "High temperature warning - Rectifier Module 2",
    lowBatteryVoltageGroup1: "Low battery voltage - Battery Group 1",
    alarmAcknowledged: "Alarm acknowledged",
    detailsSoon: "Details coming soon",
    noAlarm: "No alarm",
    powerFactor: "Power Factor",
    thdVoltage: "THD (Voltage)",
    thdCurrent: "THD (Current)",
    loadRatio: "Load Ratio",
    soh: "Battery State of Health (SOH)",
    energyEfficiency: "Energy Efficiency",
    avgPower: "Average Power",
    peakPower: "Peak Power",
    batteryCycles: "Charge/Discharge Cycles"
  }
};

export function getTranslation(lang: Language): Translation {
  return translations[lang] || translations.tr;
}

export function getAvailableLanguages(): { code: Language; name: string }[] {
  return [
    { code: 'tr', name: 'Türkçe' },
    { code: 'en', name: 'English' }
  ];
}