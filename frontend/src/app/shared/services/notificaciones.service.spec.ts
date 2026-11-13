import { TestBed } from '@angular/core/testing';
import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService', () => {
    let servicio: NotificacionesService;

    beforeEach(() => {
        jest.useFakeTimers();
        TestBed.configureTestingModule({ providers: [NotificacionesService] });
        servicio = TestBed.inject(NotificacionesService);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('empieza sin avisos', () => {
        expect(servicio.notificaciones()).toEqual([]);
    });

    it('encola un aviso de éxito', () => {
        servicio.exito('Guardado');

        expect(servicio.notificaciones()).toEqual([
            { id: 1, tipo: 'exito', texto: 'Guardado' },
        ]);
    });

    it('distingue los tipos', () => {
        servicio.error('Falló');
        servicio.info('Aviso');

        expect(servicio.notificaciones().map((n) => n.tipo)).toEqual(['error', 'info']);
    });

    it('descarta el aviso al cumplirse la duración', () => {
        servicio.exito('Guardado', 1000);
        expect(servicio.notificaciones()).toHaveLength(1);

        jest.advanceTimersByTime(1000);

        expect(servicio.notificaciones()).toHaveLength(0);
    });

    it('con duración 0 el aviso permanece', () => {
        servicio.error('Persistente', 0);

        jest.advanceTimersByTime(60_000);

        expect(servicio.notificaciones()).toHaveLength(1);
    });

    it('cierra un aviso puntual sin tocar los demás', () => {
        servicio.exito('Primero', 0);
        servicio.exito('Segundo', 0);

        servicio.cerrar(1);

        expect(servicio.notificaciones().map((n) => n.texto)).toEqual(['Segundo']);
    });
});
