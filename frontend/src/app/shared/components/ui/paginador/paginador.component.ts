import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Paginación simple: anterior / siguiente con indicador de posición. */
@Component({
    selector: 'app-paginador',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <nav class="paginador" aria-label="Paginación de productos">
            <button
                type="button"
                class="paginador__boton"
                [disabled]="pagina() <= 1"
                (click)="cambio.emit(pagina() - 1)"
            >
                Anterior
            </button>

            <span class="paginador__posicion" aria-live="polite">
                Página {{ pagina() }} de {{ totalPaginas() }}
            </span>

            <button
                type="button"
                class="paginador__boton"
                [disabled]="pagina() >= totalPaginas()"
                (click)="cambio.emit(pagina() + 1)"
            >
                Siguiente
            </button>
        </nav>
    `,
    styles: [
        `
            .paginador {
                display: flex;
                align-items: center;
                gap: var(--app-esp-md);
            }

            .paginador__boton {
                min-height: 2.25rem;
                padding: 0 var(--app-esp-md);
                border: 1px solid var(--app-color-borde-fuerte);
                border-radius: var(--app-radio-sm);
                background-color: var(--app-color-superficie);
                color: var(--app-color-texto);
                font-size: var(--app-texto-sm);

                &:hover:not(:disabled) {
                    background-color: var(--app-color-secundario);
                }

                &:disabled {
                    color: var(--app-color-texto-tenue);
                    cursor: not-allowed;
                }
            }

            .paginador__posicion {
                color: var(--app-color-texto-suave);
                font-size: var(--app-texto-sm);
                white-space: nowrap;
            }
        `,
    ],
})
export class PaginadorComponent {
    readonly pagina = input.required<number>();
    readonly totalPaginas = input.required<number>();

    readonly cambio = output<number>();
}
