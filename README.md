# Control Gestos IA

Demo web experimental para controlar una interfaz usando gestos de mano detectados con la webcam.

## Qué incluye esta V1

- Detección de hasta 2 manos con MediaPipe Hands.
- Dibujo de puntos y conexiones de la mano en tiempo real.
- Gestos básicos: señalar, pinza, mano abierta, puño y victoria.
- Cursor virtual experimental.
- Clic virtual con gesto de pinza sobre botones/enlaces.
- Telemetría de manos, confianza y FPS.
- Interfaz estilo HUD futurista inspirada en la referencia de video.

## Cómo probarlo

La cámara del navegador requiere HTTPS o localhost.

### Opción 1: Cloudflare Pages

1. Crea un proyecto en Cloudflare Pages.
2. Conecta este repositorio: `DiegoRod24/control-gestos-ia`.
3. Framework preset: `None`.
4. Build command: déjalo vacío.
5. Build output directory: `/`.
6. Despliega.
7. Abre la URL HTTPS y permite el acceso a la cámara.

### Opción 2: Local

Puedes usar cualquier servidor local, por ejemplo VS Code Live Server.

## Siguiente fase

- Calibración de sensibilidad.
- Gestos de swipe izquierda/derecha.
- Arrastrar tarjetas con pinza.
- Zoom con dos manos.
- Menú radial.
- Paneles flotantes tipo Minority Report.
- Sonidos y partículas.
- Modo presentación/control de dashboard.

> Todo el procesamiento de cámara de esta versión ocurre en el navegador del usuario.
