import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiError } from '../../../../shared/errors/api-error';
import { NotificacionesService } from '../../../../shared/services/notificaciones.service';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../../data/productos.repository';
import { Producto } from '../../models/productos.model';
import ListadoProductosComponent, { filtrarProductos, normalizar } from './listado-productos.component';

function producto(indice: number, nombre = `Producto ${indice}`): Producto {
    return {
        id: `id-${indice}`,
        nombre,
        descripcion: `Descripción del producto ${indice}`,
        logo: 'logo.png',
        fechaLiberacion: '2027-01-01',
        fechaRevision: '2028-01-01',
    };
}

describe('filtrarProductos', () => {
    const datos: Producto[] = [
        producto(1, 'Tarjetas de Crédito'),
        producto(2, 'Cuenta de Ahorros'),
    ];

    it('sin término devuelve todo', () => {
        expect(filtrarProductos(datos, '')).toHaveLength(2);
        expect(filtrarProductos(datos, '   ')).toHaveLength(2);
    });

    it('busca por nombre sin distinguir mayúsculas', () => {
        expect(filtrarProductos(datos, 'TARJETAS')).toEqual([datos[0]]);
    });

    it('ignora los acentos', () => {
        expect(filtrarProductos(datos, 'credito')).toEqual([datos[0]]);
    });

    it('busca también por id y por descripción', () => {
        expect(filtrarProductos(datos, 'id-2')).toEqual([datos[1]]);
        expect(filtrarProductos(datos, 'producto 1')).toEqual([datos[0]]);
    });

    it('devuelve vacío si nada coincide', () => {
        expect(filtrarProductos(datos, 'hipotecario')).toEqual([]);
    });
});

describe('normalizar', () => {
    it('baja a minúsculas y quita diacríticos', () => {
        expect(normalizar('Crédito ÁÉÍÓÚ')).toBe('credito aeiou');
    });
});

describe('ListadoProductosComponent', () => {
    let fixture: ComponentFixture<ListadoProductosComponent>;
    let componente: ListadoProductosComponent;
    let repositorio: jest.Mocked<ProductosRepository>;

    function crear(productos: Producto[] = [producto(1)]): void {
        repositorio = {
            listar: jest.fn().mockReturnValue(of(productos)),
            obtener: jest.fn(),
            verificarId: jest.fn(),
            crear: jest.fn(),
            actualizar: jest.fn(),
            eliminar: jest.fn().mockReturnValue(of(undefined)),
        } as unknown as jest.Mocked<ProductosRepository>;

        TestBed.configureTestingModule({
            imports: [ListadoProductosComponent],
            providers: [
                provideRouter([]),
                NotificacionesService,
                { provide: PRODUCTOS_REPOSITORY, useValue: repositorio },
            ],
        });

        fixture = TestBed.createComponent(ListadoProductosComponent);
        componente = fixture.componentInstance;
        fixture.detectChanges();
    }

    afterEach(() => TestBed.resetTestingModule());

    it('carga los productos al iniciar', () => {
        crear([producto(1), producto(2)]);

        expect(repositorio.listar).toHaveBeenCalled();
        expect(componente.productos()).toHaveLength(2);
        expect(componente.cargando()).toBe(false);
    });

    it('muestra el total de resultados', () => {
        crear([producto(1), producto(2), producto(3)]);

        expect(componente.total()).toBe(3);
    });

    it('pagina según el tamaño elegido', () => {
        crear(Array.from({ length: 12 }, (_v, i) => producto(i)));

        expect(componente.visibles()).toHaveLength(5);
        expect(componente.totalPaginas()).toBe(3);

        componente.irAPagina(2);
        expect(componente.visibles()[0].id).toBe('id-5');

        componente.cambiarTamanoPagina('20');
        expect(componente.visibles()).toHaveLength(12);
        expect(componente.totalPaginas()).toBe(1);
    });

    it('vuelve a la primera página al cambiar el tamaño', () => {
        crear(Array.from({ length: 12 }, (_v, i) => producto(i)));

        componente.irAPagina(3);
        componente.cambiarTamanoPagina('10');

        expect(componente.pagina()).toBe(1);
    });

    it('nunca deja la página fuera de rango', () => {
        crear(Array.from({ length: 12 }, (_v, i) => producto(i)));

        componente.irAPagina(3);
        componente.cambiarTamanoPagina('20'); // ahora solo hay una página

        expect(componente.pagina()).toBe(1);
        expect(componente.visibles()).toHaveLength(12);
    });

    it('recorta la página cuando la lista encoge sin tocar los filtros', () => {
        // Este caso es el que de verdad ejercita el recorte: `irAPagina` no se
        // vuelve a llamar, así que si `pagina` no se acotara contra
        // `totalPaginas`, la tabla quedaría vacía en una página inexistente.
        crear(Array.from({ length: 12 }, (_v, i) => producto(i)));
        componente.irAPagina(3);
        expect(componente.visibles()).toHaveLength(2);

        componente.productos.set([producto(1)]);

        expect(componente.pagina()).toBe(1);
        expect(componente.visibles()).toHaveLength(1);
    });

    it('recorta la página al eliminar el último elemento de la última página', () => {
        const once = Array.from({ length: 11 }, (_v, i) => producto(i));
        crear(once);
        componente.irAPagina(3);
        expect(componente.visibles()).toHaveLength(1);

        // El borrado recarga: el repositorio devuelve ahora 10 productos.
        repositorio.listar.mockReturnValue(of(once.slice(0, 10)));
        componente.alElegirAccion('eliminar', once[10]);
        componente.confirmarEliminacion();

        expect(componente.totalPaginas()).toBe(2);
        expect(componente.pagina()).toBe(2);
        expect(componente.visibles()).toHaveLength(5);
    });

    it('distingue lista vacía de búsqueda sin resultados', () => {
        crear([]);

        expect(componente.sinResultados()).toBe(true);
        expect(componente.hayProductos()).toBe(false);
    });

    it('muestra el error de carga y permite reintentar', () => {
        crear();
        repositorio.listar.mockReturnValue(
            throwError(() => new ApiError('RED', 'Sin conexión'))
        );

        componente.cargar();

        expect(componente.errorCarga()).toBe('Sin conexión');
        expect(componente.cargando()).toBe(false);
    });

    it('navega a la edición al elegir esa acción', () => {
        crear();
        const router = TestBed.inject(Router);
        const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

        componente.alElegirAccion('editar', producto(1));

        expect(navigate).toHaveBeenCalledWith(['/productos', 'id-1', 'editar']);
    });

    it('al elegir eliminar abre el modal con el nombre del producto', () => {
        crear();

        componente.alElegirAccion('eliminar', producto(1, 'Tarjetas'));

        expect(componente.productoAEliminar()?.nombre).toBe('Tarjetas');
        expect(componente.mensajeEliminacion(producto(1, 'Tarjetas'))).toBe(
            '¿Estas seguro de eliminar el producto Tarjetas?'
        );
    });

    it('cancelar cierra el modal sin llamar al repositorio', () => {
        crear();
        componente.alElegirAccion('eliminar', producto(1));

        componente.cancelarEliminacion();

        expect(componente.productoAEliminar()).toBeNull();
        expect(repositorio.eliminar).not.toHaveBeenCalled();
    });

    it('confirmar elimina, avisa y recarga', () => {
        crear();
        const notificaciones = TestBed.inject(NotificacionesService);
        componente.alElegirAccion('eliminar', producto(1, 'Tarjetas'));

        componente.confirmarEliminacion();

        expect(repositorio.eliminar).toHaveBeenCalledWith('id-1');
        expect(repositorio.listar).toHaveBeenCalledTimes(2);
        expect(componente.productoAEliminar()).toBeNull();
        expect(notificaciones.notificaciones()[0].texto).toContain('Tarjetas');
    });

    it('si la eliminación falla, recarga igualmente para reflejar el estado real', () => {
        crear();
        repositorio.eliminar.mockReturnValue(
            throwError(() => new ApiError('NO_ENCONTRADO', 'ya no existe'))
        );
        componente.alElegirAccion('eliminar', producto(1));

        componente.confirmarEliminacion();

        expect(repositorio.listar).toHaveBeenCalledTimes(2);
        expect(componente.productoAEliminar()).toBeNull();
    });

    it('convierte la fecha ISO sin correr el día', () => {
        crear();

        const fecha = componente.aFecha('2027-03-01');

        expect(fecha.getDate()).toBe(1);
        expect(fecha.getMonth()).toBe(2);
    });
});
