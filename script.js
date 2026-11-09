document.addEventListener('DOMContentLoaded', () => {
    // Referências do DOM
    const setupModal = document.getElementById('setup-modal');
    const resultModal = document.getElementById('result-modal');
    const setupForm = document.getElementById('setup-form');
    
    const boardElement = document.getElementById('board');
    const chalkSvg = document.getElementById('chalk-svg');
    const chalkLine = document.getElementById('chalk-line');
    
    const turnSymbolElement = document.getElementById('current-turn-symbol');
    const playerScoreElement = document.getElementById('player-score');
    const botScoreElement = document.getElementById('bot-score');
    const playerLabelElement = document.getElementById('player-label');
    const botLabelElement = document.getElementById('bot-label');
    
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const scoreSummaryMessage = document.getElementById('score-summary-message');
    
    const btnRestart = document.getElementById('btn-restart');
    const btnExit = document.getElementById('btn-exit');

    // Estado do Jogo
    let boardSize = 3;
    let winConditionLength = 3;
    let difficulty = 'medium';
    let playerSymbol = 'X';
    let botSymbol = 'O';
    
    let currentTurn = 'X';
    let gameActive = false;
    let boardState = [];
    
    let playerScore = 0;
    let botScore = 0;

    // Formulario de Configuração Inicial
    setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        difficulty = document.getElementById('difficulty').value;
        boardSize = parseInt(document.getElementById('board-size').value, 10);
        playerSymbol = document.querySelector('input[name="symbol"]:checked').value;
        botSymbol = playerSymbol === 'X' ? 'O' : 'X';
        
        // Definição da quantidade de alinhamentos necessários por modo
        winConditionLength = boardSize === 3 ? 3 : (boardSize <= 5 ? 4 : 5);

        // Atualizar nomes e símbolos no placar
        playerLabelElement.textContent = `Jogador (${playerSymbol})`;
        botLabelElement.textContent = `Bot (${botSymbol})`;

        setupModal.close();
        initGame();
    });

    // Inicialização da Partida
    function initGame() {
        boardState = Array(boardSize * boardSize).fill('');
        gameActive = true;
        currentTurn = 'X'; // Símbolo X sempre inicia
        
        turnSymbolElement.textContent = currentTurn;
        clearChalkLine();
        renderBoard();

        if (botSymbol === 'X') {
            setTimeout(makeBotMove, 450);
        }
    }

    // Monta a grade com as linhas de giz
    function renderBoard() {
        boardElement.innerHTML = '';
        boardElement.style.setProperty('--grid-size', boardSize);
        boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
        boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

        for (let i = 0; i < boardSize * boardSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            const row = Math.floor(i / boardSize);
            const col = i % boardSize;
            
            // Remove bordas externas para manter o formato tradicional de jogo da velha
            if (col === boardSize - 1) cell.classList.add('no-border-right');
            if (row === boardSize - 1) cell.classList.add('no-border-bottom');

            cell.dataset.index = i;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }

    function handleCellClick(e) {
        const index = parseInt(e.target.dataset.index, 10);

        if (!gameActive || boardState[index] !== '' || currentTurn !== playerSymbol) {
            return;
        }

        executeMove(index, playerSymbol);

        if (gameActive && currentTurn === botSymbol) {
            setTimeout(makeBotMove, 500);
        }
    }

    function executeMove(index, symbol) {
        boardState[index] = symbol;
        const cell = boardElement.children[index];
        cell.textContent = symbol;
        cell.classList.add('taken');

        const winCombination = checkWin(symbol);

        if (winCombination) {
            gameActive = false;
            drawChalkLine(winCombination);
            setTimeout(() => endGame(symbol === playerSymbol ? 'player' : 'bot'), 700);
        } else if (boardState.every(cell => cell !== '')) {
            gameActive = false;
            setTimeout(() => endGame('draw'), 400);
        } else {
            currentTurn = currentTurn === 'X' ? 'O' : 'X';
            turnSymbolElement.textContent = currentTurn;
        }
    }

    function makeBotMove() {
        if (!gameActive) return;

        let availableIndices = boardState
            .map((val, idx) => val === '' ? idx : null)
            .filter(val => val !== null);

        if (availableIndices.length === 0) return;

        let chosenIndex;

        if (difficulty === 'easy') {
            chosenIndex = getRandomMove(availableIndices);
        } else if (difficulty === 'medium') {
            chosenIndex = findWinningMove(botSymbol) ?? findWinningMove(playerSymbol) ?? getRandomMove(availableIndices);
        } else {
            chosenIndex = findWinningMove(botSymbol) ?? findWinningMove(playerSymbol) ?? getStrategicMove(availableIndices);
        }

        executeMove(chosenIndex, botSymbol);
    }

    function getRandomMove(available) {
        return available[Math.floor(Math.random() * available.length)];
    }

    function findWinningMove(symbol) {
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === '') {
                boardState[i] = symbol;
                if (checkWin(symbol)) {
                    boardState[i] = '';
                    return i;
                }
                boardState[i] = '';
            }
        }
        return null;
    }

    function getStrategicMove(available) {
        const center = Math.floor((boardSize * boardSize) / 2);
        if (available.includes(center)) return center;
        return getRandomMove(available);
    }

    // Verificação de Vitória Dinâmica (Horizontais, Verticais e Diagonais)
    function checkWin(symbol) {
        const size = boardSize;
        const req = winConditionLength;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= size - req; c++) {
                // Horizontal
                let horiz = [];
                for (let k = 0; k < req; k++) horiz.push(r * size + (c + k));
                if (horiz.every(idx => boardState[idx] === symbol)) return horiz;

                // Vertical
                let vert = [];
                for (let k = 0; k < req; k++) vert.push((c + k) * size + r);
                if (vert.every(idx => boardState[idx] === symbol)) return vert;
            }
        }

        for (let r = 0; r <= size - req; r++) {
            for (let c = 0; c <= size - req; c++) {
                // Diagonal Principal (\)
                let diag1 = [];
                for (let k = 0; k < req; k++) diag1.push((r + k) * size + (c + k));
                if (diag1.every(idx => boardState[idx] === symbol)) return diag1;

                // Diagonal Secundária (/)
                let diag2 = [];
                for (let k = 0; k < req; k++) diag2.push((r + k) * size + (c + (req - 1 - k)));
                if (diag2.every(idx => boardState[idx] === symbol)) return diag2;
            }
        }

        return null;
    }

    // Traçado do Risco Animado de Giz
    function drawChalkLine(combination) {
        const firstCell = boardElement.children[combination[0]];
        const lastCell = boardElement.children[combination[combination.length - 1]];

        const boardRect = boardElement.getBoundingClientRect();
        const firstRect = firstCell.getBoundingClientRect();
        const lastRect = lastCell.getBoundingClientRect();

        const x1 = (firstRect.left + firstRect.width / 2) - boardRect.left;
        const y1 = (firstRect.top + firstRect.height / 2) - boardRect.top;
        const x2 = (lastRect.left + lastRect.width / 2) - boardRect.left;
        const y2 = (lastRect.top + lastRect.height / 2) - boardRect.top;

        chalkLine.setAttribute('x1', x1);
        chalkLine.setAttribute('y1', y1);
        chalkLine.setAttribute('x2', x2);
        chalkLine.setAttribute('y2', y2);

        chalkSvg.style.display = 'block';
        chalkLine.style.animation = 'none';
        chalkLine.offsetHeight;
        chalkLine.style.animation = 'strike-draw 0.5s ease-out forwards';
    }

    function clearChalkLine() {
        chalkSvg.style.display = 'none';
        chalkLine.setAttribute('x1', 0);
        chalkLine.setAttribute('y1', 0);
        chalkLine.setAttribute('x2', 0);
        chalkLine.setAttribute('y2', 0);
    }

    function endGame(winner) {
        if (winner === 'player') {
            playerScore++;
            resultTitle.textContent = "Vitória!";
            resultMessage.textContent = "Parabéns! Você venceu a partida!";
        } else if (winner === 'bot') {
            botScore++;
            resultTitle.textContent = "Derrota!";
            resultMessage.textContent = "Valeu a tentativa!";
        } else {
            resultTitle.textContent = "Empate!";
            resultMessage.textContent = "Ops! Deu velha!";
        }

        playerScoreElement.textContent = playerScore;
        botScoreElement.textContent = botScore;

        if (playerScore > botScore) {
            scoreSummaryMessage.textContent = `Você está liderando por ${playerScore} a ${botScore}!`;
        } else if (botScore > playerScore) {
            scoreSummaryMessage.textContent = `O Bot está na frente com ${botScore} vitórias contra ${playerScore}!`;
        } else {
            scoreSummaryMessage.textContent = `O placar está empatado em ${playerScore} a ${botScore}!`;
        }

        resultModal.showModal();
    }

    // Botão Recomeçar (Mantém placar e configurações atuais)
    btnRestart.addEventListener('click', () => {
        resultModal.close();
        initGame();
    });

    // Botão Sair (Zera o placar e abre menu de configuração)
    btnExit.addEventListener('click', () => {
        resultModal.close();
        
        // Zera o placar zerado para nova sessão
        playerScore = 0;
        botScore = 0;
        playerScoreElement.textContent = '0';
        botScoreElement.textContent = '0';
        
        setupModal.showModal();
    });
});