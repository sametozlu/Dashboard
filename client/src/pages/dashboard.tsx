import { useState } from "react";
import Header, { MainTab } from "@/components/header";
import Sidebar from "@/components/sidebar";
import ContentArea from "@/components/content-area";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export type MenuSection = 
  | "kontrol-paneli"
  | "izleme"
  | "gps"
  | "tesis-birimi"
  | "toplayici-aygit"
  | "pil-grubu";

export type ContentType = 
  | "dashboard"
  | "sistem-genel-bakis"
  | "aktif-alarm"
  | "gecmis-alarmlar"
  | "site-yapilandirmasi"
  | "yazilim-yukseltme"
  | "performans-verileri"
  | "sistem-bilgileri"
  | "islem-kaydi"
  | "konum-bilgileri"
  | "saat"
  | "surum-bilgisi"
  | "dijital-guc"
  | "ac-giris-dagitimi"
  | "dc-cikis-dagitimi"
  | "yapilandirma-dosyasi"
  | "calisma-bilgileri"
  | "calisma-kontrolu"
  | "ag-yapilandirmasi"
  | "site-kimligi"
  | "pil-durumu"
  | "pil-test-kayitlari"
  | "toplam-pil-akimi"
  | "konfigurasyon"
  | "dogrultucular"
  | "solarlar";

export default function Dashboard() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("ana-sayfa");
  const [expandedMenus, setExpandedMenus] = useState<MenuSection[]>(["kontrol-paneli"]);
  const [currentContent, setCurrentContent] = useState<ContentType>("dashboard");

  const toggleMenu = (menuId: MenuSection) => {
    setExpandedMenus(prev => 
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const selectContent = (contentId: ContentType) => {
    setCurrentContent(contentId);
  };

  const handleMainTabChange = (tab: MainTab) => {
    setActiveMainTab(tab);
    // Set appropriate default content for each main tab
    switch (tab) {
      case "ana-sayfa":
        setCurrentContent("dashboard");
        setExpandedMenus(["kontrol-paneli"]);
        break;
      case "izleme":
        setCurrentContent("sistem-genel-bakis");
        setExpandedMenus(["izleme"]);
        break;
      case "sorgu":
        setCurrentContent("performans-verileri");
        setExpandedMenus(["izleme"]);
        break;
      case "sistem-ayarlari":
        setCurrentContent("site-yapilandirmasi");
        setExpandedMenus(["tesis-birimi"]);
        break;
      case "bakim":
        setCurrentContent("yazilim-yukseltme");
        setExpandedMenus(["kontrol-paneli"]);
        break;
      case "konfigurasyon":
        setCurrentContent("konfigurasyon");
        setExpandedMenus(["toplayici-aygit"]);
        break;
      default:
        setCurrentContent("dashboard");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        activeTab={activeMainTab}
        onTabChange={handleMainTabChange}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          expandedMenus={expandedMenus}
          currentContent={currentContent}
          onToggleMenu={toggleMenu}
          onSelectContent={selectContent}
        />
        <div className="flex-1 overflow-y-auto">
          <ContentArea currentContent={currentContent} />
        </div>
      </div>
    </div>
  );
}
