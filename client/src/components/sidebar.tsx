import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from "@/hooks/use-language";
import { 
  ChevronRight, 
  Gauge, 
  LineChart, 
  MapPin, 
  Building, 
  Cpu, 
  Battery,
  Home,
  BarChart2,
  Settings
} from "lucide-react";
import type { MenuSection, ContentType } from "@/pages/dashboard";

interface SidebarProps {
  expandedMenus: MenuSection[];
  currentContent: ContentType;
  onToggleMenu: (menuId: MenuSection) => void;
  onSelectContent: (contentId: ContentType) => void;
}



export default function Sidebar({ 
  expandedMenus, 
  currentContent, 
  onToggleMenu, 
  onSelectContent 
}: SidebarProps) {
  const { t } = useLanguage();
  const isMenuExpanded = (menuId: MenuSection) => expandedMenus.includes(menuId);

  const getMenuStructure = () => [
    {
      id: "kontrol-paneli" as MenuSection,
      title: t.controlPanel,
      icon: Gauge,
      items: [
        { id: "sistem-genel-bakis" as ContentType, title: t.systemOverview },
        { id: "aktif-alarm" as ContentType, title: t.activeAlarms },
        { id: "gecmis-alarmlar" as ContentType, title: t.alarmHistory },
        { id: "site-yapilandirmasi" as ContentType, title: t.siteConfiguration },
        { id: "yazilim-yukseltme" as ContentType, title: t.softwareUpgrade },
      ],
    },
    {
      id: "izleme" as MenuSection,
      title: t.monitoringMenu,
      icon: LineChart,
      items: [
        { id: "performans-verileri" as ContentType, title: t.performanceData },
        { id: "sistem-bilgileri" as ContentType, title: t.systemInformation },
        { id: "islem-kaydi" as ContentType, title: t.operationLog },
      ],
    },
    {
      id: "gps" as MenuSection,
      title: t.gps,
      icon: MapPin,
      items: [
        { id: "konum-bilgileri" as ContentType, title: t.locationInfo },
        { id: "saat" as ContentType, title: t.timeSettings },
        { id: "surum-bilgisi" as ContentType, title: t.versionInfo },
      ],
    },
    {
      id: "tesis-birimi" as MenuSection,
      title: t.facilityUnit,
      icon: Building,
      items: [
        { id: "dijital-guc" as ContentType, title: t.digitalPower },
        { id: "ac-giris-dagitimi" as ContentType, title: t.acInputDistribution },
        { id: "dc-cikis-dagitimi" as ContentType, title: t.dcOutputDistribution },
        { id: "yapilandirma-dosyasi" as ContentType, title: t.configurationFile },
        { id: "calisma-bilgileri" as ContentType, title: t.operationInfo },
        { id: "calisma-kontrolu" as ContentType, title: t.operationControl },
        { id: "ag-yapilandirmasi" as ContentType, title: t.networkConfiguration },
        { id: "site-kimligi" as ContentType, title: t.siteIdentity },
      ],
    },
    {
      id: "toplayici-aygit" as MenuSection,
      title: t.collectorDevice,
      icon: Cpu,
      items: [
        { id: "dogrultucular" as ContentType, title: "Doğrultucular" },
        { id: "solarlar" as ContentType, title: "Solarlar" }
      ],
    },
    {
      id: "pil-grubu" as MenuSection,
      title: t.batteryGroup,
      icon: Battery,
      items: [
        { id: "pil-durumu" as ContentType, title: t.batteryStatus },
        { id: "pil-test-kayitlari" as ContentType, title: t.batteryTestRecords },
        { id: "toplam-pil-akimi" as ContentType, title: t.totalBatteryCurrent },
      ],
    },
  ];

  return (
    <aside className="w-80 bg-sidebar border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">{t.systemTitle}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {getMenuStructure().map((section) => {
            const Icon = section.icon;
            const isExpanded = isMenuExpanded(section.id);

            return (
              <Collapsible key={section.id} open={isExpanded}>
                <CollapsibleTrigger asChild>
                  <Button
                      className="w-full justify-start p-2 h-auto text-left font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => onToggleMenu(section.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5 text-netmon-blue" />
                      <span>{section.title}</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-0 space-y-0.5">
                  {section.items.map((item) => (
                    <Button
                        key={item.id}
                        className={cn(
                          "w-full justify-start p-1 h-auto text-gray-600 hover:bg-netmon-light hover:text-netmon-blue text-[16px] font-normal text-left pl-8 font-sans",
                          currentContent === item.id && "bg-netmon-light text-netmon-blue"
                        )}
                        onClick={() => onSelectContent(item.id)}
                    >
                      {item.title}
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
