import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    DestroyRef,
    inject,
    input,
    OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl, ValidationErrors, Validators } from '@angular/forms';
import { primerMensajeDeError } from '../mensajes-error';

/** Campo de formulario con etiqueta, control y mensaje de error. */
@Component({
    selector: 'app-campo',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="campo">
            <label class="campo__etiqueta" [for]="idControl">{{ etiqueta() }}</label>

            <input
                class="campo__control"
                [class.campo__control--error]="mostrarError()"
                [id]="idControl"
                [type]="tipo()"
                [disabled]="deshabilitado"
                [value]="valor"
                [attr.aria-invalid]="mostrarError()"
                [attr.aria-describedby]="descripcion()"
                [attr.aria-required]="requerido()"
                [attr.maxlength]="maxlength() ?? null"
                (input)="alEscribir($any($event.target).value)"
                (blur)="alSalir()"
            />

            @if (mostrarError()) {
                <p class="campo__error" [id]="idError" role="alert">{{ textoError() }}</p>
            } @else if (ayuda()) {
                <p class="campo__ayuda" [id]="idAyuda">{{ ayuda() }}</p>
            }
        </div>
    `,
    styles: [
        `
            .campo {
                display: flex;
                flex-direction: column;
                gap: var(--app-esp-xs);
            }

            .campo__etiqueta {
                color: var(--app-color-texto);
                font-size: var(--app-texto-sm);
                font-weight: 600;
            }

            .campo__control {
                min-height: var(--app-alto-control);
                padding: 0 var(--app-esp-md);
                border: 1px solid var(--app-color-borde-fuerte);
                border-radius: var(--app-radio-sm);
                background-color: var(--app-color-superficie);
                width: 100%;

                &:disabled {
                    background-color: var(--app-color-secundario);
                    color: var(--app-color-texto-tenue);
                    cursor: not-allowed;
                }
            }

            /* El error no se comunica solo con color: hay borde y texto. */
            .campo__control--error {
                border-color: var(--app-color-error);
                border-width: 2px;
            }

            .campo__error {
                color: var(--app-color-error);
                font-size: var(--app-texto-xs);
            }

            .campo__ayuda {
                color: var(--app-color-texto-suave);
                font-size: var(--app-texto-xs);
            }
        `,
    ],
})
export class CampoComponent implements OnInit {
    readonly etiqueta = input.required<string>();
    readonly tipo = input<'text' | 'date'>('text');
    readonly maxlength = input<number | undefined>(undefined);
    readonly ayuda = input<string>('');
    /** Fuerza el error aunque el control no se haya tocado. */
    readonly envioIntentado = input<boolean>(false);

    /** Contador para identificadores únicos. */
    private static contador = 0;

    readonly idControl = `campo-${CampoComponent.contador++}`;
    readonly idError = `${this.idControl}-error`;
    readonly idAyuda = `${this.idControl}-ayuda`;

    private readonly ngControl: NgControl = inject(NgControl, { self: true });
    private readonly cd: ChangeDetectorRef = inject(ChangeDetectorRef);
    private readonly destroyRef: DestroyRef = inject(DestroyRef);

    valor: string = '';
    deshabilitado = false;

    private alCambiar: (valor: string) => void = () => undefined;
    private alTocar: () => void = () => undefined;

    constructor() {
        // Registrarse como accessor aquí evita el ciclo de dependencias que
        // provocaría usar NG_VALUE_ACCESSOR con forwardRef.
        this.ngControl.valueAccessor = this;
    }

    ngOnInit(): void {
        // Con OnPush, un cambio de validez que no nace de este componente (el
        // validador asíncrono del ID, o los errores que marca el backend al
        // enviar) no repintaría el mensaje de error.
        this.ngControl.control?.statusChanges
            ?.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.cd.markForCheck());
    }

    writeValue(valor: string | null): void {
        this.valor = valor ?? '';
        // El formulario escribe los valores al cargar un producto, después del
        // primer render: sin esto, los campos se verían vacíos en la edición.
        this.cd.markForCheck();
    }

    registerOnChange(fn: (valor: string) => void): void {
        this.alCambiar = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.alTocar = fn;
    }

    setDisabledState(deshabilitado: boolean): void {
        this.deshabilitado = deshabilitado;
        this.cd.markForCheck();
    }

    alEscribir(valor: string): void {
        this.valor = valor;
        this.alCambiar(valor);
    }

    alSalir(): void {
        this.alTocar();
    }

    /** Enlaza el input con el mensaje que lo describe: el error o la ayuda. */
    descripcion(): string | null {
        if (this.mostrarError()) {
            return this.idError;
        }
        return this.ayuda() ? this.idAyuda : null;
    }

    requerido(): boolean {
        return this.ngControl.control?.hasValidator(Validators.required) ?? false;
    }

    mostrarError(): boolean {
        const control = this.ngControl.control;
        if (!control || control.valid || control.pending) {
            return false;
        }
        return control.touched || control.dirty || this.envioIntentado();
    }

    textoError(): string | null {
        const errores: ValidationErrors | null = this.ngControl.control?.errors ?? null;
        return primerMensajeDeError(errores, this.etiqueta());
    }
}
