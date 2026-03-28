import type { Battlesnake, Board, Coord, Game, GameState } from "./types";

/**
 * Build a minimal Battlesnake object.
 * @param id  Unique identifier for the snake.
 * @param body  All body segments – body[0] is the head, body[1] is the neck.
 * @param health  Current health (defaults to 100).
 */
export function makeSnake(
  id: string,
  body: Coord[],
  health = 100
): Battlesnake {
  return {
    id,
    name: `snake-${id}`,
    health,
    body,
    head: body[0],
    length: body.length,
    latency: "0",
    shout: "",
    customizations: { color: "#ff0000", head: "default", tail: "default" },
  };
}

/**
 * Build a complete GameState for testing.
 * @param body  Your snake's body – body[0] is the head, body[1] is the neck.
 * @param options  Optional overrides for board size, food, opponent snakes, etc.
 */
export function makeGameState(
  body: Coord[],
  options: {
    boardWidth?: number;
    boardHeight?: number;
    food?: Coord[];
    opponents?: Battlesnake[];
    health?: number;
    turn?: number;
  } = {}
): GameState {
  const {
    boardWidth = 11,
    boardHeight = 11,
    food = [],
    opponents = [],
    health = 100,
    turn = 1,
  } = options;

  const you = makeSnake("you", body, health);

  const game: Game = {
    id: "test-game",
    ruleset: {
      name: "standard",
      version: "1.0.0",
      settings: {
        foodSpawnChance: 15,
        minimumFood: 1,
        hazardDamagePerTurn: 0,
      },
    },
    map: "standard",
    source: "test",
    timeout: 500,
  };

  const board: Board = {
    height: boardHeight,
    width: boardWidth,
    food,
    hazards: [],
    snakes: [you, ...opponents],
  };

  return { game, turn, board, you };
}
