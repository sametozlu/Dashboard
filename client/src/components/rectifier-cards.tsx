import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { useHardwareData } from "@/hooks/use-websocket";
import { 
  Zap, 
  Thermometer, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Fan
} from "lucide-react";

interface RectifierData {
  id: number;
  voltage: number;
  current: number;
  power: number;
  temperature: number;
  status: number; // 0=Off, 1=On, 2=Fault
  timestamp: number;
}

interface SystemStatus {
  total_rectifiers: number;
  total_power: number;
  system_voltage: number;
  system_current: number;
  alarm_status: number;
  timestamp: number;
}

export default function RectifierCards() {
  const { currentLanguage } = useLanguage();
  
  // WebSocket'ten rectifier verilerini al
  const { data: rectifiers } = useHardwareData<RectifierData[]>("rectifiers", []);
  const { data: systemStatus } = useHardwareData<SystemStatus>("systemStatus", {} as SystemStatus);

  // Konfigurasyondan rectifier sayısı ve eşik bilgilerini al
  const [rectifierCountFromConfig, setRectifierCountFromConfig] = useState<number | null>(null);
  const [tempAlarmC, setTempAlarmC] = useState<number | null>(null);
  const [defaultFanRpm, setDefaultFanRpm] = useState<number>(2400);
  useEffect(() => {
    axios.get("/api/config").then((res) => {
      const count = res?.data?.rectifiers?.rectifierCount;
      if (typeof count === 'number' && count > 0) setRectifierCountFromConfig(count);
      const tempA = res?.data?.rectifiers?.tempAlarm;
      const fan = res?.data?.rectifiers?.fanSpeed;
      if (tempA && !Number.isNaN(Number(tempA))) setTempAlarmC(Number(tempA));
      if (fan && !Number.isNaN(Number(fan))) setDefaultFanRpm(Number(fan));
    }).catch(() => {
      // ignore
    });
  }, []);

  // Fan hızı durumu (frontend kontrol)
  const effectiveRectifierCount = rectifierCountFromConfig ?? rectifiers.length ?? 0;
  const initialFanState = useMemo(() => {
    return Array.from({ length: effectiveRectifierCount }).reduce<Record<number, number>>((acc, _, idx) => {
      acc[idx + 1] = defaultFanRpm;
      return acc;
    }, {});
  }, [effectiveRectifierCount, defaultFanRpm]);

  const [fanRpmById, setFanRpmById] = useState<Record<number, number>>({});

  useEffect(() => {
    setFanRpmById(initialFanState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRectifierCount]);

  // Sıcaklığa göre otomatik fan hız kontrolü
  useEffect(() => {
    if (!rectifiers || rectifiers.length === 0) return;
    setFanRpmById(prev => {
      const next = { ...prev };
      const threshold = typeof tempAlarmC === 'number' ? tempAlarmC : 55; // default 55C
      for (const r of rectifiers) {
        const id = r.id;
        const current = next[id] ?? defaultFanRpm;
        const maxRpm = 6000;
        const minRpm = 1200;
        if (r.temperature >= threshold) {
          // sıcaklık yüksekse artır
          next[id] = Math.min(maxRpm, (current || defaultFanRpm) + 300);
        } else if (r.temperature <= threshold - 3) {
          // düşüşteyse yavaşça azalt
          next[id] = Math.max(minRpm, (current || defaultFanRpm) - 200);
        } else if (!current) {
          next[id] = defaultFanRpm;
        }
      }
      return next;
    });
  }, [rectifiers, tempAlarmC, defaultFanRpm]);

  const changeFan = (id: number, delta: number) => {
    setFanRpmById(prev => {
      const current = prev[id] ?? defaultFanRpm;
      const next = Math.max(800, Math.min(7000, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Rectifier durumuna göre ikon ve renk
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0: // Off
        return {
          icon: XCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          statusText: currentLanguage === 'tr' ? 'Kapalı' : 'Off'
        };
      case 1: // On
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          statusText: currentLanguage === 'tr' ? 'Çalışıyor' : 'Running'
        };
      case 2: // Fault
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          statusText: currentLanguage === 'tr' ? 'Hata' : 'Fault'
        };
      default:
        return {
          icon: XCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-100",
          statusText: currentLanguage === 'tr' ? 'Bilinmiyor' : 'Unknown'
        };
    }
  };

  // Voltaj durumuna göre renk
  const getVoltageColor = (voltage: number) => {
    if (voltage >= 47.5 && voltage <= 48.5) return "text-green-600";
    if (voltage >= 47.0 && voltage <= 49.0) return "text-yellow-600";
    return "text-red-600";
  };

  // Sıcaklık durumuna göre renk
  const getTemperatureColor = (temp: number) => {
    if (temp <= 35) return "text-green-600";
    if (temp <= 45) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Sistem Genel Durumu */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            {currentLanguage === 'tr' ? 'Sistem Genel Durumu' : 'System Overview'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {effectiveRectifierCount}
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === 'tr' ? 'Toplam Rectifier' : 'Total Rectifiers'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(systemStatus.total_power || 0).toFixed(1)} kW
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === 'tr' ? 'Toplam Güç' : 'Total Power'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(systemStatus.system_voltage || 0).toFixed(1)} V
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === 'tr' ? 'Sistem Voltajı' : 'System Voltage'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(systemStatus.system_current || 0).toFixed(1)} A
              </div>
              <div className="text-sm text-gray-600">
                {currentLanguage === 'tr' ? 'Sistem Akımı' : 'System Current'}
              </div>
            </div>
          </div>
          
          {/* Alarm Durumu */}
          {systemStatus.alarm_status > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  {currentLanguage === 'tr' ? 'Sistemde alarm bulunuyor!' : 'System has alarms!'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rectifier Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.from({ length: effectiveRectifierCount }).map((_, idx) => {
          const rectifier = rectifiers[idx] ?? ({ id: idx + 1, voltage: 0, current: 0, power: 0, temperature: 25, status: 0, timestamp: 0 } as RectifierData);
          const statusInfo = getStatusInfo(rectifier.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card key={rectifier.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {currentLanguage === 'tr' ? 'Rectifier' : 'Rectifier'} {rectifier.id}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={`${statusInfo.bgColor} ${statusInfo.color} border-current`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.statusText}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Voltaj */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'tr' ? 'Voltaj' : 'Voltage'}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${getVoltageColor(rectifier.voltage)}`}>
                    {rectifier.voltage.toFixed(2)} V
                  </span>
                </div>

                {/* Akım */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'tr' ? 'Akım' : 'Current'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-blue-600">
                    {rectifier.current.toFixed(2)} A
                  </span>
                </div>

                {/* Güç */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'tr' ? 'Güç' : 'Power'}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-green-600">
                    {rectifier.power.toFixed(1)} W
                  </span>
                </div>

                {/* Sıcaklık */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'tr' ? 'Sıcaklık' : 'Temperature'}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${getTemperatureColor(rectifier.temperature)}`}>
                    {rectifier.temperature.toFixed(1)}°C
                  </span>
                </div>

                {/* Fan Hızı Kontrolü */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Fan className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {currentLanguage === 'tr' ? 'Fan Hızı' : 'Fan Speed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-0.5 border rounded text-gray-700 hover:bg-gray-50"
                      onClick={() => changeFan(rectifier.id, -200)}
                      aria-label="decrease fan"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-gray-700 min-w-[64px] text-right">
                      {Math.round(fanRpmById[rectifier.id] ?? defaultFanRpm)} RPM
                    </span>
                    <button
                      className="px-2 py-0.5 border rounded text-gray-700 hover:bg-gray-50"
                      onClick={() => changeFan(rectifier.id, +200)}
                      aria-label="increase fan"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Son Güncelleme */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 text-center">
                    {currentLanguage === 'tr' ? 'Son güncelleme' : 'Last update'}: {' '}
                    {rectifier.timestamp
                      ? new Date(rectifier.timestamp * 1000).toLocaleTimeString(
                          currentLanguage === 'tr' ? 'tr-TR' : 'en-US',
                          { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                        )
                      : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }))}
      </div>

      {/* Veri Yoksa */}
      {rectifiers.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {currentLanguage === 'tr' ? 'Rectifier verisi bekleniyor...' : 'Waiting for rectifier data...'}
              </p>
              <p className="text-sm">
                {currentLanguage === 'tr' 
                  ? 'C programı çalıştırıldıktan sonra veriler burada görünecek'
                  : 'Data will appear here after C program is running'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
