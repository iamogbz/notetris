(function () {
  // render board constants
  const boardElemId = "game-board";
  const renderBoard = (b) => drawBoard(boardElemId, b);
  const gameStepIntervalMs = 1000;
  const clearStepIntervalMs = gameStepIntervalMs / 2;

  // Create new updatable game board
  let board = newBoard();

  // game step function
  const step = async () => {
    renderBoard(board);
    const score = getBottomContiguous(board);
    for (let i = 0; i < score; i++) {
      board = removeBottomRow(board);
      await delay(clearStepIntervalMs);
      renderBoard(board);
    }
    board = iterBoard(board);
    setTimeout(step, gameStepIntervalMs);
  };

  step();
})();

/**
 * Create new empty game board
 * @param {number} width
 * @param {number} height
 * @param {() => number} fillCell
 * @returns {number[][]}
 */
function newBoard(width = 10, height = 20, fillCell = () => randomInt(0, 1)) {
  return new Array(width)
    .fill(undefined)
    .map(() => new Array(height).fill(undefined).map(fillCell));
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
 * @param {number[][]} board
 * @returns {number[][]}
 */
function iterBoard(board) {
  /**
   * Iterate column cells
   * @param {number[]} cells
   * @returns {number[]}
   */
  function iterColumn(cells) {
    const lastEmptySpace = cells.lastIndexOf(0);
    return [0, ...cells.filter((_, i) => i != lastEmptySpace)];
  }

  return board.map(iterColumn);
}

/**
 * Compare two boards for equality
 * @param {number[][]} boardA
 * @param {number[][]} boardB
 * @returns {boolean}
 */
function boardEquals(boardA, boardB) {
  return JSON.stringify(boardA) == JSON.stringify(boardB);
}

/**
 * Get bottom rows that are contiguous i.e. no empty spaces below or between
 * @param {number[][]} board
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
 * Pop bottom row from board
 * @param {number[][]} board
 * @param {number} count
 * @returns number[][]
 */
function removeBottomRow(board, count = 1) {
  /**
   * Remove last cell from column
   * @param {number[]} cells
   * @returns {number[]}
   */
  function removeLastCell(cells) {
    return [...new Array(count).fill(0), ...cells.slice(0, -count)];
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
 * @returns {number[][]} new tile group
 */
function randomGroup(n = 4) {
  let lastTile = "0,0";
  const hydrateTile = (t) => t.split(",").map(Number);
  const group = new Set([lastTile]);
  // TODO: look up matrix rotation
  while (group.size < n) {
    const lastTileHydrated = hydrateTile(lastTile);
    const leftOrRight = randomInt(-1, 1);
    lastTile = [
      lastTileHydrated[0] + leftOrRight,
      lastTileHydrated[1] + (Math.abs(leftOrRight) ? 0 : randomInt(-1, 1)),
    ].join(",");
    group.add(lastTile);
  }
  return Array.from(group).sort().map(hydrateTile);
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
