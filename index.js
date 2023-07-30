(function () {
  // render board constants
  const boardWidth = 10;
  const boardHeight = boardWidth * 2;
  const boardElemId = "game-board";
  const gameStepIntervalMs = 300;
  const clearStepIntervalMs = gameStepIntervalMs / 2;

  // game actions
  /**
   * Render current game board including floating tiles
   * @param {readonly (readonly number[])[]} b
   * @param {{ value: readonly (readonly number[])[]; x: number; y: number; }} f
   */
  function renderBoard(b, f) {
    const gameBoard = cloneBoard(b);
    f.value.forEach(([x, y]) => {
      gameBoard[x + f.x][y + f.y] = 1;
    });
    drawBoard(boardElemId, gameBoard);
  };

  // Create new updatable game board
  let board = newBoard(boardWidth, boardHeight, () => 0);
  let float = newFloat(boardWidth);

  // game step function
  const step = async () => {
    renderBoard(board, float);
    const score = getBottomContiguous(board);
    for (let i = 0; i < score; i++) {
      board = removeBottomRow(board);
      await delay(clearStepIntervalMs);
      renderBoard(board, float);
    }
    [board, float] = iterBoard(board, float);
    if (!isGameOver(board)) setTimeout(step, gameStepIntervalMs);
  };

  step();
})();

/**
 * Create new empty game board
 * @param {number} width
 * @param {number} height
 * @param {() => number} fillCell
 * @returns {readonly (readonly number[])[]}
 */
function newBoard(width = 10, height = 20, fillCell = () => randomInt(0, 1)) {
  return Object.freeze(
    new Array(width)
      .fill(undefined)
      .map(() => Object.freeze(new Array(height).fill(undefined).map(fillCell)))
  );
}

/**
 * Create new floating group at default position
 * @param {number} boardWidth
 * @param {number} length
 * @returns {{ value: readonly (readonly number[])[]; x: number; y: number; }}
 */
function newFloat(boardWidth, length = 4) {
  const value = randomGroup(length);
  const floatWidth = tileGroupWidth(value);
  return {
    value,
    x: Math.floor((boardWidth - floatWidth) / 2),
    y: 0,
  };
}

/**
 * Get width of tile group on x axis
 * @param {readonly (readonly number[])[]} value
 * @returns {number}
 */
function tileGroupWidth(value) {
  const xs = value.map(([x, _]) => x);
  return Math.max(...xs) - Math.min(...xs);
}

/**
 * Draw on the screen the contents of the game board
 * @param {string} elemId
 * @param {number[][]} gameBoard
 */
function drawBoard(elemId, gameBoard) {
  const score = getBottomContiguous(gameBoard);
  const bottomIndex = gameBoard[0].length - score;

  /**
   * Create cell for board render
   * @param {number} value
   * @param {number} index
   * @returns {HTMLDivElement}
   */
  function createCell(value, index) {
    const cell = document.createElement("div");
    cell.style.width = "20px";
    cell.style.height = cell.style.width;
    cell.style.border = `1px solid rgba(0,0,0,.5)`;
    cell.style.margin = "none";
    cell.style.backgroundColor = value
      ? `rgba(${index >= bottomIndex ? "128,0,0" : "32,32,32"},1)`
      : "white";
    return cell;
  }

  /**
   * Create board column to be rendered
   * @param {number[]} cells
   */
  function createColumn(cells) {
    const rowWrapper = document.createElement("div");
    rowWrapper.style.display = "flex-row";
    rowWrapper.style.alignItems = "center";
    rowWrapper.style.justifyContent = "center";
    cells.map(createCell).forEach((elem) => rowWrapper.appendChild(elem));
    return rowWrapper;
  }

  // prepare board elem
  const boardWrapper = document.getElementById(elemId);
  if (!boardWrapper) return;
  boardWrapper.style.padding = "12px";
  boardWrapper.style.display = "flex";
  boardWrapper.style.alignItems = "center";
  boardWrapper.style.justifyContent = "center";
  boardWrapper.innerHTML = ""; // reset before drawing elements
  gameBoard.forEach((row) => boardWrapper.appendChild(createColumn(row)));

  // highlight bottom rows that are contiguous
}

/**
 * Iterate board into next state i.e. moving all cells that can be moved downwards
 * @param {readonly (readonly number[])[]} board
 * @param {{value: readonly (readonly number[])[], x: number, y: number}} float
 * @returns {[readonly (readonly number[])[], {value: readonly (readonly number[])[], x: number, y: number}]}
 */
function iterBoard(board, float) {
  /**
   * Mutate board adding floating tile to it
   * @param {number[][]} board
   * @param {{value: readonly (readonly number[])[], x: number, y: number}} float
   * @returns {undefined}
   */
  function boardWithFloatingTiles(board, float) {
    float.value.forEach(([x, y]) => {
      board[x + float.x][y + float.y] = 1;
    });
  }

  /**
   * Iterate column cells
   * @param {readonly number[]} cells
   * @returns {number[]}
   */
  function iterColumn(cells) {
    const lastEmptySpace = cells.lastIndexOf(0);
    if (lastEmptySpace < 0) return [...cells];
    return [0, ...cells.filter((_, i) => i != lastEmptySpace)];
  }

  const boardWidth = board.length;
  const nextBoard = board.map(iterColumn);
  const nextFloat = { ...float, y: float.y + 1 };

  const hasDropped = nextFloat.value.some(([x, y]) => {
    const column = board[x + nextFloat.x];
    const nextY = y + nextFloat.y;
    return column[nextY] || nextY == column.length;
  });

  if (hasDropped) {
    boardWithFloatingTiles(nextBoard, float);
    Object.assign(nextFloat, newFloat(boardWidth));
  }

  return [nextBoard, nextFloat];
}

/**
 * Compare two boards for equality
 * @param {readonly (readonly number[])[]} boardA
 * @param {readonly (readonly number[])[]} boardB
 * @returns {boolean}
 */
function boardEquals(boardA, boardB) {
  return JSON.stringify(boardA) == JSON.stringify(boardB);
}

/**
 * Create duplicate board for mutation
 * @param {readonly (readonly number[])[]} board
 * @returns {number[][]}
 */
function cloneBoard(board) {
  return JSON.parse(JSON.stringify(board));
}

/**
 * Get bottom rows that are contiguous i.e. no empty spaces below or between
 * @param {readonly (readonly number[])[]} board
 * @returns {number}
 */
function getBottomContiguous(board) {
  const width = board.length;
  const height = board[0].length;
  let count = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (!board[j][height - i - 1]) {
        return i;
      }
    }
    count = i + 1;
  }
  return count;
}

/**
 * Check if game board is in over state
 * @param {readonly (readonly number[])[]} board
 * @returns {boolean}
 */
function isGameOver(board) {
  return board.some((cells) => cells.lastIndexOf(0) < 0);
}

/**
 * Pop bottom row from board
 * @param {readonly (readonly number[])[]} board
 * @param {number} count
 * @returns {readonly (readonly number[])[]}
 */
function removeBottomRow(board, count = 1) {
  /**
   * Remove last cell from column
   * @param {readonly number[]} cells
   * @returns {readonly number[]}
   */
  function removeLastCell(cells) {
    return Object.freeze([
      ...new Array(count).fill(0),
      ...cells.slice(0, -count),
    ]);
  }

  return board.map(removeLastCell);
}

/**
 * Wait for delay milliseconds before resolving promise
 * @param {number} delayMs
 * @returns {Promise<undefined>}
 */
async function delay(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Create a tile group that can be placed
 * @param {number} n number of tiles in group
 * @returns {readonly (readonly number[])[]} new tile group
 */
function randomGroup(n = 4) {
  /**
   * Turn tile object into string
   * @param {readonly number[]} t
   * @returns {string}
   */
  function dehydrateTile(t) {
    return t.join(",");
  }
  /**
   * Turn string tile into js number object
   * @param {string} t
   * @returns {readonly number[]}
   */
  function hydrateTile(t) {
    return Object.freeze(t.split(",").map(Number));
  }

  let lastTile = "0,0";
  let [minX, minY] = hydrateTile(lastTile);

  const group = new Set([lastTile]);
  // TODO: look up matrix rotation
  while (group.size < n) {
    const lastTileHydrated = hydrateTile(lastTile);
    const leftOrRight = randomInt(-1, 1);
    const nextX = lastTileHydrated[0] + leftOrRight;
    const nextY =
      lastTileHydrated[1] + (Math.abs(leftOrRight) ? 0 : randomInt(-1, 1));
    if (nextX < minX) minX = nextX;
    if (nextY < minY) minY = nextY;
    lastTile = dehydrateTile([nextX, nextY]);
    group.add(lastTile);
  }

  return Object.freeze(
    Array.from(group)
      .sort()
      .map((t) => {
        const tile = hydrateTile(t);
        return [tile[0] - minX, tile[1] - minY];
      })
  );
}

/**
 * Random number between min and max
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}
