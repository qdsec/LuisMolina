import { BadRequestError, NotFoundError } from "routing-controllers";
import { ProductInterface } from "../interfaces/product.interface";
import { InMemoryProductRepository } from "../repositories/in-memory-product.repository";
import { ProductService } from "./product.service";

function producto(overrides: Partial<ProductInterface> = {}): ProductInterface {
  return {
    id: "trj-crd",
    name: "Tarjetas de Crédito",
    description: "Tarjeta de consumo bajo la modalidad de crédito",
    logo: "logo.png",
    date_release: "2027-01-01",
    date_revision: "2028-01-01",
    ...overrides,
  };
}

describe("ProductService", () => {
  let repositorio: InMemoryProductRepository;
  let service: ProductService;

  beforeEach(() => {
    // Repositorio propio por prueba, sin tocar la instancia global.
    repositorio = new InMemoryProductRepository([producto()]);
    service = new ProductService(repositorio);
  });

  describe("listar", () => {
    it("devuelve los productos almacenados", () => {
      expect(service.listar()).toEqual([producto()]);
    });

    it("devuelve copias: mutar el resultado no altera el almacén", () => {
      const listado = service.listar();
      listado[0].name = "Modificado por fuera";
      expect(service.listar()[0].name).toBe("Tarjetas de Crédito");
    });
  });

  describe("obtener", () => {
    it("devuelve el producto cuando existe", () => {
      expect(service.obtener("trj-crd")).toEqual(producto());
    });

    it("lanza NotFoundError cuando no existe", () => {
      expect(() => service.obtener("nada")).toThrow(NotFoundError);
    });
  });

  describe("existe", () => {
    it("distingue un id registrado de uno libre", () => {
      expect(service.existe("trj-crd")).toBe(true);
      expect(service.existe("nada")).toBe(false);
    });
  });

  describe("crear", () => {
    it("agrega el producto y lo devuelve", () => {
      const nuevo = producto({ id: "cta-ahr", name: "Cuenta de Ahorros" });
      expect(service.crear(nuevo)).toEqual(nuevo);
      expect(service.listar()).toHaveLength(2);
    });

    it("lanza BadRequestError si el id ya existe", () => {
      expect(() => service.crear(producto())).toThrow(BadRequestError);
      expect(service.listar()).toHaveLength(1);
    });
  });

  describe("actualizar", () => {
    it("aplica los cambios conservando el id", () => {
      const actualizado = service.actualizar("trj-crd", {
        name: "Nombre nuevo",
        description: "Descripción nueva con largo suficiente",
        logo: "otro.png",
        date_release: "2027-06-01",
        date_revision: "2028-06-01",
      });

      expect(actualizado.id).toBe("trj-crd");
      expect(actualizado.name).toBe("Nombre nuevo");
      expect(service.obtener("trj-crd").logo).toBe("otro.png");
    });

    it("lanza NotFoundError si el producto no existe", () => {
      expect(() =>
        service.actualizar("nada", {
          name: "Nombre nuevo",
          description: "Descripción nueva con largo suficiente",
          logo: "otro.png",
          date_release: "2027-06-01",
          date_revision: "2028-06-01",
        })
      ).toThrow(NotFoundError);
    });
  });

  describe("eliminar", () => {
    it("quita el producto del almacén", () => {
      service.eliminar("trj-crd");
      expect(service.listar()).toHaveLength(0);
    });

    it("lanza NotFoundError si el producto no existe", () => {
      expect(() => service.eliminar("nada")).toThrow(NotFoundError);
    });
  });
});
