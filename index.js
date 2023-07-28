(function () {
  // render board constants
  const boardElemId = "game-board";
  const renderBoard = (b) => drawBoard(boardElemId, b);
  const gameStepIntervalMs = 1000;

  // Create new updatable game board
  let board = newBoard();

  // game step function
  const step = async () => {
    renderBoard(board);
    const result = clearBottomContigous(board);
    board = result[0];
    const score = result[1];
    await delay((gameStepIntervalMs / 10) * score);
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
function newBoard(
  width = 10,
  height = 20,
  fillCell = () => Math.round(Math.random())
) {
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
  /**
   * Create cell for board render
   * @param {number} value
   * @returns {HTMLDivElement}
   */
  function createCell(value) {
    const cell = document.createElement("div");
    cell.style.width = "20px";
    cell.style.height = cell.style.width;
    cell.style.border = `1px solid rgba(0,0,0,.5)`;
    cell.style.margin = "none";
    cell.style.backgroundColor = value ? "rgba(32,32,32,1)" : "white";
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
    cells.forEach((cellValue) => rowWrapper.appendChild(createCell(cellValue)));
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

  // highlight bottom rows that are contigous
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
 * Clear bottom rows that are contigous i.e. no empty spaces below or between
 * @param {number[][]} board
 * @returns {[number[][], number]}
 */
function clearBottomContigous(board) {
  return [board, 0];
}

/**
 * Wait for delay milliseconds before resolving promise
 * @param {number} delayMs
 * @returns {Promise<undefined>}
 */
async function delay(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
