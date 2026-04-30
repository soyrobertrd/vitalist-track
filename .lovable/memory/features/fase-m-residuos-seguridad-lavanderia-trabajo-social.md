---
name: Fase M - Residuos, Seguridad Física, Lavandería, Trabajo Social
description: Four hospital support modules: waste management (hazardous/common), physical security (access logs/credentials/cameras), laundry (orders/linen inventory), social work (cases/referrals)
type: feature
---
## Gestión de Residuos
- `residuos_hospitalarios`: RES-YYYY-NNNNN, tipos (biológico_infeccioso/punzocortante/químico/farmacéutico/radioactivo/común/anatomopatológico), peso, área, estados (generado→dispuesto)
- `manifiestos_residuos`: MAN-YYYY-NNNNN, transportista, destino, verificación
- Ruta: `/residuos`

## Seguridad Física
- `areas_seguridad`: nivel acceso (público/restringido/crítico), cámaras
- `bitacora_accesos`: ACC-YYYYMMDD-NNNN, tipo persona, método verificación
- `credenciales_acceso`: tipo (empleado/visitante/proveedor/temporal), vigencia
- Ruta: `/seguridad-fisica`

## Lavandería y Ropería
- `ordenes_lavanderia`: LAV-YYYY-NNNNN, tipo ropa, peso, estados (recibida→entregada)
- `inventario_ropa`: stock disponible vs mínimo, en lavado, en baja
- Ruta: `/lavanderia`

## Trabajo Social
- `casos_trabajo_social`: CTS-YYYY-NNNNN, tipo caso (evaluación socioeconómica/violencia/abandono/adicciones/etc), nivel socioeconómico, composición familiar
- `referimientos_sociales`: institución destino, estados (pendiente→completado)
- Ruta: `/trabajo-social`
