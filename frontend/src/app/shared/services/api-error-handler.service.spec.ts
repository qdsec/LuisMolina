import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiError } from '../errors/api-error';
import { ApiErrorHandlerService, manejarErrorApi } from './api-error-handler.service';
import { NotificacionesService } from './notificaciones.service';

function respuesta(status: number, body: unknown = {}): HttpErrorResponse {
    return new HttpErrorResponse({ status, error: body });
}

describe('ApiErrorHandlerService', () => {
    let servicio: ApiErrorHandlerService;
    let notificaciones: NotificacionesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ApiErrorHandlerService, NotificacionesService],
        });
        servicio = TestBed.inject(ApiErrorHandlerService);
        notificaciones = TestBed.inject(NotificacionesService);
    });

    describe('aApiError', () => {
        it('clasifica el status 0 como problema de red', () => {
            const error = servicio.aApiError(respuesta(0), 'por defecto');

            expect(error.code).toBe('RED');
            expect(error.message).toContain('No pudimos conectar');
        });

        it('clasifica el 404 como no encontrado', () => {
            const error = servicio.aApiError(
                respuesta(404, { name: 'NotFoundError' }),
                'por defecto'
            );

            expect(error.code).toBe('NO_ENCONTRADO');
            expect(error.message).toBe('El producto ya no existe.');
        });

        it('distingue el duplicado dentro de los 400', () => {
            const error = servicio.aApiError(
                respuesta(400, { message: 'Duplicate identifier found in the database' }),
                'por defecto'
            );

            expect(error.code).toBe('DUPLICADO');
        });

        it('trata el resto de los 400 como validación y conserva el detalle por campo', () => {
            const error = servicio.aApiError(
                respuesta(400, {
                    message: "Invalid body, check 'errors' property for more info.",
                    errors: [{ campo: 'name', mensajes: ['muy corto'] }],
                }),
                'Revisa los datos'
            );

            expect(error.code).toBe('VALIDACION');
            expect(error.message).toBe('Revisa los datos');
            expect(error.errores).toEqual([{ campo: 'name', mensajes: ['muy corto'] }]);
        });

        it('clasifica los 5xx como error de servidor', () => {
            expect(servicio.aApiError(respuesta(500), 'x').code).toBe('SERVIDOR');
        });

        it('usa el mensaje por defecto ante un status inesperado', () => {
            const error = servicio.aApiError(respuesta(418), 'Algo salió mal');

            expect(error.code).toBe('DESCONOCIDO');
            expect(error.message).toBe('Algo salió mal');
        });
    });

    describe('manejarErrorApi', () => {
        it('deja pasar los valores cuando no hay error', async () => {
            const valor = await firstValueFrom(
                of('ok').pipe(manejarErrorApi({ handler: servicio, mensajeError: 'x' }))
            );

            expect(valor).toBe('ok');
        });

        it('convierte el fallo HTTP en ApiError y avisa', async () => {
            const flujo$ = throwError(() => respuesta(500)).pipe(
                manejarErrorApi({ handler: servicio, mensajeError: 'x' })
            );

            await expect(firstValueFrom(flujo$)).rejects.toBeInstanceOf(ApiError);
            expect(notificaciones.notificaciones()).toHaveLength(1);
        });

        it('no avisa cuando se pide silencio', async () => {
            const flujo$ = throwError(() => respuesta(500)).pipe(
                manejarErrorApi({ handler: servicio, mensajeError: 'x', mostrarAviso: false })
            );

            await expect(firstValueFrom(flujo$)).rejects.toBeInstanceOf(ApiError);
            expect(notificaciones.notificaciones()).toHaveLength(0);
        });

        it('envuelve también los errores que no son HTTP', async () => {
            const flujo$ = throwError(() => new Error('raro')).pipe(
                manejarErrorApi({ handler: servicio, mensajeError: 'mensaje', mostrarAviso: false })
            );

            await expect(firstValueFrom(flujo$)).rejects.toMatchObject({
                code: 'DESCONOCIDO',
                message: 'mensaje',
            });
        });
    });
});
