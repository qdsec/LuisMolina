import { inject, Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator, ValidationErrors } from '@angular/forms';
import { catchError, first, map, Observable, of, switchMap, timer } from 'rxjs';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../data/productos.repository';

const ESPERA_MS = 400;

/** Comprueba contra el backend que el ID no esté registrado. */
@Injectable()
export class IdDisponibleValidator implements AsyncValidator {
    private readonly repositorio: ProductosRepository = inject(PRODUCTOS_REPOSITORY);

    validate(control: AbstractControl): Observable<ValidationErrors | null> {
        const id: string = (control.value ?? '').trim();

        // No consulta la red si el valor ya es inválido.
        if (!id || control.hasError('required') || control.hasError('minlength') || control.hasError('maxlength')) {
            return of(null);
        }

        return timer(ESPERA_MS).pipe(
            // Angular cancela la ejecución anterior: el temporizador actúa como debounce.
            switchMap(() => this.repositorio.verificarId(id)),
            map((existe: boolean) => (existe ? { idRegistrado: true } : null)),
            // Falla permisivo a proposito: es ayuda de UX, no un control. El backend
            // rechaza el duplicado con 400 al guardar.
            catchError(() => of(null)),
            // first() completa el flujo: si no, el control queda en PENDING y Enviar
            // no se habilita nunca.
            first()
        );
    }
}
