import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampoComponent } from './campo.component';

@Component({
    imports: [ReactiveFormsModule, CampoComponent],
    template: `
        <form [formGroup]="form">
            <app-campo
                formControlName="nombre"
                etiqueta="Nombre"
                [envioIntentado]="envioIntentado()"
            />
        </form>
    `,
})
class AnfitrionDePrueba {
    readonly form = new FormGroup({
        nombre: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(5)],
        }),
    });
    readonly envioIntentado = signal(false);
}

describe('CampoComponent', () => {
    let fixture: ComponentFixture<AnfitrionDePrueba>;
    let anfitrion: AnfitrionDePrueba;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [AnfitrionDePrueba] }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionDePrueba);
        anfitrion = fixture.componentInstance;
        fixture.detectChanges();
    });

    function input(): HTMLInputElement {
        return fixture.nativeElement.querySelector('input');
    }

    function error(): HTMLElement | null {
        return fixture.nativeElement.querySelector('.campo__error');
    }

    it('rotula el control con su etiqueta', () => {
        const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
        expect(label.textContent?.trim()).toBe('Nombre');
        expect(label.htmlFor).toBe(input().id);
    });

    it('pinta en el input un valor escrito desde el formulario', () => {
        // Caso de la edición: el valor llega después del primer render.
        anfitrion.form.patchValue({ nombre: 'Tarjetas de Crédito' });
        fixture.detectChanges();

        expect(input().value).toBe('Tarjetas de Crédito');
    });

    it('refleja hacia el formulario lo que se escribe', () => {
        input().value = 'Cuenta';
        input().dispatchEvent(new Event('input'));

        expect(anfitrion.form.controls.nombre.value).toBe('Cuenta');
    });

    it('no muestra error mientras el campo no se ha tocado', () => {
        expect(error()).toBeNull();
        expect(input().getAttribute('aria-invalid')).toBe('false');
    });

    it('muestra el error al salir del campo', () => {
        input().value = 'abc';
        input().dispatchEvent(new Event('input'));
        input().dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(error()?.textContent).toContain('al menos 5 caracteres');
        expect(input().getAttribute('aria-invalid')).toBe('true');
        expect(input().getAttribute('aria-describedby')).toBe(error()?.id);
    });

    it('revela el error al intentar enviar, aunque no se haya tocado', () => {
        anfitrion.envioIntentado.set(true);
        fixture.detectChanges();

        expect(error()?.textContent).toContain('requerido');
    });

    it('muestra un error marcado desde fuera sin que el usuario toque el campo', () => {
        // Los errores del backend llegan por esta vía.
        anfitrion.form.controls.nombre.setValue('Nombre válido');
        anfitrion.form.controls.nombre.setErrors({ backend: 'Ese nombre ya está en uso' });
        anfitrion.form.controls.nombre.markAsTouched();
        fixture.detectChanges();

        expect(error()?.textContent).toContain('Ese nombre ya está en uso');
    });

    it('deshabilita el input cuando el control se deshabilita', () => {
        anfitrion.form.controls.nombre.disable();
        fixture.detectChanges();

        expect(input().disabled).toBe(true);
    });
});
