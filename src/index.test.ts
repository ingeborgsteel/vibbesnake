import { describe, expect, test } from "bun:test";
import app from "./index";
import { makeGameState } from "./test-helpers";

const VALID_MOVES = ["up", "down", "left", "right"];

/** Minimal valid GameState JSON for POST endpoints. */
function gameStateBody() {
  return JSON.stringify(
    makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ])
  );
}

// ---------------------------------------------------------------------------
// GET /
// ---------------------------------------------------------------------------

describe("GET /", () => {
  test("responds with HTTP 200", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
  });

  test("returns JSON with the snake's apiversion", async () => {
    const res = await app.request("/");
    const body = await res.json();
    expect(body.apiversion).toBe("1");
  });

  test("returns the snake's colour in the response", async () => {
    const res = await app.request("/");
    const body = await res.json();
    expect(body.color).toBe("#ead00a");
  });
});

// ---------------------------------------------------------------------------
// POST /start
// ---------------------------------------------------------------------------

describe("POST /start", () => {
  test("responds with HTTP 200 and text 'ok'", async () => {
    const res = await app.request("/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: gameStateBody(),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// POST /move
// ---------------------------------------------------------------------------

describe("POST /move", () => {
  test("responds with HTTP 200", async () => {
    const res = await app.request("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: gameStateBody(),
    });
    expect(res.status).toBe(200);
  });

  test("returns a valid move direction", async () => {
    const res = await app.request("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: gameStateBody(),
    });
    const body = await res.json();
    expect(VALID_MOVES).toContain(body.move);
  });

  test("returns a shout with the move", async () => {
    const res = await app.request("/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: gameStateBody(),
    });
    const body = await res.json();
    expect(typeof body.shout).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// POST /end
// ---------------------------------------------------------------------------

describe("POST /end", () => {
  test("responds with HTTP 200 and text 'ok'", async () => {
    const res = await app.request("/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: gameStateBody(),
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });
});
