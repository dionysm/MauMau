// ==========================================================================
// GLOBAL CONSTANTS & VARIABLES
// ==========================================================================
const debugMode = false; // true: Gegnerkarten sichtbar, false: nur Rückseiten (zum Debuggen)

const cardSuits = [
  { symbol: "♣", name: "Kreuz", color: "schwarz" },
  { symbol: "♠", name: "Pik", color: "schwarz" },
  { symbol: "♥", name: "Herz", color: "rot" },
  { symbol: "♦", name: "Karo", color: "rot" }
];

const cardValues = ["7", "8", "9", "10", "J", "Q", "K", "A"];

let turn = 1;
let deck = [];
let shuffledDeck = [];
let cpuHand = [];
let playerHand = [];
let discardPile = [];
let draggedElement = null;

// Variable, die steuert, ob der Spieler am Zug ist
let isPlayerTurn = true;

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================
const roundCounterDiv = document.getElementById("round");
const opponentHandDiv = document.getElementById("opponentHand");
const dropArea = document.getElementById("discardDrop");
const modalContainer = document.getElementById("modal");

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

/**
 * Verzögert die Ausführung um eine bestimmte Anzahl Millisekunden.
 * @param {number} ms - Verzögerungszeit in Millisekunden.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ermittelt aus einer Hand, welche Farbe (Symbol) am häufigsten vorkommt.
 * @param {Array} hand - Array mit Kartenobjekten.
 * @returns {string} Das Symbol der bevorzugten Farbe.
 */
function getBestColor(hand) {
  const counts = {};
  for (const card of hand) {
    const symbol = card.symbol;
    counts[symbol] = (counts[symbol] || 0) + 1;
  }
  let bestColor = null;
  let bestCount = -1;
  for (const symbol in counts) {
    if (counts[symbol] > bestCount) {
      bestCount = counts[symbol];
      bestColor = symbol;
    }
  }
  // Fallback, falls die Hand leer ist
  return bestColor || cardSuits[0].symbol;
}

// ==========================================================================
// DECK-FUNKTIONEN
// ==========================================================================
/**
 * Erzeugt ein neues Deck mit allen Karten.
 * @returns {Array} Array mit Kartenobjekten.
 */
function initializeDeck() {
  renderTurn()
  const newDeck = [];
  for (const suit of cardSuits) {
    for (const value of cardValues) {
      newDeck.push({
        symbol: suit.symbol,
        name: suit.name,
        color: suit.color,
        cardValue: value,
        fullName: `${value} ${suit.name}`
      });
    }
  }
  return newDeck;
}

/**
 * Mischt ein Kartenarray mithilfe des Fisher-Yates-Algorithmus.
 * @param {Array} array - Zu mischendes Array.
 * @returns {Array} Gemischtes Array.
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
// RENDERING-FUNKTIONEN
// ==========================================================================

/**
 * Rendert Karten in einem bestimmten Container.
 * @param {string} containerSelector - CSS-Selektor des Containers.
 * @param {Array} cards - Array mit Kartenobjekten.
 * @param {boolean} [showOnlyTop=false] - Wenn true, wird nur die oberste Karte angezeigt.
 * @param {boolean} [hideDetails=false] - Wenn true, werden keine Kartendetails angezeigt (z. B. für Gegner).
 */
function renderCards(containerSelector, cards, showOnlyTop = false, hideDetails = false) {
  const container = document.querySelector(containerSelector);
  container.innerHTML = "";

  const cardsToRender = showOnlyTop && cards.length > 0 ? [cards[0]] : cards;
  cardsToRender.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.classList.add("card");

    // Für die Spielerhand: Interaktion nur zulassen, wenn Spieler am Zug ist.
    if (containerSelector === ".player-hand") {
      cardElement.setAttribute("draggable", "true");
      cardElement.addEventListener("dragstart", () => {
        draggedElement = cardElement;
      });
        cardElement.setAttribute("onclick", "playerTurn(this);")
    }

    if (hideDetails) {
      // Zeigt nur Rückseite (z. B. Fragezeichen) an
      cardElement.innerHTML = `<div class="card-back-text"></div>`;
    } else {
      const textColor = card.color === "rot" ? "#F294B6" : "white";

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

      cardElement.append(topDiv, centerDiv, bottomDiv);
    }

    container.appendChild(cardElement);
  });
}

/**
 * Rendert die Spielerhand.
 */
function renderPlayerHand() {
  renderCards(".player-hand", playerHand);
}

/**
 * Rendert die Gegnerhand.
 * Bei debugMode = false werden nur die Rückseiten angezeigt.
 */
function renderCPUHand() {
  if (debugMode) {
    renderCards(".opponent-hand", cpuHand);
  } else {
    renderCards(".opponent-hand", cpuHand, false, true);
  }
}

/**
 * Rendert den Ablagestapel (nur die oberste Karte).
 */
function renderDiscardPile() {
  renderCards(".discard", discardPile, true);
}

// ==========================================================================
// SPIELSETUP-FUNKTIONEN
// ==========================================================================

/**
 * Teilt anfangs 5 Karten an Spieler und Gegner aus und legt eine Karte in den Ablagestapel.
 */
function dealInitialHands() {
  for (let i = 0; i < 5; i++) {
    playerHand.push(shuffledDeck.shift());
    cpuHand.push(shuffledDeck.shift());
  }
  discardPile.push(shuffledDeck.shift());
  renderPlayerHand();
  renderCPUHand();
  renderDiscardPile();
  initializeDropArea();
}

/**
 * Startet das Spiel: Deck initialisieren, mischen und Karten austeilen.
 */
function startGame() {
  modalContainer.classList.add("hidden");
  deck = initializeDeck();
  shuffledDeck = shuffleDeck(deck);
  dealInitialHands();
  isPlayerTurn = true;
}

// ==========================================================================
// SPIELLOGIK & -FUNKTIONEN
// ==========================================================================

/**
 * Verarbeitet den Zug des Spielers asynchron.
 * @param {HTMLElement} card - Das angeklickte Karten-Element.
 */
async function playerTurn(card) {
  if (!isPlayerTurn) return; // Spielerzug nur, wenn Spieler am Zug ist
  isPlayerTurn = false;
  renderTurn()
  const index = Array.from(card.parentNode.children).indexOf(card);
  const selectedCard = playerHand[index];
  const topDiscard = discardPile[0];

  // Gültigkeitsprüfung
  if (selectedCard.cardValue === topDiscard.cardValue || selectedCard.symbol === topDiscard.symbol) {
    playerHand.splice(index, 1);
    card.remove();
    discardPile.unshift(selectedCard);
    renderDiscardPile();
    gameOver("player", playerHand)

    // Spezialaktionen (z. B. Farbwahl beim Bube)
    await handleSpecialCard(selectedCard, cpuHand, "player");

    // Nach Spielerzug: Gegner ist an der Reihe

    opponentTurn();
  } else {
    // Ungültiger Zug – Spieler darf erneut interagieren
    isPlayerTurn = true;
  }
}

/**
 * Verarbeitet Spezialeffekte und gibt ein Promise zurück.
 * @param {Object} specialCard - Gespielte Karte.
 * @param {Array} targetHand - Hand, die vom Effekt betroffen ist.
 * @param {string} playedBy - "player" oder "cpu".
 * @returns {Promise}
 */
function handleSpecialCard(specialCard, targetHand, playedBy = "player") {
  switch (specialCard.cardValue) {
    case "7":
      console.log("Siebener gespielt");
      drawCard(2, targetHand);
      return Promise.resolve();
    case "8":
      console.log("Achter gespielt");
      aussetzen(playedBy);
      return Promise.resolve();
    case "J":
      console.log("Jack gespielt");
      // Beim Gegner (cpu) nicht interaktiv – Animation und clevere Farbauswahl
      return chooseColor(playedBy === "cpu");
    default:
      return Promise.resolve();
  }
}

function aussetzen(playedBy){
  if (playedBy==="cpu"){
    isPlayerTurn = false
    console.log("SpielerIN muss aussetzen")
    opponentTurn()
  }
  else {
    isPlayerTurn = true
    console.log("CPU muss aussetzen")
    playerTurn()
  }

}
/**
 * Zieht eine bestimmte Anzahl Karten in die angegebene Hand.
 * @param {number} cardsToDraw - Anzahl der zu ziehenden Karten.
 * @param {Array} hand - Zielhand (playerHand oder cpuHand).
 */
function drawCard(cardsToDraw, hand) {
  for (let i = 0; i < cardsToDraw; i++) {
    hand.push(shuffledDeck.shift());
  }
  if (hand === playerHand) {
    renderPlayerHand();
  } else if (hand === cpuHand) {
    renderCPUHand();
  }
}


function renderTurn() {
  turnHeader = document.getElementById('turn')
  if (isPlayerTurn) {
    turnHeader.innerHTML = "Your Turn"
    turnHeader.style.color = "#94F29B";
  } else {
    turnHeader.innerHTML = "CPUs Turn"
    turnHeader.style.color = "#F294B6";
  }
}
/**
 * Führt den Zug des Gegners asynchron aus.
 */
async function opponentTurn() {
  isPlayerTurn = false;
  renderTurn();
  // Sammle alle spielbaren Karten
  const playableCards = cpuHand.reduce((cards, cpuCard, index) => {
    if (cpuCard.cardValue === discardPile[0].cardValue || cpuCard.symbol === discardPile[0].symbol) {
      cards.push({ card: cpuCard, index });
    }
    return cards;
  }, []);

  await sleep(1000);

  if (playableCards.length > 0) {
    // Zuerst Karte aus der CPU-Hand entfernen und in den Ablagestapel einfügen
    const { card, index } = playableCards[0];
    cpuHand.splice(index, 1);
    discardPile.unshift(card);
    renderDiscardPile();
    renderCPUHand();
    gameOver("cpu",cpuHand)
    // Jetzt Spezialaktionen abarbeiten – z.B. Farbwahl bei Bube
    await handleSpecialCard(card, playerHand, "cpu");
    // Nach der Spezialaktion wurde bereits turnColor auf discardPile[0] aufgerufen.
  } else {
    drawCard(1, cpuHand);
  }
  roundCounterDiv.innerHTML = turn++;
  isPlayerTurn = true;
  renderTurn()
}


/**
 * Lässt den Spieler per Klick eine Karte ziehen.
 */
function clickDraw() {
  if (!isPlayerTurn) return;
  drawCard(1, playerHand);
  isPlayerTurn = false;
  opponentTurn();
}

// ==========================================================================
// MODAL & ASYNCHRONE AKTIONEN
// ==========================================================================

/**
 * Zeigt ein Modal zur Farbwahl an und gibt ein Promise zurück.
 * @param {boolean} nonInteractive - Wenn true, wird der CPU-Modus (ohne User-Interaktion) genutzt.
 * @returns {Promise}
 */
function chooseColor(nonInteractive = false) {
  return new Promise(resolve => {
    modal("chooseColor", resolve, nonInteractive);
  });
}

/**
 * Zeigt je nach Typ ein Modal an.
 * @param {string} kind - Typ des Modals ("chooseColor", etc.).
 * @param {Function} resolveCallback - Callback, der beim Abschluss aufgerufen wird.
 * @param {boolean} [nonInteractive=false] - Wenn true, ist das Modal nicht interaktiv (CPU wählt).
 * @param {whichplayer} string - Gibt den Spieler an um den Gameover Screen richtig darzustellen
 */
function modal(kind, resolveCallback, nonInteractive = false, whichplayer = "") {
  modalContainer.innerHTML = "";

  if (kind === "chooseColor") {
    const centerWrapper = document.createElement("div");
    centerWrapper.classList.add("modal-center");
    centerWrapper.id = "innerModal";
    centerWrapper.innerHTML = "<h3 style='color: white;'>Wähle eine Farbe</h3>";
    modalContainer.appendChild(centerWrapper);

    const colorWrapper = document.createElement("div");
    colorWrapper.classList.add("modal-center-color-wr");
    centerWrapper.appendChild(colorWrapper);

    // Erstelle für jeden Suit ein Karten-Element
    cardSuits.forEach(suit => {
      const cardElement = document.createElement("div");
      cardElement.classList.add("card", "player-hand");
      const textColor = suit.color === "rot" ? "#f294b6" : "white";

      const topDiv = document.createElement("div");
      topDiv.classList.add("card-top");
      topDiv.textContent +=
      topDiv.textContent += suit.symbol;
      topDiv.style.color = textColor;

      const centerDiv = document.createElement("div");
      centerDiv.classList.add("card-center");
      centerDiv.textContent = suit.symbol;
      centerDiv.style.color = textColor;
      centerDiv.style.fontSize = "42px";

      const bottomDiv = document.createElement("div");
      bottomDiv.classList.add("card-bottom");
      bottomDiv.textContent = suit.symbol;
      bottomDiv.style.color = textColor;
      bottomDiv.style.transform = "rotate(180deg)";

      cardElement.append(topDiv, centerDiv, bottomDiv);

      // Nur im interaktiven Modus wird ein Klick-Event hinzugefügt.
      if (!nonInteractive) {
        cardElement.addEventListener("click", () => {
          turnColor(suit.symbol);
          modalContainer.classList.add("hidden");
          resolveCallback();
        });
      }
      colorWrapper.appendChild(cardElement);
    });

    modalContainer.classList.remove("hidden");

    // Im nicht-interaktiven Modus (CPU) erfolgt eine Animation:
    if (nonInteractive) {
      modalContainer.classList.add("nonInteractive");
      // CPU wählt die für sie beste Farbe (basierend auf ihrer Hand)
      const bestColor = getBestColor(cpuHand);
      const bestIndex = cardSuits.findIndex(suit => suit.symbol === bestColor);
      const cardElements = Array.from(colorWrapper.children);
      let currentIndex = 0;
      const cycleInterval = 200;  // Zeit zwischen den Umschaltungen (ms)
      const cycleDuration = 1500; // Gesamtdauer der Umschaltung (ms)
      const totalCycles = Math.floor(cycleDuration / cycleInterval);
      let cycles = 0;

      const interval = setInterval(() => {
        // Entferne die Hervorhebung von allen
        cardElements.forEach(el => el.classList.remove("computerHover"));
        // Hebe das aktuelle Element hervor
        cardElements[currentIndex].classList.add("computerHover");
        currentIndex = (currentIndex + 1) % cardElements.length;
        cycles++;
        if (cycles >= totalCycles) {
          clearInterval(interval);
          // Nach der Animation: Setze die Hervorhebung auf die beste Farbe
          cardElements.forEach(el => el.classList.remove("computerHover"));
          cardElements[bestIndex].classList.add("computerHover");
          // Lasse die Hervorhebung 0,5 Sekunden stehen
          setTimeout(() => {
            console.log(bestColor)
            modalContainer.classList.remove("nonInteractive");
            modalContainer.classList.add("hidden");
            turnColor(bestColor);
            resolveCallback();
          }, 500);
        }
      }, cycleInterval);
    }
  }
  // Weitere Modaltypen lassen sich hier ergänzen.
  if (kind === "GameOver"){
      if( whichplayer === "cpu"){
        console.log("Verloren 😭!")
        modalContainer.classList.remove("hidden");
        centerWrapper = document.getElementById('modal')
        const gameOverWrapper = document.createElement("div");
        gameOverWrapper.classList.add("modal-center-color-wr");
        gameOverWrapper.classList.add("gameover");
        gameOverWrapper.style.gridColumn = "2"
        gameOverWrapper.style.gridRow = "2"
        centerWrapper.appendChild(gameOverWrapper);
        gameOverWrapper.innerHTML = "<h1>\"Verloren 😭!\"</h1>"
      }
      else {
        console.log("Gewonnen! Ü")
        modalContainer.classList.remove("hidden");
        centerWrapper = document.getElementById('modal')
        const gameOverWrapper = document.createElement("div");
        gameOverWrapper.classList.add("modal-center-color-wr");
        gameOverWrapper.classList.add("gameover");
        gameOverWrapper.style.gridColumn = "2"
        gameOverWrapper.style.gridRow = "2"
        centerWrapper.appendChild(gameOverWrapper);
        gameOverWrapper.innerHTML = "<h1>\"Gewonnen 😍!\"</h1>"
      }






    modalContainer.toggleAttribute()
  }
}

/**
 * Aktualisiert die Farbe (bzw. das Symbol) der obersten Karte im Ablagestapel.
 */
function turnColor(chosenSymbol) {
  // Finde den passenden Suit anhand des Symbols
  const suit = cardSuits.find(s => s.symbol === chosenSymbol);
  if (suit) {
    // Aktualisiere das Symbol und die Farbe des obersten Ablagestapel-Karte
    discardPile[0].symbol = suit.symbol;
    discardPile[0].color = suit.color;
    discardPile[0].name = suit.name;
    // Optional: Falls fullName genutzt wird, kann auch dieser angepasst werden
    discardPile[0].fullName = `${discardPile[0].cardValue} ${suit.name}`;
  }
  renderDiscardPile();
}


// ==========================================================================
// EVENT-HANDLER & INITIALISIERUNG
// ==========================================================================

/**
 * Initialisiert den Drag-&-Drop-Bereich.
 */
function initializeDropArea() {
  dropArea.addEventListener("dragover", event => {
    event.preventDefault();
  });
  dropArea.addEventListener("drop", event => {
    event.preventDefault();
    playerTurn(draggedElement);
  });
}

function gameOver(whichPlayer, playersHand) {
  if (playersHand.length <= 0){
    if (whichPlayer === "cpu") {
      modal("GameOver",null,null,"cpu")
    }
    else{
      modal("GameOver",null,null,"player")
    }
  }

}

/**
 * Platzhalter für zukünftige Erweiterungen (z. B. Tastaturnavigation).
 */
function keyboardNavigation(){
  console.log("nothing")
  //LEER
}

// ==========================================================================
// SPIELSTART
// ==========================================================================
//startGame();
