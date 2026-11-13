import { TestBed } from '@angular/core/testing';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { firstValueFrom, of, throwError } from 'rxjs';
import { PRODUCTOS_REPOSITORY, ProductosRepository } from '../data/productos.repository';
import { IdDisponibleValidator } from './id-disponible.validator';

describe('IdDisponibleValidator', () => {
    let validador: IdDisponibleValidator;
    let verificarId: jest.Mock;

    beforeEach(() => {
        jest.useFakeTimers();
        verificarId = jest.fn();

        TestBed.configureTestingModule({
            providers: [
                IdDisponibleValidator,
                {
                    provide: PRODUCTOS_REPOSITORY,
                    useValue: { verificarId } as unknown as ProductosRepository,
                },
            ],
        });
        validador = TestBed.inject(IdDisponibleValidator);
    });

    afterEach(() => jest.useRealTimers());

    /** Resuelve el validador avanzando el temporizador. */
    async function validar(control: FormControl): Promise<ValidationErrors | null> {
        const resultado = firstValueFrom(validador.validate(control));
        await jest.advanceTimersByTimeAsync(400);
        return resultado;
    }

    it('no consulta al backend si el valor está vacío', async () => {
        await expect(validar(new FormControl(''))).resolves.toBeNull();
        expect(verificarId).not.toHaveBeenCalled();
    });

    it('no consulta si el control ya es inválido por longitud', async () => {
        const control = new FormControl('ab', [Validators.minLength(3)]);
        control.updateValueAndValidity();

        await expect(validar(control)).resolves.toBeNull();
        expect(verificarId).not.toHaveBeenCalled();
    });

    it('marca el id como registrado cuando ya existe', async () => {
        verificarId.mockReturnValue(of(true));

        await expect(validar(new FormControl('trj-crd'))).resolves.toEqual({
            idRegistrado: true,
        });
        expect(verificarId).toHaveBeenCalledWith('trj-crd');
    });

    it('acepta el id cuando está libre', async () => {
        verificarId.mockReturnValue(of(false));

        await expect(validar(new FormControl('libre'))).resolves.toBeNull();
    });

    it('recorta los espacios antes de consultar', async () => {
        verificarId.mockReturnValue(of(false));

        await validar(new FormControl('  abc  '));

        expect(verificarId).toHaveBeenCalledWith('abc');
    });

    it('no bloquea el formulario si la consulta falla', async () => {
        verificarId.mockReturnValue(throwError(() => new Error('sin red')));

        await expect(validar(new FormControl('abc'))).resolves.toBeNull();
    });

    it('completa el observable: el control no queda en PENDING', async () => {
        verificarId.mockReturnValue(of(false));

        const control = new FormControl('abc', {
            asyncValidators: [validador.validate.bind(validador)],
        });
        control.updateValueAndValidity();
        expect(control.status).toBe('PENDING');

        await jest.advanceTimersByTimeAsync(400);

        expect(control.status).toBe('VALID');
    });
});
