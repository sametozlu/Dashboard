import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, AlertCircle, Info, LogOut, ChevronDown, X, Globe, UserCircle } from "lucide-react";
import { getAvailableLanguages, Language } from "@/../../shared/i18n";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import netmonLogo from "@assets/Kwc_Netmon_Logo_Siyah_1749623422136.png";
import React from "react";

export type MainTab = "ana-sayfa" | "izleme" | "sorgu" | "sistem-ayarlari" | "bakim" | "konfigurasyon";

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [showAlarms, setShowAlarms] = useState(false);

  // Fetch real alarm data from hardware API
  const { data: alarmData = [], isLoading: alarmsLoading } = useQuery({
    queryKey: ['/api/hardware/alarms'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const alarms = Array.isArray(alarmData) ? alarmData : [];
  
  const groupedAlarms = {
    critical: alarms.filter((alarm: any) => alarm.severity === 2 && alarm.isActive).length,
    warning: alarms.filter((alarm: any) => alarm.severity === 1 && alarm.isActive).length,
    info: alarms.filter((alarm: any) => alarm.severity === 0 && alarm.isActive).length,
  };

  const mainTabs = [
    { id: "sistem-ayarlari" as MainTab, label: t.systemSettings },
    { id: "bakim" as MainTab, label: t.maintenance },
    { id: "konfigurasyon" as MainTab, label: t.configuration }
  ];

  const availableLanguages = getAvailableLanguages();

  // Canlı sistem saati
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-netmon-blue text-white shadow-lg">
      {/* Top section with logo and user info */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <img 
            src={netmonLogo} 
            alt="Netmon" 
            className="h-12 w-auto filter brightness-0 invert" 
          />
          {/* Sistem Saati */}
          <span className="text-lg font-mono font-bold bg-white/10 px-3 py-1 rounded">
            {now.toLocaleTimeString(currentLanguage === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <h1 className="text-xl font-semibold">{t.systemTitle}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Alarm Indicators */}
          <div className="flex items-center space-x-2">
            <Dialog open={showAlarms} onOpenChange={setShowAlarms}>
              <div className="flex items-center space-x-2">
                <DialogTrigger asChild>
                  <Button
                    className="p-1 hover:bg-blue-700"
                    disabled={alarmsLoading}
                  >
                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 cursor-pointer">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {groupedAlarms.critical}
                    </Badge>
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    className="p-1 hover:bg-blue-700"
                    disabled={alarmsLoading}
                  >
                    <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {groupedAlarms.warning}
                    </Badge>
                  </Button>
                </DialogTrigger>
                <DialogTrigger asChild>
                  <Button
                    className="p-1 hover:bg-blue-700"
                    disabled={alarmsLoading}
                  >
                    <Badge variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer">
                      <Info className="w-3 h-3 mr-1" />
                      {groupedAlarms.info}
                    </Badge>
                  </Button>
                </DialogTrigger>
              </div>
              
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{t.activeAlarms}</span>
                    <Button
                      className="ml-4"
                      onClick={() => setShowAlarms(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {alarmsLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      {currentLanguage === 'tr' ? 'Alarmlar yükleniyor...' : 'Loading alarms...'}
                    </div>
                  ) : alarms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {currentLanguage === 'tr' ? 'Aktif alarm bulunmuyor' : 'No active alarms'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alarms
                        .filter((alarm: any) => alarm.isActive)
                        .sort((a: any, b: any) => b.severity - a.severity)
                        .map((alarm: any) => (
                          <div
                            key={alarm.alarmId}
                            className={`p-4 rounded-lg border ${
                              alarm.severity === 2
                                ? 'bg-red-50 border-red-200'
                                : alarm.severity === 1
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {alarm.severity === 2 ? (
                                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                ) : alarm.severity === 1 ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                ) : (
                                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {alarm.messageKey ? t[alarm.messageKey as keyof typeof t] : alarm.message}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {currentLanguage === 'tr' ? 'Alarm ID' : 'Alarm ID'}: {alarm.alarmId} • {' '}
                                    {new Date(alarm.timestamp * 1000).toLocaleString(
                                      currentLanguage === 'tr' ? 'tr-TR' : 'en-US'
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                className="ml-4"
                                onClick={async () => {
                                  try {
                                    await fetch(`/api/hardware/alarms/${alarm.alarmId}/acknowledge`, {
                                      method: 'POST',
                                    });
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Failed to acknowledge alarm:', error);
                                  }
                                }}
                              >
                                {t.acknowledge}
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Language Selector - sağda ve globe ikonlu */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="relative group">
              <button className="bg-blue-800 px-3 py-1 rounded flex items-center space-x-1 hover:bg-blue-700 transition-colors">
                <Globe className="w-4 h-4 mr-1" />
                <span>{availableLanguages.find(lang => lang.code === currentLanguage)?.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg min-w-[120px] opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      currentLanguage === lang.code 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Kullanıcı avatarı ve adı */}
            <div className="flex items-center space-x-2 bg-blue-800 px-3 py-1 rounded">
              {/* SVG Avatar */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#2563eb"/>
                <circle cx="12" cy="10" r="4" fill="#fff"/>
                <ellipse cx="12" cy="18" rx="6" ry="3" fill="#fff"/>
              </svg>
              <span className="font-medium text-white text-sm">
                {user?.username || user?.name || "Kullanıcı"}
              </span>
            </div>
            <Button
              onClick={logout}
              disabled={isLoggingOut}
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-sans font-medium text-[16px] flex items-center h-[36px] min-w-[90px] justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? `${t.logout}...` : t.logout}
            </Button>
          </div>
        </div>
      </div>
      {/* Menü sekmeleri: tam genişlikte, mavi arka plan, aktif sekme vurgulu */}
      <nav className="w-full bg-[#1a3fa6] flex items-center px-6">
        <ul className="flex flex-row w-full">
          {mainTabs.map(tab => (
            <li key={tab.id} className="flex-1">
              <button
                className={`w-full py-3 text-base font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'bg-[#2046c8] text-white shadow font-bold'
                    : 'bg-transparent text-blue-100 hover:bg-[#2046c8] hover:text-white'}
                `}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
