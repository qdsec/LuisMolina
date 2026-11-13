# Frontend

Aplicación Angular 19 del ejercicio de productos financieros. Cómo levantar el proyecto y correr
las pruebas está en el [`README.md` de la raíz](../README.md).

Lo más cómodo es levantar los dos ambientes de una sola vez desde la raíz del repositorio
(`npm run instalar` y `npm run dev`); este frontend necesita el backend corriendo en el puerto 3002.

Si prefiere trabajar solo aquí, desde esta carpeta:

```bash
npm ci                    # instalación reproducible a partir de package-lock.json
npm start                 # ng serve en http://localhost:4200, con proxy.conf.json hacia el backend
npm run build             # build de producción en dist/frontend
npm test                  # pruebas con Jest (no Karma)
npm run test:coverage     # con cobertura; falla por debajo del 70%
```

El backend debe estar corriendo en el puerto 3002 (`npm run dev:api` en la raíz del repositorio).
