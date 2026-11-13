import { NextFunction, Request, Response } from "express";
import { ValidationError } from "class-validator";
import { ExpressErrorMiddlewareInterface, HttpError, Middleware } from "routing-controllers";

interface ErrorDeCampo {
  campo: string;
  mensajes: string[];
}

interface CuerpoDeError {
  name: string;
  message: string;
  errors?: ErrorDeCampo[];
}

/** Da una forma única a todas las respuestas de error. */
@Middleware({ type: "after" })
export class ErrorHandlerMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: unknown, _request: Request, response: Response, next: NextFunction): void {
    if (response.headersSent) {
      next(error);
      return;
    }

    const httpError = error as HttpError & {
      errors?: unknown;
      status?: number;
      statusCode?: number;
    };

    // routing-controllers usa httpCode; body-parser y Express, status/statusCode.
    // Sin mirar los tres, un JSON malformado daria 500 en vez de 400.
    const status: number =
      primerNumero(httpError?.httpCode, httpError?.status, httpError?.statusCode) ?? 500;

    const cuerpo: CuerpoDeError = {
      name: httpError?.name ?? "InternalServerError",
      // En un 500 no se expone el mensaje ni el stack: el detalle solo va al log.
      message: status === 500 ? "Unexpected error" : (httpError?.message ?? "Unexpected error"),
    };

    const errores = aplanarErroresDeValidacion(httpError?.errors);
    if (errores.length > 0) {
      cuerpo.errors = errores;
    }

    if (status === 500) {
      console.error("[error-no-controlado]", error);
    }

    response.status(status).json(cuerpo);
  }
}

function primerNumero(...valores: unknown[]): number | undefined {
    return valores.find((valor): valor is number => typeof valor === "number");
}

function aplanarErroresDeValidacion(errores: unknown): ErrorDeCampo[] {
  if (!Array.isArray(errores)) {
    return [];
  }
  return errores
    .filter((error): error is ValidationError => typeof error?.property === "string")
    .map((error) => ({
      campo: error.property,
      mensajes: Object.values(error.constraints ?? {}),
    }));
}
