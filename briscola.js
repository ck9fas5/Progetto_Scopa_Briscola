function SetOrder(game, sg) {
  let playedcard = game.card_played;
  //console.log(playedcard);
  let card_briscola = playedcard.filter(
    (card) => card.suit === sg.briscola.suit,
  ); //riga che trova le carte di briscola giocate in questa mano
  console.log(card_briscola);

  if (card_briscola.length === 0) {
    let mometum_briscola = playedcard[0]; //se non c'è ne sono inizializza una briscola momentanea prima carta giocata
    card_briscola = playedcard.filter(
      (card) => card.suit === mometum_briscola.suit,
    ); //cerca se ci sono altre carte con lo stesso seme della briscola momentanea
    ////console.log(card_briscola);
    if (card_briscola.length === 1) {
      return 0; // se c'è nè solo una vuol dire che deve prendere chi ha iniziato
    } else {
      if (card_briscola.find((c) => parseInt(c.number) === 1) !== undefined) {
        let index = playedcard.findIndex(
          (c) => c.suit === mometum_briscola.suit && parseInt(c.number) == 1,
        );
        //////console.log(index);
        return index;
      } // se è presente un asso delle briscola momentanea
      else if (
        card_briscola.find((c) => parseInt(c.number) === 3) !== undefined
      ) {
        let index = playedcard.findIndex(
          (c) => c.suit === mometum_briscola.suit && parseInt(c.number) == 3,
        );
        //////console.log(index);
        return index;
      } // se è presente un 3 delle briscola momentanea e non c'è un asso prende chi ha giocato il 3
      else {
        let high_card = card_briscola.find(
          (c) =>
            parseInt(c.number) ===
            Math.max(...card_briscola.map((ca) => ca.number)),
        ); //trova la carta dal valore (number) più alto
        //////console.log(high_card);
        let index = playedcard.findIndex(
          (c) =>
            c.suit === high_card.suit && parseInt(c.number) == high_card.number,
        ); // cerca in che posizione si trova nella lista
        //////console.log(index);
        return index; //index sarà la posizione del giocatore che prende
      } //calcola chi prende se non trova ne asso ne 3
    }
  } else {
    if (card_briscola.find((c) => parseInt(c.number) === 1) !== undefined) {
      let index = playedcard.findIndex(
        (c) => c.suit === sg.briscola.suit && parseInt(c.number) === 1,
      );
      return index;
    } else if (
      card_briscola.find((c) => parseInt(c.number) === 3) !== undefined
    ) {
      let index = playedcard.findIndex(
        (c) => c.suit === sg.briscola.suit && parseInt(c.number) == 3,
      );
      //////console.log(index);
      return index;
    } else {
      let high_card = card_briscola.find(
        (c) =>
          parseInt(c.number) ===
          Math.max(...card_briscola.map((ca) => ca.number)),
      );
      ////console.log(high_card);
      let index = playedcard.findIndex(
        (c) => c.suit === high_card.suit && c.number == high_card.number,
      );
      //////console.log(index);
      return index;
    }
  }
} //funzione di BRISCOLA  che calcola chi ha preso in questo turno

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
} //funzione che randomizza array

async function SetUpGameBriscola(room, carte) {
  let type = "b";

  let order = room.users.slice(0); //ottiene una lista di socket_id mescolata a caso
  shuffleArray(order);

  let deck = carte; //ottiene una lista di carte (40) mescolate a caso
  shuffleArray(deck);

  let briscola = deck[deck.length - 1]; //definisce la briscola

  let taken_card = order.map((p) => ({ user: p, mazzo: [] })); //crea i "mazzetti di ogni giocatore"

  let index = 0; //variabile che scandisce l'ordine del gioco perchè usata per emettere evento star turn

  let sr = {
    room: room.room,
    order: order,
    index: index,
    card_played: [],
  }; // crea un oggetto sr (started round) che contiene le proprietà di un rount come ordine e le carte giocate in quel round

  let sg = {
    type: type,
    room: room.room,
    deck: deck,
    taken_card: taken_card,
    briscola: briscola,
    list_turncard: [],
  }; //crea oggetto started_game (sg), che salvera tutti gli attributi della cartica come briscola e i mazzetti e il mazzo

  return { sg: sg, sr: sr };
} //funzione che inizializa le variabili fondamentali per la partita

function punteggi_briscola(user) {
  let punti_briscola = [11, 0, 10, 0, 0, 0, 0, 2, 3, 4];
  let punteggio = 0;
  user.mazzo.forEach((card) => {
    punteggio += punti_briscola[card.number - 1];
  });
  return punteggio;
}

module.exports = {
  setOrder: SetOrder,
  shuffleArray: shuffleArray,
  SetUpGameBriscola: SetUpGameBriscola,
  PointBriscola: punteggi_briscola,
};
