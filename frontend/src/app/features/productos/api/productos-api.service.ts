import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import environment from '../../../environments/environment';
import { PRODUCTOS_ENDPOINTS } from './productos.endpoints';
import {
    ActualizarProductoRequestDto,
    CrearProductoRequestDto,
    EliminacionProductoDto,
    ListaProductosDto,
    MutacionProductoDto,
    ProductoDto,
} from './productos-api.types';

/** Único punto del feature que conoce HttpClient. */
@Injectable()
export class ProductosApiService {
    private readonly http: HttpClient = inject(HttpClient);
    private readonly apiBase: string = environment.apiBase;

    listar(): Observable<ListaProductosDto> {
        return this.http.get<ListaProductosDto>(this.url(PRODUCTOS_ENDPOINTS.base));
    }

    obtener(id: string): Observable<ProductoDto> {
        return this.http.get<ProductoDto>(
            `${this.url(PRODUCTOS_ENDPOINTS.base)}/${encodeURIComponent(id)}`
        );
    }

    verificarId(id: string): Observable<boolean> {
        return this.http.get<boolean>(
            `${this.url(PRODUCTOS_ENDPOINTS.verificacion)}/${encodeURIComponent(id)}`
        );
    }

    crear(payload: CrearProductoRequestDto): Observable<MutacionProductoDto> {
        return this.http.post<MutacionProductoDto>(this.url(PRODUCTOS_ENDPOINTS.base), payload);
    }

    actualizar(
        id: string,
        payload: ActualizarProductoRequestDto
    ): Observable<MutacionProductoDto> {
        return this.http.put<MutacionProductoDto>(
            `${this.url(PRODUCTOS_ENDPOINTS.base)}/${encodeURIComponent(id)}`,
            payload
        );
    }

    eliminar(id: string): Observable<EliminacionProductoDto> {
        return this.http.delete<EliminacionProductoDto>(
            `${this.url(PRODUCTOS_ENDPOINTS.base)}/${encodeURIComponent(id)}`
        );
    }

    private url(ruta: string): string {
        return `${this.apiBase}${ruta}`;
    }
}
