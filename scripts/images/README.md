# Imágenes del sitio

- `prepare.sh`: toma los retratos generados (carpeta local `~/Imágenes/Modelo IA`), recorta la marca de agua inferior, limita el tamaño y deja JPG en `src/assets/img/`. También genera `public/og.jpg`.
- `cover-*.jpg`: capturas de pantalla de cada producto a 1440×900, recortadas a 16:10 (1600×1000). Las de Requerimientos y Compras llevan difuminados el nombre de usuario y la sesión; al recapturar, hacerlo con sesión cerrada o datos demo.
