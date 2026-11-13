import { Injectable, signal, Signal, WritableSignal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
    id: number;
    tipo: TipoNotificacion;
    texto: string;
}

const DURACION_POR_DEFECTO_MS = 4000;

/** Cola de avisos que pinta `toast-host`. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
    private readonly cola: WritableSignal<Notificacion[]> = signal<Notificacion[]>([]);
    private siguienteId = 1;

    /** Solo lectura para los componentes. */
    get notificaciones(): Signal<Notificacion[]> {
        return this.cola.asReadonly();
    }

    exito(texto: string, duracionMs: number = DURACION_POR_DEFECTO_MS): void {
        this.mostrar('exito', texto, duracionMs);
    }

    error(texto: string, duracionMs: number = DURACION_POR_DEFECTO_MS): void {
        this.mostrar('error', texto, duracionMs);
    }

    info(texto: string, duracionMs: number = DURACION_POR_DEFECTO_MS): void {
        this.mostrar('info', texto, duracionMs);
    }

    cerrar(id: number): void {
        this.cola.update((actuales: Notificacion[]) =>
            actuales.filter((notificacion: Notificacion) => notificacion.id !== id)
        );
    }

    private mostrar(tipo: TipoNotificacion, texto: string, duracionMs: number): void {
        const id: number = this.siguienteId++;
        this.cola.update((actuales: Notificacion[]) => [...actuales, { id, tipo, texto }]);

        if (duracionMs > 0) {
            setTimeout(() => this.cerrar(id), duracionMs);
        }
    }
}
