import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    OnInit,
    signal,
    Signal,
    WritableSignal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { LogoProductoComponent } from '../../../../shared/components/ui/logo-producto/logo-producto.component';
import {
    MenuContextualComponent,
    OpcionMenu,
} from '../../../../shared/components/ui/menu-contextual/menu-contextual.component';
import { ModalConfirmacionComponent } from '../../../../shared/components/ui/modal-confirmacion/modal-confirmacion.component';
import { PaginadorComponent } from '../../../../shared/components/ui/paginador/paginador.component';
import { SkeletonTablaComponent } from '../../../../shared/components/ui/skeleton-tabla/skeleton-tabla.component';
import { NotificacionesService } from '../../../../shared/services/notificaciones.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../../data/productos.repository';
import { Producto, TAMANOS_PAGINA, TamanoPagina } from '../../models/productos.model';

const OPCIONES_MENU: OpcionMenu[] = [
    { accion: 'editar', etiqueta: 'Editar' },
    { accion: 'eliminar', etiqueta: 'Eliminar', destructiva: true },
];

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
export function normalizar(texto: string): string {
    return (texto ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

/** Filtro del listado. Función pura. */
export function filtrarProductos(productos: Producto[], busqueda: string): Producto[] {
    const termino: string = normalizar(busqueda).trim();
    if (!termino) {
        return productos;
    }
    return productos.filter((producto: Producto) =>
        [producto.id, producto.nombre, producto.descripcion].some((campo: string) =>
            normalizar(campo).includes(termino)
        )
    );
}

@Component({
    selector: 'app-listado-productos',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        LogoProductoComponent,
        MenuContextualComponent,
        ModalConfirmacionComponent,
        PaginadorComponent,
        SkeletonTablaComponent,
    ],
    templateUrl: './listado-productos.component.html',
    styleUrl: './listado-productos.component.scss',
})
export default class ListadoProductosComponent implements OnInit {
    private readonly repositorio: ProductosRepository = inject(PRODUCTOS_REPOSITORY);
    private readonly notificaciones: NotificacionesService = inject(NotificacionesService);
    private readonly router: Router = inject(Router);

    readonly tamanosDisponibles = TAMANOS_PAGINA;
    readonly opcionesMenu = OPCIONES_MENU;

    readonly productos: WritableSignal<Producto[]> = signal<Producto[]>([]);
    readonly cargando: WritableSignal<boolean> = signal(true);
    readonly errorCarga: WritableSignal<string | null> = signal<string | null>(null);
    readonly productoAEliminar: WritableSignal<Producto | null> = signal<Producto | null>(null);
    readonly eliminando: WritableSignal<boolean> = signal(false);

    readonly busquedaControl = new FormControl('', { nonNullable: true });
    private readonly busquedaSignal: Signal<string> = toSignal(
        this.busquedaControl.valueChanges.pipe(debounceTime(250), distinctUntilChanged()),
        { initialValue: '' }
    );

    readonly tamanoPagina: WritableSignal<TamanoPagina> = signal<TamanoPagina>(5);
    private readonly paginaSolicitada: WritableSignal<number> = signal(1);

    readonly filtrados: Signal<Producto[]> = computed(() =>
        filtrarProductos(this.productos(), this.busquedaSignal())
    );
    readonly total: Signal<number> = computed(() => this.filtrados().length);
    readonly totalPaginas: Signal<number> = computed(() =>
        Math.max(1, Math.ceil(this.total() / this.tamanoPagina()))
    );

    /** Página efectiva, recortada al total de páginas. */
    readonly pagina: Signal<number> = computed(() =>
        Math.min(this.paginaSolicitada(), this.totalPaginas())
    );

    readonly visibles: Signal<Producto[]> = computed(() => {
        const inicio: number = (this.pagina() - 1) * this.tamanoPagina();
        return this.filtrados().slice(inicio, inicio + this.tamanoPagina());
    });

    readonly hayProductos: Signal<boolean> = computed(() => this.productos().length > 0);
    readonly sinResultados: Signal<boolean> = computed(
        () => !this.cargando() && this.total() === 0
    );

    ngOnInit(): void {
        this.cargar();
    }

    cargar(): void {
        this.cargando.set(true);
        this.errorCarga.set(null);

        this.repositorio
            .listar()
            .pipe(finalize(() => this.cargando.set(false)))
            .subscribe({
                next: (productos: Producto[]) => this.productos.set(productos),
                error: (error: Error) => this.errorCarga.set(error.message),
            });
    }

    alBuscar(): void {
        this.paginaSolicitada.set(1);
    }

    cambiarTamanoPagina(valor: string): void {
        this.tamanoPagina.set(Number(valor) as TamanoPagina);
        this.paginaSolicitada.set(1);
    }

    irAPagina(pagina: number): void {
        this.paginaSolicitada.set(pagina);
    }

    alElegirAccion(accion: string, producto: Producto): void {
        if (accion === 'editar') {
            void this.router.navigate(['/productos', producto.id, 'editar']);
            return;
        }
        this.productoAEliminar.set(producto);
    }

    cancelarEliminacion(): void {
        this.productoAEliminar.set(null);
    }

    confirmarEliminacion(): void {
        const producto: Producto | null = this.productoAEliminar();
        if (!producto || this.eliminando()) {
            return;
        }

        this.eliminando.set(true);
        this.repositorio
            .eliminar(producto.id)
            .pipe(
                finalize(() => {
                    this.eliminando.set(false);
                    this.productoAEliminar.set(null);
                })
            )
            .subscribe({
                next: () => {
                    this.notificaciones.exito(`Se eliminó "${producto.nombre}".`);
                    this.cargar();
                },
                // El repositorio ya avisa del error; aquí solo se refresca.
                error: () => this.cargar(),
            });
    }

    mensajeEliminacion(producto: Producto): string {
        return `¿Estas seguro de eliminar el producto ${producto.nombre}?`;
    }

    aFecha(fechaIso: string): Date {
        return aFechaLocal(fechaIso);
    }
}
