import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

// No se anuncia el framework del servidor.
app.disable("x-powered-by");

// Solo loopback: el API no tiene autenticación.
app.listen(env.puerto, "127.0.0.1", () => {
  console.log(`Servidor Iniciado`);
  console.log(`Host: http://localhost:${env.puerto}`);
  console.log(`CORS permitido para: ${env.origenesPermitidos.join(", ")}`);
  console.log(`Fecha/Hora: ${new Date().toLocaleString()}`);
});
