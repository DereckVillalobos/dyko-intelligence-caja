# Dyko Intelligence — Caja móvil

> **Estado (2026-10-17):** prototipo en desarrollo. La versión `main` conserva infraestructura de Grok; la modernización a Vercel/Neon entregada por Claude en ZIP y los cambios de [PR #1](https://github.com/DereckVillalobos/dyko-intelligence-caja/pull/1) **aún no están fusionados**. **No usar en producción.**
>
> **[Leer estado de módulos, funcionalidades, versiones y entrega a Claude](docs/ESTADO_Y_HANDOFF.md)**

Punto de venta para el teléfono del empleado: escáner de códigos, cobro en efectivo (con vuelto), datáfono y SINPE Móvil.

## Cómo usarlo en el iPhone

No se instala desde GitHub. Se abre en Safari como una app web:

1. Primero desplegar una **versión de prueba validada** con HTTPS. No hay aún un enlace público de Vercel comprobado.
2. En el iPhone, abra el enlace de la app **en Safari** (no en Chrome ni en Instagram).
3. Toque el botón **Compartir** (el cuadrado con la flecha hacia arriba).
4. Toque **Agregar a pantalla de inicio**.
5. Ábrala desde el ícono. Cuando pida la cámara, toque **Permitir** para escanear.

Así queda como una app: pantalla completa, lista para cobrar.

**En el local:** Caja → toque productos o Escanear → Cobrar → Efectivo, Tarjeta o SINPE. El historial guarda cada venta.

En **Ajustes** ponga el número SINPE real del negocio y el nombre de la caja de ese teléfono.

## Qué incluye

- Catálogo con códigos de barras y precios en colones
- Escáner por cámara (o código escrito)
- Efectivo con vuelto, tarjeta (datáfono) y SINPE Móvil
- Historial del día
- Registro de productos nuevos al vuelo

## Desarrollo local (demo, datos ficticios)

```bash
npm install
npm run dev
```

La versión `main` puede necesitar variables de entorno y ajustes heredados de Grok. Para una demostración más segura hay que **conciliar primero** el ZIP de Claude y el PR #1 en una rama validada. No introducir datos de clientes ni cobrar operaciones reales hasta confirmar las pruebas y los permisos. Ver [guía de coordinación](docs/ESTADO_Y_HANDOFF.md).

Los precios se muestran con IVA incluido (13%).
