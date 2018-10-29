(() => {
  const buffer = document.querySelector('.buffer');
  const field = document.querySelector('.field');
  const start = document.querySelector('input[type="button"]');
  const sounds = document.querySelectorAll('audio');
  const dimensions = document.querySelectorAll('input[type="number"]');
  [...dimensions].forEach((dim) => {
    dim.addEventListener('change', (e) => {
      dim.value = dim.value > 20 || dim.value < 1 || dim.value % 1 !== 0 ? 12 : dim.value;
    });
  });

  let board = [];
  let firstMove = true;
  let timer = null;

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
      addMine(w, h);
    }
  };

  const addMine = (w, h) => {
    const row = Math.floor(Math.random() * h);
    const col = Math.floor(Math.random() * w);

    if (board[row][col] === 0) {
      board[row][col] = 1;
    } else {
      addMine(w, h);
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
    const col = parseInt(coords[2]);
    let cell = board[row][col];

    if (firstMove && cell === 1) {
      addMine(parseInt(dimensions[0].value), parseInt(dimensions[1].value));
      board[row][col] = 0;
      cell = 0;
    }

    if (e.target.classList.contains('flag')) { return; }

    if (cell === 1) {
      handleDefeat();
      return;
    } else {
      const warningNumber = getWarningNumber(row, col);
      e.target.classList.add('clear');
      e.target.textContent = warningNumber > 0 ? warningNumber : '';

      if (warningNumber === 0) {
        clearEmptySpace(row, col);
        playSound('clear');
      } else {
        playSound('warning');
      }

      firstMove = false;
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
        playSound('flagup');
      } else {
        e.target.classList.remove('flag');
        e.target.textContent = '';
        playSound('flagdown');
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
      const cell = document.querySelector(`#_${item.row}_${item.col}`);
      const warningNumber = getWarningNumber(item.row, item.col);
      cell.classList.add('clear');
      if (warningNumber === 0) {
        clearEmptySpace(item.row, item.col);
      } else {
        cell.textContent = warningNumber;
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
      clearInterval(timer);
      playSound('victory');
      lockBoard(allCells);
      field.style.animation = 'spin 1s linear 1';
      buffer.classList.add('victory');
      buffer.textContent = `VICTORY IN ${buffer.textContent}`;
    }
  };

  const handleDefeat = () => {
    clearInterval(timer);
    playSound('defeat');
    const allCells = document.querySelectorAll('.cell');
    [...allCells].forEach((cell) => {
      const coords = cell.id.split('_');
      const row = parseInt(coords[1]);
      const col = parseInt(coords[2]);
      if (board[row][col] === 1) {
        cell.classList.add('mine');
        cell.textContent = '💣';
      }
    });
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

  const playSound = (soundName) => {
    const audio = [...sounds].find(sound => sound.id === soundName);
    audio.volume = 0.25;
    audio.paused ? audio.play() : audio.currentTime = 0;
  };

  const displayClock = () => {
    buffer.textContent = '0:00';
    clearInterval(timer);
    let sec = 0;
    let min = 0;

    timer = setInterval(() => {
      sec += 1;
      if (sec === 60) {
        min += 1;
        sec = 0;
      }
      buffer.textContent = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }, 1000);
  };

  const init = (w, h) => {
    playSound('start');

    seed(w, h);
    placeRows();
    placeSquares();
    displayClock();

    firstMove = true;

    field.style.animation = 'none';

    if (buffer.classList.contains('victory')) { buffer.classList.remove('victory'); }
    if (buffer.classList.contains('defeat')) { buffer.classList.remove('defeat'); }
  };
})();
