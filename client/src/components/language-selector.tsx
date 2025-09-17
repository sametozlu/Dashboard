import { useLanguage } from "@/hooks/use-language";
import { getAvailableLanguages } from "@shared/i18n";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  showText?: boolean;
}

export function LanguageSelector({ 
  showText = true 
}: LanguageSelectorProps) {
  const { currentLanguage, setLanguage } = useLanguage();
  const availableLanguages = getAvailableLanguages();

  const currentLangName = availableLanguages.find(
    lang => lang.code === currentLanguage
  )?.name || "Language";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <Globe className="w-4 h-4" />
          {showText && <span>{currentLangName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`cursor-pointer ${
              currentLanguage === lang.code 
                ? 'bg-blue-50 text-blue-600 font-medium' 
                : ''
            }`}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}