import request from "supertest";
import { Express } from "express";
import { createApp } from "../src/app";
import { ProductInterface } from "../src/interfaces/product.interface";
import { productRepository } from "../src/repositories/in-memory-product.repository";
import { sumarUnAnio } from "../src/utils/fecha.util";

const BASE = "/bp/products";

function producto(overrides: Partial<ProductInterface> = {}): ProductInterface {
  const date_release = "2030-05-10";
  return {
    id: "trj-crd",
    name: "Tarjetas de Crédito",
    description: "Tarjeta de consumo bajo la modalidad de crédito",
    logo: "logo.png",
    date_release,
    date_revision: sumarUnAnio(date_release),
    ...overrides,
  };
}

describe("API /bp/products", () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    // Reinicia el repositorio singleton antes de cada prueba.
    productRepository.reset([producto()]);
  });

  describe("GET /bp/products", () => {
    it("devuelve los productos dentro de la propiedad data", async () => {
      const res = await request(app).get(BASE).expect(200);
      expect(res.body).toEqual({ data: [producto()] });
    });
  });

  describe("GET /bp/products/verification/:id", () => {
    it("devuelve true si el id existe", async () => {
      const res = await request(app).get(`${BASE}/verification/trj-crd`).expect(200);
      expect(res.body).toBe(true);
    });

    it("devuelve false si el id no existe", async () => {
      const res = await request(app).get(`${BASE}/verification/libre`).expect(200);
      expect(res.body).toBe(false);
    });
  });

  describe("GET /bp/products/:id", () => {
    it("devuelve el producto pedido", async () => {
      const res = await request(app).get(`${BASE}/trj-crd`).expect(200);
      expect(res.body.id).toBe("trj-crd");
    });

    it("responde 404 con el mensaje del contrato", async () => {
      const res = await request(app).get(`${BASE}/nada`).expect(404);
      expect(res.body).toMatchObject({
        name: "NotFoundError",
        message: "Not product found with that identifier",
      });
    });
  });

  describe("POST /bp/products", () => {
    it("crea el producto y lo deja disponible en el listado", async () => {
      const nuevo = producto({ id: "cta-ahr", name: "Cuenta de Ahorros" });

      const creacion = await request(app).post(BASE).send(nuevo).expect(200);
      expect(creacion.body).toEqual({ message: "Product added successfully", data: nuevo });

      // El dato debe seguir ahí en una petición posterior.
      const listado = await request(app).get(BASE).expect(200);
      expect(listado.body.data.map((p: ProductInterface) => p.id)).toContain("cta-ahr");
    });

    it("responde 400 si el id ya existe", async () => {
      const res = await request(app).post(BASE).send(producto()).expect(400);
      expect(res.body).toMatchObject({
        name: "BadRequestError",
        message: "Duplicate identifier found in the database",
      });
    });

    it("responde 400 con el detalle por campo cuando el cuerpo es inválido", async () => {
      const res = await request(app)
        .post(BASE)
        .send({
          id: "ab",
          name: "Hola",
          description: "corta",
          logo: "",
          date_release: "2020-01-01",
          date_revision: "2030-05-05",
        })
        .expect(400);

      const campos = (res.body.errors as Array<{ campo: string }>).map((e) => e.campo);
      expect(campos).toEqual(
        expect.arrayContaining([
          "id",
          "name",
          "description",
          "logo",
          "date_release",
          "date_revision",
        ])
      );
    });

    it("acepta un nombre de 5 caracteres, como pide el enunciado", async () => {
      const nuevo = producto({ id: "plz", name: "Plazo" });
      await request(app).post(BASE).send(nuevo).expect(200);
    });

    it("rechaza una fecha de revisión que no sea exactamente un año después", async () => {
      const invalido = producto({
        id: "plz",
        date_release: "2030-05-10",
        date_revision: "2030-11-10",
      });
      const res = await request(app).post(BASE).send(invalido).expect(400);
      expect(res.body.errors.map((e: { campo: string }) => e.campo)).toContain("date_revision");
    });

    it("rechaza un cuerpo en forma de arreglo", async () => {
      // Sin esta guarda, class-validator lo dejaba pasar y se guardaba un
      // registro sin id, imposible de editar o borrar después.
      await request(app)
        .post(BASE)
        .send([1] as unknown as object)
        .expect(400);
      await request(app)
        .post(BASE)
        .send([] as unknown as object)
        .expect(400);

      const listado = await request(app).get(BASE).expect(200);
      expect(listado.body.data).toHaveLength(1);
    });

    it("rechaza propiedades que no están en el contrato", async () => {
      const conExtras = { ...producto({ id: "ext" }), isAdmin: true };

      await request(app).post(BASE).send(conExtras).expect(400);
    });

    it("rechaza un logo desmesuradamente largo", async () => {
      const invalido = producto({ id: "lrg", logo: "x".repeat(501) });

      await request(app).post(BASE).send(invalido).expect(400);
    });

    it("responde 400, no 500, ante un JSON mal formado", async () => {
      await request(app)
        .post(BASE)
        .set("Content-Type", "application/json")
        .send("{malformado")
        .expect(400);
    });

    it("acepta el 29 de febrero contra el 28 del año siguiente", async () => {
      const bisiesto = producto({
        id: "bis",
        date_release: "2028-02-29",
        date_revision: "2029-02-28",
      });
      await request(app).post(BASE).send(bisiesto).expect(200);
    });
  });

  describe("PUT /bp/products/:id", () => {
    it("actualiza el producto sin recibir el id en el cuerpo", async () => {
      const cambios = {
        name: "Nombre editado",
        description: "Descripción editada con largo suficiente",
        logo: "nuevo.png",
        date_release: "2030-07-01",
        date_revision: "2031-07-01",
      };

      const res = await request(app).put(`${BASE}/trj-crd`).send(cambios).expect(200);
      expect(res.body.message).toBe("Product updated successfully");
      expect(res.body.data).toMatchObject({ id: "trj-crd", ...cambios });
    });

    it("valida el cuerpo igual que el alta", async () => {
      const res = await request(app)
        .put(`${BASE}/trj-crd`)
        .send({
          name: "Hola",
          description: "corta",
          logo: "",
          date_release: "2020-01-01",
          date_revision: "2021-01-01",
        })
        .expect(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("responde 404 si el producto no existe", async () => {
      await request(app)
        .put(`${BASE}/nada`)
        .send({
          name: "Nombre editado",
          description: "Descripción editada con largo suficiente",
          logo: "nuevo.png",
          date_release: "2030-07-01",
          date_revision: "2031-07-01",
        })
        .expect(404);
    });
  });

  describe("DELETE /bp/products/:id", () => {
    it("elimina el producto", async () => {
      const res = await request(app).delete(`${BASE}/trj-crd`).expect(200);
      expect(res.body).toEqual({ message: "Product removed successfully" });

      const listado = await request(app).get(BASE).expect(200);
      expect(listado.body.data).toHaveLength(0);
    });

    it("responde 404 si el producto no existe", async () => {
      await request(app).delete(`${BASE}/nada`).expect(404);
    });
  });

  describe("CORS", () => {
    it("permite el origen del frontend en el preflight", async () => {
      const res = await request(app)
        .options(BASE)
        .set("Origin", "http://localhost:4200")
        .set("Access-Control-Request-Method", "POST");

      expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:4200");
    });
  });
});
