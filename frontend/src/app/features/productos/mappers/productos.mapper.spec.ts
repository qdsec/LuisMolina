import { ProductoDto } from '../api/productos-api.types';
import { Producto } from '../models/productos.model';
import { ProductosMapper } from './productos.mapper';

const dto: ProductoDto = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'logo.png',
    date_release: '2027-01-01',
    date_revision: '2028-01-01',
};

const dominio: Producto = {
    id: 'trj-crd',
    nombre: 'Tarjetas de Crédito',
    descripcion: 'Tarjeta de consumo bajo la modalidad de crédito',
    logo: 'logo.png',
    fechaLiberacion: '2027-01-01',
    fechaRevision: '2028-01-01',
};

describe('ProductosMapper', () => {
    describe('desdeDto', () => {
        it('traduce los nombres del backend al dominio', () => {
            expect(ProductosMapper.desdeDto(dto)).toEqual(dominio);
        });

        it('conserva las fechas como cadenas, sin convertirlas a Date', () => {
            const resultado = ProductosMapper.desdeDto(dto);
            expect(typeof resultado.fechaLiberacion).toBe('string');
            expect(resultado.fechaLiberacion).toBe('2027-01-01');
        });
    });

    describe('desdeListaDto', () => {
        it('mapea cada elemento', () => {
            expect(ProductosMapper.desdeListaDto([dto, dto])).toEqual([dominio, dominio]);
        });

        it('soporta una lista vacía', () => {
            expect(ProductosMapper.desdeListaDto([])).toEqual([]);
        });
    });

    describe('aCrearRequest', () => {
        it('incluye el id y usa snake_case', () => {
            expect(ProductosMapper.aCrearRequest(dominio)).toEqual(dto);
        });
    });

    describe('aActualizarRequest', () => {
        it('omite el id, que viaja en la URL', () => {
            const payload = ProductosMapper.aActualizarRequest(dominio);
            expect(payload).not.toHaveProperty('id');
            expect(payload).toEqual({
                name: dto.name,
                description: dto.description,
                logo: dto.logo,
                date_release: dto.date_release,
                date_revision: dto.date_revision,
            });
        });
    });

    it('ida y vuelta: dto -> dominio -> dto', () => {
        expect(ProductosMapper.aCrearRequest(ProductosMapper.desdeDto(dto))).toEqual(dto);
    });
});
