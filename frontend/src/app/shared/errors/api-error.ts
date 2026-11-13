/** Clasificación de fallos que la interfaz necesita distinguir. */
export type ApiErrorCode =
    | 'VALIDACION'
    | 'DUPLICADO'
    | 'NO_ENCONTRADO'
    | 'RED'
    | 'SERVIDOR'
    | 'DESCONOCIDO';

/** Error de validación del backend, asociado a un campo. */
export interface ErrorDeCampo {
    campo: string;
    mensajes: string[];
}

/** Error de dominio que emiten los repositorios. */
export class ApiError extends Error {
    constructor(
        readonly code: ApiErrorCode,
        message: string,
        readonly status: number = 0,
        readonly errores: ErrorDeCampo[] = []
    ) {
        super(message);
        this.name = 'ApiError';
        // Mantiene `instanceof` al compilar a ES5/ES2015.
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export function esApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}
