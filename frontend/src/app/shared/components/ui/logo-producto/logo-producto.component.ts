import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    signal,
    Signal,
    WritableSignal,
} from '@angular/core';
import { AvatarInicialesComponent } from '../avatar-iniciales/avatar-iniciales.component';

/** Logo del producto. Si la imagen no carga, o no hay URL, muestra las iniciales del nombre. */
@Component({
    selector: 'app-logo-producto',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AvatarInicialesComponent],
    template: `
        @if (mostrarImagen()) {
            <img
                class="logo"
                [src]="url()"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                (error)="alFallar()"
            />
        } @else {
            <app-avatar-iniciales [texto]="nombre()" />
        }
    `,
    styles: [
        `
            .logo {
                display: block;
                width: 2.25rem;
                height: 2.25rem;
                border-radius: var(--app-radio-circulo);
                /* contain, no cover: un logo no se recorta. La proporción es desconocida
                   (un icono cuadrado o una imagen apaisada) y el hueco es circular. */
                object-fit: contain;
                padding: 0.1875rem;
                background-color: var(--app-color-superficie);
                border: 1px solid var(--app-color-borde);
            }
        `,
    ],
})
export class LogoProductoComponent {
    /** URL absoluta o ruta relativa a una imagen. Vacío equivale a no tener logo. */
    readonly logo = input<string>('');
    readonly nombre = input.required<string>();

    /**
     * Guarda la URL que falló, no un booleano: la tabla reutiliza componentes
     * entre filas y un booleano ocultaría el logo bueno de la fila siguiente.
     */
    private readonly urlFallida: WritableSignal<string | null> = signal<string | null>(null);

    readonly url: Signal<string> = computed(() => this.logo().trim());

    readonly mostrarImagen: Signal<boolean> = computed(() => {
        const url: string = this.url();
        return url.length > 0 && this.urlFallida() !== url;
    });

    alFallar(): void {
        this.urlFallida.set(this.url());
    }
}
