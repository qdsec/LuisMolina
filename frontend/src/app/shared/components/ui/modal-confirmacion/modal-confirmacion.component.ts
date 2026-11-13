import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    input,
    output,
    viewChild,
} from '@angular/core';

/** Modal de confirmación (diseño D4). Atrapa el foco mientras está abierto. */
@Component({
    selector: 'app-modal-confirmacion',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="fondo" (click)="cancelar()">
            <!-- El clic dentro del cuadro no debe cerrar el modal. -->
            <div
                class="modal"
                role="dialog"
                aria-modal="true"
                [attr.aria-labelledby]="idTitulo"
                (click)="$event.stopPropagation()"
            >
                <p class="modal__mensaje" [id]="idTitulo">{{ mensaje() }}</p>

                <div class="modal__acciones">
                    <button
                        #botonCancelar
                        type="button"
                        class="app-boton app-boton--secundario"
                        (click)="cancelar()"
                    >
                        {{ etiquetaCancelar() }}
                    </button>
                    <button
                        type="button"
                        class="app-boton app-boton--primario"
                        (click)="confirmar.emit()"
                    >
                        {{ etiquetaConfirmar() }}
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .fondo {
                position: fixed;
                inset: 0;
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--app-esp-md);
                background-color: var(--app-color-velo-modal);
            }

            .modal {
                width: 100%;
                max-width: 26rem;
                padding: var(--app-esp-xl);
                background-color: var(--app-color-superficie);
                border-radius: var(--app-radio-sm);
                box-shadow: var(--app-sombra-lg);
            }

            .modal__mensaje {
                margin-bottom: var(--app-esp-xl);
                color: var(--app-color-texto);
                font-size: var(--app-texto-md);
            }

            .modal__acciones {
                display: flex;
                gap: var(--app-esp-md);

                > * {
                    flex: 1;
                }
            }

            @media (max-width: 30rem) {
                .modal__acciones {
                    flex-direction: column-reverse;
                }
            }
        `,
    ],
})
export class ModalConfirmacionComponent implements AfterViewInit {
    readonly mensaje = input.required<string>();
    readonly etiquetaConfirmar = input<string>('Confirmar');
    readonly etiquetaCancelar = input<string>('Cancelar');

    readonly confirmar = output<void>();
    readonly cancelado = output<void>();

    /** Contador para el id de `aria-labelledby`. */
    private static contador = 0;

    readonly idTitulo = `modal-titulo-${ModalConfirmacionComponent.contador++}`;

    private readonly botonCancelar =
        viewChild.required<ElementRef<HTMLButtonElement>>('botonCancelar');

    constructor(private readonly host: ElementRef<HTMLElement>) {}

    ngAfterViewInit(): void {
        this.botonCancelar().nativeElement.focus();
    }

    cancelar(): void {
        this.cancelado.emit();
    }

    @HostListener('document:keydown', ['$event'])
    manejarTeclado(evento: KeyboardEvent): void {
        if (evento.key === 'Escape') {
            evento.preventDefault();
            this.cancelar();
            return;
        }
        if (evento.key === 'Tab') {
            this.atraparFoco(evento);
        }
    }

    /** Hace que el tabulador circule dentro del modal. */
    private atraparFoco(evento: KeyboardEvent): void {
        const enfocables: HTMLElement[] = Array.from(
            this.host.nativeElement.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
        );
        if (enfocables.length === 0) {
            return;
        }

        const primero: HTMLElement = enfocables[0];
        const ultimo: HTMLElement = enfocables[enfocables.length - 1];
        const activo: Element | null = document.activeElement;

        if (!evento.shiftKey && activo === ultimo) {
            evento.preventDefault();
            primero.focus();
        } else if (evento.shiftKey && activo === primero) {
            evento.preventDefault();
            ultimo.focus();
        }
    }
}
