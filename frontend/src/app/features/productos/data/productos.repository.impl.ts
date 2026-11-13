import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import {
    ApiErrorHandlerService,
    manejarErrorApi,
} from '../../../shared/services/api-error-handler.service';
import { ProductosApiService } from '../api/productos-api.service';
import {
    EliminacionProductoDto,
    ListaProductosDto,
    MutacionProductoDto,
    ProductoDto,
} from '../api/productos-api.types';
import { ProductosMapper } from '../mappers/productos.mapper';
import { CambiosProducto, Producto } from '../models/productos.model';
import { ProductosRepository } from './productos.repository';

/** Implementación HTTP del repositorio: DTOs a dominio, fallos a ApiError. */
@Injectable()
export class ProductosRepositoryImpl implements ProductosRepository {
    private readonly api: ProductosApiService = inject(ProductosApiService);
    private readonly manejador: ApiErrorHandlerService = inject(ApiErrorHandlerService);

    listar(): Observable<Producto[]> {
        return this.api.listar().pipe(
            map((respuesta: ListaProductosDto) =>
                ProductosMapper.desdeListaDto(respuesta.data ?? [])
            ),
            // La pantalla muestra el error en su propio espacio.
            manejarErrorApi({
                handler: this.manejador,
                mensajeError: 'No fue posible cargar los productos.',
                mostrarAviso: false,
            })
        );
    }

    obtener(id: string): Observable<Producto> {
        return this.api.obtener(id).pipe(
            map((dto: ProductoDto) => ProductosMapper.desdeDto(dto)),
            manejarErrorApi({
                handler: this.manejador,
                mensajeError: 'No fue posible cargar el producto.',
                mostrarAviso: false,
            })
        );
    }

    /** Si la verificación falla, responde id disponible: el backend rechaza el duplicado al guardar. */
    verificarId(id: string): Observable<boolean> {
        return this.api.verificarId(id).pipe(
            map((existe: unknown) => existe === true),
            catchError(() => of(false))
        );
    }

    crear(producto: Producto): Observable<Producto> {
        return this.api.crear(ProductosMapper.aCrearRequest(producto)).pipe(
            map((respuesta: MutacionProductoDto) => ProductosMapper.desdeDto(respuesta.data)),
            manejarErrorApi({
                handler: this.manejador,
                mensajeError: 'No fue posible crear el producto.',
            })
        );
    }

    actualizar(id: string, cambios: CambiosProducto): Observable<Producto> {
        return this.api.actualizar(id, ProductosMapper.aActualizarRequest(cambios)).pipe(
            map((respuesta: MutacionProductoDto) => ProductosMapper.desdeDto(respuesta.data)),
            manejarErrorApi({
                handler: this.manejador,
                mensajeError: 'No fue posible actualizar el producto.',
            })
        );
    }

    eliminar(id: string): Observable<void> {
        return this.api.eliminar(id).pipe(
            map((_respuesta: EliminacionProductoDto) => undefined),
            manejarErrorApi({
                handler: this.manejador,
                mensajeError: 'No fue posible eliminar el producto.',
            })
        );
    }
}
