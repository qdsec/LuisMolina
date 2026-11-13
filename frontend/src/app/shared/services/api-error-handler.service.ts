import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, OperatorFunction, throwError } from 'rxjs';
import { ApiError, ApiErrorCode, ErrorDeCampo } from '../errors/api-error';
import { NotificacionesService } from './notificaciones.service';

/** Cuerpo de error del backend. */
interface CuerpoDeError {
    name?: string;
    message?: string;
    errors?: ErrorDeCampo[];
}

const MENSAJE_RED = 'No pudimos conectar con el servidor. Verifica que esté disponible.';
const MENSAJE_SERVIDOR = 'Ocurrió un error en el servidor. Intenta de nuevo en unos minutos.';
const MENSAJE_NO_ENCONTRADO = 'El producto ya no existe.';
const MENSAJE_DUPLICADO = 'Ya existe un producto con ese ID.';

/** Traduce los fallos HTTP al lenguaje del dominio. */
@Injectable({ providedIn: 'root' })
export class ApiErrorHandlerService {
    private readonly notificaciones: NotificacionesService = inject(NotificacionesService);

    aApiError(respuesta: HttpErrorResponse, mensajePorDefecto: string): ApiError {
        const cuerpo: CuerpoDeError = (respuesta.error ?? {}) as CuerpoDeError;
        const errores: ErrorDeCampo[] = Array.isArray(cuerpo.errors) ? cuerpo.errors : [];
        const { code, mensaje } = this.clasificar(respuesta, cuerpo, mensajePorDefecto);
        return new ApiError(code, mensaje, respuesta.status, errores);
    }

    notificar(error: ApiError): void {
        this.notificaciones.error(error.message);
    }

    private clasificar(
        respuesta: HttpErrorResponse,
        cuerpo: CuerpoDeError,
        mensajePorDefecto: string
    ): { code: ApiErrorCode; mensaje: string } {
        // status 0: no hubo respuesta.
        if (respuesta.status === 0) {
            return { code: 'RED', mensaje: MENSAJE_RED };
        }
        if (respuesta.status === 404) {
            return { code: 'NO_ENCONTRADO', mensaje: MENSAJE_NO_ENCONTRADO };
        }
        if (respuesta.status === 400) {
            // El duplicado se distingue por el mensaje, no por el código.
            if ((cuerpo.message ?? '').includes('Duplicate identifier')) {
                return { code: 'DUPLICADO', mensaje: MENSAJE_DUPLICADO };
            }
            return { code: 'VALIDACION', mensaje: mensajePorDefecto };
        }
        if (respuesta.status >= 500) {
            return { code: 'SERVIDOR', mensaje: MENSAJE_SERVIDOR };
        }
        return { code: 'DESCONOCIDO', mensaje: mensajePorDefecto };
    }
}

/** Convierte cualquier fallo HTTP en un `ApiError`. */
export function manejarErrorApi<T>({
    handler,
    mensajeError,
    mostrarAviso = true,
}: {
    handler: ApiErrorHandlerService;
    mensajeError: string;
    mostrarAviso?: boolean;
}): OperatorFunction<T, T> {
    return (origen$: Observable<T>) =>
        origen$.pipe(
            catchError((error: unknown) => {
                const apiError: ApiError =
                    error instanceof HttpErrorResponse
                        ? handler.aApiError(error, mensajeError)
                        : new ApiError('DESCONOCIDO', mensajeError);

                if (mostrarAviso) {
                    handler.notificar(apiError);
                }
                return throwError(() => apiError);
            })
        );
}
