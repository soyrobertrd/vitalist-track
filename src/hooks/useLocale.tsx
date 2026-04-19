import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { CountryCode } from "libphonenumber-js";

interface LocaleContextValue {
  /** Resolved ISO 3166-1 alpha-2 country code (e.g. "DO", "US") */
  countryCode: CountryCode;
  /** Resolved IANA timezone (e.g. "America/Santo_Domingo") */
  timezone: string;
  /** Source of resolution: 'workspace' | 'user' | 'browser' */
  source: "workspace" | "user" | "browser";
  loading: boolean;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const DEFAULT_COUNTRY: CountryCode = "DO";
const DEFAULT_TIMEZONE = "America/Santo_Domingo";

/** Best-effort browser country guess from navigator.language (e.g. "es-DO" -> "DO") */
function detectBrowserCountry(): CountryCode | null {
  try {
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    if (!lang) return null;
    const parts = lang.split("-");
    if (parts.length >= 2) {
      const cc = parts[parts.length - 1].toUpperCase();
      if (/^[A-Z]{2}$/.test(cc)) return cc as CountryCode;
    }
    return null;
  } catch {
    return null;
  }
}

function detectBrowserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const [userPrefs, setUserPrefs] = useState<{ country_code: string | null; timezone: string | null } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setLoadingUser(false);
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("country_code, timezone")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) setUserPrefs(data ?? null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    // Workspace > user > browser > default
    const wsCountry = (currentWorkspace as any)?.country_code as string | null | undefined;
    const wsTz = (currentWorkspace as any)?.timezone as string | null | undefined;

    let country: CountryCode = DEFAULT_COUNTRY;
    let timezone: string = DEFAULT_TIMEZONE;
    let source: "workspace" | "user" | "browser" = "browser";

    if (wsCountry || wsTz) {
      country = (wsCountry as CountryCode) || country;
      timezone = wsTz || timezone;
      source = "workspace";
    } else if (userPrefs?.country_code || userPrefs?.timezone) {
      country = (userPrefs.country_code as CountryCode) || country;
      timezone = userPrefs.timezone || timezone;
      source = "user";
    } else {
      const bc = detectBrowserCountry();
      const btz = detectBrowserTimezone();
      if (bc) country = bc;
      if (btz) timezone = btz;
      source = "browser";
    }

    return {
      countryCode: country,
      timezone,
      source,
      loading: wsLoading || loadingUser,
    };
  }, [currentWorkspace, userPrefs, wsLoading, loadingUser]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    // Safe fallback if provider not mounted (avoids hard crash)
    return {
      countryCode: (detectBrowserCountry() || DEFAULT_COUNTRY) as CountryCode,
      timezone: detectBrowserTimezone() || DEFAULT_TIMEZONE,
      source: "browser",
      loading: false,
    };
  }
  return ctx;
}
