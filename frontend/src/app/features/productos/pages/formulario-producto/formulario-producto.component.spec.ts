import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../shared/errors/api-error';
import { NotificacionesService } from '../../../../shared/services/notificaciones.service';
import { hoyIso, sumarUnAnio } from '../../../../shared/utils/fecha.util';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../../data/productos.repository';
import { Producto } from '../../models/productos.model';
import FormularioProductoComponent from './formulario-producto.component';

const existente: Producto = {
    id: 'trj-crd',
    nombre: 'Tarjetas de Crédito',
    descripcion: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'logo.png',
    fechaLiberacion: '2030-01-01',
    fechaRevision: '2031-01-01',
};

const valido = {
    id: 'abc',
    nombre: 'Plazo fijo',
    descripcion: 'Descripción con más de diez caracteres',
    logo: 'logo.png',
    fechaLiberacion: '2030-05-10',
};

describe('FormularioProductoComponent', () => {
    let fixture: ComponentFixture<FormularioProductoComponent>;
    let componente: FormularioProductoComponent;
    let repositorio: jest.Mocked<ProductosRepository>;

    function crear(id?: string): void {
        repositorio = {
            listar: jest.fn(),
            obtener: jest.fn().mockReturnValue(of(existente)),
            verificarId: jest.fn().mockReturnValue(of(false)),
            crear: jest.fn().mockReturnValue(of(existente)),
            actualizar: jest.fn().mockReturnValue(of(existente)),
            eliminar: jest.fn(),
        } as unknown as jest.Mocked<ProductosRepository>;

        TestBed.configureTestingModule({
            imports: [FormularioProductoComponent],
            providers: [
                provideRouter([]),
                NotificacionesService,
                { provide: PRODUCTOS_REPOSITORY, useValue: repositorio },
            ],
        });

        fixture = TestBed.createComponent(FormularioProductoComponent);
        componente = fixture.componentInstance;
        fixture.componentRef.setInput('id', id);
        fixture.detectChanges();
    }

    /** Llena el formulario y espera al validador asíncrono del ID. */
    async function llenarValido(): Promise<void> {
        componente.form.patchValue(valido);
        await jest.advanceTimersByTimeAsync(400);
    }

    afterEach(() => {
        jest.useRealTimers();
        TestBed.resetTestingModule();
    });

    describe('modo alta', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            crear();
        });

        it('arranca en blanco y con el ID habilitado', () => {
            expect(componente.modoEdicion()).toBe(false);
            expect(componente.form.controls.id.enabled).toBe(true);
            expect(componente.titulo()).toBe('Formulario de Registro');
        });

        it('la fecha de revisión está deshabilitada', () => {
            expect(componente.form.controls.fechaRevision.disabled).toBe(true);
        });

        it('calcula la fecha de revisión al cambiar la liberación', () => {
            componente.form.controls.fechaLiberacion.setValue('2030-05-10');

            expect(componente.form.controls.fechaRevision.value).toBe(sumarUnAnio('2030-05-10'));
        });

        it('recalcula al 28 de febrero si la liberación es un 29', () => {
            componente.form.controls.fechaLiberacion.setValue('2028-02-29');

            expect(componente.form.controls.fechaRevision.value).toBe('2029-02-28');
        });

        it('exige todos los campos', () => {
            componente.guardar();

            expect(componente.form.invalid).toBe(true);
            expect(repositorio.crear).not.toHaveBeenCalled();
            expect(componente.envioIntentado()).toBe(true);
        });

        it('valida las longitudes del enunciado', () => {
            componente.form.patchValue({ id: 'ab', nombre: 'Hola', descripcion: 'corta' });

            expect(componente.form.controls.id.hasError('minlength')).toBe(true);
            expect(componente.form.controls.nombre.hasError('minlength')).toBe(true);
            expect(componente.form.controls.descripcion.hasError('minlength')).toBe(true);
        });

        it('acepta un nombre de exactamente 5 caracteres', () => {
            componente.form.controls.nombre.setValue('Plazo');

            expect(componente.form.controls.nombre.valid).toBe(true);
        });

        it('rechaza una fecha de liberación anterior a hoy', () => {
            componente.form.controls.fechaLiberacion.setValue('2020-01-01');

            expect(componente.form.controls.fechaLiberacion.hasError('fechaAnteriorAHoy')).toBe(
                true
            );
        });

        it('acepta la fecha de hoy', () => {
            componente.form.controls.fechaLiberacion.setValue(hoyIso());

            expect(componente.form.controls.fechaLiberacion.valid).toBe(true);
        });

        it('envía el producto completo, incluida la fecha deshabilitada', async () => {
            await llenarValido();

            componente.guardar();

            expect(repositorio.crear).toHaveBeenCalledWith({
                ...valido,
                fechaRevision: sumarUnAnio(valido.fechaLiberacion),
            });
        });

        it('avisa y navega al listado tras crear', async () => {
            const router = TestBed.inject(Router);
            const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
            const notificaciones = TestBed.inject(NotificacionesService);
            await llenarValido();

            componente.guardar();

            expect(notificaciones.notificaciones()[0].texto).toBe('Producto creado.');
            expect(navigate).toHaveBeenCalledWith(['/productos']);
        });

        it('marca el ID cuando el backend responde duplicado', async () => {
            repositorio.crear.mockReturnValue(
                throwError(() => new ApiError('DUPLICADO', 'Ya existe', 400))
            );
            await llenarValido();

            componente.guardar();

            expect(componente.form.controls.id.hasError('idRegistrado')).toBe(true);
        });

        it('traslada los errores de validación del backend a cada campo', async () => {
            repositorio.crear.mockReturnValue(
                throwError(
                    () =>
                        new ApiError('VALIDACION', 'Datos inválidos', 400, [
                            { campo: 'name', mensajes: ['muy corto'] },
                        ])
                )
            );
            await llenarValido();

            componente.guardar();

            expect(componente.form.controls.nombre.hasError('backend')).toBe(true);
        });

        it('reiniciar deja el formulario como al inicio', async () => {
            await llenarValido();

            componente.reiniciar();

            expect(componente.form.controls.nombre.value).toBe('');
            expect(componente.form.controls.id.value).toBe('');
            expect(componente.envioIntentado()).toBe(false);
        });
    });

    describe('modo edición', () => {
        beforeEach(() => crear('trj-crd'));

        it('deshabilita el ID', () => {
            expect(componente.modoEdicion()).toBe(true);
            expect(componente.form.controls.id.disabled).toBe(true);
            expect(componente.titulo()).toBe('Formulario de Edición');
        });

        it('precarga los datos del producto', () => {
            expect(repositorio.obtener).toHaveBeenCalledWith('trj-crd');
            expect(componente.form.controls.nombre.value).toBe(existente.nombre);
        });

        it('actualiza con el id de la ruta', () => {
            componente.form.patchValue({ nombre: 'Nombre editado' });

            componente.guardar();

            expect(repositorio.actualizar).toHaveBeenCalledWith(
                'trj-crd',
                expect.objectContaining({ nombre: 'Nombre editado' })
            );
        });

        it('reiniciar vuelve a los valores cargados, no a vacío', () => {
            componente.form.patchValue({ nombre: 'Otro nombre' });

            componente.reiniciar();

            expect(componente.form.controls.nombre.value).toBe(existente.nombre);
        });

        it('muestra un error si el producto ya no existe', () => {
            TestBed.resetTestingModule();
            crear('nada');
            repositorio.obtener.mockReturnValue(
                throwError(() => new ApiError('NO_ENCONTRADO', 'El producto ya no existe.', 404))
            );

            componente.ngOnInit();

            expect(componente.errorCarga()).toBe('El producto ya no existe.');
        });
    });
});
