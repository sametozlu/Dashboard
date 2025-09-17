import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { useHardwareData } from "@/hooks/use-websocket";
import { 
  Zap, 
  Gauge, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings,
  Battery,
  Thermometer,
  Power,
  Wifi,
  MapPin,
  Calendar,
  
} from "lucide-react";
import type { ContentType } from "@/pages/dashboard";
import type { BatteryData } from "@/../../shared/websocket-types";
// UI Table importunu ekle
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import axios from "axios";
// import { ChartContainer } from "./ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// import RectifierCards from "./rectifier-cards";

interface ContentAreaProps {
  currentContent: ContentType;
}

function DashboardPowerChart({ currentLanguage }: { currentLanguage: string }) {
  const generatePowerData = () =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      power: 2 + Math.sin(i / 3) + Math.random() * 0.5
    }));

  const [powerData, setPowerData] = useState(generatePowerData());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPowerData(generatePowerData());
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentLanguage === 'tr' ? 'Güç Tüketimi (24 Saat)' : 'Power Consumption (24 Hours)'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={powerData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 4]} label={{ value: currentLanguage === 'tr' ? 'kW' : 'kW', angle: -90, position: 'insideLeft', fontSize: 12 }} />
              <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)} kW`} labelFormatter={(label: any) => `${label}`} />
              <Line type="monotone" dataKey="power" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContentArea({ currentContent }: ContentAreaProps) {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  // HOOKS (top-level only) – avoid conditional calls
  const rectifierLive = useHardwareData<any[]>("rectifiers", []);
  const liveRectifiersTop = Array.isArray(rectifierLive.data) ? rectifierLive.data : [];
  // Fan speed control state (top-level to avoid hook order issues)
  const [fanRpmById, setFanRpmById] = React.useState<Record<number, number>>({});
  const defaultFanRef = React.useRef<number>(2400);
  const thresholdRef = React.useRef<number>(55);
  const [simTempById, setSimTempById] = React.useState<Record<number, number>>({});
  const [simStatusById, setSimStatusById] = React.useState<Record<number, number>>({});
  const [simCurrentById, setSimCurrentById] = React.useState<Record<number, number>>({});
  const [simVoltageById, setSimVoltageById] = React.useState<Record<number, number>>({});
  const [simPowerById, setSimPowerById] = React.useState<Record<number, number>>({});
  
  const bumpFan = React.useCallback((id: number, delta: number) => {
    setFanRpmById(prev => {
      const current = prev[id] ?? defaultFanRef.current;
      const next = Math.max(800, Math.min(7000, current + delta));
      return { ...prev, [id]: next };
    });
    
    // Immediately adjust temperature based on fan change
    setSimTempById(prev => {
      const current = prev[id] ?? 40;
      // const rpm = fanRpmById[id] ?? defaultFanRef.current;
      // const newRpm = Math.max(800, Math.min(7000, rpm + delta));
      
      // Strong immediate temperature effect from fan change
      let tempChange = 0;
      if (delta > 0) { // RPM artıyor - sıcaklık düşüyor
        tempChange = -2.0; // Immediate cooling effect
      } else { // RPM azalıyor - sıcaklık yükseliyor
        tempChange = 1.5; // Immediate heating effect
      }
      
      const next = Math.max(20, Math.min(80, current + tempChange));
      return { ...prev, [id]: next };
    });
  }, [fanRpmById, defaultFanRef.current]);

  // Tüm hook'lar component başında, koşulsuz çağrılır
  const hardwareDataResult = useHardwareData<BatteryData[]>("batteries", []);



  // Get content title based on current language
  const getContentTitle = (content: ContentType): string => {
    const titleMap: Record<ContentType, string> = {
      dashboard: t.dashboard,
      "sistem-genel-bakis": t.systemOverview,
      "aktif-alarm": t.activeAlarms,
      "gecmis-alarmlar": t.alarmHistory,
      "site-yapilandirmasi": t.siteConfiguration,
      "yazilim-yukseltme": t.softwareUpgrade,
      "performans-verileri": t.performanceData,
      "sistem-bilgileri": t.systemInformation,
      "islem-kaydi": t.operationLog,
      "konum-bilgileri": t.locationInfo,
      "saat": t.timeSettings,
      "surum-bilgisi": t.versionInfo,
      "dijital-guc": t.digitalPower,
      "ac-giris-dagitimi": t.acInputDistribution,
      "dc-cikis-dagitimi": t.dcOutputDistribution,
      "yapilandirma-dosyasi": t.configurationFile,
      "calisma-bilgileri": t.operationInfo,
      "calisma-kontrolu": t.operationControl,
      "ag-yapilandirmasi": t.networkConfiguration,
      "site-kimligi": t.siteIdentity,
      "pil-durumu": t.batteryStatus,
      "pil-test-kayitlari": t.batteryTestRecords,
      "toplam-pil-akimi": t.totalBatteryCurrent,
      "konfigurasyon": t.configuration,
      "dogrultucular": t.rectifiers,
      "solarlar": t.solars,
      "alarmlar": t.alarms,
    };
    
    return titleMap[content] || content;
  };

  // Simulate real system data - in real app this would come from APIs
  const systemData = {
    gridStatus: "Normal",
    acVoltage: "231.0 V",
    totalPower: "0.00 kW",
    frequency: "50.0 Hz",
    gridStatusDetail: currentLanguage === 'en' ? "Grid Open" : "Şebeke Açık",
    gridACVoltage: "231.0 V",
    gridACCurrent: "0.0 A",
    totalActivePower: "0.00 kW",
    acFrequency: "50.0 Hz",
    gridQuality: currentLanguage === 'en' ? "Class C" : "C Sınıfı",
    totalGridConsumption: "0.08 kWh",
    gridPowerRecordTime: "0.08 h",
  };

  // const isDashboard = currentContent === "dashboard" || currentContent === "sistem-genel-bakis";

  // Donanım ham verisini dashboard'da göster
  // const { data: rawHardwareData } = rawHardwareDataResult; // unused

  // Konfigürasyon için state ve hook'lar (her zaman tanımlanmalı)
  const [config, setConfig] = useState<{
    rectifiers?: {
      rectifierCount: number;
      inputCurrent: string;
      outputCurrent: string;
      inputVoltage: string;
      outputVoltage: string;
      alarmThreshold: string;
      alarmLevel: string;
      tempAlarm: string;
      tempAlarmLevel: string;
      lowVoltageAlarm: string;
      lowVoltageAlarmLevel: string;
      fanSpeed: string;
    };
    solars?: {
      solarPanelCount: number;
      panelVoltage: string;
      panelCurrent: string;
      alarmThreshold: string;
      alarmLevel: string;
    };
    batteryGroup: {
      batteryCount: number;
      batteryVoltage: string;
      batteryCurrent: string;
      batteryTempMin: number;
      batteryTempMax: number;
      alarmThreshold: string;
      alarmLevel: string;
    };
    acInput: {
      acInputVoltage: string;
      acInputCurrent: string;
      frequency: string;
      alarmThreshold: string;
      alarmLevel: string;
    };
    dcOutput: {
      dcOutputVoltage: string;
      dcOutputCurrent: string;
      alarmThreshold: string;
      alarmLevel: string;
    };
    environment: {
      temperatureMin: number;
      temperatureMax: number;
      humidityMin: number;
      humidityMax: number;
      alarmLevel: string;
    };
  }>({
    batteryGroup: {
      batteryCount: 4,
      batteryVoltage: "",
      batteryCurrent: "",
      batteryTempMin: -10,
      batteryTempMax: 45,
      alarmThreshold: "",
      alarmLevel: "acil"
    },
    acInput: {
      acInputVoltage: "",
      acInputCurrent: "",
      frequency: "",
      alarmThreshold: "",
      alarmLevel: "acil"
    },
    dcOutput: {
      dcOutputVoltage: "",
      dcOutputCurrent: "",
      alarmThreshold: "",
      alarmLevel: "acil"
    },
    environment: {
      temperatureMin: 0,
      temperatureMax: 40,
      humidityMin: 10,
      humidityMax: 90,
      alarmLevel: "acil"
    }
  });
  const [, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  // Config GET (sadece konfigurasyon sayfası aktifken çalışsın)
  useEffect(() => {
    if (currentContent === "konfigurasyon") {
      setLoading(true);
      axios.get("/api/config").then(res => {
        if (res.data) setConfig(res.data);
        else {
          // Eğer config yoksa, rectifiers ve solars'ı burada ekle
          setConfig(prev => ({
            ...prev,
            rectifiers: {
              rectifierCount: 4,
              inputCurrent: "",
              outputCurrent: "",
              inputVoltage: "",
              outputVoltage: "",
              alarmThreshold: "",
              alarmLevel: "acil",
              tempAlarm: "",
              tempAlarmLevel: "acil",
              lowVoltageAlarm: "",
              lowVoltageAlarmLevel: "acil",
              fanSpeed: "2400"
            },
            solars: {
              solarPanelCount: 0,
              panelVoltage: "",
              panelCurrent: "",
              alarmThreshold: "",
              alarmLevel: "acil"
            }
          }));
        }
      }).finally(() => setLoading(false));
    }
  }, [currentContent]);

  // Initialize all rectifier states and simulation
  React.useEffect(() => {
    const count = Number(config.rectifiers?.rectifierCount) || 8;
    
    // Initialize fan speeds
    setFanRpmById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (!next[i]) next[i] = Number(config.rectifiers?.fanSpeed) || 2400;
      }
      return next;
    });

    // Initialize temperatures
    setSimTempById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (next[i] === undefined) {
          next[i] = 25 + Math.random() * 20; // 25-45°C random start
        }
      }
      return next;
    });

    // Initialize status (all running)
    setSimStatusById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (!next[i]) next[i] = 1; // 1 = running
      }
      return next;
    });

    // Initialize current
    setSimCurrentById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (next[i] === undefined) {
          next[i] = 2 + Math.random() * 3; // 2-5A random
        }
      }
      return next;
    });

    // Initialize voltage
    setSimVoltageById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (next[i] === undefined) {
          next[i] = 47 + Math.random() * 2; // 47-49V random
        }
      }
      return next;
    });

    // Initialize power
    setSimPowerById(prev => {
      const next: Record<number, number> = { ...prev };
      for (let i = 1; i <= count; i++) {
        if (next[i] === undefined) {
          next[i] = 100 + Math.random() * 150; // 100-250W random
        }
      }
      return next;
    });

  }, [config.rectifiers?.rectifierCount, config.rectifiers?.fanSpeed]);

  // Real-time simulation loop
  React.useEffect(() => {
    const count = Number(config.rectifiers?.rectifierCount) || 8;
    if (!count) return;

    const interval = setInterval(() => {
      // Update temperatures based on fan speed - more responsive
      setSimTempById(prev => {
        const updated: Record<number, number> = { ...prev };
        for (let i = 1; i <= count; i++) {
          const current = updated[i] ?? 40;
          const rpm = fanRpmById[i] ?? 2400;
          const ambient = 25;
          const heatLoad = 0.15; // much higher heat generation for visible changes
          const cooling = (rpm - 2400) * 0.003; // even stronger fan cooling effect
          const drift = (Math.random() - 0.5) * 1.5; // more dramatic random drift
          const relax = (ambient - current) * 0.015; // faster return to ambient
          
          let next = current + heatLoad - cooling + drift + relax;
          if (next < 20) next = 20;
          if (next > 80) next = 80;
          updated[i] = next;
        }
        return updated;
      });

      // Update current with small variations
      setSimCurrentById(prev => {
        const updated: Record<number, number> = { ...prev };
        for (let i = 1; i <= count; i++) {
          const current = updated[i] ?? 3;
          const drift = (Math.random() - 0.5) * 0.2;
          let next = current + drift;
          if (next < 0.5) next = 0.5;
          if (next > 6) next = 6;
          updated[i] = next;
        }
        return updated;
      });

      // Update voltage with small variations
      setSimVoltageById(prev => {
        const updated: Record<number, number> = { ...prev };
        for (let i = 1; i <= count; i++) {
          const current = updated[i] ?? 48;
          const drift = (Math.random() - 0.5) * 0.1;
          let next = current + drift;
          if (next < 46) next = 46;
          if (next > 50) next = 50;
          updated[i] = next;
        }
        return updated;
      });

      // Update power based on voltage and current
      setSimPowerById(prev => {
        const updated: Record<number, number> = { ...prev };
        for (let i = 1; i <= count; i++) {
          const voltage = simVoltageById[i] ?? 48;
          const current = simCurrentById[i] ?? 3;
          updated[i] = voltage * current;
        }
        return updated;
      });

    }, 500); // Update every half second for more responsive temperature

    return () => clearInterval(interval);
  }, [config.rectifiers?.rectifierCount, fanRpmById, simVoltageById, simCurrentById]);

  // Input handler
  type ConfigSection = keyof typeof config;
  type ConfigField = string;
  const handleChange = (section: ConfigSection, field: ConfigField, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Kaydet
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post("/api/config", config);
      toast({ title: t.settingsSavedTitle, description: t.settingsSavedDescription });
    } catch {
      toast({ title: t.settingsSaveErrorTitle, description: t.settingsSaveErrorDescription, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Kontrol Paneli için modern ve ikonlu/grafik alanlı tasarım
  if (currentContent === "dashboard") {
    return (
      <main className="flex-1 p-6 overflow-y-auto max-h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard}</h2>
          <p className="text-gray-600">{t.powerSystemStatusSummary}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <DashboardPowerChart currentLanguage={currentLanguage} />
          {/* ... diğer dashboard kartları ... */}
        </div>
        {/* ... diğer dashboard içeriği ... */}
      </main>
    );
  }

  if (currentContent === "sistem-genel-bakis") {
    // Sistem Genel Bakış için klasik sade kartlar ve tablo
    return (
      <main className="flex-1 p-8 overflow-y-auto w-full h-full bg-gray-50">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.systemOverview}</h2>
          <p className="text-lg text-gray-600">{t.powerSystemStatusSummary}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 w-full">
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center bg-white shadow-sm">
            <div className="text-sm text-gray-500 mb-1">{t.gridStatus}</div>
            <div className="text-2xl font-extrabold text-gray-800">{systemData.gridStatus}</div>
          </div>
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center bg-white shadow-sm">
            <div className="text-sm text-gray-500 mb-1">{t.acVoltage}</div>
            <div className="text-2xl font-extrabold text-gray-800">{systemData.acVoltage}</div>
          </div>
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center bg-white shadow-sm">
            <div className="text-sm text-gray-500 mb-1">{t.totalPower}</div>
            <div className="text-2xl font-extrabold text-gray-800">{systemData.totalPower}</div>
          </div>
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col items-center bg-white shadow-sm">
            <div className="text-sm text-gray-500 mb-1">{t.frequency}</div>
            <div className="text-2xl font-extrabold text-gray-800">{systemData.frequency}</div>
          </div>
        </div>
        <div className="overflow-x-auto w-full flex justify-center">
          <table className="border-collapse w-full max-w-4xl bg-white border border-gray-200 rounded-xl shadow-sm">
            <tbody>
              <tr><td className="p-4 font-bold text-gray-700">{t.gridStatus}</td><td className="p-4 text-gray-800">{systemData.gridStatusDetail}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.gridACVoltage}</td><td className="p-4 text-gray-800">{systemData.gridACVoltage}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.gridACCurrent}</td><td className="p-4 text-gray-800">{systemData.gridACCurrent}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.totalActivePower}</td><td className="p-4 text-gray-800">{systemData.totalActivePower}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.acFrequency}</td><td className="p-4 text-gray-800">{systemData.acFrequency}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.gridQualityLevel}</td><td className="p-4 text-gray-800">{systemData.gridQuality}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.totalGridEnergyConsumption}</td><td className="p-4 text-gray-800">{systemData.totalGridConsumption}</td></tr>
              <tr><td className="p-4 font-bold text-gray-700">{t.totalGridPowerRecordTime}</td><td className="p-4 text-gray-800">{systemData.gridPowerRecordTime}</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    );
  }

  // Aktif Alarmlar sayfası
  if (currentContent === "aktif-alarm") {
    const activeAlarms = [
      { id: 1, type: t.criticalAlarm, message: t.dcOutputVoltageHigh, time: "10:30", status: "active" },
      { id: 2, type: t.warningAlarm, message: t.batteryTemperatureHigh, time: "09:45", status: "active" },
      { id: 3, type: t.infoAlarm, message: t.systemMaintenanceTime, time: "08:15", status: "acknowledged" }
    ];

    return (
      <main className="flex-1 p-6 overflow-y-auto max-h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.activeSystemAlarms}</p>
        </div>

        <div className="grid gap-4">
          {activeAlarms.map((alarm) => (
            <Card key={alarm.id} className={`border-l-4 ${
              alarm.type === t.criticalAlarm ? 'border-l-red-500' :
              alarm.type === t.warningAlarm ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className={`w-5 h-5 ${
                      alarm.type === t.criticalAlarm ? 'text-red-500' :
                      alarm.type === t.warningAlarm ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <h4 className="font-medium">{alarm.message}</h4>
                      <p className="text-sm text-gray-600">{alarm.time} - {alarm.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={alarm.status === 'active' ? 'destructive' : 'secondary'}>
                      {alarm.status === 'active' ? t.activeStatus : t.acknowledgedStatus}
                    </Badge>
                    <Button className="btn-outline btn-sm" onClick={() => {
                      if (alarm.status === 'active') {
                        toast({ title: t.acknowledgeButton, description: t.alarmAcknowledged || 'Alarm başarıyla onaylandı.' });
                      } else {
                        toast({ title: t.detailsButton, description: t.detailsSoon || 'Detaylar yakında eklenecek.' });
                      }
                    }}>
                      {alarm.status === 'active' ? t.acknowledgeButton : t.detailsButton}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  // Performans Verileri sayfası
  if (currentContent === "performans-verileri") {
    return (
      <main className="flex-1 p-6 overflow-y-auto max-h-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.systemPerformanceMetrics}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.powerConsumption24Hours}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <Activity className="w-12 h-12 text-gray-400" />
                <span className="ml-2 text-gray-500">{t.chartArea}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.voltageFluctuation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
                <Zap className="w-12 h-12 text-gray-400" />
                <span className="ml-2 text-gray-500">{t.chartArea}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Gauge className="w-8 h-8 text-netmon-blue mx-auto mb-2" />
              <h3 className="font-medium">{t.averageLoad}</h3>
              <p className="text-2xl font-bold text-netmon-blue">68%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Thermometer className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-medium">{t.averageTemperature}</h3>
              <p className="text-2xl font-bold text-orange-500">42°C</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">{t.systemEfficiency}</h3>
              <p className="text-2xl font-bold text-green-500">95.2%</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // GPS/Konum Bilgileri sayfası
  if (currentContent === "konum-bilgileri") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.gpsLocationSettings}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
{t.gpsCoordinates}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.latitude}</Label>
                <Input defaultValue="39.9334" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.longitude}</Label>
                <Input defaultValue="32.8597" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.altitude}</Label>
                <Input defaultValue="850 m" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.gpsStatus}</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">{t.gpsConnected} - 12 {t.satellites}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
{t.timeSettings}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.systemTime}</Label>
                <Input defaultValue={new Date().toLocaleString('tr-TR')} readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.timezone}</Label>
                <Input defaultValue={t.timezoneValue} readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.ntpServer}</Label>
                <Input defaultValue="pool.ntp.org" className="mt-1" />
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: t.settingsSavedTitle, description: t.settingsSavedDescription })}>
                <Clock className="w-4 h-4 mr-2" />
{t.updateTime}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Pil Durumu sayfası - Gerçek zamanlı veri ile
  if (currentContent === "pil-durumu") {
    const { data: rawBatteryData, lastUpdate } = hardwareDataResult;
    const batteryData = Array.isArray(rawBatteryData) ? rawBatteryData : [];

    // Toplam değerleri ve otomatik hesaplamaları güvenli şekilde yap
    const totalVoltage = batteryData.reduce((sum, battery) => sum + (battery.voltage || 0), 0);
    const totalCurrent = batteryData.reduce((sum, battery) => sum + (battery.current || 0), 0);
    const totalPower = batteryData.reduce((sum, battery) => sum + ((battery.voltage || 0) * (battery.current || 0)), 0); // W
    const averageTemperature = batteryData.length > 0 
      ? batteryData.reduce((sum, battery) => sum + (battery.temperature || 0), 0) / batteryData.length 
      : 0;
    // Enerji örneği: 1 saatlik ölçüm için (gerçek uygulamada süreyi backend'den almak gerekir)
    const totalEnergy = totalPower * 1 / 1000; // kWh (örnek: 1 saatlik)
    // Ortalama kapasite yüzdesi
    const averageCapacity = batteryData.length > 0 
      ? batteryData.reduce((sum, battery) => sum + (battery.capacityPercent || 0), 0) / batteryData.length
      : 0;

    // 1. Güç faktörü (Power Factor) hesaplaması için örnek veri ve formül
    const powerFactor = 0.92; // Örnek değer, ileride backend'den alınabilir
    // 2. THD (Toplam Harmonik Bozulma) için örnek veri
    const thdVoltage = 2.1; // %
    const thdCurrent = 3.4; // %
    // 3. Yük oranı (Load Ratio) için örnek veri ve formül
    const maxPowerCapacity = 10_000; // W, örnek kapasite
    const loadRatio = totalPower && maxPowerCapacity ? (totalPower / maxPowerCapacity) * 100 : 0;
    // 4. Pil sağlık endeksi (SOH) için örnek veri ve formül
    const nominalCapacity = 100; // Ah, örnek
    const soh = batteryData && batteryData.length > 0 ? (batteryData.reduce((sum, b) => sum + (b.capacityPercent || 0), 0) / (batteryData.length * nominalCapacity)) * 100 : 100;
    // 5. Enerji verimliliği için örnek veri ve formül
    const inputEnergy = 1000; // Wh, örnek
    const outputEnergy = 950; // Wh, örnek
    const energyEfficiency = inputEnergy ? (outputEnergy / inputEnergy) * 100 : 100;
    // 6. Ortalama ve pik güç tüketimi için örnek veri ve formül
    const powerReadings = [800, 1200, 950, 1100, 1000, 1300, 900]; // W, örnek geçmiş veriler
    const avgPower = powerReadings.length > 0 ? powerReadings.reduce((a, b) => a + b, 0) / powerReadings.length : 0;
    const peakPower = powerReadings.length > 0 ? Math.max(...powerReadings) : 0;
    // 7. Akü şarj/deşarj döngü sayısı için örnek veri
    const batteryCycles = 152; // Örnek

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.batteryStatus}</h2>
          <p className="text-gray-600">{t.batteryGroup}</p>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              {t.lastUpdate}: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {batteryData.map((battery) => {
            const getBatteryStatus = () => {
              if (battery.testInProgress) return 'testing';
              if (battery.isCharging) return 'charging';
              if (battery.capacityPercent < 20) return 'warning';
              return 'normal';
            };

            const status = getBatteryStatus();
            const getBorderColor = () => {
              switch (status) {
                case 'charging': return 'border-l-green-500';
                case 'warning': return 'border-l-red-500';
                case 'testing': return 'border-l-blue-500';
                default: return 'border-l-gray-500';
              }
            };

            const getIconColor = () => {
              switch (status) {
                case 'charging': return 'text-green-500';
                case 'warning': return 'text-red-500';
                case 'testing': return 'text-blue-500';
                default: return 'text-gray-500';
              }
            };

            // Anlık güç hesabı (P = V * I)
            const power = (battery.voltage || 0) * (battery.current || 0);

            return (
              <Card key={battery.batteryId} className={`border-l-4 ${getBorderColor()}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{t.batteryNumber} {battery.batteryId}</h3>
                    <Battery className={`w-5 h-5 ${getIconColor()}`} />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{t.voltage}:</span>
                      <span className="font-medium">{battery.voltage.toFixed(1)}V</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.current}:</span>
                      <span className="font-medium">{battery.current.toFixed(1)}A</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Güç:</span>
                      <span className="font-medium">{power.toFixed(1)}W</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.temperature}:</span>
                      <span className="font-medium">{battery.temperature.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.capacity}:</span>
                      <span className="font-medium">{battery.capacityPercent.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Badge 
                    variant={status === 'charging' || status === 'normal' ? 'default' : 'secondary'}
                    className="mt-2 w-full justify-center"
                  >
                    {status === 'charging' && t.chargingStatus}
                    {status === 'warning' && t.warningStatus}
                    {status === 'testing' && (currentLanguage === 'en' ? 'Testing' : 'Test Yapılıyor')}
                    {status === 'normal' && t.normal}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.batteryGroupSummary}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-netmon-blue">{totalVoltage.toFixed(1)}V</div>
                <div className="text-sm text-gray-600">{t.totalVoltage}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalCurrent.toFixed(1)}A</div>
                <div className="text-sm text-gray-600">{t.totalCurrent}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{averageTemperature.toFixed(1)}°C</div>
                <div className="text-sm text-gray-600">{t.averageTemperature}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalPower.toFixed(1)}W</div>
                <div className="text-sm text-gray-600">Toplam Güç</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{totalEnergy.toFixed(2)} kWh</div>
                <div className="text-sm text-gray-600">Toplam Enerji (örnek)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{averageCapacity.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Ortalama Kapasite</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{powerFactor.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Güç Faktörü</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{thdVoltage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">THD (Gerilim)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{thdCurrent.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">THD (Akım)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{loadRatio.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Yük Oranı</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{soh.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">SOH</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{energyEfficiency.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Enerji Verimliliği</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{avgPower.toFixed(0)} W</div>
                <div className="text-sm text-gray-600">Ortalama Güç</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{peakPower.toFixed(0)} W</div>
                <div className="text-sm text-gray-600">Pik Güç</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{batteryCycles}</div>
                <div className="text-sm text-gray-600">Akü Şarj/Deşarj Döngüsü</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Site Yapılandırması sayfası
  if (currentContent === "site-yapilandirmasi") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.systemSettingsConfig}</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">{t.general}</TabsTrigger>
            <TabsTrigger value="network">{t.network}</TabsTrigger>
            <TabsTrigger value="security">{t.security}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.siteIdentity}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t.siteIdentity}</Label>
                  <Input defaultValue="Ankara Ana Merkez" className="mt-1" />
                </div>
                <div>
                  <Label>Site ID</Label>
                  <Input defaultValue="ANK-001" className="mt-1" />
                </div>
                <div>
                  <Label>{t.locationInfo}</Label>
                  <Input defaultValue="Ankara, Türkiye" className="mt-1" />
                </div>
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bilgileri Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wifi className="w-5 h-5 mr-2" />
                  {t.networkConfiguration}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t.ipAddress}</Label>
                  <Input defaultValue="192.168.1.100" className="mt-1" />
                </div>
                <div>
                  <Label>{t.subnetMask}</Label>
                  <Input defaultValue="255.255.255.0" className="mt-1" />
                </div>
                <div>
                  <Label>{t.gateway}</Label>
                  <Input defaultValue="192.168.1.1" className="mt-1" />
                </div>
                <div>
                  <Label>{t.dnsServer}</Label>
                  <Input defaultValue="8.8.8.8" className="mt-1" />
                </div>
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bilgileri Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.security}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t.communityString}</Label>
                  <Input type="password" defaultValue="public" className="mt-1" />
                </div>
                <div>
                  <Label>{t.sshPort}</Label>
                  <Input defaultValue="22" className="mt-1" />
                </div>
                <div>
                  <Label>{t.https}</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input type="checkbox" defaultChecked />
                    <span>{t.enabled}</span>
                  </div>
                </div>
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Bilgileri Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    );
  }

  // Ağ Yapılandırması sayfası
  if ((currentContent as ContentType) === "ag-yapilandirmasi") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'tr' ? 'Ağ ayarları ve iletişim protokolleri' : 'Network settings and communication protocols'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>IP Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>IP Adresi</Label>
                <Input defaultValue="192.168.1.100" className="mt-1" />
              </div>
              <div>
                <Label>Alt Ağ Maskesi</Label>
                <Input defaultValue="255.255.255.0" className="mt-1" />
              </div>
              <div>
                <Label>Ağ Geçidi</Label>
                <Input defaultValue="192.168.1.1" className="mt-1" />
              </div>
              <div>
                <Label>DNS Sunucu</Label>
                <Input defaultValue="8.8.8.8" className="mt-1" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">DHCP Kullan</span>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bilgileri Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SNMP Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SNMP Portu</Label>
                <Input defaultValue="161" className="mt-1" />
              </div>
              <div>
                <Label>Community String</Label>
                <Input defaultValue="public" type="password" className="mt-1" />
              </div>
              <div>
                <Label>SNMP Versiyonu</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>SNMPv1</option>
                  <option>SNMPv2c</option>
                  <option>SNMPv3</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">SNMP Etkin</span>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bilgileri Kaydet
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Web Server</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>HTTP Portu</Label>
                <Input defaultValue="80" className="mt-1" />
              </div>
              <div>
                <Label>HTTPS Portu</Label>
                <Input defaultValue="443" className="mt-1" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">SSL Zorla</span>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bilgileri Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modbus TCP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Modbus Portu</Label>
                <Input defaultValue="502" className="mt-1" />
              </div>
              <div>
                <Label>Slave ID</Label>
                <Input defaultValue="1" className="mt-1" />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Modbus Etkin</span>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bilgileri Kaydet
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firewall</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Firewall:</span>
                <Badge variant="outline" className="text-green-600">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>SSH:</span>
                <Badge variant="outline" className="text-yellow-600">Kısıtlı</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Telnet:</span>
                <Badge variant="outline" className="text-red-600">Kapalı</Badge>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bilgileri Kaydet
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Geçmiş Alarmlar sayfası
  if (currentContent === "gecmis-alarmlar") {
    const historyAlarms = [
      { id: 1, type: "Kritik", message: "AC Güç Kesintisi", time: "08.01.2024 14:30", duration: "2 saat", resolved: true },
      { id: 2, type: "Uyarı", message: "Pil Kapasitesi Düşük", time: "07.01.2024 09:15", duration: "30 dakika", resolved: true },
      { id: 3, type: "Bilgi", message: "Rutin Bakım Tamamlandı", time: "05.01.2024 16:00", duration: "1 saat", resolved: true },
      { id: 4, type: "Kritik", message: "Doğrultucu Arızası", time: "03.01.2024 11:45", duration: "4 saat", resolved: true },
      { id: 5, type: "Uyarı", message: "Sıcaklık Yüksek", time: "02.01.2024 13:20", duration: "45 dakika", resolved: true }
    ];

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.alarmHistoryDescription}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.alarmHistoryTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">{t.type}</th>
                    <th className="text-left py-3">{t.alarmMessage}</th>
                    <th className="text-left py-3">{t.dateTime}</th>
                    <th className="text-left py-3">{t.duration}</th>
                    <th className="text-left py-3">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyAlarms.map((alarm) => (
                    <tr key={alarm.id}>
                      <td className="py-3">
                        <Badge variant={
                          alarm.type === 'Kritik' ? 'destructive' :
                          alarm.type === 'Uyarı' ? 'secondary' : 'default'
                        }>
                          {alarm.type}
                        </Badge>
                      </td>
                      <td className="py-3 font-medium">{alarm.message}</td>
                      <td className="py-3 text-gray-600">{alarm.time}</td>
                      <td className="py-3 text-gray-600">{alarm.duration}</td>
                      <td className="py-3">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-green-600">{t.resolved}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Yazılım Yükseltme sayfası
  if (currentContent === "yazilim-yukseltme") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'System software update and management' : 'Sistem yazılımı güncelleme ve yönetimi'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.versionInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.systemVersion}</Label>
                <Input defaultValue="v2.1.4" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.buildDate}</Label>
                <Input defaultValue="15.12.2023" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.kernelVersion}</Label>
                <Input defaultValue="5.4.0-netmon" readOnly className="mt-1" />
              </div>
              <div>
                <Label>{t.lastUpdate}</Label>
                <Input defaultValue="20.12.2023 14:30" readOnly className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.update}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t.newVersionCheck}</Label>
                <div className="flex items-center mt-2 space-x-2">
                  <Button className="btn-outline flex-1">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t.checkForUpdates}
                  </Button>
                </div>
              </div>
              <Separator />
              <div>
                <Label>{t.manualUpdate}</Label>
                <div className="mt-2 space-y-2">
                  <Input type="file" accept=".bin,.tar.gz" />
                  <Button className="w-full btn-destructive" onClick={() => toast({ title: 'Dosya yüklendi', description: 'Dosya başarıyla yüklendi.' })}>
                    <Power className="w-4 h-4 mr-2" />
                    {t.uploadAndRestart}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                <strong>{t.warning}:</strong> {t.updateWarning}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Sistem Bilgileri sayfası
  if (currentContent === "sistem-bilgileri") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'Hardware and software details' : 'Donanım ve yazılım detayları'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.hardwareInformation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  [t.processor, "ARM Cortex-A53 Quad Core"],
                  [t.memoryRAM, "2GB DDR4"],
                  [t.storage, "32GB eMMC"],
                  [t.ethernet, "10/100/1000 Mbps"],
                  [t.serialPort, "2x RS485, 1x RS232"],
                  ["GPIO", currentLanguage === 'en' ? "16 Pin Digital I/O" : "16 Pin Dijital I/O"],
                  [t.powerConsumption, "12W"],
                  [t.operatingTemperature, "-20°C ~ +70°C"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-medium">{label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.softwareInformation}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  [t.operatingSystem, "Linux 5.4.0-netmon"],
                  [t.applicationVersion, "NetMon v2.1.4"],
                  [t.database, "SQLite 3.36.0"],
                  [t.webServer, "Nginx 1.20.1"],
                  ["SNMP", "Net-SNMP 5.9"],
                  ["Modbus", "libmodbus 3.1.6"],
                  [t.uptime, currentLanguage === 'en' ? "47 days, 12 hours" : "47 gün, 12 saat"],
                  [t.lastRestart, "15.11.2023 09:30"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-medium">{label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.systemResources}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-netmon-blue mb-2">32%</div>
                <div className="text-sm text-gray-600">{t.cpuUsage}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-netmon-blue h-2 rounded-full" style={{width: '32%'}}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">58%</div>
                <div className="text-sm text-gray-600">{t.ramUsage}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '58%'}}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">23%</div>
                <div className="text-sm text-gray-600">{t.diskUsage}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{width: '23%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // İşlem Kaydı sayfası
  if (currentContent === "islem-kaydi") {
    const operationLogs = [
      { time: "11.01.2024 10:15", user: "admin", action: currentLanguage === 'en' ? "System restarted" : "Sistem yeniden başlatıldı", level: "info" },
      { time: "11.01.2024 09:45", user: "netmon", action: currentLanguage === 'en' ? "Battery test parameters updated" : "Pil test parametreleri güncellendi", level: "config" },
      { time: "11.01.2024 09:30", user: "netmon", action: currentLanguage === 'en' ? "AC voltage alarm threshold changed" : "AC voltaj alarm eşiği değiştirildi", level: "config" },
      { time: "11.01.2024 08:20", user: "system", action: currentLanguage === 'en' ? "Automatic battery test started" : "Otomatik pil test başlatıldı", level: "auto" },
      { time: "11.01.2024 07:15", user: "netmon", action: currentLanguage === 'en' ? "User logged in" : "Kullanıcı giriş yaptı", level: "auth" },
      { time: "10.01.2024 23:30", user: "system", action: currentLanguage === 'en' ? "Daily report generated" : "Günlük rapor oluşturuldu", level: "auto" },
      { time: "10.01.2024 18:45", user: "admin", action: currentLanguage === 'en' ? "Network settings updated" : "Ağ ayarları güncellendi", level: "config" },
      { time: "10.01.2024 15:20", user: "system", action: currentLanguage === 'en' ? "SNMP trap sent" : "SNMP trap gönderildi", level: "alert" }
    ];

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{t.operationLogDescription}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t.systemLogRecords}
              <Button className="btn-outline btn-sm" onClick={() => toast({ title: 'Kayıtlar dışa aktarıldı', description: 'Log kayıtları başarıyla indirildi.' })}>
                <Power className="w-4 h-4 mr-2" />
                {t.exportLog}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {operationLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      log.level === 'alert' ? 'bg-red-500' :
                      log.level === 'config' ? 'bg-blue-500' :
                      log.level === 'auth' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-gray-600">
                        {log.time} - {t.user}: {log.user}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    log.level === 'alert' ? 'destructive' :
                    log.level === 'config' ? 'default' :
                    log.level === 'auth' ? 'secondary' : 'outline'
                  }>
                    {log.level === 'alert' && t.alertLevel}
                    {log.level === 'config' && t.configLevel}
                    {log.level === 'auth' && t.authLevel}
                    {log.level === 'auto' && t.autoLevel}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Saat sayfası
  if (currentContent === "saat") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'System time and time synchronization' : 'Sistem saati ve zaman senkronizasyonu'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {t.systemTime}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold text-netmon-blue mb-2">
                  {new Date().toLocaleTimeString(currentLanguage === 'en' ? 'en-US' : 'tr-TR')}
                </div>
                <div className="text-lg text-gray-600">
                  {new Date().toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'tr-TR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'Manual Time Setting' : 'Manuel Saat Ayarı'}</Label>
                <Input type="datetime-local" className="mt-1" />
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: t.settingsSavedTitle, description: t.settingsSavedDescription })}>
                <Settings className="w-4 h-4 mr-2" />
                {t.updateTime}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{currentLanguage === 'en' ? 'NTP Settings' : 'NTP Ayarları'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{currentLanguage === 'en' ? 'NTP Server 1' : 'NTP Sunucu 1'}</Label>
                <Input defaultValue="pool.ntp.org" className="mt-1" />
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'NTP Server 2' : 'NTP Sunucu 2'}</Label>
                <Input defaultValue="time.google.com" className="mt-1" />
              </div>
              <div>
                <Label>{t.timezone}</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option value="Europe/Istanbul">{currentLanguage === 'en' ? 'UTC+3 (Turkey)' : 'UTC+3 (Türkiye)'}</option>
                  <option value="UTC">UTC+0 (Greenwich)</option>
                  <option value="Europe/London">{currentLanguage === 'en' ? 'UTC+1 (London)' : 'UTC+1 (Londra)'}</option>
                </select>
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'Synchronization Status' : 'Senkronizasyon Durumu'}</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">{currentLanguage === 'en' ? 'Synchronized - Last: 2 minutes ago' : 'Senkronize - Son: 2 dakika önce'}</span>
                </div>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'NTP Senkronizasyonu', description: 'NTP senkronizasyonu başlatıldı.' })}>
                <Wifi className="w-4 h-4 mr-2" />
                {currentLanguage === 'en' ? 'Force NTP Synchronization' : 'NTP Senkronizasyonu Zorla'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Sürüm Bilgisi sayfası
  if (currentContent === "surum-bilgisi") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'Software and hardware version details' : 'Yazılım ve donanım sürüm detayları'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{currentLanguage === 'en' ? 'Main Software' : 'Ana Yazılım'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  [currentLanguage === 'en' ? "Product Name" : "Ürün Adı", currentLanguage === 'en' ? "NetMon Power System" : "NetMon Güç Sistemi"],
                  [currentLanguage === 'en' ? "Main Version" : "Ana Sürüm", "v2.1.4"],
                  [currentLanguage === 'en' ? "Build Number" : "Derleme No", "20231215-1430"],
                  [currentLanguage === 'en' ? "Build Date" : "Derleme Tarihi", currentLanguage === 'en' ? "December 15, 2023" : "15 Aralık 2023"],
                  ["Git Commit", "a7b3c9d"],
                  [currentLanguage === 'en' ? "Developer" : "Geliştirici", "NetMon Technologies"],
                  [currentLanguage === 'en' ? "License" : "Lisans", "Commercial"],
                  [currentLanguage === 'en' ? "Support" : "Destek", "support@netmon.com.tr"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-medium">{label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{currentLanguage === 'en' ? 'Hardware Versions' : 'Donanım Sürümleri'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  [currentLanguage === 'en' ? "Main Board" : "Ana Kart", "NetMon-HW v1.2"],
                  ["CPU Board", "ARM-A53 v2.0"],
                  ["Power Board", "PWR-CTRL v1.1"],
                  ["IO Board", "DIO-16 v1.0"],
                  [currentLanguage === 'en' ? "GPS Module" : "GPS Modül", "GPS-L86 v1.3"],
                  [currentLanguage === 'en' ? "GSM Module" : "GSM Modül", "SIM7600 v2.1"],
                  ["Bootloader", "U-Boot 2022.01"],
                  ["FPGA", "Cyclone IV v1.0"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-medium">{label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{currentLanguage === 'en' ? 'Module Versions' : 'Modül Sürümleri'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "SNMP Agent", version: "v3.2.1", status: currentLanguage === 'en' ? "Active" : "Aktif" },
                { name: "Modbus TCP", version: "v2.4.0", status: currentLanguage === 'en' ? "Active" : "Aktif" },
                { name: currentLanguage === 'en' ? "Web Interface" : "Web Arayüzü", version: "v1.8.3", status: currentLanguage === 'en' ? "Active" : "Aktif" },
                { name: currentLanguage === 'en' ? "Data Logger" : "Veri Kaydedici", version: "v1.5.2", status: currentLanguage === 'en' ? "Active" : "Aktif" },
                { name: currentLanguage === 'en' ? "Alarm Engine" : "Alarm Motoru", version: "v2.1.0", status: currentLanguage === 'en' ? "Active" : "Aktif" },
                { name: currentLanguage === 'en' ? "Report Generator" : "Rapor Üretici", version: "v1.3.1", status: currentLanguage === 'en' ? "Active" : "Aktif" }
              ].map((module) => (
                <Card key={module.name} className="p-4">
                  <h4 className="font-medium mb-2">{module.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{module.version}</p>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {module.status}
                  </Badge>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Dijital Güç sayfası
  if (currentContent === "dijital-guc") {
    if (!config.rectifiers) return null;
    // Kullanıcıdan gelen değerleri kullan
    const rectifierCount = Number(config.rectifiers.rectifierCount) || 0;
    const inputVoltageRange = config.rectifiers.inputCurrent || '-';
    // Voltaj aralığını işle
    let outputVoltage = '-';
    let current = '-';
    if (inputVoltageRange && inputVoltageRange.includes('-')) {
      const match = inputVoltageRange.match(/(\d+)[^\d]+(\d+)/);
      if (match) {
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        outputVoltage = ((min + max) / 2).toFixed(1);
        current = (Math.max(5, Math.min(20, (max - min) / 10))).toFixed(1);
      }
    }
    // Modül dizisini oluştur
    const powerModules = Array.from({ length: rectifierCount }, (_, idx) => ({
      id: idx + 1,
      name: currentLanguage === 'en' ? `Rectifier ${idx + 1}` : `Doğrultucu ${idx + 1}`,
      voltage: outputVoltage + 'V',
      current: current + 'A',
      power: outputVoltage !== '-' && current !== '-' ? ((parseFloat(outputVoltage) * parseFloat(current)) / 1000).toFixed(2) + 'kW' : '-',
      status: 'normal',
      temp: Number(35 + Math.random() * 10).toFixed(1) + '°C'
    }));

    // Sistem Özeti hesaplamaları
    const totalPower = outputVoltage !== '-' && current !== '-' ? (parseFloat(outputVoltage) * parseFloat(current) * rectifierCount / 1000).toFixed(2) : '-';
    const activeModules = rectifierCount;
    const efficiency = '94.2%'; // Sabit örnek
    const loadRatio = '72%'; // Sabit örnek

    // Kontrol Ayarları (örnek: hedef voltaj, akım limiti, sıcaklık alarmı)
    const targetVoltage = outputVoltage !== '-' ? outputVoltage + 'V' : '-';
    const currentLimit = current !== '-' ? current + 'A' : '-';
    const tempAlarm = config.rectifiers.tempAlarm || '-';

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'Rectifier modules and power distribution system' : 'Doğrultucu modülleri ve güç dağıtım sistemi'}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {powerModules.map((module) => (
            <Card key={module.id} className={`border-l-4 ${
              module.status === 'normal' ? 'border-l-green-500' : 'border-l-gray-400'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{module.name}</h3>
                  <Power className={`w-5 h-5 ${
                    module.status === 'normal' ? 'text-green-500' : 'text-gray-400'
                  }`} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Voltaj:</span>
                    <span className="font-medium">{module.voltage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akım:</span>
                    <span className="font-medium">{module.current}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Güç:</span>
                    <span className="font-medium">{module.power}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sıcaklık:</span>
                    <span className="font-medium">{module.temp}</span>
                  </div>
                </div>
                <Badge 
                  variant={module.status === 'normal' ? 'default' : 'secondary'}
                  className="mt-3 w-full justify-center"
                >
                  {module.status === 'normal' ? t.running : t.stopped}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sistem Özeti */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Özeti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Toplam Güç:</span>
                <span className="font-bold text-lg">{totalPower} kW</span>
              </div>
              <div className="flex justify-between">
                <span>Aktif Modül::</span>
                <span className="font-bold">{activeModules}/{activeModules}</span>
              </div>
              <div className="flex justify-between">
                <span>Verimlilik:</span>
                <span className="font-bold text-green-600">{efficiency}</span>
              </div>
              <div className="flex justify-between">
                <span>Yük Oranı::</span>
                <span className="font-bold">{loadRatio}</span>
              </div>
            </CardContent>
          </Card>
          {/* Kontrol Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>Kontrol Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label>Hedef Voltaj</Label>
                <Input value={targetVoltage} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Akım Limiti</Label>
                <Input value={currentLimit} readOnly className="mt-1" />
              </div>
              <div>
                <Label>Sıcaklık Alarmı</Label>
                <Input value={tempAlarm + '°C'} readOnly className="mt-1" />
              </div>
              <Button className="w-full btn-outline mt-2" disabled>
                <Settings className="w-4 h-4 mr-2" />
                Ayarları Uygula
              </Button>
            </CardContent>
          </Card>
          {/* Alarm Durumu */}
          <Card>
            <CardHeader>
              <CardTitle>Alarm Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Aşırı Sıcaklık::</span>
                <Badge variant="outline" className="text-green-600">Normal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Aşırı Akım::</span>
                <Badge variant="outline" className="text-green-600">Normal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Voltaj Hatası::</span>
                <Badge variant="outline" className="text-green-600">Normal</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Haberleşme::</span>
                <Badge variant="outline" className="text-green-600">Bağlı</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // AC Giriş Dağıtımı sayfası
  if (currentContent === "ac-giris-dagitimi") {
    const acInputs = [
      { phase: "L1", voltage: "230.5V", current: "12.3A", freq: "50.0Hz", power: "2.83kW", status: "normal" },
      { phase: "L2", voltage: "231.2V", current: "11.8A", freq: "50.0Hz", power: "2.73kW", status: "normal" },
      { phase: "L3", voltage: "229.8V", current: "12.1A", freq: "50.0Hz", power: "2.78kW", status: "normal" }
    ];

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AC Giriş Dağıtımı</h2>
          <p className="text-gray-600">Üç fazlı AC giriş voltajları ve güç dağıtımı</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {acInputs.map((input) => (
            <Card key={input.phase}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {input.phase} Fazı
                  <Zap className="w-5 h-5 text-netmon-blue" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-netmon-blue mb-1">{input.voltage}</div>
                    <div className="text-sm text-gray-600">Gerilim</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Akım:</span>
                      <div className="font-medium">{input.current}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Frekans:</span>
                      <div className="font-medium">{input.freq}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Güç:</span>
                      <div className="font-medium">{input.power}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Durum:</span>
                      <Badge variant="outline" className="text-green-600">Normal</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Şebeke Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Toplam Güç:</span>
                  <span className="font-bold text-netmon-blue">8.34 kW</span>
                </div>
                <div className="flex justify-between">
                  <span>Güç Faktörü:</span>
                  <span className="font-medium">0.98</span>
                </div>
                <div className="flex justify-between">
                  <span>THD (Gerilim):</span>
                  <span className="font-medium">2.1%</span>
                </div>
                <div className="flex justify-between">
                  <span>THD (Akım):</span>
                  <span className="font-medium">3.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Dengesizlik:</span>
                  <span className="font-medium text-green-600">0.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alarm Eşikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Yüksek Voltaj Eşiği</Label>
                <Input defaultValue="250V" className="mt-1" />
              </div>
              <div>
                <Label>Düşük Voltaj Eşiği</Label>
                <Input defaultValue="200V" className="mt-1" />
              </div>
              <div>
                <Label>Aşırı Akım Eşiği</Label>
                <Input defaultValue="20A" className="mt-1" />
              </div>
              <div>
                <Label>Frekans Toleransı</Label>
                <Input defaultValue="±2Hz" className="mt-1" />
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: t.settingsSavedTitle, description: t.settingsSavedDescription })}>
                <Settings className="w-4 h-4 mr-2" />
                Eşikleri Kaydet
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // DC Çıkış Dağıtımı sayfası
  if (currentContent === "dc-cikis-dagitimi") {
    const dcOutputs = [
      { circuit: "DC-1", voltage: "53.5V", current: "15.2A", power: "813W", load: "Telecom", status: "active" },
      { circuit: "DC-2", voltage: "53.4V", current: "8.7A", power: "464W", load: "Security", status: "active" },
      { circuit: "DC-3", voltage: "53.6V", current: "12.1A", power: "649W", load: "Network", status: "active" },
      { circuit: "DC-4", voltage: "53.5V", current: "6.3A", power: "337W", load: "Lighting", status: "active" },
      { circuit: "DC-5", voltage: "0.0V", current: "0.0A", power: "0W", load: "Spare", status: "disabled" },
      { circuit: "DC-6", voltage: "0.0V", current: "0.0A", power: "0W", load: "Spare", status: "disabled" }
    ];

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">DC Çıkış Dağıtımı</h2>
          <p className="text-gray-600">DC yük dağıtım devreleri ve güç tüketimi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {dcOutputs.map((output) => (
            <Card key={output.circuit} className={`border-l-4 ${
              output.status === 'active' ? 'border-l-green-500' : 'border-l-gray-400'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{output.circuit}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    output.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Voltaj:</span>
                    <span className="font-medium">{output.voltage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Akım:</span>
                    <span className="font-medium">{output.current}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Güç:</span>
                    <span className="font-medium">{output.power}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yük:</span>
                    <span className="font-medium">{output.load}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <Badge variant={output.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center">
                    {output.status === 'active' ? 'Aktif' : 'Kapalı'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Yük Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Toplam DC Güç:</span>
                  <span className="font-bold text-netmon-blue">2.26 kW</span>
                </div>
                <div className="space-y-3">
                  {dcOutputs.filter(o => o.status === 'active').map((output) => (
                    <div key={output.circuit}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{output.load}:</span>
                        <span className="text-sm font-medium">{output.power}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-netmon-blue h-2 rounded-full" 
                          style={{width: `${(parseInt(output.power) / 813) * 100}%`}}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Devre Koruma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Aşırı Akım Koruması</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Aktif</span>
                </div>
              </div>
              <div>
                <Label>Kısa Devre Koruması</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Aktif</span>
                </div>
              </div>
              <div>
                <Label>Ters Polarite Koruması</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Aktif</span>
                </div>
              </div>
              <Separator />
              <div>
                <Label>Devre Kontrol</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button className="btn-outline btn-sm" onClick={() => toast({ title: 'Devre kapatıldı', description: 'DC-1 devresi başarıyla kapatıldı.' })}>DC-1 Kapat</Button>
                  <Button className="btn-outline btn-sm" onClick={() => toast({ title: 'Devre kapatıldı', description: 'DC-2 devresi başarıyla kapatıldı.' })}>DC-2 Kapat</Button>
                  <Button className="btn-outline btn-sm" onClick={() => toast({ title: 'Devre kapatıldı', description: 'DC-3 devresi başarıyla kapatıldı.' })}>DC-3 Kapat</Button>
                  <Button className="btn-outline btn-sm" onClick={() => toast({ title: 'Devre kapatıldı', description: 'DC-4 devresi başarıyla kapatıldı.' })}>DC-4 Kapat</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Çalışma Bilgileri sayfası
  if (currentContent === "calisma-bilgileri") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Çalışma Bilgileri</h2>
          <p className="text-gray-600">Sistem operasyon bilgileri ve durum raporları</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Durumu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ["Çalışma Modu", "Otomatik", "normal"],
                  ["Ana Güç", "Şebeke", "normal"],
                  ["Yedek Güç", "Pil", "normal"],
                  ["Şarj Durumu", "Float Şarj", "normal"],
                  ["Load Transfer", "Normal", "normal"],
                  ["Generator", "Standby", "warning"],
                  ["Cooling Fan", "Çalışıyor", "normal"],
                  ["System Health", "İyi", "normal"]
                ].map(([label, value, status]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-medium">{label}:</span>
                    <div className="flex items-center">
                      <span className="mr-2">{value}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'normal' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Çalışma Süreleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ["Toplam Çalışma", "1247 gün, 8 saat"],
                  ["Şebeke Çalışma", "1245 gün, 2 saat"],
                  ["Pil Çalışma", "2 gün, 6 saat"],
                  ["Generator Çalışma", "4 saat, 30 dakika"],
                  ["Son Şebeke Kesintisi", "15.12.2023 14:30"],
                  ["Kesinti Süresi", "45 dakika"],
                  ["Pil Test Sayısı", "52 test"],
                  ["Son Pil Testi", "01.01.2024 02:00"]
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-medium">{label}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enerji İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-netmon-blue mb-1">2,847 kWh</div>
                  <div className="text-sm text-gray-600">Bu Ay Tüketim</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Günlük Ort.:</span>
                    <div className="font-medium">94.9 kWh</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Haftalık Ort.:</span>
                    <div className="font-medium">664 kWh</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Pik Güç:</span>
                    <div className="font-medium">9.2 kW</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Min Güç:</span>
                    <div className="font-medium">2.1 kW</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verimlilik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">95.8%</div>
                  <div className="text-sm text-gray-600">Genel Verimlilik</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>AC/DC Dönüşüm:</span>
                    <span className="font-medium">97.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pil Şarj/Deşarj:</span>
                    <span className="font-medium">94.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dağıtım Kayıpları:</span>
                    <span className="font-medium">1.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Çevre Koşulları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>İç Sıcaklık:</span>
                  <span className="font-medium">42°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Dış Sıcaklık:</span>
                  <span className="font-medium">18°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Nem Oranı:</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between">
                  <span>Fan Hızı:</span>
                  <span className="font-medium">2400 RPM</span>
                </div>
                <div className="flex justify-between">
                  <span>Kapı Durumu:</span>
                  <span className="font-medium text-green-600">Kapalı</span>
                </div>
                <div className="flex justify-between">
                  <span>Sigara Dedektörü:</span>
                  <span className="font-medium text-green-600">Normal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Pil Test Kayıtları sayfası
  if (currentContent === "pil-test-kayitlari") {
    const testRecords = [
      { date: "01.01.2024", type: "Otomatik", duration: "10 dakika", capacity: "87%", result: "Başarılı", temp: "24°C" },
      { date: "01.12.2023", type: "Manuel", duration: "15 dakika", capacity: "85%", result: "Başarılı", temp: "26°C" },
      { date: "01.11.2023", type: "Otomatik", duration: "10 dakika", capacity: "88%", result: "Başarılı", temp: "22°C" },
      { date: "01.10.2023", type: "Otomatik", duration: "10 dakika", capacity: "86%", result: "Başarılı", temp: "25°C" },
      { date: "15.09.2023", type: "Kapasite", duration: "2 saat", capacity: "84%", result: "Uyarı", temp: "28°C" }
    ];

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'en' ? 'Battery performance tests and capacity analysis' : 'Pil performans testleri ve kapasite analizi'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Kontrolü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Test Tipi</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>Hızlı Test (10dk)</option>
                  <option>Standart Test (30dk)</option>
                  <option>Kapasite Testi (2sa)</option>
                </select>
              </div>
              <div>
                <Label>Test Akımı</Label>
                <Input defaultValue="10A" className="mt-1" />
              </div>
              <div>
                <Label>Minimum Voltaj</Label>
                <Input defaultValue="10.8V/hücre" className="mt-1" />
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Test başlatıldı', description: 'Pil testi başlatıldı.' })}>
                <Power className="w-4 h-4 mr-2" />
                Test Başlat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Son Test Sonucu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-green-50 rounded-lg mb-4">
                <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
                <div className="text-sm text-gray-600">Pil Kapasitesi</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Test Tarihi:</span>
                  <span className="font-medium">01.01.2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Test Süresi:</span>
                  <span className="font-medium">10 dakika</span>
                </div>
                <div className="flex justify-between">
                  <span>Sonuç:</span>
                  <Badge variant="outline" className="text-green-600">Başarılı</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Programı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Otomatik Test</Label>
                <div className="flex items-center mt-1">
                  <input type="checkbox" defaultChecked />
                  <span className="ml-2">Otomatik test etkin</span>
                </div>
              </div>
              <div>
                <Label>Test Periyodu</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>Haftalık</option>
                  <option>Aylık</option>
                  <option>3 Aylık</option>
                </select>
              </div>
              <div>
                <Label>Test Saati</Label>
                <Input type="time" defaultValue="02:00" className="mt-1" />
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Program ayarlandı', description: 'Test programı başarıyla ayarlandı.' })}>
                <Settings className="w-4 h-4 mr-2" />
                Program Ayarla
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Geçmişi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Tarih</th>
                    <th className="text-left py-3">Test Tipi</th>
                    <th className="text-left py-3">Süre</th>
                    <th className="text-left py-3">Kapasite</th>
                    <th className="text-left py-3">Sıcaklık</th>
                    <th className="text-left py-3">Sonuç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {testRecords.map((record, index) => (
                    <tr key={index}>
                      <td className="py-3 font-medium">{record.date}</td>
                      <td className="py-3">{record.type}</td>
                      <td className="py-3">{record.duration}</td>
                      <td className="py-3 font-medium">{record.capacity}</td>
                      <td className="py-3">{record.temp}</td>
                      <td className="py-3">
                        <Badge variant={record.result === 'Başarılı' ? 'default' : 'secondary'}>
                          {record.result}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Çalışma Kontrolü sayfası
  if (currentContent === "calisma-kontrolu") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Çalışma Kontrolü</h2>
          <p className="text-gray-600">Sistem operasyon kontrol ve yönetimi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Kontrolü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sistem Durumu</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Çalışıyor</span>
                </div>
              </div>
              <div>
                <Label>Çalışma Modu</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>Otomatik</option>
                  <option>Manuel</option>
                  <option>Test</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Sistem başlatıldı', description: 'Sistem başarıyla başlatıldı.' })}>
                  <Power className="w-4 h-4 mr-2" />
                  Sistem Başlat
                </Button>
                <Button className="w-full btn-destructive" onClick={() => toast({ title: 'Sistem durduruldu', description: 'Sistem başarıyla durduruldu.' })}>
                  <Power className="w-4 h-4 mr-2" />
                  Sistem Durdur
                </Button>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Sistem yeniden başlatıldı', description: 'Sistem başarıyla yeniden başlatıldı.' })}>
                <Settings className="w-4 h-4 mr-2" />
                Yeniden Başlat
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Güç Kontrolü</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Ana Güç Kaynağı</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Şebeke Aktif</span>
                </div>
              </div>
              <div>
                <Label>Yedek Güç</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-blue-600">Pil Hazır</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Şebeke testi', description: 'Şebeke testi başarıyla gerçekleştirildi.' })}>
                  Şebeke Test
                </Button>
                <Button className="w-full btn-outline" onClick={() => toast({ title: 'Pil testi', description: 'Pil testi başarıyla gerçekleştirildi.' })}>
{currentLanguage === 'en' ? 'Battery Test' : 'Pil Test'}
                </Button>
              </div>
              <Button className="w-full btn-secondary" onClick={() => toast({ title: 'Transfer testi', description: 'Transfer testi başarıyla gerçekleştirildi.' })}>
                <Zap className="w-4 h-4 mr-2" />
                Transfer Test
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alarm Kontrolleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Alarm Sistemi:</span>
                <Badge variant="outline" className="text-green-600">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>SMS Bildirimi:</span>
                <Badge variant="outline" className="text-green-600">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Email Bildirimi:</span>
                <Badge variant="outline" className="t ext-green-600">Aktif</Badge>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Test alarmı gönderildi', description: 'Test alarmı başarıyla gönderildi.' })}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Test Alarmı Gönder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Veri Loglama</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Veri Kaydı:</span>
                <Badge variant="outline" className="text-green-600">Aktif</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Log Boyutu:</span>
                <span className="text-sm">2.4 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Disk Kullanımı:</span>
                <span className="text-sm">45%</span>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Log temizlendi', description: 'Log kayıtları başarıyla temizlendi.' })}>
                <Power className="w-4 h-4 mr-2" />
                Log Temizle
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ağ Bağlantısı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Ethernet:</span>
                <Badge variant="outline" className="text-green-600">Bağlı</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>WiFi:</span>
                <Badge variant="outline" className="text-gray-600">Kapalı</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>SNMP:</span>
                <Badge variant="outline" className="text-green-600">Aktif</Badge>
              </div>
              <Button className="w-full btn-outline" onClick={() => toast({ title: 'Bağlantı testi', description: 'Ethernet bağlantısı başarıyla test edildi.' })}>
                <Wifi className="w-4 h-4 mr-2" />
                Bağlantı Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Site Kimliği sayfası
  if (currentContent === "site-kimligi") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'tr' ? 'Tesis bilgileri ve site tanımlamaları' : 'Facility information and site definitions'}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Site Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Adı</Label>
                <Input defaultValue="Ankara Merkez Santral" className="mt-1" />
              </div>
              <div>
                <Label>Site Kodu</Label>
                <Input defaultValue="ANK-MS-001" className="mt-1" />
              </div>
              <div>
                <Label>Bölge</Label>
                <Input defaultValue="Ankara" className="mt-1" />
              </div>
              <div>
                <Label>Adres</Label>
                <textarea 
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md" 
                  rows={3}
                  defaultValue="Kızılay Mah. Atatürk Blv. No:123 Çankaya/Ankara"
                />
              </div>
              <div>
                <Label>Sorumlu Kişi</Label>
                <Input defaultValue="Mehmet YILMAZ" className="mt-1" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input defaultValue="+90 312 123 45 67" className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teknik Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sistem Tipi</Label>
                <Input defaultValue="NETMONAS" className="mt-1" />
              </div>
              <div>
                <Label>Ürün Bilgileri</Label>
                <Input defaultValue="Site Güç Sistemi" className="mt-1" />
              </div>
              <div>
                <Label>Sistem Türü</Label>
                <Input defaultValue="ETP4830" className="mt-1" />
              </div>
              <div>
                <Label>Sistem Voltajı</Label>
                <Input defaultValue="53.4 V" className="mt-1" />
              </div>
              <div>
                <Label>Toplam Yük Akımı</Label>
                <Input defaultValue="0.0 A" className="mt-1" />
              </div>
              <div>
                <Label>Güç Modülü Yük Oranı</Label>
                <Input defaultValue="0 %" className="mt-1" />
              </div>
              <div>
                <Label>Sistem Kontrol Modu</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>Otomatik</option>
                  <option>Manuel</option>
                  <option>Test</option>
                </select>
              </div>
              <div>
                <Label>Akım Güç Kaynağı Tipi</Label>
                <select className="w-full mt-1 p-2 border border-gray-300 rounded-md">
                  <option>Şebeke Güç Kaynağı</option>
                  <option>Generator</option>
                  <option>Hibrit</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sistem Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">Normal</div>
                <div className="text-sm text-gray-600">Sistem Durumu</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">Active</div>
                <div className="text-sm text-gray-600">Çalışma Modu</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 mb-1">1247</div>
                <div className="text-sm text-gray-600">Çalışma Günü</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">99.8%</div>
                <div className="text-sm text-gray-600">Güvenilirlik</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end space-x-4">
          <Button className="btn-outline" onClick={() => toast({ title: 'Varsayılana sıfırla', description: 'Tüm ayarlar varsayılana sıfırlandı.' })}>
            <Settings className="w-4 h-4 mr-2" />
            Varsayılana Sıfırla
          </Button>
          <Button className="btn-outline" onClick={() => toast({ title: 'Bilgiler kaydedildi', description: 'Tüm bilgiler başarıyla kaydedildi.' })}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Bilgileri Kaydet
          </Button>
        </div>
      </main>
    );
  }

  // Toplam Pil Akımı sayfası
  if (currentContent === "toplam-pil-akimi") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toplam Pil Akımı</h2>
          <p className="text-gray-600">Pil grubu toplam akım analizi ve izleme</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Anlık Pil Akımı</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-netmon-blue mb-2">0.0 A</div>
              <div className="text-sm text-gray-600 mb-4">Kullanılmıyor</div>
              <div className="text-xs text-gray-500">Şarj: 0.0A | Deşarj: 0.0A</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pil Voltajı</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">53.4 V</div>
              <div className="text-sm text-gray-600 mb-4">Normal Seviye</div>
              <div className="text-xs text-gray-500">Min: 48.0V | Max: 57.6V</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pil Kapasitesi</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">87%</div>
              <div className="text-sm text-gray-600 mb-4">İyi Durum</div>
              <div className="text-xs text-gray-500">Tahmini: 8.5 saat</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Akım Geçmişi (Son 24 Saat)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-700 mb-2">Akım Grafiği</div>
                  <div className="text-sm text-gray-500">Son 24 saatlik pil akımı değişimi</div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>06:00</span>
                      <span>-2.5A (Şarj)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>12:00</span>
                      <span>0.0A</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>18:00</span>
                      <span>+1.8A (Deşarj)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>00:00</span>
                      <span>-1.2A (Şarj)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pil Analizi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pil Durumu</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Kullanılmıyor Şarj</span>
                </div>
              </div>
              <div>
                <Label>Şarj Modu</Label>
                <div className="flex items-center mt-1">
                  <span className="text-blue-600">Float Şarj</span>
                </div>
              </div>
              <div>
                <Label>Pil Sıcaklığı</Label>
                <div className="flex items-center mt-1">
                  <span>24°C (Normal)</span>
                </div>
              </div>
              <div>
                <Label>Son Test Tarihi</Label>
                <div className="flex items-center mt-1">
                  <span>01.01.2024 02:00</span>
                </div>
              </div>
              <div>
                <Label>Test Sonucu</Label>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-green-600">Başarılı (87%)</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Akım Eşikleri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Maksimum Şarj:</span>
                    <div className="font-medium">10A</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Maksimum Deşarj:</span>
                    <div className="font-medium">50A</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Alarm Eşiği:</span>
                    <div className="font-medium">45A</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Kesme Eşiği:</span>
                    <div className="font-medium">60A</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pil Akım İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">24h</div>
                <div className="text-xs text-gray-600">Ortalama: 0.2A</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">7d</div>
                <div className="text-xs text-gray-600">Ortalama: 0.8A</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-lg font-bold text-yellow-600">30d</div>
                <div className="text-xs text-gray-600">Ortalama: 1.2A</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-lg font-bold text-purple-600">Max</div>
                <div className="text-xs text-gray-600">En Yüksek: 12.4A</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Konfigürasyon sayfası
  if (currentContent === "konfigurasyon") {
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getContentTitle(currentContent)}</h2>
          <p className="text-gray-600">{currentLanguage === 'tr'
            ? 'Sistemdeki tüm ana bileşenler için eşik ve alarm ayarlarını buradan yapılandırabilirsiniz.'
            : 'Configure thresholds and alarm settings for all main system components here.'}</p>
        </div>
        <Card className="w-full shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-netmon-blue flex items-center gap-2">
              <Settings className="w-6 h-6 text-netmon-blue" />
              {t.configuration}
            </CardTitle>
            <p className="text-gray-500 mt-2 text-base">
              {currentLanguage === 'tr'
                ? 'Sistemdeki tüm ana bileşenler için eşik ve alarm ayarlarını buradan yapılandırabilirsiniz.'
                : 'Configure thresholds and alarm settings for all main system components here.'}
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rectifiers" className="space-y-6">
              <TabsList className="grid grid-cols-6 gap-2 mb-4">
               <TabsTrigger value="rectifiers">{t.rectifiers}</TabsTrigger>
                <TabsTrigger value="solars">{currentLanguage === 'tr' ? 'Solarlar' : 'Solars'}</TabsTrigger>
                <TabsTrigger value="batteries">{currentLanguage === 'tr' ? 'Pil Grubu' : 'Battery Group'}</TabsTrigger>
                <TabsTrigger value="acinput">{currentLanguage === 'tr' ? 'AC Giriş' : 'AC Input'}</TabsTrigger>
                <TabsTrigger value="dcoutput">{currentLanguage === 'tr' ? 'DC Çıkış' : 'DC Output'}</TabsTrigger>
                <TabsTrigger value="environment">{currentLanguage === 'tr' ? 'Ortam' : 'Environment'}</TabsTrigger>
              </TabsList>
              {/* Doğrultucular */}
              <TabsContent value="rectifiers">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.rectifierSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.rectifierCount}</Label>
                        <Input type="number" min={1} max={16} value={config.rectifiers?.rectifierCount ?? ''} onChange={e => handleChange('rectifiers', 'rectifierCount', e.target.value)} />
                      </div>
                      <div>
                        <Label>Çalışma Voltaj Aralığı <span className="text-gray-500">(90-270 V)</span></Label>
                        <Input type="text" value={config.rectifiers?.inputCurrent ?? ''} onChange={e => handleChange('rectifiers', 'inputCurrent', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Sıcaklık Alarmı</Label>
                          <Input type="number" min={-20} max={100} value={config.rectifiers?.tempAlarm ?? ''} onChange={e => handleChange('rectifiers', 'tempAlarm', e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <Label>Alarm Seviyesi</Label>
                          <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.rectifiers?.tempAlarmLevel ?? ''} onChange={e => handleChange('rectifiers', 'tempAlarmLevel', e.target.value)}>
                            <option value="acil">Acil</option>
                            <option value="kritik">Kritik</option>
                            <option value="bilgi">Bilgi</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label>Düşük Voltaj Alarmı</Label>
                          <Input type="number" min={0} max={270} value={config.rectifiers?.lowVoltageAlarm ?? ''} onChange={e => handleChange('rectifiers', 'lowVoltageAlarm', e.target.value)} />
                        </div>
                        <div className="flex-1">
                          <Label>Alarm Seviyesi</Label>
                          <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.rectifiers?.lowVoltageAlarmLevel ?? ''} onChange={e => handleChange('rectifiers', 'lowVoltageAlarmLevel', e.target.value)}>
                            <option value="acil">Acil</option>
                            <option value="kritik">Kritik</option>
                            <option value="bilgi">Bilgi</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Solarlar */}
              <TabsContent value="solars">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.solarPanelSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.solarPanelCount}</Label>
                        <Input type="number" min={1} max={16} value={config.solars?.solarPanelCount ?? ''} onChange={e => handleChange('solars', 'solarPanelCount', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.panelVoltage} ({t.volts})</Label>
                        <Input type="number" min={0} max={300} step="0.1" value={config.solars?.panelVoltage ?? ''} onChange={e => handleChange('solars', 'panelVoltage', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.panelCurrent} ({t.amperes})</Label>
                        <Input type="number" min={0} max={30} step="0.1" value={config.solars?.panelCurrent ?? ''} onChange={e => handleChange('solars', 'panelCurrent', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.alarmThreshold} ({t.amperes})</Label>
                        <Input type="number" step="0.1" value={config.solars?.alarmThreshold ?? ''} onChange={e => handleChange('solars', 'alarmThreshold', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.alarmLevel}</Label>
                        <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.solars?.alarmLevel ?? ''} onChange={e => handleChange('solars', 'alarmLevel', e.target.value)}>
                          <option value="acil">{t.emergency}</option>
                          <option value="kritik">{t.critical}</option>
                          <option value="bilgi">{t.info}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Pil Grubu */}
              <TabsContent value="batteries">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.batteryGroupSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.batteryCount}</Label>
                        <Input type="number" min={1} max={16} value={config.batteryGroup.batteryCount} onChange={e => handleChange('batteryGroup', 'batteryCount', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.batteryVoltage} ({t.volts})</Label>
                        <Input type="number" min={2} max={60} step="0.1" value={config.batteryGroup.batteryVoltage} onChange={e => handleChange('batteryGroup', 'batteryVoltage', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.batteryCurrent} ({t.amperes})</Label>
                        <Input type="number" min={1} max={100} step="0.1" value={config.batteryGroup.batteryCurrent} onChange={e => handleChange('batteryGroup', 'batteryCurrent', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.batteryTempThreshold} ({t.celsius})</Label>
                        <div className="flex gap-2">
                          <Input type="number" min={-20} max={100} step="1" value={config.batteryGroup.batteryTempMin} onChange={e => handleChange('batteryGroup', 'batteryTempMin', e.target.value)} placeholder={t.min} />
                          <span className="self-center">-</span>
                          <Input type="number" min={-20} max={100} step="1" value={config.batteryGroup.batteryTempMax} onChange={e => handleChange('batteryGroup', 'batteryTempMax', e.target.value)} placeholder={t.max} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.alarmThreshold} ({t.amperes})</Label>
                        <Input type="number" step="0.1" value={config.batteryGroup.alarmThreshold} onChange={e => handleChange('batteryGroup', 'alarmThreshold', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.alarmLevel}</Label>
                        <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.batteryGroup.alarmLevel} onChange={e => handleChange('batteryGroup', 'alarmLevel', e.target.value)}>
                          <option value="acil">{t.emergency}</option>
                          <option value="kritik">{t.critical}</option>
                          <option value="bilgi">{t.info}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* AC Giriş */}
              <TabsContent value="acinput">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.acInputSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.acInputVoltage} ({t.volts})</Label>
                        <Input type="number" min={90} max={270} step="0.1" value={config.acInput.acInputVoltage} onChange={e => handleChange('acInput', 'acInputVoltage', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.acInputCurrent} ({t.amperes})</Label>
                        <Input type="number" min={1} max={100} step="0.1" value={config.acInput.acInputCurrent} onChange={e => handleChange('acInput', 'acInputCurrent', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.frequency} ({t.hertz})</Label>
                        <Input type="number" min={40} max={70} step="0.1" value={config.acInput.frequency} onChange={e => handleChange('acInput', 'frequency', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.alarmThreshold} ({t.volts})</Label>
                        <Input type="number" step="0.1" value={config.acInput.alarmThreshold} onChange={e => handleChange('acInput', 'alarmThreshold', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.alarmLevel}</Label>
                        <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.acInput.alarmLevel} onChange={e => handleChange('acInput', 'alarmLevel', e.target.value)}>
                          <option value="acil">{t.emergency}</option>
                          <option value="kritik">{t.critical}</option>
                          <option value="bilgi">{t.info}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* DC Çıkış */}
              <TabsContent value="dcoutput">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.dcOutputSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.dcOutputVoltage} ({t.volts})</Label>
                        <Input type="number" min={48} max={58} step="0.1" value={config.dcOutput.dcOutputVoltage} onChange={e => handleChange('dcOutput', 'dcOutputVoltage', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.dcOutputCurrent} ({t.amperes})</Label>
                        <Input type="number" min={1} max={100} step="0.1" value={config.dcOutput.dcOutputCurrent} onChange={e => handleChange('dcOutput', 'dcOutputCurrent', e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.alarmThreshold} ({t.volts})</Label>
                        <Input type="number" step="0.1" value={config.dcOutput.alarmThreshold} onChange={e => handleChange('dcOutput', 'alarmThreshold', e.target.value)} />
                      </div>
                      <div>
                        <Label>{t.alarmLevel}</Label>
                        <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.dcOutput.alarmLevel} onChange={e => handleChange('dcOutput', 'alarmLevel', e.target.value)}>
                          <option value="acil">{t.emergency}</option>
                          <option value="kritik">{t.critical}</option>
                          <option value="bilgi">{t.info}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              {/* Ortam */}
              <TabsContent value="environment">
                <Card className="mb-4">
                  <CardHeader><CardTitle>{t.environmentSettings}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.temperatureThreshold} ({t.celsius})</Label>
                        <div className="flex gap-2">
                          <Input type="number" min={-20} max={100} step="1" value={config.environment.temperatureMin} onChange={e => handleChange('environment', 'temperatureMin', e.target.value)} placeholder={t.min} />
                          <span className="self-center">-</span>
                          <Input type="number" min={-20} max={100} step="1" value={config.environment.temperatureMax} onChange={e => handleChange('environment', 'temperatureMax', e.target.value)} placeholder={t.max} />
                        </div>
                      </div>
                      <div>
                        <Label>{t.humidityThreshold} ({t.percent})</Label>
                        <div className="flex gap-2">
                          <Input type="number" min={0} max={100} step="1" value={config.environment.humidityMin} onChange={e => handleChange('environment', 'humidityMin', e.target.value)} placeholder={t.min} />
                          <span className="self-center">-</span>
                          <Input type="number" min={0} max={100} step="1" value={config.environment.humidityMax} onChange={e => handleChange('environment', 'humidityMax', e.target.value)} placeholder={t.max} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>{t.alarmLevel}</Label>
                        <select className="input input-bordered w-full mt-1 p-2 rounded-md border border-gray-300" value={config.environment.alarmLevel} onChange={e => handleChange('environment', 'alarmLevel', e.target.value)}>
                          <option value="acil">{t.emergency}</option>
                          <option value="kritik">{t.critical}</option>
                          <option value="bilgi">{t.info}</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <div className="flex justify-end mt-6">
                <Button type="button" className="w-full md:w-auto px-8 py-2 text-lg font-semibold rounded-md" onClick={handleSave} disabled={saving}>
                  {saving ? 'Kaydediliyor...' : t.save}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Doğrultucular sayfası
  if (currentContent === "dogrultucular") {
    // WebSocket'ten canlı rectifier sıcaklıkları ve sayısı
    // live data is obtained at top level (liveRectifiersTop)
    const rectCount = Number(config.rectifiers?.rectifierCount) || (liveRectifiersTop?.length ?? 0);
    defaultFanRef.current = Number(config.rectifiers?.fanSpeed) || 2400;
    thresholdRef.current = Number(config.rectifiers?.tempAlarm) || 55;

    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.rectifiers}</h2>
          <p className="text-gray-600">
            {currentLanguage === 'tr' 
              ? 'Gerçek zamanlı rectifier verileri ve sistem durumu' 
              : 'Real-time rectifier data and system status'
            }
          </p>
        </div>
        {/* Sistem Genel Durumu - konfigurasyondan hesaplanan */}
        <Card className="mb-6 bg-blue-50">
          <CardHeader>
            <CardTitle>{currentLanguage === 'tr' ? 'Sistem Genel Durumu' : 'System Overview'}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
                const parseRange = (raw?: string): [number, number] | null => {
                  if (!raw) return null;
                  const s = String(raw).replace(/\s/g, '');
                  const m = s.match(/^(-?\d+(?:\.\d+)?)(?:[-~to]+(-?\d+(?:\.\d+)?))?$/i);
                  if (!m) return null;
                  const a = Number(m[1]);
                  const b = m[2] !== undefined ? Number(m[2]) : a;
                  if (Number.isNaN(a) || Number.isNaN(b)) return null;
                  return a <= b ? [a, b] : [b, a];
                };
                const mid = (r: [number, number] | null, def = 0) => (r ? (r[0] + r[1]) / 2 : def);
                const vOutNom = mid(parseRange(config.rectifiers?.outputVoltage), 48);
                
                // Calculate totals from simulated data
                let totalPowerW = 0;
                let totalCurrentA = 0;
                let avgVoltage = 0;
                let runningCount = 0;
                
                for (let i = 1; i <= rectCount; i++) {
                  const status = simStatusById[i] ?? 1;
                  if (status === 1) { // running
                    runningCount++;
                    totalPowerW += simPowerById[i] ?? 0;
                    totalCurrentA += simCurrentById[i] ?? 0;
                    avgVoltage += simVoltageById[i] ?? 48;
                  }
                }
                
                if (runningCount > 0) {
                  avgVoltage = avgVoltage / runningCount;
                } else {
                  avgVoltage = vOutNom;
                }
                
                const totalPowerKW = totalPowerW / 1000;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center"><div className="text-3xl font-bold text-blue-600">{rectCount}</div><div className="text-gray-600">{currentLanguage === 'tr' ? 'Toplam Rectifier' : 'Total Rectifiers'}</div></div>
                    <div className="text-center"><div className="text-3xl font-bold text-green-600">{totalPowerKW.toFixed(1)} kW</div><div className="text-gray-600">{currentLanguage === 'tr' ? 'Toplam Güç' : 'Total Power'}</div></div>
                    <div className="text-center"><div className="text-3xl font-bold text-purple-600">{avgVoltage.toFixed(1)} V</div><div className="text-gray-600">{currentLanguage === 'tr' ? 'Sistem Voltajı' : 'System Voltage'}</div></div>
                    <div className="text-center"><div className="text-3xl font-bold text-orange-600">{totalCurrentA.toFixed(1)} A</div><div className="text-gray-600">{currentLanguage === 'tr' ? 'Sistem Akımı' : 'System Current'}</div></div>
                  </div>
                );
              })()}
          </CardContent>
        </Card>

        {/* Konfigürasyon tablosu + fan kontrolü */}
        {config.rectifiers && (() => {
          const parseRange = (raw?: string): [number, number] | null => {
            if (!raw) return null;
            const s = String(raw).replace(/\s/g, '');
            const m = s.match(/^(-?\d+(?:\.\d+)?)(?:[-~to]+(-?\d+(?:\.\d+)?))?$/i);
            if (!m) return null;
            const a = Number(m[1]);
            const b = m[2] !== undefined ? Number(m[2]) : a;
            if (Number.isNaN(a) || Number.isNaN(b)) return null;
            return a <= b ? [a, b] : [b, a];
          };
          const fmt = (r: [number, number] | null, digits = 0) => {
            if (!r) return '-';
            const [lo, hi] = r;
            const f = (n: number) => n.toFixed(digits);
            return lo === hi ? f(lo) : `${f(lo)}-${f(hi)}`;
          };
          const vinR = parseRange(config.rectifiers?.inputVoltage);
          const iinR = parseRange(config.rectifiers?.inputCurrent);
          const voutR = parseRange(config.rectifiers?.outputVoltage);
          const voutNom = voutR ? (voutR[0] + voutR[1]) / 2 : 48;
          // Removed unused ioutR calculation
          const rows = Array.from({ length: rectCount });
          return (
            <Card className="mb-6">
              <CardHeader><CardTitle>{currentLanguage === 'tr' ? 'Doğrultucu Yapılandırması' : 'Rectifier Configuration'}</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{currentLanguage === 'tr' ? 'Adı/ID' : 'Name/ID'}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.inputVoltage} ({t.volts})</TableHead>
                      <TableHead>{t.outputVoltage} ({t.volts})</TableHead>
                      <TableHead>{currentLanguage === 'tr' ? 'Giriş Akımı' : 'Input Current'} ({t.amperes})</TableHead>
                      <TableHead>{currentLanguage === 'tr' ? 'Çıkış Akımı' : 'Output Current'} ({t.amperes})</TableHead>
                      <TableHead>{currentLanguage === 'tr' ? 'Güç' : 'Power'} (W)</TableHead>
                      <TableHead>{t.temperature} ({t.celsius})</TableHead>
                      <TableHead>{currentLanguage === 'tr' ? 'Fan Hızı' : 'Fan Speed'}</TableHead>
                      <TableHead>{currentLanguage === 'tr' ? 'Son Güncelleme' : 'Last Update'}</TableHead>
                      <TableHead>{t.alarmLevel}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((_, i) => (
                      <TableRow key={`R${i + 1}`}>
                        <TableCell>{`R${i + 1}`}</TableCell>
                        <TableCell>
                          {(() => {
                            const st = simStatusById[i + 1] ?? 1;
                            if (st === 2) return <span className="text-red-600 font-medium">{currentLanguage === 'tr' ? 'Hata' : 'Fault'}</span>;
                            if (st === 1) return <span className="text-green-600 font-medium">{currentLanguage === 'tr' ? 'Çalışıyor' : 'Running'}</span>;
                            return <span className="text-gray-500">{currentLanguage === 'tr' ? 'Kapalı' : 'Off'}</span>;
                          })()}
                        </TableCell>
                        <TableCell>{fmt(vinR ?? ([90, 270] as [number, number]), 0)}</TableCell>
                        <TableCell>{voutR ? fmt(voutR, 0) : voutNom}</TableCell>
                        <TableCell>{iinR ? fmt(iinR, 0) : '-'}</TableCell>
                        <TableCell>
                          {(() => {
                            const simI = simCurrentById[i + 1];
                            if (Number.isFinite(simI)) return simI.toFixed(1);
                            return '-';
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const simP = simPowerById[i + 1];
                            if (Number.isFinite(simP)) return simP.toFixed(1);
                            return '-';
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const sim = simTempById[i + 1];
                            return Number.isFinite(sim) ? sim.toFixed(1) : '-';
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button className="px-2 py-0.5 border rounded" onClick={() => bumpFan(i + 1, -200)} aria-label={currentLanguage === 'tr' ? 'Fan azalt' : 'Decrease fan'}>-</button>
                            <span className="font-mono min-w-[64px] text-center">{Math.round(fanRpmById[i + 1] ?? defaultFanRef.current)} RPM</span>
                            <button className="px-2 py-0.5 border rounded" onClick={() => bumpFan(i + 1, +200)} aria-label={currentLanguage === 'tr' ? 'Fan artır' : 'Increase fan'}>+</button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const now = new Date();
                            return now.toLocaleTimeString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          })()}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const liveAl: any = (liveRectifiersTop)[i]?.alarmLevel || (liveRectifiersTop)[i]?.alarm;
                            if (typeof liveAl === 'string' && liveAl.trim()) return liveAl;
                            const cfg = (config.rectifiers?.tempAlarmLevel || config.rectifiers?.alarmLevel || '').toString();
                            if (cfg) return cfg;
                            return currentLanguage === 'tr' ? 'Uyarı yok' : 'No alarm';
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })()}
      </main>
    );
  }

  // Solarlar sayfası
  if (currentContent === "solarlar") {
    if (!config.solars) return null;
    type AlarmType = "emergency" | "critical" | "info" | "none";
    // Dinamik olarak config.solars.solarPanelCount kadar solar panel oluştur
    const baseSolar = {
      status: "active",
      inputVoltage: 120,
      outputVoltage: 48,
      current: 5.2,
      temperature: 32,
      alarm: "none" as AlarmType
    };
    const solars = Array.from({ length: Number(config.solars.solarPanelCount) || 0 }, (_, i) => ({
      id: `S${i + 1}`,
      ...baseSolar
    }));
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentLanguage === 'tr' ? 'Solarlar' : 'Solars'}</h2>
          <p className="text-gray-600">{currentLanguage === 'tr' ? 'Sistemdeki solar panel listesi ve ayarları' : 'List and settings of solar panels in the system'}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{currentLanguage === 'tr' ? 'Adı/ID' : 'Name/ID'}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.inputVoltage} ({t.volts})</TableHead>
              <TableHead>{t.outputVoltage} ({t.volts})</TableHead>
              <TableHead>{t.current} ({t.amperes})</TableHead>
              <TableHead>{t.temperature} ({t.celsius})</TableHead>
              <TableHead>{t.alarmLevel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solars.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>
                  {s.status === "active"
                    ? <span className="text-green-600 font-semibold">{t.active}</span>
                    : <span className="text-gray-400">{t.inactive}</span>}
                </TableCell>
                <TableCell>{s.inputVoltage}</TableCell>
                <TableCell>{s.outputVoltage}</TableCell>
                <TableCell>{s.current}</TableCell>
                <TableCell>{s.temperature}</TableCell>
                <TableCell>
                  <span className="text-gray-500">{t.noAlarm || 'Alarm yok.'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    );
  }

  // Alarmlar sayfası
  if (currentContent === "alarmlar") {
    const isTR = currentLanguage === 'tr';
    return (
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{isTR ? "Alarmlar ve Eşik Ayarları Rehberi" : "Alarm Types & Threshold Guide"}</h2>
          <p className="text-gray-600 max-w-2xl">
            {isTR
              ? "Aşağıda sistemde karşılaşabileceğiniz alarm tipleri ve her biri için pratik ayar önerileri ile açıklamalar bulabilirsiniz. Alarm eşiklerini belirlerken hem üretici tavsiyelerini hem de tesisinizin çalışma koşullarını dikkate alınız."
              : "Below you will find the types of alarms you may encounter in the system, with practical threshold suggestions and explanations for each. When setting alarm thresholds, consider both manufacturer recommendations and your facility's operating conditions."}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{isTR ? "Sıcaklık Alarmı" : "Temperature Alarm"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-800">
              <p><b>{isTR ? "Ne zaman tetiklenir?" : "When is it triggered?"}</b> {isTR ? "Doğrultucu, solar panel veya pil grubu sıcaklığı belirlenen eşiği aştığında." : "When the rectifier, solar panel, or battery group temperature exceeds the set threshold."}</p>
              <p><b>{isTR ? "Tipik eşik:" : "Typical threshold:"}</b> {isTR ? "60°C (uyarı), 70-75°C (kritik/alarm). Üretici maksimum sıcaklık değerini aşmayın." : "60°C (warning), 70-75°C (critical/alarm). Do not exceed the manufacturer's maximum temperature."}</p>
              <p><b>{isTR ? "Pratik öneri:" : "Practical tip:"}</b> {isTR ? "Sıcaklık eşiğini ortam sıcaklığı ve cihazın havalandırma durumuna göre ayarlayın. Sık sık alarm alıyorsanız soğutma sistemini kontrol edin." : "Set the temperature threshold according to ambient temperature and device ventilation. If you get frequent alarms, check the cooling system."}</p>
              <p><b>{isTR ? "En iyi uygulama:" : "Best practice:"}</b> {isTR ? "Kritik sıcaklıkta otomatik kapanma veya yük azaltma önerilir." : "Automatic shutdown or load reduction is recommended at critical temperature."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{isTR ? "Akım Alarmı" : "Current Alarm"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-800">
              <p><b>{isTR ? "Ne zaman tetiklenir?" : "When is it triggered?"}</b> {isTR ? "Modül veya sistemden geçen akım belirlenen sınırı aştığında." : "When the current through the module or system exceeds the set limit."}</p>
              <p><b>{isTR ? "Tipik eşik:" : "Typical threshold:"}</b> {isTR ? "Modül başına 10-50A arası. Toplam sistem için üreticiye bakınız." : "10-50A per module. Check manufacturer for total system."}</p>
              <p><b>{isTR ? "Pratik öneri:" : "Practical tip:"}</b> {isTR ? "Akım eşiğini, sistemin nominal kapasitesinin %80-90'ı civarında tutmak güvenli olur. Sık alarm oluyorsa yük dağılımını gözden geçirin." : "Set the current threshold at about 80-90% of nominal capacity. If you get frequent alarms, review load distribution."}</p>
              <p><b>{isTR ? "En iyi uygulama:" : "Best practice:"}</b> {isTR ? "Aşırı akımda otomatik sigorta veya röle ile koruma sağlanmalı." : "Use automatic fuses or relays for overcurrent protection."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{isTR ? "Voltaj Alarmı" : "Voltage Alarm"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-800">
              <p><b>{isTR ? "Ne zaman tetiklenir?" : "When is it triggered?"}</b> {isTR ? "Giriş veya çıkış voltajı belirlenen aralığın dışına çıktığında." : "When input or output voltage goes outside the set range."}</p>
              <p><b>{isTR ? "Tipik eşik:" : "Typical threshold:"}</b> {isTR ? "Giriş: 90-270V, Çıkış: 48-58V. Şebeke dalgalanmalarına tolerans bırakın." : "Input: 90-270V, Output: 48-58V. Allow tolerance for grid fluctuations."}</p>
              <p><b>{isTR ? "Pratik öneri:" : "Practical tip:"}</b> {isTR ? "Şebeke voltajı sık değişiyorsa, alt ve üst sınırları biraz geniş tutun. Düşük voltajda sistemin kapanmasını önlemek için kritik eşiği belirleyin." : "If grid voltage fluctuates often, set wider min/max limits. Set a critical threshold to prevent shutdown at low voltage."}</p>
              <p><b>{isTR ? "En iyi uygulama:" : "Best practice:"}</b> {isTR ? "Voltaj hatasında sistem uyarı versin, kritik durumda otomatik kapanma veya bypass devreye girsin." : "System should warn on voltage error, and shut down or bypass automatically in critical cases."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{isTR ? "Haberleşme Alarmı" : "Communication Alarm"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-800">
              <p><b>{isTR ? "Ne zaman tetiklenir?" : "When is it triggered?"}</b> {isTR ? "Sistem ile doğrultucu, solar veya pil grubu arasındaki iletişim kesildiğinde." : "When communication between the system and rectifier, solar, or battery group is lost."}</p>
              <p><b>{isTR ? "Tipik durumlar:" : "Typical cases:"}</b> {isTR ? "Kablolama hatası, bağlantı kopması, cihaz arızası." : "Wiring error, connection loss, device failure."}</p>
              <p><b>{isTR ? "Pratik öneri:" : "Practical tip:"}</b> {isTR ? "Kabloları, konnektörleri ve cihaz yazılımını düzenli kontrol edin. Haberleşme alarmı uzun sürüyorsa teknik destek alın." : "Regularly check cables, connectors, and device firmware. If the alarm persists, contact technical support."}</p>
              <p><b>{isTR ? "En iyi uygulama:" : "Best practice:"}</b> {isTR ? "Kritik haberleşme kaybında sistem uyarı versin, otomatik yeniden başlatma veya yedekleme devreye girsin." : "System should warn on critical communication loss, and trigger auto-restart or backup if needed."}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{isTR ? "Diğer Alarmlar & Genel Tavsiyeler" : "Other Alarms & General Advice"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-800">
              <ul className="list-disc ml-6 space-y-1">
                <li><b>{isTR ? "Sigorta Atması:" : "Fuse Trip:"}</b> {isTR ? "Aşırı yük veya kısa devre durumunda sigorta atar. Sigorta değerini sistem kapasitesine göre seçin." : "Fuse trips in case of overload or short circuit. Select fuse rating according to system capacity."}</li>
                <li><b>{isTR ? "Düşük Pil Voltajı:" : "Low Battery Voltage:"}</b> {isTR ? "Pil voltajı belirlenen alt sınırın altına düştüğünde alarm verir. Pil ömrünü korumak için kritik eşiği üreticiye göre ayarlayın." : "Alarm triggers when battery voltage drops below the set limit. Set the critical threshold according to manufacturer to protect battery life."}</li>
                <li><b>{isTR ? "Aşırı Yük:" : "Overload:"}</b> {isTR ? "Sistem kapasitesinin üzerinde yük çekildiğinde alarm verir. Yük dağılımını ve cihaz kapasitesini kontrol edin." : "Alarm triggers when system is overloaded. Check load distribution and device capacity."}</li>
                <li><b>{isTR ? "Kısa Devre:" : "Short Circuit:"}</b> {isTR ? "Çıkışta kısa devre algılandığında sistem korumaya geçer. Kablolama ve bağlantıları kontrol edin." : "System enters protection mode on output short circuit. Check wiring and connections."}</li>
                <li><b>{isTR ? "Bakım Uyarıları:" : "Maintenance Warnings:"}</b> {isTR ? "Filtre temizliği, fan bakımı gibi periyodik bakım alarmları olabilir. Bakım takvimine uyun." : "There may be periodic maintenance alarms such as filter cleaning, fan maintenance. Follow the maintenance schedule."}</li>
              </ul>
              <div className="mt-2 text-xs text-gray-500">
                {isTR
                  ? "Alarm eşiklerini belirlerken sistemin nominal değerleri, üretici tavsiyeleri ve tesisinizin özel koşulları dikkate alınmalıdır. Emin değilseniz teknik destek alın."
                  : "When setting alarm thresholds, consider system nominal values, manufacturer recommendations, and your facility's specific conditions. If unsure, consult technical support."}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Varsayılan sayfa
  return (
    <main className="flex-1 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {getContentTitle(currentContent)}
            <Badge variant="secondary">Aktif</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-6">
            {getContentTitle(currentContent)} modülü için detaylı bilgiler ve ayarlar.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Modül aktif ve çalışıyor</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Bağlantı Durumu</h4>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Bağlı
                </Badge>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">Son Güncelleme</h4>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleString('tr-TR')}
                </p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
