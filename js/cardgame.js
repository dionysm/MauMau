// ==========================================================================
// Global Constants and Variables
// ==========================================================================
const cardSuits = [
  { symbol: "♣", name: "Kreuz", color: "schwarz" },
  { symbol: "♠", name: "Pik", color: "schwarz" },
  { symbol: "♥", name: "Herz", color: "rot" },
  { symbol: "♦", name: "Karo", color: "rot" }
];

const cardValues = ["7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];

let turn = 1;
let deck;
let shuffledDeck = [];
let cpuHand = [];
let playerHand = [];
let discardPile = [];
let draggedElement = null;

// DOM Elements
const roundCounterDiv = document.getElementById("round");
const opponentHandDiv = document.getElementById("opponentHand");
const dropArea = document.getElementById("discardDrop");


// ==========================================================================
// Deck Functions
// ==========================================================================

/**
 * Initializes a new deck of cards.
 * @returns {Array} Array of card objects.
 */
function initializeDeck() {

  const newDeck = [];
  for (const suit of cardSuits) {
    for (const value of cardValues) {
      newDeck.push({
        symbol: suit.symbol,
        name: suit.name,
        color: suit.color,
        cardValue: value,
        fullName: `${value} ${suit.name}` // e.g., "Bube Herz"
      });
    }
  }
  return newDeck;
}

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} Shuffled array.
 */
function shuffleDeck(array) {
  const shuffledArray = [...array];
  let currentIndex = shuffledArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[currentIndex]
    ];
  }

  return shuffledArray;
}


// ==========================================================================
// Game Setup Functions
// ==========================================================================

/**
 * Deals the initial hands for both player and opponent,
 * and sets the first card of the discard pile.
 */
function dealInitialHands() {
  for (let i = 0; i < 5; i++) {
    playerHand.push(shuffledDeck.shift());
    cpuHand.push(shuffledDeck.shift());
  }
  discardPile.push(shuffledDeck.shift());
  renderPlayerHand();
  renderDiscardPile();
  initializeDropArea();
}

/**
 * Starts the game by initializing and shuffling the deck,
 * then dealing the initial hands.
 */
function startGame() {
  document.getElementById("modal").classList.toggle("hidden");
  deck = initializeDeck();
  shuffledDeck = shuffleDeck(deck);
  dealInitialHands();
}


// ==========================================================================
// Rendering Functions
// ==========================================================================

/**
 * Renders an array of cards in a specified container.
 * @param {string} containerSelector - CSS selector for the container.
 * @param {Array} cards - Array of card objects.
 * @param {boolean} [showOnlyTop=false] - If true, only the top card is shown.
 */
function renderCards(containerSelector, cards, showOnlyTop = false) {

  const container = document.querySelector(containerSelector);
  container.innerHTML = "";
  const cardsToRender = showOnlyTop && cards.length > 0 ? [cards[0]] : cards;

  cardsToRender.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("onclick", "playerTurn(this);");
    cardElement.setAttribute("draggable", "true");

    cardElement.addEventListener("dragstart", function () {
      draggedElement = this;
    });

    const textColor = card.color === "rot" ? "red" : "black";

    // Create card elements for top, center, and bottom
    const topDiv = document.createElement("div");
    topDiv.classList.add("card-top");
    topDiv.textContent = `${card.cardValue} ${card.symbol}`;
    topDiv.style.color = textColor;

    const centerDiv = document.createElement("div");
    centerDiv.classList.add("card-center");
    centerDiv.textContent = card.symbol;
    centerDiv.style.color = textColor;
    centerDiv.style.fontSize = "42px";

    const bottomDiv = document.createElement("div");
    bottomDiv.classList.add("card-bottom");
    bottomDiv.textContent = `${card.cardValue} ${card.symbol}`;
    bottomDiv.style.color = textColor;
    bottomDiv.style.transform = "rotate(180deg)";

    cardElement.appendChild(topDiv);
    cardElement.appendChild(centerDiv);
    cardElement.appendChild(bottomDiv);
    container.appendChild(cardElement);
  });
}

/**
 * Renders the player's hand.
 */
function renderPlayerHand() {
  renderCards(".player-hand", playerHand);
}

/**
 * Renders the opponent's hand.
 */
function renderCPUHand() {
  renderCards(".opponent-hand", cpuHand);
}

/**
 * Renders the discard pile, showing only the top card.
 */
function renderDiscardPile() {
  renderCards(".discard", discardPile, true);
}


// ==========================================================================
// Gameplay Functions
// ==========================================================================

/**
 * Handles the player's action when a card is played.
 * Validates the move and, if valid, updates the discard pile and hand.
 * @param {HTMLElement} card - The clicked card element.
 */
function playerTurn(card) {
  const index = Array.from(card.parentNode.children).indexOf(card);
  const selectedCard = playerHand[index];
  const topDiscard = discardPile[0];

  if (selectedCard.cardValue === topDiscard.cardValue || selectedCard.symbol === topDiscard.symbol) {
    card.remove();
    discardPile.unshift(selectedCard);
    playerHand.splice(index, 1);
    renderDiscardPile();
    opponentTurn();
  }
}

/**
 * Draws a specified number of cards for a given hand.
 * @param {number} cardsToDraw - Number of cards to draw.
 * @param {Array} hand - The hand to which cards are added.
 */
function drawCard(cardsToDraw, hand) {
  for (let i = 0; i < cardsToDraw; i++) {
    hand.push(shuffledDeck.shift());
  }
  renderPlayerHand();
}

/**
 * Executes the opponent's turn. The opponent plays a valid card if available;
 * otherwise, it draws a card.
 */
async function opponentTurn() {
  const playableCards = [];
  for (let i = 0; i < cpuHand.length; i++) {
    const card = cpuHand[i];
    if (card.cardValue === discardPile[0].cardValue || card.symbol === discardPile[0].symbol) {
      playableCards.push({ ...card, index: i });
    }
  }

  await sleep(1000);

  if (playableCards.length > 0) {
    const cardIndex = playableCards[0].index;
    discardPile.unshift(cpuHand[cardIndex]);
    cpuHand.splice(cardIndex, 1);
    renderDiscardPile();

    // Remove a random card element from the opponent's hand display
    if (opponentHandDiv.children.length > 0) {
      const randomIndex = Math.floor(Math.random() * opponentHandDiv.children.length);
      opponentHandDiv.removeChild(opponentHandDiv.children[randomIndex]);
    }
  } else {
    drawCard(1, cpuHand);
    // Clone a card element to represent the new card in the opponent's hand display
    if (opponentHandDiv.children.length > 0) {
      const cardToAdd = opponentHandDiv.children[0];
      const clonedCard = cardToAdd.cloneNode(true);
      opponentHandDiv.appendChild(clonedCard);
    }
  }

  roundCounterDiv.innerHTML = turn++;
}


// ==========================================================================
// Additional / Placeholder Functions
// ==========================================================================

/**
 * Placeholder for the "Sieben" card action (e.g., force opponent to draw 2 cards).
 */
function sieben() {
  // TODO: Implement "draw 2" functionality.
}

/**
 * Placeholder for the "Acht" card action (e.g., skip the opponent's turn).
 */
function acht() {
  // TODO: Implement "skip turn" functionality.
}

/**
 * Placeholder for the "Bube" card action (e.g., allow suit change).
 */
function bube() {
  // TODO: Implement "choose suit" functionality.
}

/**
 * Displays a modal based on the provided type.
 * @param {string} kind - The type of modal to display ("startScreen", "chooseColor", etc.).
 */
function modal(kind) {
  if (kind === "startScreen") {
    // TODO: Implement start screen modal.
  } else if (kind == "chooseColor") {
    container = document.getElementById("modal")
    console.log("JUP")
    container.innerHTML = ""
    wrapperElement = document.createElement("div")
    innerWrapperElement = document.createElement("div")
    innerWrapperElement.classList.add("modal-center")
    innerWrapperElement.innerHTML = "<h3>Choose Color</h3>"
    container.appendChild(innerWrapperElement)
    wrapperElement.classList.add("modal-center-color-wr")
    innerWrapperElement.appendChild(wrapperElement)

      for (card of cardSuits){
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.classList.add("player-hand")
        cardElement.setAttribute("onclick", "turnColor(this);");
        const textColor = card.color === "rot" ? "red" : "black";
        // Create card elements for top, center, and bottom
        const topDiv = document.createElement("div");
        topDiv.classList.add("card-top");
        topDiv.textContent = `${card.symbol}`;
        topDiv.style.color = textColor;
        const centerDiv = document.createElement("div");
        centerDiv.classList.add("card-center");
        centerDiv.textContent = card.symbol;
        centerDiv.style.color = textColor;
        centerDiv.style.fontSize = "42px";
        const bottomDiv = document.createElement("div");
        bottomDiv.classList.add("card-bottom");
        bottomDiv.textContent = `${card.symbol}`;
        bottomDiv.style.color = textColor;
        bottomDiv.style.transform = "rotate(180deg)";
        cardElement.appendChild(topDiv);
        cardElement.appendChild(centerDiv);
        cardElement.appendChild(bottomDiv);
        wrapperElement.appendChild(cardElement);
      }
    container.classList.toggle("hidden");
    // TODO: Implement choose color modal.
  }
}

/**
 * Event handler for when the player clicks to draw a card.
 */
function clickDraw() {
  drawCard(1, playerHand);
  opponentTurn();
}

/**
 * Initializes the drop area for drag-and-drop card playing.
 */
function initializeDropArea() {
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    playerTurn(draggedElement);
  });
}

// ==========================================================================
// Utility Functions
// ==========================================================================

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - Milliseconds to delay.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


