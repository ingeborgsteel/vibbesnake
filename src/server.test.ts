import { describe, expect, test } from "bun:test";
import { info, move } from "./server";
import { makeGameState, makeSnake } from "./test-helpers";

const VALID_MOVES = ["up", "down", "left", "right"] as const;

// ---------------------------------------------------------------------------
// info()
// ---------------------------------------------------------------------------

describe("info", () => {
  test("returns apiversion '1'", () => {
    expect(info().apiversion).toBe("1");
  });

  test("returns the snake's colour", () => {
    expect(info().color).toBe("#ead00a");
  });

  test("returns the correct head and tail customisation", () => {
    const result = info();
    expect(result.head).toBe("smart-caterpillar");
    expect(result.tail).toBe("coffee");
  });
});

// ---------------------------------------------------------------------------
// move() – general validity
// ---------------------------------------------------------------------------

describe("move – response shape", () => {
  test("always returns one of the four valid directions", () => {
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ]);
    const result = move(gs);
    expect(VALID_MOVES).toContain(result.move as (typeof VALID_MOVES)[number]);
  });

  test("always includes a shout string", () => {
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ]);
    expect(move(gs).shout).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// move() – neck (backwards) avoidance
// ---------------------------------------------------------------------------

describe("move – neck avoidance", () => {
  test("does not move back into the neck when it is below", () => {
    // head (5,5), neck (5,4) – snake is moving up, 'down' must be avoided
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
    ]);
    expect(move(gs).move).not.toBe("down");
  });

  test("does not move back into the neck when it is above", () => {
    // head (5,5), neck (5,6) – snake is moving down, 'up' must be avoided
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 6 },
    ]);
    expect(move(gs).move).not.toBe("up");
  });

  test("does not move back into the neck when it is to the left", () => {
    // head (5,5), neck (4,5) – snake is moving right, 'left' must be avoided
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ]);
    expect(move(gs).move).not.toBe("left");
  });

  test("does not move back into the neck when it is to the right", () => {
    // head (5,5), neck (6,5) – snake is moving left, 'right' must be avoided
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 6, y: 5 },
    ]);
    expect(move(gs).move).not.toBe("right");
  });
});

// ---------------------------------------------------------------------------
// move() – wall / out-of-bounds avoidance
// ---------------------------------------------------------------------------

describe("move – wall avoidance", () => {
  test("does not move left when head is on the left wall (x = 0)", () => {
    const gs = makeGameState([
      { x: 0, y: 5 },
      { x: 0, y: 4 },
    ]);
    expect(move(gs).move).not.toBe("left");
  });

  test("does not move right when head is on the right wall (x = boardWidth-1)", () => {
    const gs = makeGameState(
      [
        { x: 10, y: 5 },
        { x: 10, y: 4 },
      ],
      { boardWidth: 11 }
    );
    expect(move(gs).move).not.toBe("right");
  });

  test("does not move down when head is on the bottom wall (y = 0)", () => {
    const gs = makeGameState([
      { x: 5, y: 0 },
      { x: 4, y: 0 },
    ]);
    expect(move(gs).move).not.toBe("down");
  });

  test("does not move up when head is on the top wall (y = boardHeight-1)", () => {
    const gs = makeGameState(
      [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
      ],
      { boardHeight: 11 }
    );
    expect(move(gs).move).not.toBe("up");
  });
});

// ---------------------------------------------------------------------------
// move() – own-body collision avoidance
// ---------------------------------------------------------------------------

describe("move – own body collision avoidance", () => {
  test("does not move right into own body segment", () => {
    // Body: head (5,5) → neck (5,4) → (6,4) → (6,5)
    // Segment (6,5) is directly to the right of the head.
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 6, y: 4 },
      { x: 6, y: 5 },
    ]);
    expect(move(gs).move).not.toBe("right");
  });

  test("does not move left into own body segment", () => {
    // Body: head (5,5) → neck (5,4) → (4,4) → (4,5)
    // Segment (4,5) is directly to the left of the head.
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ]);
    expect(move(gs).move).not.toBe("left");
  });

  test("does not move up into own body segment", () => {
    // Body: head (5,5) → neck (4,5) → (4,6) → (5,6)
    // Segment (5,6) is directly above the head.
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
    ]);
    expect(move(gs).move).not.toBe("up");
  });

  test("does not move down into own body segment", () => {
    // Body: head (5,5) → neck (6,5) → (6,4) → (5,4)
    // Segment (5,4) is directly below the head.
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 4 },
      { x: 5, y: 4 },
    ]);
    expect(move(gs).move).not.toBe("down");
  });
});

// ---------------------------------------------------------------------------
// move() – no safe moves
// ---------------------------------------------------------------------------

describe("move – no safe moves", () => {
  test("returns 'down' with a shout when completely trapped", () => {
    // Snake in the bottom-left corner, fully enclosed:
    //   head (0,0) – neck (1,0) blocks 'right'
    //   x=0 wall blocks 'left'
    //   y=0 wall blocks 'down'
    //   own body segment (0,1) blocks 'up'
    // Path: head(0,0) ← neck(1,0) ← (1,1) ← (0,1)
    const gs = makeGameState([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]);
    const result = move(gs);
    expect(result.move).toBe("down");
    expect(result.shout).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// move() – food seeking
// ---------------------------------------------------------------------------

describe("move – food seeking", () => {
  test("moves right when food is the only thing to the right and the path is clear", () => {
    // head (5,5), neck (5,4) → 'down' is blocked.
    // Food at (8,5) → only preferred move is 'right'.
    const gs = makeGameState(
      [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
      ],
      { food: [{ x: 8, y: 5 }] }
    );
    expect(move(gs).move).toBe("right");
  });

  test("moves up when food is directly above and the path is clear", () => {
    // head (5,5), neck (6,5) → 'right' is blocked.
    // Food at (5,9) → only preferred move is 'up'.
    const gs = makeGameState(
      [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
      ],
      { food: [{ x: 5, y: 9 }] }
    );
    expect(move(gs).move).toBe("up");
  });

  test("moves toward the closest food when multiple food items exist", () => {
    // head (5,5), neck (5,4) → 'down' is blocked.
    // Food at (4,5) [distance 1] and (9,5) [distance 4].
    // Closest is (4,5) → preferred move is 'left'.
    const gs = makeGameState(
      [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
      ],
      { food: [{ x: 4, y: 5 }, { x: 9, y: 5 }] }
    );
    expect(move(gs).move).toBe("left");
  });

  test("falls back to a safe move when the preferred food direction is blocked", () => {
    // head (5,5), neck (5,4) → 'down' is blocked.
    // Own body at (5,6) → 'up' is also blocked.
    // Food at (5,9) → preferred move 'up' is blocked, so picks from ['left','right'].
    const gs = makeGameState([
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
    ], { food: [{ x: 5, y: 9 }] });
    const result = move(gs).move;
    expect(["left", "right"]).toContain(result);
  });

  test("returns a valid safe move when no food is present on the board", () => {
    // head (5,5), neck (5,4) – no food – 'down' is the only blocked direction.
    const gs = makeGameState(
      [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
      ],
      { food: [] }
    );
    const result = move(gs).move;
    expect(["up", "left", "right"]).toContain(result);
  });
});

// ---------------------------------------------------------------------------
// move() – opponent snake awareness
// ---------------------------------------------------------------------------

describe("move – opponent snakes", () => {
  test("correctly identifies opponent snakes (they are listed in board.snakes)", () => {
    // The move function builds mappedOpponents by filtering out 'you'.
    // Verify the function doesn't crash when opponents are present.
    const opponent = makeSnake(
      "opponent",
      [
        { x: 7, y: 5 },
        { x: 7, y: 4 },
      ]
    );
    const gs = makeGameState(
      [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
      ],
      { opponents: [opponent] }
    );
    const result = move(gs);
    expect(VALID_MOVES).toContain(result.move as (typeof VALID_MOVES)[number]);
  });
});
