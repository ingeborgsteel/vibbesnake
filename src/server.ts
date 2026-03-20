import { Coord, GameState, InfoResponse, MoveResponse } from "./types";
import { getOpposite, getRelativePosition, manhattenDistance } from "./utils";

export function info(): InfoResponse {
  console.log("INFO");
  return {
    apiversion: "1",
    author: "Bubblun",
    color: "#ead00a",
    head: "smart-caterpillar",
    tail: "coffee",
  };
}

export function start(gameState: GameState): void {
  console.log(`${gameState.game.id} START`);
}

export function end(gameState: GameState): void {
  console.log(`${gameState.game.id} END\n`);
}

// Returns the coordinate that results from moving in the given direction
function nextCoord(head: Coord, direction: string): Coord {
  switch (direction) {
    case "up":
      return { x: head.x, y: head.y + 1 };
    case "down":
      return { x: head.x, y: head.y - 1 };
    case "left":
      return { x: head.x - 1, y: head.y };
    case "right":
      return { x: head.x + 1, y: head.y };
    default:
      return head;
  }
}

function coordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function move(gameState: GameState): MoveResponse {
  const directions = ["up", "down", "left", "right"];

  let isMoveSafe: { [key: string]: boolean } = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  const myHead = gameState.you.head;
  const myNeck = gameState.you.body[1];
  const myLength = gameState.you.length;

  // Step 0: Don't move backwards
  if (myNeck.x < myHead.x) {
    isMoveSafe.left = false;
  } else if (myNeck.x > myHead.x) {
    isMoveSafe.right = false;
  } else if (myNeck.y < myHead.y) {
    isMoveSafe.down = false;
  } else if (myNeck.y > myHead.y) {
    isMoveSafe.up = false;
  }

  // Step 1: Prevent moving out of bounds
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;

  if (myHead.x === 0) {
    isMoveSafe.left = false;
  }
  if (myHead.x === boardWidth - 1) {
    isMoveSafe.right = false;
  }
  if (myHead.y === 0) {
    isMoveSafe.down = false;
  }
  if (myHead.y === boardHeight - 1) {
    isMoveSafe.up = false;
  }

  // Step 2: Prevent colliding with yourself
  const myBody = gameState.you.body;
  directions.forEach((dir) => {
    const next = nextCoord(myHead, dir);
    if (myBody.some((segment) => coordsEqual(segment, next))) {
      isMoveSafe[dir] = false;
    }
  });

  // Step 3: Prevent colliding with other snakes' bodies
  const opponents = gameState.board.snakes.filter(
    (snake) => snake.id !== gameState.you.id
  );
  opponents.forEach((snake) => {
    directions.forEach((dir) => {
      const next = nextCoord(myHead, dir);
      if (snake.body.some((segment) => coordsEqual(segment, next))) {
        isMoveSafe[dir] = false;
      }
    });
  });

  // Step 4: Avoid head-on-head collisions with snakes of equal or greater length
  opponents.forEach((snake) => {
    if (snake.length >= myLength) {
      // Cells the opponent could move into next turn
      const opponentNextMoves = directions.map((dir) =>
        nextCoord(snake.head, dir)
      );
      directions.forEach((dir) => {
        const next = nextCoord(myHead, dir);
        if (opponentNextMoves.some((pos) => coordsEqual(pos, next))) {
          isMoveSafe[dir] = false;
        }
      });
    }
  });

  // Collect hard-safe moves (avoid walls, bodies, and dangerous heads)
  let safeMoves = directions.filter((dir) => isMoveSafe[dir]);

  // Step 5: Avoid hazards when possible (soft constraint — fall back if no other option)
  const hazards = gameState.board.hazards;
  if (hazards.length > 0) {
    const nonHazardMoves = safeMoves.filter((dir) => {
      const next = nextCoord(myHead, dir);
      return !hazards.some((h) => coordsEqual(h, next));
    });
    // Only avoid hazards if there is at least one non-hazard safe move
    if (nonHazardMoves.length > 0) {
      safeMoves = nonHazardMoves;
    }
  }

  if (safeMoves.length === 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down", shout: "Take down Magnus!" };
  }

  // Step 6: Defend — move away from the closest opponent when they are adjacent
  const mappedOpponents = opponents.map((sn) => ({
    head: sn.head,
    id: sn.id,
    length: sn.length,
    relativeToMe: getRelativePosition(myHead, sn),
    distance: manhattenDistance(myHead, sn.head),
  }));

  if (mappedOpponents.length > 0) {
    const closest = mappedOpponents.toSorted(
      (a, b) => a.distance - b.distance
    )[0];
    if (closest.distance < 2) {
      const defend = getOpposite(closest.relativeToMe);
      if (defend && safeMoves.includes(defend)) {
        console.log(`MOVE ${gameState.turn}: ${defend} (DEFEND)`);
        return { move: defend, shout: "DEFEND!" };
      }
    }
  }

  // Step 7: Move towards the closest food
  const food = gameState.board.food;
  let closestFood: Coord | undefined;
  let minDistance = Infinity;

  food.forEach((f) => {
    const distance = manhattenDistance(myHead, f);
    if (distance < minDistance) {
      minDistance = distance;
      closestFood = f;
    }
  });

  let nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  if (closestFood !== undefined) {
    const preferredMoves: string[] = [];
    if (myHead.x < closestFood.x) {
      preferredMoves.push("right");
    } else if (myHead.x > closestFood.x) {
      preferredMoves.push("left");
    }
    if (myHead.y < closestFood.y) {
      preferredMoves.push("up");
    } else if (myHead.y > closestFood.y) {
      preferredMoves.push("down");
    }

    const safePreferredMoves = preferredMoves.filter((m) =>
      safeMoves.includes(m)
    );
    if (safePreferredMoves.length > 0) {
      nextMove =
        safePreferredMoves[
          Math.floor(Math.random() * safePreferredMoves.length)
        ];
    }
  }

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove, shout: "Take down Magnus!" };
}
