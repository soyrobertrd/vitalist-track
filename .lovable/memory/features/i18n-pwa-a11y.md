---
name: i18n y PWA shell móvil
description: i18next con es/en, LanguageSwitcher en header, SW guard para iframe/preview, tap targets 44px
type: feature
---
- `src/i18n/index.ts` con i18next + LanguageDetector, namespaces `common` y `nav`. Idiomas: es (default), en. Persiste en `localStorage` clave `i18nextLng`. Sincroniza `<html lang>` en cada cambio.
- Importado en `src/main.tsx` antes del `createRoot`.
- `LanguageSwitcher` (icon-only Button con `aria-label` y `min-h-11 min-w-11` para tap target WCAG) montado en header móvil y top bar desktop.
- Service Worker en `public/sw.js` mantiene offline en producción pero **nunca se registra dentro de iframes ni en hosts `id-preview--`, `lovableproject.com`, `lovable.app`** — se desregistra explícitamente en preview para evitar caches stale. Sin esto, el editor sirve builds antiguos.
- A11y: botones icon-only del header tienen `aria-label` y `min-h-11 min-w-11`; ícono interno marcado `aria-hidden="true"`.
- Manifest ya existente cubre instalabilidad (`display: standalone`, iconos 192/512, theme `#2563eb`).

Para nuevos textos: `const { t } = useTranslation();` y `t("key")` (o `t("nav:patients")` para namespace explícito).
