// --------------------------------------------------------------------------
// Global Constants and Variables
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// DOM Elemente
// --------------------------------------------------------------------------

const roundCounterDiv = document.getElementById("round");
const opponentHandDiv = document.getElementById("opponentHand");
const dropArea = document.getElementById('discardDrop');
// --------------------------------------------------------------------------
// Deck-Funktionen: Initialisierung und Mischen
// --------------------------------------------------------------------------


/**
 * Erstelle das Deck mit allen Informationen
 */
function initializeDeck() {
  let newDeck = [];
  for (const suit of cardSuits) {
    for (const value of cardValues) {
      newDeck.push({
        symbol: suit.symbol,
        name: suit.name,
        color: suit.color,
        cardValue: value,
        fullName: `${value} ${suit.name}` // Z. B. "Bube Herz"
      });
    }
  }
  return newDeck;
}

/**
 * Mische das Deck
 */
function shuffleDeck(array) {
  let shuffledArray = [...array];
  let currentIndex = shuffledArray.length;

  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [shuffledArray[randomIndex], shuffledArray[currentIndex]];
  }

  return shuffledArray;
}

// --------------------------------------------------------------------------
// Spiel-Setup / Initialisierungsfunktionen
// --------------------------------------------------------------------------

/**
 * Erste Runde: Karten austeilen
 */
function dealInitialHands() {
  for (let i = 0; i < 5; i++) {
    playerHand.push(shuffledDeck.shift());
    cpuHand.push(shuffledDeck.shift());
  }
  discardPile.push(shuffledDeck.shift());
  renderPlayerHand();
  renderDiscardPile();
  dropCard()
}

/**
 * Starte das Spiel: Initialisiere und mische das Deck, dann starte die erste Runde
 */
function startGame() {
  document.getElementById('modal').classList.toggle('hidden')
  // 🎴 Initialisiere und mische das Deck
  deck = initializeDeck();
  shuffledDeck = shuffleDeck(deck);
  dealInitialHands();
}

// --------------------------------------------------------------------------
// Rendering-Funktionen
// --------------------------------------------------------------------------

/**
 * Rendere Karten in einem Container
 * @param {string} containerSelector - Der Selector des Containers
 * @param {Array} cards - Das Karten-Array
 * @param {boolean} showOnlyTop - Zeige nur die oberste Karte (optional)
 */
function renderCards(containerSelector, cards, showOnlyTop = false) {
  const container = document.querySelector(containerSelector);
  container.innerHTML = ""; // Vorherige Karten löschen

  if (showOnlyTop && cards.length > 0) {
    // Nur die oberste Karte anzeigen
    cards = [cards[0]];
  }

  cards.forEach((card) => {
    // Neues Karten-Element erstellen
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");
    cardElement.setAttribute("onclick", "playerTurn(this);");
    cardElement.setAttribute("draggable", "true");

    cardElement.addEventListener('dragstart', function() {
      draggedElement = this;
    });

    // Textfarbe anhand der Kartenfarbe setzen
    let textColor = card.color === "rot" ? "red" : "black";

    // Drei Unter-Divs für das Kartendesign erstellen
    const topDiv = document.createElement("div");
    topDiv.classList.add("card-top");
    topDiv.textContent = `${card.cardValue} ${card.symbol}`;
    topDiv.style.color = textColor;

    const centerDiv = document.createElement("div");
    centerDiv.classList.add("card-center");
    centerDiv.textContent = card.symbol;
    centerDiv.style.color = textColor;
    centerDiv.style.fontSize = "42px"; // Größer für bessere Optik

    const bottomDiv = document.createElement("div");
    bottomDiv.classList.add("card-bottom");
    bottomDiv.textContent = `${card.cardValue} ${card.symbol}`;
    bottomDiv.style.color = textColor;
    bottomDiv.style.transform = "rotate(180deg)";

    // Struktur in die Karte einfügen
    cardElement.appendChild(topDiv);
    cardElement.appendChild(centerDiv);
    cardElement.appendChild(bottomDiv);

    // Karte zum Container hinzufügen
    container.appendChild(cardElement);
  });
}

/**
 * Render-Funktion für die Spielerhand
 */
function renderPlayerHand() {
  renderCards(".player-hand", playerHand);
}

function renderCPUHand(){
  renderCards(".opponent-hand", cpuHand)
}


/**
 * Render-Funktion für den Ablagestapel (zeigt nur die oberste Karte)
 */
function renderDiscardPile() {
  renderCards(".discard", discardPile, true);
}

// --------------------------------------------------------------------------
// Spieler- und Gegner-Funktionen (Gameplay)
// --------------------------------------------------------------------------

/**
 * Spieler spielt eine Karte
 * @param {HTMLElement} card - Die angeklickte Karte
 */
function playerTurn(card) {
  let index = Array.from(card.parentNode.children).indexOf(card);
  if (playerHand[index].cardValue === discardPile[0].cardValue || playerHand[index].symbol === discardPile[0].symbol) {
    console.log(playerHand[index]);
    card.remove();
    discardPile.unshift(playerHand[index]);
    playerHand.splice(index, 1);
    renderDiscardPile();
    opponentTurn();
  } else {
    console.log("Karte kann nicht gelegt werden.");
  }
}

/**
 * Ziehe eine bestimmte Anzahl Karten in eine Hand
 * @param {number} cards2Draw - Anzahl der zu ziehenden Karten
 * @param {Array} whichHand - Die Hand, in die die Karte(n) gezogen werden
 */
function drawCard(cards2Draw, whichHand) {
  if (whichHand.length > 0) {
    for (let i = 0; i < cards2Draw; i++) {
      whichHand.push(shuffledDeck.shift());
    }
    renderPlayerHand();
  } else {
    console.log("Spiel noch nicht gestartet oder bereits gewonnen");
  }
}

/**
 * Gegnerzug: Prüft auf spielbare Karten oder zieht eine Karte
 */
async function opponentTurn() {
  let playableCards = [];
  playableCards.splice(0, playableCards.length);
  let card;
  for (let i = 0; i < cpuHand.length; i++) {
    card = cpuHand[i];
    if (card.cardValue === discardPile[0].cardValue || card.symbol === discardPile[0].symbol) {
      let newCard = card;
      newCard.index = i;
      playableCards.push(newCard);
    }
  }
  await sleep(1000);
  if (playableCards.length > 0) {
    console.log(playableCards[0]);
    console.log("opponent played " + playableCards[0].symbol + " " + playableCards[0].cardValue);
    // Zufällige Karte abwerfen für natürlicheres Spiel
    let randomIndex = Math.floor(Math.random() * cpuHand.length);
    discardPile.unshift(cpuHand[playableCards[0].index]);
    cpuHand.splice(playableCards[0].index, 1);
    renderDiscardPile();
    opponentHandDiv
    cardToRemove = opponentHandDiv.children[randomIndex];
    opponentHandDiv.removeChild(cardToRemove);


  } else {
    console.log("gegner muss ziehen");
    drawCard(1, cpuHand);
    const cardToAdd = opponentHandDiv.children[0];
    const clonedCard = cardToAdd.cloneNode(true);
    opponentHandDiv.appendChild(clonedCard);


  }
  roundCounterDiv.innerHTML = turn++;
}

function sieben(){
  // draw 2
}

function acht(){
  // aussetzen
}

function bube(){
  // wünsch dir was
}

function modal(kind){
  if (kind == "startScreen"){

  }
  else if(kind == "chooseColor"){

  }
}

/**
 * Klick-Handler: Spieler zieht eine Karte und der Gegner ist dran
 */
function clickDraw() {
  drawCard(1, playerHand);
  opponentTurn();
}

function dropCard(){
  dropArea.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  dropArea.addEventListener('drop',(event) =>{
    event.preventDefault();
    console.log("Hallo DROP")
    playerTurn(draggedElement)
  })
}

// --------------------------------------------------------------------------
// Utility-Funktionen
// --------------------------------------------------------------------------

/**
 * Hilfsfunktion für Verzögerungen
 * @param {number} ms - Zeit in Millisekunden
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debug-Funktion: Zeige die oberste Karte des Ablagestapels
 */
function showDiscard() {
  console.log(discardPile[0]);
}
