import request from "supertest";
import { createApp } from "../../index";

const app = createApp();

describe("Auth routes", () => {
  it("GET / should return 200 with api status", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("VoyageMind API ok");
  });

  it("POST /auth/login with invalid credentials should return 401", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "naoexiste@test.com", password: "Senha123!" });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /auth/register with weak password should return 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ name: "Teste", email: "teste@test.com", password: "fraca" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("WEAK_PASSWORD");
  });

  it("GET /passports without token should return 401", async () => {
    const res = await request(app).get("/passports");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("UNAUTHORIZED");
  });
});
