import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'productos' },
    {
        path: 'productos',
        loadChildren: () => import('./features/productos/productos.routes'),
    },
    { path: '**', redirectTo: 'productos' },
];
