import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiErrorHandlerService } from '../../../shared/services/api-error-handler.service';
import { NotificacionesService } from '../../../shared/services/notificaciones.service';
import { ProductosApiService } from '../api/productos-api.service';
import { ProductoDto } from '../api/productos-api.types';
import { Producto } from '../models/productos.model';
import { ProductosRepositoryImpl } from './productos.repository.impl';

const dto: ProductoDto = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'logo.png',
    date_release: '2027-01-01',
    date_revision: '2028-01-01',
};

const producto: Producto = {
    id: 'trj-crd',
    nombre: 'Tarjetas de Crédito',
    descripcion: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'logo.png',
    fechaLiberacion: '2027-01-01',
    fechaRevision: '2028-01-01',
};

describe('ProductosRepositoryImpl', () => {
    let repositorio: ProductosRepositoryImpl;
    let api: jest.Mocked<ProductosApiService>;

    beforeEach(() => {
        api = {
            listar: jest.fn(),
            obtener: jest.fn(),
            verificarId: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn(),
        } as unknown as jest.Mocked<ProductosApiService>;

        TestBed.configureTestingModule({
            providers: [
                ProductosRepositoryImpl,
                ApiErrorHandlerService,
                NotificacionesService,
                { provide: ProductosApiService, useValue: api },
            ],
        });
        repositorio = TestBed.inject(ProductosRepositoryImpl);
    });

    describe('listar', () => {
        it('mapea los DTOs al modelo de dominio', async () => {
            api.listar.mockReturnValue(of({ data: [dto] }));

            await expect(firstValueFrom(repositorio.listar())).resolves.toEqual([producto]);
        });

        it('tolera una respuesta sin la propiedad data', async () => {
            api.listar.mockReturnValue(of({} as { data: ProductoDto[] }));

            await expect(firstValueFrom(repositorio.listar())).resolves.toEqual([]);
        });

        it('convierte un fallo de red en ApiError con código RED', async () => {
            api.listar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));

            await expect(firstValueFrom(repositorio.listar())).rejects.toMatchObject({
                code: 'RED',
            });
        });
    });

    describe('obtener', () => {
        it('propaga el 404 como NO_ENCONTRADO', async () => {
            api.obtener.mockReturnValue(
                throwError(() => new HttpErrorResponse({ status: 404, error: {} }))
            );

            await expect(firstValueFrom(repositorio.obtener('nada'))).rejects.toMatchObject({
                code: 'NO_ENCONTRADO',
            });
        });
    });

    describe('verificarId', () => {
        it('devuelve true solo ante un booleano verdadero', async () => {
            api.verificarId.mockReturnValue(of(true));
            await expect(firstValueFrom(repositorio.verificarId('trj-crd'))).resolves.toBe(true);
        });

        it('devuelve false ante cualquier otro valor', async () => {
            api.verificarId.mockReturnValue(of('' as unknown as boolean));
            await expect(firstValueFrom(repositorio.verificarId('x'))).resolves.toBe(false);
        });

        it('ante un error de red responde false en vez de propagar', async () => {
            api.verificarId.mockReturnValue(
                throwError(() => new HttpErrorResponse({ status: 0 }))
            );

            await expect(firstValueFrom(repositorio.verificarId('x'))).resolves.toBe(false);
        });
    });

    describe('crear', () => {
        it('envía el payload con el id y devuelve el producto creado', async () => {
            api.crear.mockReturnValue(of({ message: 'ok', data: dto }));

            await expect(firstValueFrom(repositorio.crear(producto))).resolves.toEqual(producto);
            expect(api.crear).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'trj-crd', name: 'Tarjetas de Crédito' })
            );
        });

        it('traduce el duplicado del backend', async () => {
            api.crear.mockReturnValue(
                throwError(
                    () =>
                        new HttpErrorResponse({
                            status: 400,
                            error: { message: 'Duplicate identifier found in the database' },
                        })
                )
            );

            await expect(firstValueFrom(repositorio.crear(producto))).rejects.toMatchObject({
                code: 'DUPLICADO',
            });
        });
    });

    describe('actualizar', () => {
        it('no incluye el id en el cuerpo de la petición', async () => {
            api.actualizar.mockReturnValue(of({ message: 'ok', data: dto }));

            await firstValueFrom(repositorio.actualizar('trj-crd', producto));

            const [id, payload] = api.actualizar.mock.calls[0];
            expect(id).toBe('trj-crd');
            expect(payload).not.toHaveProperty('id');
        });
    });

    describe('eliminar', () => {
        it('completa sin valor', async () => {
            api.eliminar.mockReturnValue(of({ message: 'Product removed successfully' }));

            await expect(firstValueFrom(repositorio.eliminar('trj-crd'))).resolves.toBeUndefined();
        });
    });
});
