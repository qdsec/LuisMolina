import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
    AvatarInicialesComponent,
    calcularIniciales,
} from './avatar-iniciales/avatar-iniciales.component';
import { LogoProductoComponent } from './logo-producto/logo-producto.component';
import { MenuContextualComponent, OpcionMenu } from './menu-contextual/menu-contextual.component';
import { ModalConfirmacionComponent } from './modal-confirmacion/modal-confirmacion.component';
import { PaginadorComponent } from './paginador/paginador.component';
import { SkeletonTablaComponent } from './skeleton-tabla/skeleton-tabla.component';
import { ToastHostComponent } from './toast-host/toast-host.component';
import { NotificacionesService } from '../../services/notificaciones.service';

describe('calcularIniciales', () => {
    it('toma la inicial de las dos primeras palabras', () => {
        expect(calcularIniciales('Tarjetas de Crédito')).toBe('TD');
    });

    it('con una sola palabra usa sus dos primeras letras', () => {
        expect(calcularIniciales('Ahorros')).toBe('AH');
    });

    it('tolera el vacío y los espacios de más', () => {
        expect(calcularIniciales('')).toBe('');
        expect(calcularIniciales('   ')).toBe('');
        expect(calcularIniciales('  Cuenta   Corriente ')).toBe('CC');
    });
});

describe('AvatarInicialesComponent', () => {
    it('pinta las iniciales y se oculta a lectores de pantalla', async () => {
        await TestBed.configureTestingModule({ imports: [AvatarInicialesComponent] })
            .compileComponents();
        const fixture = TestBed.createComponent(AvatarInicialesComponent);
        fixture.componentRef.setInput('texto', 'Cuenta Corriente');
        fixture.detectChanges();

        const span: HTMLElement = fixture.nativeElement.querySelector('.avatar');
        expect(span.textContent?.trim()).toBe('CC');
        expect(span.getAttribute('aria-hidden')).toBe('true');
    });
});

describe('LogoProductoComponent', () => {
    async function montar(logo: string, nombre: string): Promise<ComponentFixture<LogoProductoComponent>> {
        await TestBed.configureTestingModule({ imports: [LogoProductoComponent] }).compileComponents();
        const fixture = TestBed.createComponent(LogoProductoComponent);
        fixture.componentRef.setInput('logo', logo);
        fixture.componentRef.setInput('nombre', nombre);
        fixture.detectChanges();
        return fixture;
    }

    it('muestra la imagen cuando hay URL', async () => {
        const fixture = await montar('https://ejemplo.com/visa.png', 'Tarjetas de Credito');
        const img = fixture.debugElement.query(By.css('img'));
        expect(img).not.toBeNull();
        expect(img.nativeElement.getAttribute('src')).toBe('https://ejemplo.com/visa.png');
        expect(fixture.debugElement.query(By.css('.avatar'))).toBeNull();
    });

    it('acepta una ruta relativa de carpeta', async () => {
        const fixture = await montar('assets/logos/visa.png', 'Tarjetas de Credito');
        const img = fixture.debugElement.query(By.css('img'));
        expect(img.nativeElement.getAttribute('src')).toBe('assets/logos/visa.png');
    });

    it('muestra las iniciales si no hay logo', async () => {
        const fixture = await montar('   ', 'Credito Hipotecario');
        expect(fixture.debugElement.query(By.css('img'))).toBeNull();
        expect(fixture.debugElement.query(By.css('.avatar')).nativeElement.textContent.trim()).toBe('CH');
    });

    it('cae a las iniciales cuando la imagen no carga', async () => {
        const fixture = await montar('https://ejemplo.com/roto.png', 'Credito Vehicular');
        fixture.debugElement.query(By.css('img')).triggerEventHandler('error', {});
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('img'))).toBeNull();
        expect(fixture.debugElement.query(By.css('.avatar')).nativeElement.textContent.trim()).toBe('CV');
    });

    it('vuelve a intentar con una URL distinta tras un fallo', async () => {
        // La tabla reutiliza componentes entre filas: el fallo de una URL no
        // debe ocultar el logo bueno del producto siguiente.
        const fixture = await montar('https://ejemplo.com/roto.png', 'Credito Vehicular');
        fixture.debugElement.query(By.css('img')).triggerEventHandler('error', {});
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('img'))).toBeNull();

        fixture.componentRef.setInput('logo', 'https://ejemplo.com/bueno.png');
        fixture.detectChanges();

        const img = fixture.debugElement.query(By.css('img'));
        expect(img).not.toBeNull();
        expect(img.nativeElement.getAttribute('src')).toBe('https://ejemplo.com/bueno.png');
    });

    it('no expone el referrer al host del logo', async () => {
        const fixture = await montar('https://ejemplo.com/visa.png', 'Tarjetas de Credito');
        const img = fixture.debugElement.query(By.css('img')).nativeElement;
        expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
        expect(img.getAttribute('alt')).toBe('');
    });
});

describe('SkeletonTablaComponent', () => {
    it('pinta tantas filas como se le pidan y anuncia la carga', async () => {
        await TestBed.configureTestingModule({ imports: [SkeletonTablaComponent] })
            .compileComponents();
        const fixture = TestBed.createComponent(SkeletonTablaComponent);
        fixture.componentRef.setInput('cantidadFilas', 3);
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelectorAll('.skeleton__fila')).toHaveLength(3);
        expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
            'Cargando'
        );
    });
});

describe('PaginadorComponent', () => {
    let fixture: ComponentFixture<PaginadorComponent>;

    function crear(pagina: number, total: number): void {
        fixture = TestBed.createComponent(PaginadorComponent);
        fixture.componentRef.setInput('pagina', pagina);
        fixture.componentRef.setInput('totalPaginas', total);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [PaginadorComponent] }).compileComponents();
    });

    it('deshabilita Anterior en la primera página', () => {
        crear(1, 3);
        const botones = fixture.nativeElement.querySelectorAll('button');
        expect(botones[0].disabled).toBe(true);
        expect(botones[1].disabled).toBe(false);
    });

    it('deshabilita Siguiente en la última página', () => {
        crear(3, 3);
        const botones = fixture.nativeElement.querySelectorAll('button');
        expect(botones[0].disabled).toBe(false);
        expect(botones[1].disabled).toBe(true);
    });

    it('emite la página destino', () => {
        crear(2, 3);
        const emitidas: number[] = [];
        fixture.componentInstance.cambio.subscribe((p: number) => emitidas.push(p));

        const botones = fixture.nativeElement.querySelectorAll('button');
        botones[0].click();
        botones[1].click();

        expect(emitidas).toEqual([1, 3]);
    });

    it('indica la posición actual', () => {
        crear(2, 5);
        expect(fixture.nativeElement.textContent).toContain('Página 2 de 5');
    });
});

describe('MenuContextualComponent', () => {
    const opciones: OpcionMenu[] = [
        { accion: 'editar', etiqueta: 'Editar' },
        { accion: 'eliminar', etiqueta: 'Eliminar', destructiva: true },
    ];

    let fixture: ComponentFixture<MenuContextualComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [MenuContextualComponent] })
            .compileComponents();
        fixture = TestBed.createComponent(MenuContextualComponent);
        fixture.componentRef.setInput('opciones', opciones);
        fixture.detectChanges();
    });

    function disparador(): HTMLButtonElement {
        return fixture.nativeElement.querySelector('.menu__disparador');
    }

    it('empieza cerrado y lo declara con aria-expanded', () => {
        expect(fixture.componentInstance.abierto()).toBe(false);
        expect(disparador().getAttribute('aria-expanded')).toBe('false');
        expect(disparador().getAttribute('aria-haspopup')).toBe('menu');
    });

    it('abre y cierra al pulsar el disparador', () => {
        disparador().click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('[role="menuitem"]')).toHaveLength(2);

        disparador().click();
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeNull();
    });

    it('emite la acción elegida y se cierra', () => {
        const emitidas: string[] = [];
        fixture.componentInstance.seleccion.subscribe((a: string) => emitidas.push(a));

        disparador().click();
        fixture.detectChanges();
        fixture.nativeElement.querySelectorAll('[role="menuitem"]')[1].click();
        fixture.detectChanges();

        expect(emitidas).toEqual(['eliminar']);
        expect(fixture.componentInstance.abierto()).toBe(false);
    });

    it('Escape cierra el menú', () => {
        disparador().click();
        fixture.detectChanges();

        fixture.debugElement.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'Escape' }));
        fixture.detectChanges();

        expect(fixture.componentInstance.abierto()).toBe(false);
    });

    it('un clic fuera lo cierra', () => {
        disparador().click();
        fixture.detectChanges();

        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fixture.detectChanges();

        expect(fixture.componentInstance.abierto()).toBe(false);
    });
});

describe('ModalConfirmacionComponent', () => {
    let fixture: ComponentFixture<ModalConfirmacionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [ModalConfirmacionComponent] })
            .compileComponents();
        fixture = TestBed.createComponent(ModalConfirmacionComponent);
        fixture.componentRef.setInput('mensaje', '¿Estas seguro de eliminar el producto X?');
        fixture.componentRef.setInput('etiquetaConfirmar', 'Eliminar');
        fixture.detectChanges();
    });

    it('se anuncia como diálogo modal rotulado por su mensaje', () => {
        const dialogo: HTMLElement = fixture.nativeElement.querySelector('[role="dialog"]');
        expect(dialogo.getAttribute('aria-modal')).toBe('true');
        expect(dialogo.getAttribute('aria-labelledby')).toBe(fixture.componentInstance.idTitulo);
        expect(fixture.nativeElement.textContent).toContain('¿Estas seguro de eliminar el producto X?');
    });

    it('arranca con el foco en Cancelar, la opción segura', () => {
        const cancelar = fixture.nativeElement.querySelectorAll('button')[0];
        expect(document.activeElement).toBe(cancelar);
    });

    it('emite confirmar y cancelar', () => {
        let confirmado = false;
        let cancelado = false;
        fixture.componentInstance.confirmar.subscribe(() => (confirmado = true));
        fixture.componentInstance.cancelado.subscribe(() => (cancelado = true));

        const botones = fixture.nativeElement.querySelectorAll('button');
        botones[1].click();
        botones[0].click();

        expect(confirmado).toBe(true);
        expect(cancelado).toBe(true);
    });

    it('Escape cancela', () => {
        let cancelado = false;
        fixture.componentInstance.cancelado.subscribe(() => (cancelado = true));

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        expect(cancelado).toBe(true);
    });
});

@Component({
    imports: [ToastHostComponent],
    template: '<app-toast-host />',
})
class AnfitrionDePrueba {}

describe('ToastHostComponent', () => {
    it('pinta los avisos y permite cerrarlos', async () => {
        await TestBed.configureTestingModule({
            imports: [AnfitrionDePrueba],
            providers: [NotificacionesService],
        }).compileComponents();

        const fixture = TestBed.createComponent(AnfitrionDePrueba);
        const servicio = TestBed.inject(NotificacionesService);
        fixture.detectChanges();

        servicio.error('Algo falló', 0);
        fixture.detectChanges();

        const aviso = fixture.debugElement.query(By.css('.aviso'));
        expect(aviso.nativeElement.textContent).toContain('Algo falló');
        // Los errores se anuncian como alerta.
        expect(aviso.nativeElement.getAttribute('role')).toBe('alert');

        fixture.debugElement.query(By.css('.aviso__cerrar')).nativeElement.click();
        fixture.detectChanges();

        expect(fixture.debugElement.query(By.css('.aviso'))).toBeNull();
    });
});
