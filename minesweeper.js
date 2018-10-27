(() => {
  const buffer = document.querySelector('.buffer');
  const field = document.querySelector('.field');
  const start = document.querySelector('input[type="button"]');
  const dimensions = document.querySelectorAll('input[type="number"]');
  [...dimensions].forEach((dim) => {
    dim.addEventListener('change', (e) => {
      dim.value = dim.value > 15 || dim.value < 1 || dim.value % 1 !== 0 ? 7 : dim.value;
    });
  });

  let board = [];

  window.addEventListener('selectstart', (e) => { e.preventDefault(); }, false);

  start.addEventListener('click', () => {
    field.style.display = 'inline-block';
    const width = parseInt(dimensions[0].value);
    const height = parseInt(dimensions[1].value);
    const temp = [];

    for (let i = 0; i < height; i++) {
      const row = [];
      for (let i = 0; i < width; i++) {
        row.push(0);
      }
      temp.push(row);
    }

    board = temp;
    init(width, height);
  }, false);

  const seed = (w, h) => {
    const mines = Math.ceil((w * h) * 0.1);
    for (let i = 0; i < mines; i++) {
      const row = Math.floor((Math.random() * (h - 1)));
      const col = Math.floor((Math.random() * (w - 1)));
      board[row][col] = 1;
    }
  };

  const placeRows = () => {
    while (field.lastChild) {
      field.removeChild(field.lastChild);
    }
    board.forEach((row, index) => {
      const rowDiv = document.createElement('div');
      rowDiv.classList.add('row');
      rowDiv.setAttribute('id', `row${index}`);
      field.appendChild(rowDiv);
    });
  };

  const placeSquares = () => {
    board.forEach((row, rIndex) => {
      const currentRow = document.querySelector(`#row${rIndex}`);
      row.forEach((column, cIndex) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.setAttribute('id', `_${rIndex}_${cIndex}`);
        cellDiv.addEventListener('click', handleClick, false);
        cellDiv.addEventListener('contextmenu', handleRightClick, false);
        cellDiv.addEventListener('mouseover', () => {
          if (!cellDiv.classList.contains('clear') && !cellDiv.classList.contains('mine')) {
            cellDiv.classList.add('hover');
          }
        }, false);
        cellDiv.addEventListener('mouseout', () => {cellDiv.classList.remove('hover')}, false);
        currentRow.appendChild(cellDiv);
      });
    });
  };

  const handleClick = (e) => {
    const coords = e.target.id.split('_');
    const row = parseInt(coords[1]);
    const col =  parseInt(coords[2]);
    const cell = board[row][col];
    const warningNumber = getWarningNumber(row, col);

    if (e.target.classList.contains('flag')) { return; }

    if (cell === 1) {
      e.target.classList.add('mine');
      e.target.textContent = '💣';
      handleDefeat();
      return;
    } else {
      e.target.classList.add('clear');
      e.target.textContent = warningNumber > 0 ? warningNumber : '';
      warningNumber === 0 && clearEmptySpace(row, col);
    }

    e.target.classList.remove('hover');

    checkVictoryCondition();
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (!e.target.classList.contains('clear') && !e.target.classList.contains('mine')) {
      if (!e.target.classList.contains('flag')) {
        e.target.classList.add('flag');
        e.target.textContent = '🚩';
      } else {
        e.target.classList.remove('flag');
        e.target.textContent = '';
      }
    }
  };

  const getValidNeighbors = (row, col) => {
    const possibleNeighbors = [
      {row: row - 1, col: col - 1}, {row: row - 1, col: col}, {row: row - 1, col: col + 1},
      {row: row, col: col - 1}, {row: row, col: col + 1},
      {row: row + 1, col: col - 1}, {row: row + 1, col: col}, {row: row + 1, col: col + 1},
    ];

    return possibleNeighbors.filter(item =>
      item.row >= 0 && item.row < board.length
      && item.col >= 0 && item.col < board[0].length
      && !document.querySelector(`#_${item.row}_${item.col}`).classList.contains('clear')
    );
  };

  const getWarningNumber = (row, col) => getValidNeighbors(row, col).reduce((acc, curr) => board[curr.row][curr.col] === 1 ? acc += 1 : acc, 0);

  const clearEmptySpace = (row, col) => {
    const neighbors = getValidNeighbors(row, col);

    if (neighbors.length === 0) { return; }

    neighbors.forEach(item => {
      if (getWarningNumber(item.row, item.col) === 0) {
        document.querySelector(`#_${item.row}_${item.col}`).classList.add('clear');
        clearEmptySpace(item.row, item.col);
      }
    });
  };

  const checkVictoryCondition = () => {
    const allCells = document.querySelectorAll('.cell');
    const won = [...allCells].every((cell) => {
      const coords = cell.id.split('_');
      return cell.classList.contains('clear') || board[coords[1]][coords[2]] === 1;
    });

    if (won) {
      lockBoard(allCells);
      field.style.animation = 'spin 1s linear 1';
      buffer.classList.add('victory');
      buffer.textContent = 'VICTORY!';
    }
  };

  const handleDefeat = () => {
    const allCells = document.querySelectorAll('.cell');
    lockBoard(allCells);
    field.style.animation = 'explode 0.75s linear 1';
    buffer.classList.add('defeat');
    buffer.textContent = 'DEFEAT!';
  };

  const lockBoard = (allCells) => {
    [...allCells].forEach((cell) => {
      cell.removeEventListener('click', handleClick, false);
      cell.removeEventListener('contextmenu', handleRightClick, false);
      cell.addEventListener('contextmenu', (e) => { e.preventDefault(); }, false);
    });
  };

  const init = (w, h) => {
    seed(w, h);
    placeRows();
    placeSquares();

    field.style.animation = 'none';
    buffer.textContent = '';
    if (buffer.classList.contains('victory')) { buffer.classList.remove('victory'); }
    if (buffer.classList.contains('defeat')) { buffer.classList.remove('defeat'); }
  };
})();