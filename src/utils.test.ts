import { describe, expect, test } from "bun:test";
import { getOpposite, getRelativePosition, manhattenDistance } from "./utils";
import type { Battlesnake, Coord } from "./types";

/** Build a minimal snake with just a head position. */
function snakeAt(head: Coord): Battlesnake {
  return {
    id: "test",
    name: "test",
    health: 100,
    body: [head, { x: head.x, y: head.y - 1 }],
    head,
    length: 2,
    latency: "0",
    shout: "",
    customizations: { color: "#000", head: "default", tail: "default" },
  };
}

// ---------------------------------------------------------------------------
// manhattenDistance
// ---------------------------------------------------------------------------

describe("manhattenDistance", () => {
  test("returns 0 for the same coordinate", () => {
    expect(manhattenDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  test("calculates a purely horizontal distance", () => {
    expect(manhattenDistance({ x: 0, y: 5 }, { x: 3, y: 5 })).toBe(3);
  });

  test("calculates a purely vertical distance", () => {
    expect(manhattenDistance({ x: 5, y: 0 }, { x: 5, y: 4 })).toBe(4);
  });

  test("calculates combined horizontal and vertical distance", () => {
    expect(manhattenDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  test("handles target to the left and below (negative deltas)", () => {
    expect(manhattenDistance({ x: 5, y: 5 }, { x: 2, y: 3 })).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getRelativePosition
// ---------------------------------------------------------------------------

describe("getRelativePosition", () => {
  test("returns 'up' when target is directly above", () => {
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 5, y: 8 }))).toBe(
      "up"
    );
  });

  test("returns 'down' when target is directly below", () => {
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 5, y: 2 }))).toBe(
      "down"
    );
  });

  test("returns 'right' when target is directly to the right", () => {
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 8, y: 5 }))).toBe(
      "right"
    );
  });

  test("returns 'left' when target is directly to the left", () => {
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 2, y: 5 }))).toBe(
      "left"
    );
  });

  test("returns null when target is at the same position", () => {
    expect(
      getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 5, y: 5 }))
    ).toBeNull();
  });

  test("prefers vertical axis when |dy| > |dx|", () => {
    // dy = 3, dx = 2 → should return 'up'
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 7, y: 8 }))).toBe(
      "up"
    );
  });

  test("prefers horizontal axis when |dx| >= |dy|", () => {
    // dx = 3, dy = 2 → should return 'right'
    expect(getRelativePosition({ x: 5, y: 5 }, snakeAt({ x: 8, y: 7 }))).toBe(
      "right"
    );
  });
});

// ---------------------------------------------------------------------------
// getOpposite
// ---------------------------------------------------------------------------

describe("getOpposite", () => {
  test("'up' returns 'down'", () => {
    expect(getOpposite("up")).toBe("down");
  });

  test("'down' returns 'up'", () => {
    expect(getOpposite("down")).toBe("up");
  });

  test("'left' returns 'right'", () => {
    expect(getOpposite("left")).toBe("right");
  });

  test("'right' returns 'left'", () => {
    expect(getOpposite("right")).toBe("left");
  });

  test("null returns null", () => {
    expect(getOpposite(null)).toBeNull();
  });

  test("undefined returns null", () => {
    expect(getOpposite(undefined)).toBeNull();
  });

  test("an unknown direction string returns null", () => {
    expect(getOpposite("diagonal")).toBeNull();
  });
});
