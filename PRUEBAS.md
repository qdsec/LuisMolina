# Guía de pruebas

Cómo verificar de punta a punta la solución del ejercicio de productos financieros. Los pasos
están en el orden más eficiente: lo que no necesita servidores primero, el recorrido manual al final.

Cada paso dice **qué debe pasar**, para poder distinguir "pasó" de "no pasó" sin interpretar.

> **Windows, antes de empezar.** En PowerShell `curl` es un alias de `Invoke-WebRequest`, no el curl
> real, y los bloques de API de abajo no funcionan como están escritos. Córralos en **Git Bash**, o
> en PowerShell escriba `curl.exe` en lugar de `curl`.

---

## 0. Partir de cero

En Windows es fácil que sobreviva el árbol de procesos de una corrida anterior; entonces los puertos
quedan tomados y el arranque falla de forma confusa. Antes de empezar:

```powershell
$procesos = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*
epo-interview-main\*' }
$procesos | Select-Object ProcessId, CommandLine
$procesos | ForEach-Object { Stop-Process -Id $_.ProcessId -Confirm }
```

Lista primero y pide confirmación por cada proceso, a propósito. El patrón va anclado con separadores
de ruta para no capturar una carpeta hermana (`repo-interview-main-copia`), y sin `-Force` para no
matar de golpe un proceso auxiliar del editor que esté abierto sobre la carpeta.

Y confirmar que quedaron libres:

```powershell
foreach ($puerto in 3002, 4200) {
  if (Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue) {
    "$puerto OCUPADO" } else { "$puerto libre" }
}
```

**Qué debe pasar:** `3002 libre` y `4200 libre`.

## 1. Instalar

```bash
npm run instalar
```

**Qué debe pasar:** termina sin error. Instala la raíz y `frontend/` con `npm ci`, es decir
exactamente las versiones de los dos `package-lock.json`.

**Si falla con `EBUSY` o `EPERM`:** quedó algo vivo del paso 0. `npm ci` borra `node_modules` antes
de instalar y en Windows no puede borrar archivos en uso.

## 2. Lo que no necesita servidores

Rápido y sin dependencias externas, así que conviene antes de levantar nada.

| Comando | Qué debe pasar |
|---|---|
| `npm run pruebas` | `42 passed` en el backend y luego `144 passed` en el frontend |
| `npm run pruebas:cobertura` | Lo mismo, y **ningún** aviso de umbral incumplido (el mínimo es 70% en statements, branches, functions y lines) |
| `npx tsc --noEmit -p tsconfig.json` | Sin salida (backend sin errores de tipos) |
| `npx tsc --noEmit -p frontend/tsconfig.app.json` | Sin salida (frontend sin errores de tipos) |
| `npm --prefix frontend run build` | `Application bundle generation complete`, salida en `frontend/dist/frontend/` |

`npm run pruebas` **se detiene en el primer fallo**: si el backend falla, el frontend no se ejecuta.
Es intencional, para no leer dos informes cuando el primero ya está roto.

## 3. El guardia de puertos

Comprueba que un puerto ocupado produzca un mensaje claro y no una terminal colgada.

En una terminal, ocupar el 4200 a propósito:

```bash
node -e "require('net').createServer().listen(4200,'127.0.0.1',()=>console.log('ocupado'))"
```

En otra, `npm run dev`.

**Qué debe pasar:** aborta de inmediato, sin arrancar nada:

```
Puerto ocupado: 4200.
Hay otro proceso escuchando ahí (puede ser un arranque anterior que quedó vivo).
Vea "Si un puerto está ocupado" en el README para identificarlo y liberarlo.
```

Cerrar después el proceso que ocupaba el puerto.

## 4. Levantar

```bash
npm run dev
```

**Qué debe pasar:** la salida de los dos servidores mezclada en la misma terminal, prefijada con
`[api]` y `[web]`, y estas dos líneas:

```
[api] Servidor Iniciado
[web]   ➜  Local:   http://localhost:4200/
```

## 5. Backend por API

Pegar el bloque completo en Git Bash:

```bash
B=http://localhost:3002/bp/products
L=$(date -d "+1 year" +%F 2>/dev/null || date -v+1y +%F)   # liberación: hoy + 1 año
R=$(date -d "+2 years" +%F 2>/dev/null || date -v+2y +%F)  # revisión: hoy + 2 años
P='{"id":"tst-001","name":"Producto de prueba","description":"Descripcion suficientemente larga","logo":"https://ejemplo.com/logo.png","date_release":"'$L'","date_revision":"'$R'"}'
E='{"name":"Producto editado","description":"Descripcion suficientemente larga","logo":"https://ejemplo.com/logo.png","date_release":"2027-12-01","date_revision":"2028-12-01"}'
J='Content-Type: application/json'

curl -s $B | head -c 80; echo
curl -s $B/verification/trj-crd; echo
curl -s $B/verification/no-existe; echo
curl -s -o /dev/null -w "GET uno          %{http_code}\n" $B/trj-crd
curl -s -o /dev/null -w "GET inexistente  %{http_code}\n" $B/no-existe
curl -s -o /dev/null -w "POST valido      %{http_code}\n" -X POST $B -H "$J" -d "$P"
curl -s -o /dev/null -w "POST duplicado   %{http_code}\n" -X POST $B -H "$J" -d "$P"
curl -s -o /dev/null -w "POST array       %{http_code}\n" -X POST $B -H "$J" -d '[{"x":1}]'
curl -s -o /dev/null -w "POST JSON roto   %{http_code}\n" -X POST $B -H "$J" -d '{roto'
curl -s -o /dev/null -w "PUT valido       %{http_code}\n" -X PUT $B/tst-001 -H "$J" -d "$E"
curl -s -o /dev/null -w "PUT inexistente  %{http_code}\n" -X PUT $B/no-existe -H "$J" -d "$E"
curl -s -o /dev/null -w "DELETE           %{http_code}\n" -X DELETE $B/tst-001
curl -s -o /dev/null -w "DELETE repetido  %{http_code}\n" -X DELETE $B/tst-001
```

**Qué debe pasar:**

| Caso | Esperado |
|---|---|
| `GET` lista | Un `{"data":[...]}` con **7** productos |
| `verification/trj-crd` | `true` |
| `verification/no-existe` | `false` |
| `GET` uno / inexistente | `200` / `404` |
| `POST` válido / duplicado | `200` / `400` |
| `POST` con cuerpo array | `400` |
| `POST` con JSON malformado | `400` |
| `PUT` válido / inexistente | `200` / `404` |
| `DELETE` / repetido | `200` / `404` |

Dos de esos `400` no son cosmética: el cuerpo en forma de **array** eludía la validación del DTO y
creaba un registro sin `id`, imposible de editar o borrar después; y el **JSON malformado** devolvía
un `500`. Que esos dos sigan en `400` es parte de la prueba. El tercero, el id duplicado, es la
regla de negocio del enunciado.

Para ver la forma del error de validación:

```bash
curl -s -X POST $B -H "$J" -d '{"id":"ab","name":"xx","description":"corta","logo":"","date_release":"2020-01-01","date_revision":"2020-01-01"}'
```

**Qué debe pasar:** un cuerpo con `name`, `message` y un arreglo `errors` donde cada entrada es
`{ campo, mensajes }` — uno por cada campo que falló, no solo el primero.

### Proxy del frontend

```bash
curl -s -o /dev/null -w "proxy -> %{http_code}\n" http://localhost:4200/bp/products
```

**Qué debe pasar:** `200`. El dev server reenvía `/bp` al backend, de modo que el navegador ve un
solo origen y el frontend no depende de la configuración de CORS durante el desarrollo.

## 6. Frontend, funcionalidad por funcionalidad

Abrir **http://localhost:4200**.

| # | Qué hacer | Qué debe pasar |
|---|---|---|
| F1 | Cargar el listado | Primero skeletons, después los **primeros 5** productos (el tamaño por defecto) y el contador `7 Resultados` |
| F2 | Escribir en `Search...` | Filtra por nombre y descripción. `credito` y `CRÉDITO` dan el mismo resultado (ignora tildes y mayúsculas) |
| F2 | Buscar `zzz` | Mensaje de "no se encontraron productos", distinto del estado inicial sin datos |
| F3 | Cambiar el selector de tamaño que está junto al paginador entre 5, 10 y 20, y paginar | El `select` queda mostrando el valor elegido y la tabla muestra esa cantidad |
| F3 | Ir a la página 2 y escribir en el buscador | Vuelve a la página 1, no a una página que ya no existe |
| F4 | Botón `Agregar`, llenar y `Enviar` | Título **"Formulario de Registro"**; al guardar vuelve al listado con el producto nuevo y un aviso de éxito |
| F5 | Menú de acciones → `Editar` | Título **"Formulario de Edición"**, los campos **llegan llenos** y el ID está deshabilitado |
| F6 | Menú de acciones → `Eliminar` | Modal "¿Estas seguro de eliminar el producto …?"; `Cancelar` no borra, `Eliminar` sí y refresca el listado |

### Los dos casos que más vale la pena mirar

Son defectos que las pruebas unitarias no detectaron, porque verifican el `FormGroup` y no el DOM.
Si reaparecen, F5 y F6 quedan inservibles:

1. **Edición con los campos llenos.** La pantalla llegó a renderizarse vacía aunque el formulario
   tenía los datos (un `[ngModel]` dentro de un `ControlValueAccessor` con `OnPush`). Si los inputs
   salen en blanco al editar, volvió el problema.
2. **El menú de acciones de la ÚLTIMA fila.** Se recortaba y dejaba `Editar` y `Eliminar` fuera de
   alcance. Con solo 7 productos no basta con bajar: **reduzca la altura de la ventana** hasta que
   el menú de la última fila no quepa debajo. Debe abrirse **hacia arriba** y quedar completo.

## 7. Validaciones del formulario

En `Agregar`, campo por campo. Cada error aparece **debajo** del campo y con borde rojo.

| Campo | Debe fallar con | Debe aceptar |
|---|---|---|
| ID | `ab` (2 caracteres), 11 caracteres, `trj-crd` (ya existe) | `tst-002` |
| Nombre | `abcd` (4), solo espacios | `Producto de prueba` |
| Descripción | `corta` (menos de 10), solo espacios | 10 a 200 caracteres |
| Logo | Vacío | Cualquier texto no vacío; no se valida que sea una URL |
| Fecha Liberación | Ayer o antes | Hoy o después |
| Fecha Revisión | — | No se escribe: se calcula sola y está deshabilitada |

Cuatro casos específicos que conviene forzar:

- **ID ya registrado.** Escribir `trj-crd` y esperar un momento: aparece el error de ID registrado
  (lo consulta al backend tras 400 ms) y `Enviar` queda bloqueado mientras verifica.
- **ID con el backend caído.** Detener el backend y escribir un ID: el formulario **no** debe
  bloquearse. Falla hacia el lado permisivo a propósito; el duplicado lo rechaza el servidor al
  guardar.
- **Año bisiesto.** Liberación `2028-02-29` da revisión **`2029-02-28`**, no `2029-03-01`.
- **Reiniciar.** En alta limpia todo; en edición vuelve a los valores originales del producto, no a
  vacío.

## 8. Accesibilidad y responsive

- **Solo teclado, sin tocar el mouse.** `Tab` hasta el menú de acciones, `Enter` para abrirlo,
  flechas para moverse, `Escape` para cerrar. En el modal de eliminar el foco queda **atrapado**
  dentro del diálogo y empieza en `Cancelar`.
- **Ancho de móvil.** DevTools a 360 px: la barra de búsqueda y el pie se apilan, y la columna de
  acciones queda fija a la derecha. La tabla conserva su ancho mínimo y se desplaza en horizontal
  dentro de su contenedor; **la página en sí no desborda**.

## 9. Cerrar

`Ctrl+C` en la terminal de `npm run dev` (en Windows, si `cmd` pregunta por el trabajo por lotes,
responder que sí). Después repetir la comprobación del paso 0: en Windows es fácil que sobreviva el
árbol de hijos y los puertos queden tomados para la próxima vez.

---

## Lo que parece un fallo y no lo es

- **Los datos vuelven a los 7 iniciales.** El almacenamiento es en memoria y `ts-node-dev --respawn`
  reinicia el proceso cada vez que se guarda un archivo de `src/`.
- **`Search...` en inglés** y **`¿Estas seguro…?` sin tilde.** Vienen literales del enunciado; se
  mantuvieron por fidelidad al texto original.
- **Los productos de ejemplo tienen fechas de 2027.** Cuando esas fechas queden en el pasado, esos
  productos no se podrán editar sin mover la fecha de liberación, porque el enunciado exige que la
  edición mantenga la regla de "fecha igual o posterior a hoy".
