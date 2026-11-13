import { Routes } from '@angular/router';
import { ProductosApiService } from './api/productos-api.service';
import { PRODUCTOS_REPOSITORY } from './data/productos.repository';
import { ProductosRepositoryImpl } from './data/productos.repository.impl';

/** Provee el repositorio para ambas pantallas: una sola instancia. */
const productosRoutes: Routes = [
    {
        path: '',
        providers: [
            ProductosApiService,
            { provide: PRODUCTOS_REPOSITORY, useClass: ProductosRepositoryImpl },
        ],
        children: [
            {
                path: '',
                title: 'Productos financieros · Banco',
                loadComponent: () => import('./pages/listado-productos/listado-productos.component'),
            },
            {
                path: 'nuevo',
                title: 'Nuevo producto · Banco',
                loadComponent: () =>
                    import('./pages/formulario-producto/formulario-producto.component'),
            },
            {
                path: ':id/editar',
                title: 'Editar producto · Banco',
                loadComponent: () =>
                    import('./pages/formulario-producto/formulario-producto.component'),
            },
        ],
    },
];

export default productosRoutes;
