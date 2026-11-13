import { CambiosProducto, Producto } from '../models/productos.model';
import {
    ActualizarProductoRequestDto,
    CrearProductoRequestDto,
    ProductoDto,
} from '../api/productos-api.types';

/** Traduce entre los DTOs del backend y el modelo de dominio. */
export class ProductosMapper {
    static desdeDto(dto: ProductoDto): Producto {
        return {
            id: dto.id,
            nombre: dto.name,
            descripcion: dto.description,
            logo: dto.logo,
            fechaLiberacion: dto.date_release,
            fechaRevision: dto.date_revision,
        };
    }

    static desdeListaDto(dtos: ProductoDto[]): Producto[] {
        return dtos.map((dto: ProductoDto) => ProductosMapper.desdeDto(dto));
    }

    /** Recorta los textos: `abc` y ` abc` no deben convivir como productos distintos. */
    static aCrearRequest(producto: Producto): CrearProductoRequestDto {
        return {
            id: producto.id.trim(),
            ...ProductosMapper.aActualizarRequest(producto),
        };
    }

    /** El id va en la URL del PUT: enviarlo en el cuerpo permitiría corromper el registro. */
    static aActualizarRequest(producto: CambiosProducto): ActualizarProductoRequestDto {
        return {
            name: producto.nombre.trim(),
            description: producto.descripcion.trim(),
            logo: producto.logo.trim(),
            date_release: producto.fechaLiberacion,
            date_revision: producto.fechaRevision,
        };
    }
}
