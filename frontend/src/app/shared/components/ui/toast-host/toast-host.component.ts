import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import {
    Notificacion,
    NotificacionesService,
} from '../../../services/notificaciones.service';

/** Pinta la cola de avisos. Se monta una sola vez, en la raíz. */
@Component({
    selector: 'app-toast-host',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="avisos">
            @for (aviso of notificaciones(); track aviso.id) {
                <div
                    class="aviso"
                    [class.aviso--exito]="aviso.tipo === 'exito'"
                    [class.aviso--error]="aviso.tipo === 'error'"
                    [attr.role]="aviso.tipo === 'error' ? 'alert' : 'status'"
                    [attr.aria-live]="aviso.tipo === 'error' ? 'assertive' : 'polite'"
                >
                    <span class="aviso__texto">{{ aviso.texto }}</span>
                    <button
                        type="button"
                        class="aviso__cerrar"
                        aria-label="Cerrar aviso"
                        (click)="cerrar(aviso.id)"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .avisos {
                position: fixed;
                top: var(--app-esp-md);
                right: var(--app-esp-md);
                z-index: 200;
                display: flex;
                flex-direction: column;
                gap: var(--app-esp-sm);
                max-width: min(24rem, calc(100vw - 2 * var(--app-esp-md)));
            }

            .aviso {
                display: flex;
                align-items: flex-start;
                gap: var(--app-esp-sm);
                padding: var(--app-esp-md);
                border-left: 4px solid var(--app-color-info);
                border-radius: var(--app-radio-sm);
                background-color: var(--app-color-info-fondo);
                box-shadow: var(--app-sombra-md);
                color: var(--app-color-texto);
                font-size: var(--app-texto-sm);
            }

            .aviso--exito {
                border-left-color: var(--app-color-exito);
                background-color: var(--app-color-exito-fondo);
            }

            .aviso--error {
                border-left-color: var(--app-color-error);
                background-color: var(--app-color-error-fondo);
            }

            .aviso__texto {
                flex: 1;
            }

            .aviso__cerrar {
                border: 0;
                background: transparent;
                color: inherit;
                font-size: var(--app-texto-lg);
                line-height: 1;
                padding: 0 var(--app-esp-xs);
            }
        `,
    ],
})
export class ToastHostComponent {
    private readonly servicio: NotificacionesService = inject(NotificacionesService);

    readonly notificaciones: Signal<Notificacion[]> = this.servicio.notificaciones;

    cerrar(id: number): void {
        this.servicio.cerrar(id);
    }
}
