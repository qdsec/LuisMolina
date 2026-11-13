import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductosApiService } from './productos-api.service';
import { ProductoDto } from './productos-api.types';

const dto: ProductoDto = {
    id: 'trj-crd',
    name: 'Tarjetas de Crédito',
    description: 'Tarjeta de consumo',
    logo: 'logo.png',
    date_release: '2027-01-01',
    date_revision: '2028-01-01',
};

describe('ProductosApiService', () => {
    let servicio: ProductosApiService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ProductosApiService, provideHttpClient(), provideHttpClientTesting()],
        });
        servicio = TestBed.inject(ProductosApiService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('lista con GET sobre bp/products', () => {
        servicio.listar().subscribe();

        const peticion = http.expectOne('bp/products');
        expect(peticion.request.method).toBe('GET');
        peticion.flush({ data: [dto] });
    });

    it('obtiene por id', () => {
        servicio.obtener('trj-crd').subscribe();

        const peticion = http.expectOne('bp/products/trj-crd');
        expect(peticion.request.method).toBe('GET');
        peticion.flush(dto);
    });

    it('verifica el id en la ruta de verificación', () => {
        servicio.verificarId('trj-crd').subscribe();

        const peticion = http.expectOne('bp/products/verification/trj-crd');
        expect(peticion.request.method).toBe('GET');
        peticion.flush(false);
    });

    it('escapa los caracteres especiales del id', () => {
        servicio.obtener('a/b c').subscribe();

        const peticion = http.expectOne('bp/products/a%2Fb%20c');
        peticion.flush(dto);
    });

    it('crea con POST enviando el cuerpo completo', () => {
        servicio.crear(dto).subscribe();

        const peticion = http.expectOne('bp/products');
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body).toEqual(dto);
        peticion.flush({ message: 'ok', data: dto });
    });

    it('actualiza con PUT sobre el id', () => {
        const { id: _id, ...cambios } = dto;
        servicio.actualizar('trj-crd', cambios).subscribe();

        const peticion = http.expectOne('bp/products/trj-crd');
        expect(peticion.request.method).toBe('PUT');
        expect(peticion.request.body).not.toHaveProperty('id');
        peticion.flush({ message: 'ok', data: dto });
    });

    it('elimina con DELETE', () => {
        servicio.eliminar('trj-crd').subscribe();

        const peticion = http.expectOne('bp/products/trj-crd');
        expect(peticion.request.method).toBe('DELETE');
        peticion.flush({ message: 'ok' });
    });
});
