---
name: i18n obligatorio para nuevas páginas
description: Toda página nueva debe integrar useTranslation y traducir todos sus textos a es+en desde su creación
type: preference
---
**Regla:** cada vez que se cree una página o componente nuevo:

1. Importar `useTranslation` de `react-i18next`.
2. Reemplazar literales de UI con `t("clave")`.
3. Añadir las claves al diccionario `src/i18n/index.ts` en **es y en simultáneamente**.
4. Si la página introduce muchas claves, crear namespace propio (ej. `t("teleconsulta:create_room")`).

**Por qué:** evitar deuda de traducción; el usuario exige paridad total es/en.

**Cómo aplicar:** no entregar una página nueva sin claves añadidas a ambos idiomas. Validar visualmente cambiando idioma con el LanguageSwitcher antes de cerrar la tarea.
