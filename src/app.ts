import "reflect-metadata";
import { Express } from "express";
import { createExpressServer } from "routing-controllers";
import { env } from "./config/env";
import { ProductController } from "./controllers/ProductControllers";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.middleware";

/** Construye la aplicación Express sin ponerla a escuchar. */
export function createApp(): Express {
  return createExpressServer({
    cors: {
      origin: env.origenesPermitidos,
    },
    routePrefix: "/bp",
    // Rechaza con 400 las propiedades que el DTO no declara (evita mass assignment).
    validation: {
      whitelist: true,
      forbidNonWhitelisted: true,
    },
    // Registro explícito: con --transpile-only un glob es poco fiable.
    controllers: [ProductController],
    middlewares: [ErrorHandlerMiddleware],
    defaultErrorHandler: false,
  });
}
