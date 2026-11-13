import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Pantalla de precarga del listado. */
@Component({
    selector: 'app-skeleton-tabla',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <p class="sr-only" role="status" aria-live="polite">Cargando productos…</p>

        <div class="skeleton" aria-hidden="true">
            @for (fila of filas(); track $index) {
                <div class="skeleton__fila">
                    <span class="skeleton__bloque skeleton__bloque--circulo"></span>
                    <span class="skeleton__bloque skeleton__bloque--ancho"></span>
                    <span class="skeleton__bloque skeleton__bloque--ancho"></span>
                    <span class="skeleton__bloque"></span>
                    <span class="skeleton__bloque"></span>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .skeleton {
                display: flex;
                flex-direction: column;
                gap: var(--app-esp-md);
                padding: var(--app-esp-md) 0;
            }

            .skeleton__fila {
                display: grid;
                grid-template-columns: 2.25rem repeat(4, 1fr);
                gap: var(--app-esp-md);
                align-items: center;
            }

            .skeleton__bloque {
                height: 0.875rem;
                border-radius: var(--app-radio-sm);
                background: linear-gradient(
                    90deg,
                    var(--app-color-secundario) 25%,
                    var(--app-color-borde) 37%,
                    var(--app-color-secundario) 63%
                );
                background-size: 400% 100%;
                animation: skeleton-brillo 1.4s ease infinite;
            }

            .skeleton__bloque--circulo {
                width: 2.25rem;
                height: 2.25rem;
                border-radius: var(--app-radio-circulo);
            }

            @keyframes skeleton-brillo {
                0% {
                    background-position: 100% 50%;
                }
                100% {
                    background-position: 0 50%;
                }
            }
        `,
    ],
})
export class SkeletonTablaComponent {
    readonly cantidadFilas = input<number>(5);

    filas(): number[] {
        return Array.from({ length: this.cantidadFilas() }, (_valor: unknown, i: number) => i);
    }
}
