import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    OnInit,
    signal,
    Signal,
    WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CampoComponent } from '../../../../shared/components/form-elements/campo/campo.component';
import { ApiError } from '../../../../shared/errors/api-error';
import { NotificacionesService } from '../../../../shared/services/notificaciones.service';
import { sumarUnAnio } from '../../../../shared/utils/fecha.util';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../../data/productos.repository';
import { Producto } from '../../models/productos.model';
import { IdDisponibleValidator } from '../../validators/id-disponible.validator';
import {
    fechaNoAnteriorAHoy,
    noSoloEspacios,
    revisionUnAnioDespues,
} from '../../validators/producto.validators';

interface ProductoForm {
    id: FormControl<string>;
    nombre: FormControl<string>;
    descripcion: FormControl<string>;
    logo: FormControl<string>;
    fechaLiberacion: FormControl<string>;
    fechaRevision: FormControl<string>;
}

@Component({
    selector: 'app-formulario-producto',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ReactiveFormsModule, RouterLink, CampoComponent],
    providers: [IdDisponibleValidator],
    templateUrl: './formulario-producto.component.html',
    styleUrl: './formulario-producto.component.scss',
})
export default class FormularioProductoComponent implements OnInit {
    /** Llega por `withComponentInputBinding` desde la ruta `:id/editar`. */
    readonly id = input<string | undefined>(undefined);

    private readonly repositorio: ProductosRepository = inject(PRODUCTOS_REPOSITORY);
    private readonly validadorId: IdDisponibleValidator = inject(IdDisponibleValidator);
    private readonly notificaciones: NotificacionesService = inject(NotificacionesService);
    private readonly router: Router = inject(Router);

    readonly modoEdicion: Signal<boolean> = computed(() => !!this.id());
    readonly titulo: Signal<string> = computed(() =>
        this.modoEdicion() ? 'Formulario de Edición' : 'Formulario de Registro'
    );

    readonly guardando: WritableSignal<boolean> = signal(false);
    readonly cargando: WritableSignal<boolean> = signal(false);
    readonly errorCarga: WritableSignal<string | null> = signal<string | null>(null);
    readonly envioIntentado: WritableSignal<boolean> = signal(false);

    readonly form: FormGroup<ProductoForm> = new FormGroup<ProductoForm>(
        {
            id: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(10),
                ],
            }),
            nombre: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(5),
                    Validators.maxLength(100),
                    noSoloEspacios(),
                ],
            }),
            descripcion: new FormControl('', {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(10),
                    Validators.maxLength(200),
                    noSoloEspacios(),
                ],
            }),
            logo: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required],
            }),
            fechaLiberacion: new FormControl('', {
                nonNullable: true,
                validators: [Validators.required, fechaNoAnteriorAHoy()],
            }),
            // Derivado de la liberación, por eso nace deshabilitado.
            fechaRevision: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
        },
        { validators: revisionUnAnioDespues('fechaLiberacion', 'fechaRevision') }
    );

    private valoresIniciales = this.form.getRawValue();

    constructor() {
        this.form.controls.fechaLiberacion.valueChanges
            .pipe(takeUntilDestroyed())
            .subscribe((valor: string) => this.recalcularRevision(valor));
    }

    ngOnInit(): void {
        if (this.modoEdicion()) {
            // En edición el ID se deshabilita y no lleva validador de disponibilidad.
            this.form.controls.id.disable();
            this.cargarProducto();
            return;
        }
        this.form.controls.id.addAsyncValidators(
            this.validadorId.validate.bind(this.validadorId)
        );
    }

    guardar(): void {
        this.envioIntentado.set(true);

        if (this.form.invalid || this.form.pending || this.guardando()) {
            this.form.markAllAsTouched();
            return;
        }

        // getRawValue incluye los controles deshabilitados: el id en edición y la fecha de revisión.
        const producto: Producto = this.form.getRawValue();
        this.guardando.set(true);

        const peticion$ = this.modoEdicion()
            ? this.repositorio.actualizar(this.id() as string, producto)
            : this.repositorio.crear(producto);

        peticion$.pipe(finalize(() => this.guardando.set(false))).subscribe({
            next: () => {
                this.notificaciones.exito(
                    this.modoEdicion() ? 'Producto actualizado.' : 'Producto creado.'
                );
                void this.router.navigate(['/productos']);
            },
            error: (error: ApiError) => this.marcarErroresDelBackend(error),
        });
    }

    reiniciar(): void {
        this.envioIntentado.set(false);
        this.form.reset(this.valoresIniciales);
    }

    private cargarProducto(): void {
        this.cargando.set(true);
        this.errorCarga.set(null);

        this.repositorio
            .obtener(this.id() as string)
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: (producto: Producto) => {
                    this.form.patchValue(producto);
                    this.valoresIniciales = this.form.getRawValue();
                },
                error: (error: ApiError) => this.errorCarga.set(error.message),
            });
    }

    private recalcularRevision(liberacion: string): void {
        const revision: string = liberacion ? sumarUnAnio(liberacion) : '';
        this.form.controls.fechaRevision.setValue(revision, { emitEvent: false });
    }

    /** Traslada el detalle del 400 al control correspondiente. */
    private marcarErroresDelBackend(error: ApiError): void {
        if (error.code === 'DUPLICADO') {
            this.marcar('id', { idRegistrado: true });
            return;
        }

        const equivalencias: Record<string, keyof ProductoForm> = {
            id: 'id',
            name: 'nombre',
            description: 'descripcion',
            logo: 'logo',
            date_release: 'fechaLiberacion',
            date_revision: 'fechaRevision',
        };

        for (const detalle of error.errores) {
            const control = equivalencias[detalle.campo];
            if (control) {
                this.marcar(control, { backend: detalle.mensajes[0] });
            }
        }
    }

    /** Marca el error y deja el control como tocado. */
    private marcar(control: keyof ProductoForm, errores: ValidationErrors): void {
        this.form.controls[control].setErrors(errores);
        this.form.controls[control].markAsTouched();
    }
}
