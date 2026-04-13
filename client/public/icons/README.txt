GEOFACTS APP ICONS
==================

Three icon files are required in this folder:

1. icon-192.png  (192x192 pixels)
   - Standard PWA icon
   - Used for home screen shortcut, notification badge, browser tab

2. icon-512.png  (512x512 pixels)
   - Large PWA icon
   - Used for splash screen and app store listings

3. icon-maskable-512.png  (512x512 pixels)
   - Maskable icon with safe zone padding (~20% on all sides)
   - Used on Android for adaptive icons (rounded, squircle, etc.)
   - Keep the main logo within the inner 60% of the canvas

Design notes:
- Background color: #15202B (dark blue-grey)
- Primary color: #1D8CD7 (blue)
- The logo file "GeoFacts_logo_met_wereldbol.png" can be used as the source
- All icons should be PNG format with transparency support

Tools you can use to generate these:
- https://maskable.app  (for maskable icon testing)
- https://realfavicongenerator.net  (for generating all sizes)
- Any image editor (Photoshop, GIMP, Figma, etc.)
