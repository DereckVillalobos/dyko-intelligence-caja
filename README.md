# Dyko Intelligence — Caja móvil

Punto de venta para el teléfono del empleado: escáner de códigos, cobro en efectivo (con vuelto), datáfono y SINPE Móvil.

## Cómo usarlo en el iPhone

No se instala desde GitHub. Se abre en Safari como una app web:

1. En Grok, **publique** esta app (botón de publicar).
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

## Desarrollo

```bash
npm install
npm run dev
```

Los precios se muestran con IVA incluido (13%).
