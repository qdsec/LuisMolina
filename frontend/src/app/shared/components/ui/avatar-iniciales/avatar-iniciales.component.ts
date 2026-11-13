import { ChangeDetectionStrategy, Component, computed, input, Signal } from '@angular/core';

/** Círculo con las iniciales (diseño D1). Es el reemplazo cuando el logo no carga. */
@Component({
    selector: 'app-avatar-iniciales',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <span class="avatar" aria-hidden="true">{{ iniciales() }}</span>
    `,
    styles: [
        `
            .avatar {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 2.25rem;
                height: 2.25rem;
                border-radius: var(--app-radio-circulo);
                background-color: var(--app-color-secundario);
                color: var(--app-color-secundario-texto);
                font-size: var(--app-texto-xs);
                font-weight: 700;
                letter-spacing: 0.03em;
            }
        `,
    ],
})
export class AvatarInicialesComponent {
    readonly texto = input.required<string>();

    readonly iniciales: Signal<string> = computed(() => calcularIniciales(this.texto()));
}

/** Iniciales de las dos primeras palabras, o las dos primeras letras si hay una sola. */
export function calcularIniciales(texto: string): string {
    const palabras: string[] = (texto ?? '')
        .trim()
        .split(/\s+/)
        .filter((palabra: string) => palabra.length > 0);

    if (palabras.length === 0) {
        return '';
    }
    if (palabras.length === 1) {
        return palabras[0].slice(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
}
