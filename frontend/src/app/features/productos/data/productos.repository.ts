import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CambiosProducto, Producto } from '../models/productos.model';

/** Contrato de la capa de datos, en lenguaje de dominio. */
export interface ProductosRepository {
    listar(): Observable<Producto[]>;
    obtener(id: string): Observable<Producto>;
    verificarId(id: string): Observable<boolean>;
    crear(producto: Producto): Observable<Producto>;
    actualizar(id: string, cambios: CambiosProducto): Observable<Producto>;
    eliminar(id: string): Observable<void>;
}

export const PRODUCTOS_REPOSITORY = new InjectionToken<ProductosRepository>(
    'ProductosRepository'
);
