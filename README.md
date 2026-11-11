# Mi Billetera Lite (PWA)

App web progresiva para registrar gastos diarios. Funciona 100% sin conexión.

## Estructura
```
index.html · styles.css · app.js
manifest.json · sw.js
icons/ (192 y 512, any + maskable)
make_icons.py (opcional: regenera los íconos)
```

## Probar en local
```
python3 -m http.server 8000
```
Abre http://localhost:8000 en Chrome.

## Pruebas del checklist
1. **Instalación:** icono de instalar en la barra de direcciones (o botón "Instalar app").
2. **Lighthouse:** DevTools > Lighthouse > Progressive Web App.
3. **Offline:** DevTools > Application > Service Workers (verifica que esté activo) > Network > Offline > F5.
4. **Persistencia:** en Offline agrega "Taxis" $150, cierra y reabre la pestaña.

## Desplegar en GitHub Pages
1. Crea un repositorio en GitHub y sube todos los archivos a la raíz.
2. Settings > Pages > Source: "Deploy from a branch" > rama `main`, carpeta `/ (root)`.
3. La URL quedará como `https://TU-USUARIO.github.io/NOMBRE-REPO/` (HTTPS automático).

Si cambias algún archivo del App Shell, sube el número de `VERSION` en `sw.js`.
