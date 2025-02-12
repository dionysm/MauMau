const cardSuits = [
  { symbol: "♣", name: "Kreuz", color: "schwarz" },
  { symbol: "♠", name: "Pik", color: "schwarz" },
  { symbol: "♥", name: "Herz", color: "rot" },
  { symbol: "♦", name: "Karo", color: "rot" }
];

const cardValues = ["7", "8", "9", "10", "Bube", "Dame", "König", "Ass"];
let turn = 1;
let deck;
let deckShuffled = [];
let handCPU = [];
let handPlayer = [];
let discardPile = [];

const roundCounterDiv = document.getElementById("round")
// 🃏 Erstelle das Deck mit allen Informationen
function initializeDeck() {
  let newDeck = [];
  for (const suit of cardSuits) {
    for (const value of cardValues) {
      newDeck.push({
        symbol: suit.symbol,
        name: suit.name,
        color: suit.color,
        value: value,
        fullName: `${value} ${suit.name}` // Z. B. "Bube Herz"
      });
    }
  }
  return newDeck;
}

// 🔀 Mische das Deck
function shuffleDeck(array) {
  let shuffledArray = [...array];
  let currentIndex = shuffledArray.length;

  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [shuffledArray[currentIndex], shuffledArray[randomIndex]] =
      [shuffledArray[randomIndex], shuffledArray[currentIndex]];
  }

  return shuffledArray;
}

function firstRound() {
  console.log("BEFORE: Ziehstapel Länge", deckShuffled.length);

  for (let i = 0; i < 5; i++) {
    handPlayer.push(deckShuffled.shift());
    handCPU.push(deckShuffled.shift());
  }
  discardPile.push(deckShuffled.shift());

  console.log("Spielerhand:", handPlayer);
  console.log("CPU-Hand:", handCPU);
  console.log("AFTER: Ziehstapel Länge", deckShuffled.length);

  renderPlayerHand();
  renderDiscardPile();
}

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
    cardElement.setAttribute("onclick","playerTurn(this);")
    cardElement.setAttribute("draggable","true")

    // Textfarbe anhand der Kartenfarbe setzen
    let textColor = card.color === "rot" ? "red" : "black";

    // Drei Unter-Divs für das Kartendesign erstellen
    const topDiv = document.createElement("div");
    topDiv.classList.add("card-top");
    topDiv.textContent = `${card.value} ${card.symbol}`;
    topDiv.style.color = textColor;

    const centerDiv = document.createElement("div");
    centerDiv.classList.add("card-center");
    centerDiv.textContent = card.symbol;
    centerDiv.style.color = textColor;
    centerDiv.style.fontSize = "42px"; // Größer für bessere Optik

    const bottomDiv = document.createElement("div");
    bottomDiv.classList.add("card-bottom");
    bottomDiv.textContent = `${card.value} ${card.symbol}`;
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

// 📌 Render-Funktion für die Spielerhand
function renderPlayerHand() {
  renderCards(".player-hand", handPlayer);
}

// 📌 Render-Funktion für den Ablagestapel (zeigt nur die oberste Karte)
function renderDiscardPile() {
  renderCards(".discard", discardPile, true);
}

function startGame(){
  // 🎴 Initialisiere und mische das Deck
  deck = initializeDeck();
  deckShuffled = shuffleDeck(deck);
  console.log(deck);
  console.log(deckShuffled);
  firstRound();
}


function showDiscard(){
  console.log(discardPile[0])
}

function playerTurn(card){
  let index = Array.from(card.parentNode.children).indexOf(card);
  console.log(index)
  console.log(handPlayer[index])
  if (handPlayer[index].value === discardPile[0].value || handPlayer[index].symbol === discardPile[0].symbol ){
    console.log("JEAH! Selbe Farbe bzw Symbol")
    card.remove()
    discardPile.unshift(handPlayer[index])
    handPlayer.splice(index,1);
    renderDiscardPile()
    opponentTurn()
  }
  else {
    console.log("Karte kann nicht gelegt werden.")
  }
}

function drawCard(cards2Draw, whichHand){
  if (whichHand.length > 0){
    for (let i=0; i < cards2Draw; i++){
      whichHand.push(deckShuffled.pop())
    }
    renderPlayerHand();
  }
  else{
    console.log("Spiel noch nicht gestartet oder bereits gewonnen")
  }
}

async function opponentTurn(){
  console.log("opponents turn started here")
  let playableCards =[]
  for (let i=0; i< handCPU.length; i++){
    card = handCPU[i];
    console.log("playablecards length over iteration: " + playableCards.length)
    if (card.value === discardPile[discardPile.length-1].value || card.symbol === discardPile[discardPile.length-1].symbol){
      console.log("matching card found")
      newCard = card;
      newCard.index = i;
      playableCards.push(newCard)
    }
  }
  if (playableCards.length > 0){
    console.log("opponent played " + playableCards[0].symbol + " " + playableCards[0].value)
    // Zufällige Karte abwerfen für natürlicheres Spiel
    randomIndex = Math.floor(Math.random() * handCPU.length);
    discardPile.unshift(handCPU[playableCards[0].index])
    handCPU.splice(playableCards[0].index,1);
    await sleep(1000);
    renderDiscardPile()
    const opponentHandElement = document.getElementById("opponentHand");
    cardToRemove = document.getElementById("opponentHand").children[randomIndex]
    opponentHandElement.removeChild(cardToRemove);
  }
  console.log(playableCards.length)
  roundCounterDiv.innerHTML = turn++

}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  /* Gegner zählt Karten mit, d.H. er weiß genau welche Karten noch im Ziehstapel und in der Spielerhand existieren,*/
  /* Zuerst werden alle spielbaren Karten gecheckt, wenn mehrere Karten spielbar sind, wird abgewogen welche am besten sein könnte*/
  /* Check1 → Wieviele Karten gibt es noch im Spiel von der möglichen Karte
     Check2 → Hat der Gegner Aktionskarten? Bevorzuge Aktionskarten wenn der Spieler weniger Handkarten als der Computer besitzt.
     Check3 → Wieviele "passende" Karten zu der möglichen hat der Gegner noch in der Hand.
  function enemyTurn() {
    const possiblePlayableCards = getPossiblePlayableCards(handCPU, discardPile);

    if (possiblePlayableCards.length > 0) {
      // Bewertungsphase: für jede spielbare Karte eine Bewertung berechnen
      const ratedCards = possiblePlayableCards.map(card → {

      });

      // Wähle die Karte mit der höchsten Bewertung aus
      ratedCards.sort((a, b) => b.rating - a.rating);
      playCard(ratedCards[0].card);
    } else {
      endTurn();
    }
  }

function possiblePlayableCards(handCPU, discardPile){
    let playableCards = []
    for(card in handCPU){
      if card.value == discardPile.value || card.symbol == discardPile.symbol{
        possibleCards.push(card)
      }
    }
    return playableCards
}

function rateThemCards(playableCards) {

}

countCards(card){

}
*/
