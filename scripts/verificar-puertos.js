/**
 * Aborta si alguno de los puertos recibidos ya está ocupado.
 * Uso: node scripts/verificar-puertos.js 3002 4200
 */

const net = require("net");

/** El backend escucha en IPv4 y ng serve en IPv6. */
const HOSTS = ["127.0.0.1", "::1"];
const TIEMPO_LIMITE_MS = 1000;

/** Resuelve `true` si algo acepta conexiones en ese host y puerto. */
function hayAlguienEscuchando(host, puerto) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port: puerto });
    const terminar = (resultado) => {
      socket.destroy();
      resolve(resultado);
    };

    socket.setTimeout(TIEMPO_LIMITE_MS);
    socket.once("connect", () => terminar(true));
    socket.once("timeout", () => terminar(false));
    socket.once("error", () => terminar(false));
  });
}

async function estaOcupado(puerto) {
  const resultados = await Promise.all(
    HOSTS.map((host) => hayAlguienEscuchando(host, puerto))
  );
  return resultados.some(Boolean);
}

async function main() {
  const puertos = process.argv.slice(2).map(Number);

  if (puertos.length === 0 || puertos.some((puerto) => !Number.isInteger(puerto))) {
    console.error("Uso: node scripts/verificar-puertos.js <puerto> [<puerto>...]");
    process.exit(2);
  }

  const ocupados = [];
  for (const puerto of puertos) {
    if (await estaOcupado(puerto)) {
      ocupados.push(puerto);
    }
  }

  if (ocupados.length > 0) {
    const plural = ocupados.length > 1 ? "s" : "";
    console.error(
      `\nPuerto${plural} ocupado${plural}: ${ocupados.join(", ")}.\n` +
        "Hay otro proceso escuchando ahí (puede ser un arranque anterior que quedó vivo).\n" +
        "Vea \"Si un puerto está ocupado\" en el README para identificarlo y liberarlo.\n"
    );
    process.exit(1);
  }
}

main().catch((error) => {
  // Si la comprobación misma falla, no vale la pena impedir el arranque.
  console.error("No se pudo comprobar los puertos:", error.message);
});
