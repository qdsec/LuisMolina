# Productos Financieros — Ejercicio técnico

Este documento cubre **cómo ejecutarlo y cómo correr las pruebas**. Lo demás está en archivos
aparte:

| Documento | Qué contiene |
|---|---|
| [`PRUEBAS.md`](./PRUEBAS.md) | Recorrido de verificación manual de punta a punta |

```text
repo-interview-main/
├── src/            backend  — Node.js + Express + routing-controllers (puerto 3002)
├── tests/          pruebas de integración del backend (supertest)
├── frontend/       frontend — Angular 19 (puerto 4200)
├── scripts/        utilidades de desarrollo (comprobación de puertos)
└── PRUEBAS.md      guía de pruebas de punta a punta
```

## Requisitos

- Node.js en el rango `^18.19.1 || ^20.11.1 || >=22.0.0` — es el que exige Angular 19 (lo declara
  `@angular/cli`) y el que el `package.json` de la raíz repite en `engines`, para que npm avise al
  instalar si la versión no sirve. El backend no impone más que eso. Probado con **Node 22.2.0 y
  npm 10.7.0**.
- npm (el que acompaña a Node).

## Cómo levantarlo

Dos comandos, en **una sola terminal**, desde la raíz del repositorio:

```bash
npm run instalar
npm run dev
```

Y abrir **http://localhost:4200**.

`npm run instalar` borra `node_modules` antes de instalar, así que **detenga `npm run dev`** antes
de reinstalar: en Windows, con los servidores vivos, falla con `EBUSY` o `EPERM`.

`npm run dev` levanta el backend y el frontend a la vez y mezcla la salida de ambos en la misma
terminal, prefijada con `[api]` y `[web]`. `Ctrl+C` detiene los dos (en Windows, si `cmd`
pregunta "¿Desea terminar el trabajo por lotes?", responda que sí).

| Comando | Qué hace |
|---|---|
| `npm run instalar` | Instala las dependencias de los dos proyectos (`npm ci` en la raíz y en `frontend/`) |
| `npm run dev` | Levanta backend (`:3002`) y frontend (`:4200`) juntos |
| `npm run dev:api` | Solo el backend |
| `npm run dev:web` | Solo el frontend |
| `npm run pruebas` | Las pruebas de los dos proyectos; se detiene en el primer fallo |
| `npm run pruebas:cobertura` | Las mismas, con cobertura y umbral del 70% 

### Por qué `npm ci` y no `npm install`

Los dos `package-lock.json` están versionados, así que `npm ci` instala exactamente las versiones
con las que se desarrolló y **falla** si el lock y el `package.json` no concuerdan, en vez de
reescribir el lock en silencio. Además borra `node_modules` antes de instalar, lo que evita
instalaciones a medio corromper (en Windows, `ENOTEMPTY` sobre un árbol ya existente). Para
**agregar** una dependencia sigue siendo `npm install <paquete>`.

### Detalles de cada ambiente

**Backend** — queda en `http://localhost:3002`. Arranca con siete productos de ejemplo, de modo que
el listado no aparezca vacío. El almacenamiento es en memoria: al reiniciar el proceso (y `dev:api`
lo reinicia cada vez que se guarda un archivo) los datos vuelven a esos siete.


**Frontend** — queda en `http://localhost:4200`).

### Si un puerto está ocupado

Es el tropiezo más común al relevantar, y sin ayuda es desconcertante: el backend imprime
`EADDRINUSE` pero **el proceso queda vivo sin escuchar** (`ts-node-dev --respawn` no se rinde), y
`ng serve` **se queda preguntando** si quiere usar otro puerto — una pregunta que nadie puede
contestar, porque `concurrently` no le reenvía la entrada estándar. El síntoma final es una terminal
colgada sin causa visible.

Por eso `npm run dev` comprueba antes los dos puertos (`scripts/verificar-puertos.js`, enganchado
como `predev`) y, si alguno está tomado, aborta con un mensaje claro en lugar de dejarlo colgado.
`dev:api` y `dev:web` hacen lo mismo con el puerto que les toca.

Para saber **qué** lo ocupa, en Windows (PowerShell). Este bloque no mata nada:

```powershell
foreach ($puerto in 3002, 4200) {
  Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Get-CimInstance Win32_Process -Filter "ProcessId=$_" } |
    Select-Object @{ n = 'Puerto'; e = { $puerto } }, ProcessId, Name, CommandLine
}
```

**Detenga solo lo que sea de este ejercicio.** El 4200 es el puerto por defecto de *cualquier*
`ng serve`, así que es muy posible que lo tenga otro proyecto Angular suyo; y el 3002 puede estarlo
por algo que publique puertos, como Docker. Mire el `CommandLine` que imprimió el bloque anterior:
si apunta a este repositorio, deténgalo con `Stop-Process -Id <PID>` (agregue `-Force` solo si no
responde). Si lo ocupa otra cosa, no lo mate — cierre ese otro proyecto.

Este bloque hace eso pidiendo confirmación y únicamente sobre procesos `node`:

```powershell
foreach ($puerto in 3002, 4200) {
  Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Get-Process -Id $_ -ErrorAction SilentlyContinue } |
    Where-Object ProcessName -eq 'node' |
    ForEach-Object { Stop-Process -Id $_.Id -Confirm }
}
```


## Scripts

Atajos de la raíz que abarcan los dos proyectos:

| Script | Qué hace |
|---|---|
| `npm run instalar` | `npm ci` en la raíz y en `frontend/` |
| `npm run dev` | Backend y frontend juntos, vía `concurrently` (`--kill-others`: si uno termina, detiene al otro) |
| `npm run predev` | Lo corre npm solo, antes de `dev`: aborta si 3002 o 4200 están ocupados |
| `npm run dev:api` | Alias de `start:dev` |
| `npm run dev:web` | Alias del `start` del frontend |
| `npm run pruebas` | `npm test` en los dos proyectos; se detiene en el primer fallo |
| `npm run pruebas:cobertura` | `npm run test:coverage` en los dos proyectos |

Backend (raíz):

| Script | Qué hace |
|---|---|
| `npm run start:dev` | Levanta el servidor con `ts-node-dev` (`--respawn --transpile-only`) sobre `src/main.ts` |
| `npm run build` | Compila con `tsc` a `dist/` |
| `npm start` | Ejecuta `dist/main.js` (requiere `build` previo) |
| `npm test` | Pruebas con Jest |
| `npm run test:watch` | Jest en modo observación |
| `npm run test:coverage` | Jest con cobertura y umbral |

Frontend (`frontend/`):

| Script | Qué hace |
|---|---|
| `npm start` | `ng serve` (desarrollo, con `proxy.conf.json`) |
| `npm run build` | `ng build`; la configuración por defecto es `production` (salida en `dist/frontend`) |
| `npm run watch` | `ng build --watch --configuration development` |
| `npm test` | Pruebas con Jest |
| `npm run test:watch` | Jest en modo observación |
| `npm run test:coverage` | Jest con cobertura y umbral |

## Pruebas


Desde la raíz, los dos proyectos de una vez:

```bash
npm run pruebas             # backend y después frontend
npm run pruebas:cobertura   # las mismas, con cobertura y umbral
```

O cada proyecto por separado, con sus scripts propios:

```bash
npm test                           # backend
npm --prefix frontend test         # frontend
```

Ambos proyectos exigen un mínimo de **70%** de cobertura en `statements`, `branches`, `functions` y
`lines`, configurado como `coverageThreshold` global en cada `jest.config.js`.

La cobertura se mide sobre el código con lógica. Se excluyen archivos sin ella:

| Proyecto | Excluido de la cobertura |
|---|---|
| Backend | `src/main.ts`, `src/config/**`, `src/interfaces/**`, `src/seed/**` |
| Frontend | `*.types.ts`, `*.model.ts`, `*.routes.ts`, `*.endpoints.ts`, `environments/**`, `app.config.ts` |

Dónde están las pruebas:

- **Backend.** Las de integración están en `tests/products.api.spec.ts` y recorren HTTP completo con
  supertest (rutas, códigos, forma de los errores, CORS). Las unitarias van junto al código
  (`src/utils/fecha.util.spec.ts`, `src/services/product.service.spec.ts`).
- **Frontend.** Cada `*.spec.ts` está junto al archivo que prueba: mapper, servicio de API,
  repositorio, validadores, componentes de `shared/` y las dos pantallas.
