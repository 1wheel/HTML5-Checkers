// Redirect non-mobile users to the desktop version
if((navigator.userAgent.indexOf("Android") == -1) && (navigator.userAgent.indexOf("iPhone OS") == -1)) {
    location.href = "/checkers/";
}

// Declare game constants
var ORIENTATION;
var SQUARE_SIZE;
var BOARD_WIDTH;
var BOARD_HEIGHT;
var BLACK = "#000000";
var RED = "#FF0000";
var WHOS_TURN_IS_IT = BLACK;

// Declare arrays to keep track of piece locations
var pieceTracker = new Array();
var board;
var boardContext;
var pieceBeingMoved;
var gameInProgress;
var cursorLocation = [0,0];
var jumpLocation = [0,0];
var playerOneScore = 0;
var playerTwoScore = 0;

function initializeGame()
{
    // Get canvas elements
    board = document.getElementById("board");
    boardContext = board.getContext("2d");
    
    // Display the board
    board.style.display = "block";
    
    // Reset the score card
    var scoreCard = document.getElementById("score_card");
    scoreCard.innerHTML = "<div id='restart_game' onclick='restartGame(); return false;'>Start New Game</div>";
    scoreCard.innerHTML += "<div id='player_1' class='player'>Player 1: <span id='player_one_score'></span></div>";
    scoreCard.innerHTML += "<div id='player_2' class='player'>Player 2: <span id='player_two_score'></span></div>";
    scoreCard.innerHTML += "<div id='whosturn'></div>";
    
    // Add the footer text
    var footer = document.getElementsByTagName("footer")[0];
    footer.innerHTML = "&#169; 2011 Zubair Valimohideen";
    
    // Adjust div positions based on orientation
    changeOrientation();

    // Check if local storage is supported
    if(supportsLocalStorage()) {
        // Check if there is already a game in progress
        gameInProgress = localStorage["checkers.game.in.progress"];
        if(gameInProgress == "true") {
            // Restore saved variables
            playerOneScore = parseInt(localStorage["checkers.player.one.score"]);
            playerTwoScore = parseInt(localStorage["checkers.player.two.score"]);
            pieceTracker = JSON.parse(localStorage["checkers.piece.tracker"]);
            WHOS_TURN_IS_IT = localStorage["checkers.whos.turn.is.it"];
            
            // Draw the saved game
            drawGame();
        } else {
            // Start a new game
            newGame();
        }
    } else {
        // Start a new game
        newGame();
    }
}

function changeOrientation()
{
    // Get orienatation
    ORIENTATION = (orientation == 0) || (orientation == 180) ? 1 : 0;
    
    // Get orientation for Xoom device
    if(navigator.userAgent.indexOf("Xoom") != -1) {
        ORIENTATION = (orientation == 0) || (orientation == 180) ? 0 : 1;
    }
    
    // Change div locations based on orientation, orientation = 1 is portrait, orientation = 0 is landscape
    if(ORIENTATION) {
        // Set square and board size for portrait orientation
        SQUARE_SIZE = ((browserWidth() - 2) * 0.125);
        BOARD_WIDTH = SQUARE_SIZE * 8;
        BOARD_HEIGHT = SQUARE_SIZE * 8;        
        
        // Set the height, width, and position of the score card
        var scoreCard = document.getElementById("score_card");
        scoreCard.style.width = BOARD_WIDTH + 2 + "px";
        scoreCard.style.height = "135px";
        scoreCard.style.top = BOARD_HEIGHT + 2 + "px";
        scoreCard.style.left = "0px";
        
        // Set the width of score card elements
        document.getElementById("player_1").style.width = (browserWidth() - 49) / 2 + "px";
        document.getElementById("player_2").style.width = (browserWidth() - 49) / 2 + "px";
        document.getElementById("whosturn").style.width = browserWidth() - 25 + "px";
        document.getElementById("whosturn").style.top = "90px";
        
        // Position the footer
        var footer = document.getElementsByTagName("footer")[0];
        footer.style.top = BOARD_HEIGHT + 135 + 2 + "px";
        footer.style.width = BOARD_WIDTH + 2 + "px";
    } else {
        // Set square and board size for landscape orientation
        SQUARE_SIZE = ((browserWidth() - 2) * 0.6 * 0.125);
        BOARD_WIDTH = SQUARE_SIZE * 8;
        BOARD_HEIGHT = SQUARE_SIZE * 8;        
        
        // Set the height, width, and position of the score card
        var scoreCard = document.getElementById("score_card");
        scoreCard.style.width = browserWidth() - BOARD_WIDTH + "px";
        scoreCard.style.height = BOARD_HEIGHT + 2 + "px";
        scoreCard.style.top = "0px";
        scoreCard.style.left = BOARD_WIDTH + "px";
        
        // Set the width of score card elements
        document.getElementById("player_1").style.width = browserWidth() - BOARD_WIDTH - 25 + "px";
        document.getElementById("player_2").style.width = browserWidth() - BOARD_WIDTH - 25 + "px";
        document.getElementById("whosturn").style.width = browserWidth() - BOARD_WIDTH - 25 + "px";
        document.getElementById("whosturn").style.top = "135px";
        
        // Position the footer
        var footer = document.getElementsByTagName("footer")[0];
        footer.style.top = BOARD_HEIGHT + 2 + "px";
        footer.style.width = browserWidth() + "px";
    }
}

function restartGame()
{
    // Confirm that user wants to restart the game
    var answer = confirm("Start a New Game?");
    if(answer == true) {
        newGame();
    }
}

function newGame()
{
    // Reset game variables
    WHOS_TURN_IS_IT = BLACK;
    pieceTracker = new Array();
    gameInProgress = true;
    cursorLocation = [0,0];
    jumpLocation = [0,0];
    playerOneScore = 0;
    playerTwoScore = 0;
    
    // Reset the score card
    document.getElementById("player_one_score").innerHTML = playerOneScore;
    document.getElementById("player_two_score").innerHTML = playerTwoScore;
    
    // Set initial piece locations
    initializePieces();
    
    // Draw the game board and pieces
    drawGame();
    
    // Save the new game
    saveGame();
}

function initializePieces()
{
    // Initialize the piece counters
    var blackCounter = 0;
    var redCounter = 0;
    var pieceCounter = 0
    
    for(var j = 1; j < 9; j++) {
        for(var i = 1; i < 9; i+=2) {
            if(j < 4) {
                // Add piece to the tracking array
                pieceTracker[pieceCounter] = new piece(i + (j % 2),j,false,BLACK);
                pieceCounter++;
            } else if(j > 5) {
                // Add piece to the tracking array
                pieceTracker[pieceCounter] = new piece(i + (j % 2),j,false,RED);
                pieceCounter++;
            }
        }
    }
}

function piece(x,y,k,c)
{
    // Set the column, row, king, and color for each piece
    this.col = x;
    this.row = y;
    this.king = k;
    this.color = c;
}

function drawGame()
{            
    // Resize board
    board.width = BOARD_WIDTH;
    board.height = BOARD_HEIGHT;
    
    // Draw board squares
    drawBoard();
    
    // Draw pieces
    drawPieces();
    
    // Change turn identifier
    if(WHOS_TURN_IS_IT == BLACK) {
        document.getElementById("whosturn").innerHTML = "Black's Turn";
        document.getElementById("whosturn").style.color = WHOS_TURN_IS_IT;
    } else if(WHOS_TURN_IS_IT == RED) {
        document.getElementById("whosturn").innerHTML = "Red's Turn";
        document.getElementById("whosturn").style.color = WHOS_TURN_IS_IT;
    }
    
    // Update score card
    document.getElementById("player_one_score").innerHTML = playerOneScore;
    document.getElementById("player_two_score").innerHTML = playerTwoScore;            
}

function drawBoard()
{
    for(var i = 1; i < 9; i++) {
        for(var j = 1; j < 9; j++) {                    
            // Draw square using the column and row numbers i and j
            drawSquare(i,j);
        }
    }            
    
    // Add event listeners to check for clicks on the board
    board.addEventListener("touchstart",clickPiece,false);
}

function drawSquare(x,y)
{
    var color;
    
    // Switch between black and red squares depending on the location
    if(((x % 2 == 0) && (y % 2 == 0)) || ((x % 2 == 1) && (y % 2 == 1))) {
        color = BLACK;
    } else if(((x % 2 == 0) && (y % 2 == 1)) || ((x % 2 == 1) && (y % 2 == 0))) {
        color = RED;
    }
    
    // Draw square using the column and row numbers col and row and color c
    boardContext.beginPath();
    boardContext.fillStyle = color;
    boardContext.moveTo((x - 1) * SQUARE_SIZE,(y - 1) * SQUARE_SIZE);
    boardContext.lineTo(x * SQUARE_SIZE,(y - 1) * SQUARE_SIZE);
    boardContext.lineTo(x * SQUARE_SIZE,y * SQUARE_SIZE);
    boardContext.lineTo((x - 1) * SQUARE_SIZE,y * SQUARE_SIZE);
    boardContext.lineTo((x - 1) * SQUARE_SIZE,(y - 1) * SQUARE_SIZE);
    boardContext.closePath();
    boardContext.fill();            
}

function drawPieces()
{
    // Draw all pieces in tracking array
    for(var i = 0; i < pieceTracker.length; i++) {
        boardContext.beginPath();
        boardContext.fillStyle = pieceTracker[i].color;
        boardContext.lineWidth = 5;
        boardContext.strokeStyle = BLACK;
        boardContext.arc((pieceTracker[i].col - 1) * SQUARE_SIZE + (SQUARE_SIZE * 0.5) + 0.5,(pieceTracker[i].row - 1) * SQUARE_SIZE + (SQUARE_SIZE * 0.5) + 0.5,(SQUARE_SIZE * 0.5) - 10,0,2 * Math.PI,false);
        boardContext.closePath();
        boardContext.stroke();
        boardContext.fill();
        
        // Add a "crown" if the piece is kinged
        if(pieceTracker[i].king) {
            boardContext.beginPath();
            boardContext.lineWidth = 2;
            boardContext.strokeStyle = "#FFFFFF";
            boardContext.arc((pieceTracker[i].col - 1) * SQUARE_SIZE + (SQUARE_SIZE * 0.5) + 0.5,(pieceTracker[i].row - 1) * SQUARE_SIZE + (SQUARE_SIZE * 0.5) + 0.5,(SQUARE_SIZE * 0.5) - 15,0,2 * Math.PI,false);
            boardContext.closePath();
            boardContext.stroke();
        }
    }
}

function canvasLoc(e)
{
    var canvasLocation = [0,0];
    var canvasXOffset = document.getElementById("board").offsetLeft;
    var canvasYOffset = document.getElementById("board").offsetTop;
    
    // Get touch location relative to the broswer
    if ((e.pageX != undefined) && (e.pageY != undefined)) {
        canvasLocation[0] = e.changedTouches[0].pageX;
        canvasLocation[1] = e.changedTouches[0].pageY;
    }
    
    canvasLocation[0] -= canvasXOffset;
    canvasLocation[1] -= canvasYOffset;
    
    return canvasLocation;
}

function cursorLoc(e)
{
    var canvasLocation = canvasLoc(e);
    
    // Get the cursor location relative to the squares on the board and store in an array
    var cl1 = Math.ceil(canvasLocation[0] * (1 / SQUARE_SIZE));
    var cl2 = Math.ceil(canvasLocation[1] * (1 / SQUARE_SIZE));
    cursorLocation = [cl1,cl2];
}

function clickPiece(e)
{
    // Get the current square location
    cursorLoc(e);
    
    // Check if the square clicked has a piece and get the color
    var isPiece = checkForPiece();
    
    // If the clicked piece is the users turn, continue the game
    if(isPiece == WHOS_TURN_IS_IT) {
        // Remove piece from traking array so that it looks likes its being dragged
        for(var i = 0; i < pieceTracker.length; i++) {
            if((pieceTracker[i].col == cursorLocation[0]) && (pieceTracker[i].row == cursorLocation[1])) {
                pieceBeingMoved = pieceTracker[i];
                pieceTracker.splice(i,1);
            }
        }
        
        // Set event listener to check piece drag
        board.addEventListener("touchmove",dragPiece,false);
    }
}

function checkForPiece()
{
    // Check if the square contains a piece and return the color
    var pieceColor = null;
    for(var i = 0; i < pieceTracker.length; i++) {
        if((pieceTracker[i].col == cursorLocation[0]) && (pieceTracker[i].row == cursorLocation[1])) {
            pieceColor = pieceTracker[i].color;
        }
    }
    
    return pieceColor;
}

function dragPiece(e)
{
    // Prevent screen scrolling
    e.preventDefault();
    
    // Get cursor location
    cursorLoc(e);
    drawGame();
    
    // Drag the piece and redraw the game until you drop the piece
    var canvasLocation = canvasLoc(e);
    boardContext.beginPath();
    boardContext.fillStyle = WHOS_TURN_IS_IT;
    boardContext.lineWidth = 5;
    boardContext.strokeStyle = BLACK;
    boardContext.arc(canvasLocation[0],canvasLocation[1],(SQUARE_SIZE * 0.5) - 10,0,2 * Math.PI,false);
    boardContext.closePath();
    boardContext.stroke();
    boardContext.fill();
    
    // Add a "crown" if the piece is kinged
    if(pieceBeingMoved.king) {
        boardContext.beginPath();
        boardContext.lineWidth = 2;
        boardContext.strokeStyle = "#FFFFFF";
        boardContext.arc(canvasLocation[0],canvasLocation[1],(SQUARE_SIZE * 0.5) - 15,0,2 * Math.PI,false);
        boardContext.closePath();
        boardContext.stroke();
    }
    
    // Add event listener to check for piece drop
    board.addEventListener("touchend",dropPiece,false);
}

function dropPiece(e)
{
    // Get the cursor location and get the legal status
    cursorLoc(e);

    var checkPiece = checkForPiece();
    var checkDiag = checkDiagonalMove();
    var checkJump = checkJumpOver();
    
    //alert(checkPiece + " " + checkDiag + " " + checkJump);
    
    // Check if the move is legal
    // If it is, move the piece, otherwise put it back where it was;
    if(!checkPiece && checkDiag && checkJump) {
        // Create the new piece and add to tracking array
        var newPiece = new piece(cursorLocation[0],cursorLocation[1],checkKingMe(),WHOS_TURN_IS_IT);
        pieceTracker.push(newPiece);
        
        // If the piece is jumping over an opponent, remove the piece
        if(checkJump == 1) {
            removePiece();
        }
        
        // Check for a winner
        checkForWin();
    } else {
        // The move was not legal so put the piece back where it came from
        pieceTracker.push(pieceBeingMoved);
    }
    
    // Save the state of the current game
    saveGame();
    
    // Remove the listeners and redraw the board
    board.removeEventListener("touchmove",dragPiece,false);
    board.removeEventListener("touchend",dropPiece,false);
    drawGame();
}

function checkDiagonalMove()
{
    var diagonalMove = true;
    
    // If the piece has been kinged apply a different set of constraints on the piece
    if(pieceBeingMoved.king) {
        if((cursorLocation[0] == pieceBeingMoved.col) || (cursorLocation[1] == pieceBeingMoved.row) || (Math.abs(pieceBeingMoved.col - cursorLocation[0]) != Math.abs(pieceBeingMoved.row - cursorLocation[1]))) {
            diagonalMove = false;
        }
    } else {
        if(WHOS_TURN_IS_IT == BLACK) {
            if((cursorLocation[0] == pieceBeingMoved.col) || (cursorLocation[1] <= pieceBeingMoved.row) || (Math.abs(pieceBeingMoved.col - cursorLocation[0]) > 2) || (Math.abs(pieceBeingMoved.col - cursorLocation[0]) != Math.abs(pieceBeingMoved.row - cursorLocation[1]))) {
                diagonalMove = false;
            }
        } else {
            if((cursorLocation[0] == pieceBeingMoved.col) || (cursorLocation[1] >= pieceBeingMoved.row) || (Math.abs(pieceBeingMoved.col - cursorLocation[0]) > 2) || (Math.abs(pieceBeingMoved.col - cursorLocation[0]) != Math.abs(pieceBeingMoved.row - cursorLocation[1]))) {
                diagonalMove = false;
            }
        }
    }
    
    return diagonalMove;
}

function checkJumpOver()
{
    var jumpOver = 0;
    
    // If the piece has been kinged apply a different set of conditions on the piece
    if(pieceBeingMoved.king) {
        // Get the column and row difference from the initial piece to the drop location
        var colDifference = pieceBeingMoved.col - cursorLocation[0];
        var rowDifference = pieceBeingMoved.row - cursorLocation[1];
        var colTemp = pieceBeingMoved.col;
        var rowTemp = pieceBeingMoved.row;
        var pieceCounter = 0;
        var colorMatch = 0;
        
        // Iterate through the squares that have been jumped and check for opponent pieces
        for(var i = 0; i < Math.abs(colDifference); i++) {
            // Get the squares that are being jumped over
            colTemp -= colDifference/Math.abs(colDifference);
            rowTemp -= rowDifference/Math.abs(rowDifference);
            
            // Check to see if that location contains a piece and if it is its own color
            for(var j = 0; j < pieceTracker.length; j++) {
                if((pieceTracker[j].col == colTemp) && (pieceTracker[j].row == rowTemp)) {
                    if(pieceTracker[j].color == pieceBeingMoved.color) {
                        colorMatch++;
                    } else {
                        jumpLocation[0] = pieceTracker[j].col;
                        jumpLocation[1] = pieceTracker[j].row;
                        pieceCounter++;
                    }
                }
            }
        }
            
        // Set the flag value based on the piecs that were jumped
        if(pieceCounter == 0 && colorMatch == 0) {
            jumpOver = 2;
        } else if(pieceCounter == 1 && colorMatch == 0) {
            jumpOver = 1;
        }
    } else {
        if((Math.abs(pieceBeingMoved.col - cursorLocation[0]) == 2 ) && (Math.abs(pieceBeingMoved.row - cursorLocation[1]) == 2)) {
            // Get the column and row values of the jumped square
            if(pieceBeingMoved.col - cursorLocation[0] > 0) {
                jumpLocation[0] = pieceBeingMoved.col - 1;
            } else {
                jumpLocation[0] = pieceBeingMoved.col + 1;
            }
            if(pieceBeingMoved.row - cursorLocation[1] < 0) {
                jumpLocation[1] = pieceBeingMoved.row + 1;
            } else {
                jumpLocation[1] = pieceBeingMoved.row - 1;
            }
            
            // Check to see if that location contains a piece and if it is its own color
            for(var i = 0; i < pieceTracker.length; i++) {
                if((pieceTracker[i].col == jumpLocation[0]) && (pieceTracker[i].row == jumpLocation[1]) && (pieceTracker[i].color != pieceBeingMoved.color)) {
                    jumpOver = 1;
                }
            }
        } else {
            jumpOver = 2;
        }
    }
    
    return jumpOver;
}

function removePiece()
{
    // Remove the jumped piece from the tracking array
    for(var i = 0; i < pieceTracker.length; i++) {
        if((pieceTracker[i].col == jumpLocation[0]) && (pieceTracker[i].row == jumpLocation[1])) {
            // Update the scores
            if(pieceTracker[i].color == BLACK) {
                playerTwoScore += 1;
            } else {
                playerOneScore += 1;
            }
            
            // Remove the piece
            pieceTracker.splice(i,1);
        }
    }
}

function checkForWin()
{
    // Check for a winner
    if((playerOneScore == 12) || (playerTwoScore == 12)) {
        // Get winner
        var winner = (playerOneScore == 12) ? "Player One" : "Player Two";
        
        // Remove the listeners and redraw the board
        board.removeEventListener("mousedown",clickPiece,false);
        board.removeEventListener("mousemove",dragPiece,false);
        board.removeEventListener("mouseup",dropPiece,false);
        drawGame();
        
        // Reset gameInProgress flag
        gameInProgress = false;
        
        // Prompt user of win and restart game
        alert("The winner is " + winner + "!");
        newGame();
    } else {
        // If noone has won, change the users turn
        if(WHOS_TURN_IS_IT == BLACK) {
            WHOS_TURN_IS_IT = RED;
        } else if(WHOS_TURN_IS_IT == RED) {
            WHOS_TURN_IS_IT = BLACK;
        }
    }
}

function saveGame()
{
    // Check to see if the browser supports local storage and save the current state of the game
    if (supportsLocalStorage()) {
        localStorage["checkers.game.in.progress"] = gameInProgress;
        localStorage["checkers.player.one.score"] = playerOneScore;
        localStorage["checkers.player.two.score"] = playerTwoScore;
        localStorage["checkers.piece.tracker"] = JSON.stringify(pieceTracker);
        localStorage["checkers.whos.turn.is.it"] = WHOS_TURN_IS_IT;
    }
}

function checkKingMe()
{
    var kingMe = false;
    
    // Check if the red or black piece has reached the other side or is already kinged
    if((pieceBeingMoved.color == BLACK) && (cursorLocation[1] == 8)) {
        kingMe = true;
    } else if((pieceBeingMoved.color == RED) && (cursorLocation[1] == 1)) {
        kingMe = true;
    } else if(pieceBeingMoved.king) {
        kingMe = true;
    }
    
    return kingMe;
}

function supportsLocalStorage() {
    // Check if local storage is supported by the browser
    var localStorageSupport = (('localStorage' in window) && (window['localStorage'] !== null));
    return localStorageSupport;
}

function browserHeight()
{
    var height;

    // Get the height of the browser window
    if (typeof window.innerWidth != 'undefined') {
        height = window.innerHeight;
    } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
        height = document.documentElement.clientHeight;
    } else {
        height = document.getElementsByTagName('body')[0].clientHeight;
    }

    return height;  
}

function browserWidth()
{
    var width;
    
    // Get the width of the browser window
    if (typeof window.innerWidth != 'undefined') {
        width = window.innerWidth;
    } else if (typeof document.documentElement != 'undefined' && typeof document.documentElement.clientWidth != 'undefined' && document.documentElement.clientWidth != 0) {
        width = document.documentElement.clientWidth;
    } else {
        width = document.getElementsByTagName('body')[0].clientWidth;
    }
    
    return width;
}

function test() { alert("Test"); }