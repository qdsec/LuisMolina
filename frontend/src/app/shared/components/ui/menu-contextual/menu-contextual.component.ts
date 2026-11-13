import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    input,
    output,
    signal,
    viewChild,
    WritableSignal,
} from '@angular/core';

export interface OpcionMenu {
    /** Identificador que se emite al elegirla. */
    accion: string;
    etiqueta: string;
    /** Marca acciones destructivas. */
    destructiva?: boolean;
}

/** Menú desplegable de acciones por fila (diseño D3). */
@Component({
    selector: 'app-menu-contextual',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="menu">
            <button
                #disparador
                type="button"
                class="menu__disparador"
                [attr.aria-label]="etiqueta()"
                [attr.aria-expanded]="abierto()"
                aria-haspopup="menu"
                (click)="alternar()"
                (keydown.arrowdown)="abrirYEnfocarPrimero($event)"
            >
                <span aria-hidden="true">⋮</span>
            </button>

            @if (abierto()) {
                <ul
                    class="menu__panel"
                    role="menu"
                    [style.top.px]="posicion().top"
                    [style.left.px]="posicion().left"
                >
                    @for (opcion of opciones(); track opcion.accion) {
                        <li role="none">
                            <button
                                type="button"
                                role="menuitem"
                                class="menu__opcion"
                                [class.menu__opcion--destructiva]="opcion.destructiva"
                                (click)="elegir(opcion)"
                            >
                                {{ opcion.etiqueta }}
                            </button>
                        </li>
                    }
                </ul>
            }
        </div>
    `,
    styles: [
        `
            .menu {
                position: relative;
                display: inline-block;
            }

            .menu__disparador {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 2rem;
                height: 2rem;
                padding: 0;
                border: 0;
                border-radius: var(--app-radio-sm);
                background: transparent;
                color: var(--app-color-texto-suave);
                font-size: var(--app-texto-lg);
                line-height: 1;

                &:hover {
                    background-color: var(--app-color-secundario);
                }
            }

            /* Fijo respecto al viewport: dentro de la tabla, que tiene scroll,
               un panel absoluto quedaría recortado en las últimas filas. */
            .menu__panel {
                position: fixed;
                z-index: 50;
                min-width: 10rem;
                margin: 0;
                padding: var(--app-esp-xs);
                list-style: none;
                background-color: var(--app-color-superficie);
                border: 1px solid var(--app-color-borde);
                border-radius: var(--app-radio-md);
                box-shadow: var(--app-sombra-md);
            }

            .menu__opcion {
                display: block;
                width: 100%;
                padding: var(--app-esp-sm) var(--app-esp-md);
                border: 0;
                border-radius: var(--app-radio-sm);
                background: transparent;
                color: var(--app-color-texto);
                font-size: var(--app-texto-sm);
                text-align: left;

                &:hover {
                    background-color: var(--app-color-secundario);
                }
            }

            .menu__opcion--destructiva {
                color: var(--app-color-error);
            }
        `,
    ],
})
export class MenuContextualComponent {
    readonly opciones = input.required<OpcionMenu[]>();
    readonly etiqueta = input<string>('Acciones');

    readonly seleccion = output<string>();

    readonly abierto: WritableSignal<boolean> = signal(false);
    /** Coordenadas del panel en el viewport, calculadas al abrir. */
    readonly posicion: WritableSignal<{ top: number; left: number }> = signal({
        top: 0,
        left: 0,
    });

    private static readonly ANCHO_PANEL = 160;

    private readonly disparador = viewChild.required<ElementRef<HTMLButtonElement>>('disparador');

    constructor(private readonly host: ElementRef<HTMLElement>) {}

    alternar(): void {
        if (this.abierto()) {
            this.cerrar();
            return;
        }
        this.calcularPosicion();
        this.abierto.set(true);
    }

    /** Ancla el panel bajo el disparador, o arriba si no cabe. */
    private calcularPosicion(): void {
        const caja: DOMRect = this.disparador().nativeElement.getBoundingClientRect();
        const alturaEstimada: number = 8 + this.opciones().length * 36;
        const cabeAbajo: boolean = caja.bottom + alturaEstimada <= window.innerHeight;

        this.posicion.set({
            top: cabeAbajo ? caja.bottom + 4 : Math.max(4, caja.top - alturaEstimada - 4),
            left: Math.max(
                4,
                Math.min(
                    caja.right - MenuContextualComponent.ANCHO_PANEL,
                    window.innerWidth - MenuContextualComponent.ANCHO_PANEL - 4
                )
            ),
        });
    }

    elegir(opcion: OpcionMenu): void {
        this.cerrar();
        this.seleccion.emit(opcion.accion);
    }

    cerrar(devolverFoco: boolean = true): void {
        if (!this.abierto()) {
            return;
        }
        this.abierto.set(false);
        if (devolverFoco) {
            this.disparador().nativeElement.focus();
        }
    }

    abrirYEnfocarPrimero(evento: Event): void {
        evento.preventDefault();
        this.calcularPosicion();
        this.abierto.set(true);
        // El panel se pinta en el siguiente ciclo.
        setTimeout(() => this.enfocarOpcion(0));
    }

    @HostListener('keydown', ['$event'])
    manejarTeclado(evento: KeyboardEvent): void {
        if (evento.key === 'Escape' && this.abierto()) {
            evento.stopPropagation();
            this.cerrar();
            return;
        }
        if (!this.abierto()) {
            return;
        }
        // Tabular fuera del panel lo cierra.
        if (evento.key === 'Tab') {
            this.cerrar(false);
            return;
        }

        const opciones: HTMLButtonElement[] = this.opcionesDelPanel();
        if (opciones.length === 0) {
            return;
        }
        const actual: number = opciones.findIndex(
            (opcion: HTMLButtonElement) => opcion === document.activeElement
        );

        const movimientos: Record<string, number> = {
            ArrowDown: actual + 1,
            ArrowUp: actual - 1,
            Home: 0,
            End: opciones.length - 1,
        };

        if (!(evento.key in movimientos)) {
            return;
        }
        evento.preventDefault();
        const destino: number = movimientos[evento.key];
        this.enfocarOpcion((destino + opciones.length) % opciones.length);
    }

    /** El panel está anclado al viewport. */
    @HostListener('window:scroll')
    @HostListener('window:resize')
    cerrarAlMoverLaPagina(): void {
        this.cerrar(false);
    }

    @HostListener('document:click', ['$event'])
    cerrarAlClicarFuera(evento: MouseEvent): void {
        if (!this.abierto()) {
            return;
        }
        if (!this.host.nativeElement.contains(evento.target as Node)) {
            // Sin devolver el foco: el usuario ya está en otra cosa.
            this.cerrar(false);
        }
    }

    private enfocarOpcion(indice: number): void {
        this.opcionesDelPanel()[indice]?.focus();
    }

    private opcionesDelPanel(): HTMLButtonElement[] {
        return Array.from(
            this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
        );
    }
}
