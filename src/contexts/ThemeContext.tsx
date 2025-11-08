import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Theme = "light" | "dark" | "standard";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  console.log("ThemeProvider: mounting");
  const [theme, setThemeState] = useState<Theme>("standard");
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settings) {
        setThemeState(settings.theme as Theme);
        setSidebarCollapsedState(settings.sidebar_collapsed);
        applyTheme(settings.theme as Theme);
      } else {
        // Create default settings
        await supabase.from("user_settings").insert([{
          user_id: user.id,
          theme: "standard",
          sidebar_collapsed: false
        }]);
      }
    };

    loadSettings();
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "standard");
    
    // Apply new theme
    root.classList.add(newTheme);
    
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "standard") {
      // Standard mode: sidebar dark, content light
      root.classList.remove("dark");
    } else {
      // Light mode
      root.classList.remove("dark");
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from("user_settings")
        .update({ theme: newTheme })
        .eq("user_id", user.id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo guardar el tema",
          variant: "destructive"
        });
      }
    }
  };

  const setSidebarCollapsed = async (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_settings")
        .update({ sidebar_collapsed: collapsed })
        .eq("user_id", user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, sidebarCollapsed, setSidebarCollapsed }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}