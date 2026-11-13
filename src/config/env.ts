import "dotenv/config";

const PUERTO_POR_DEFECTO = 3002;
const ORIGEN_POR_DEFECTO = "http://localhost:4200";

function leerPuerto(): number {
  const valor = Number(process.env.PORT);
  return Number.isInteger(valor) && valor > 0 ? valor : PUERTO_POR_DEFECTO;
}

function leerOrigenes(): string[] {
  return (process.env.CORS_ORIGIN ?? ORIGEN_POR_DEFECTO)
    .split(",")
    .map((origen) => origen.trim())
    .filter((origen) => origen.length > 0);
}

/** Configuración del proceso, leída una sola vez al arrancar. */
export const env = {
  puerto: leerPuerto(),
  origenesPermitidos: leerOrigenes(),
};
