//in questo file è presente il codice del server
const db = require("./database.js");
const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const socket = require("socket.io");
const { user, database } = require("./conf.js");
const { start } = require("repl");
const { setDefaultResultOrder } = require("dns");

let users_socket = [];
let games = [];
let started_games = [];
let started_round = [];
let punteggio = 0;
let length_card = [];
let l = [];

const GetUser = async () => {
  let users = await db.getting("User");
  return users;
};

const GetPartite = async () => {
  let partite = await db.getting("Game");
  return partite;
};

const GetCarte = async () => {
  let cards = await db.getting("Card");
  return cards;
};

const FindUsername = (list_user, id) => {
  //console.log(list_user);
  return list_user.find((u) => u.id === id).username;
};

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use("/", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
server.listen(3000, () => {
  ////console.log("- server running");
});
const io = new socket.Server(server);

db.createTable();

app.post("/login", async (req, res) => {
  let user = await db.checkLogin(req.body.username, req.body.password);
  //////console.log(user);
  if (user) {
    res.json({ result: "ok" });
  } else {
    res.json({ result: "unauthorized" });
  }
});

app.post("/singin", async (req, res) => {
  let user = await db.getting("User");
  JSON.stringify(user);
  /*////console.log(
    user.filter(
      (x) =>
        x.username === req.body.username && x.password === req.body.password,
    ).length === 0,
  );*/
  if (
    user.filter(
      (x) =>
        x.username === req.body.username && x.password === req.body.password,
    ).length === 0
  ) {
    //////console.log("d");
    let s = db.insert("User", {
      username: req.body.username,
      password: req.body.password,
      status: true,
    });
    res.json({ result: "ok" });
  } else {
    //////console.log("w");
    res.json({ result: "unauthorized" });
  }
});

app.get("/card_get", async (req, res) => {
  let cards = await db.getting("Card");
  res.json({ card: cards });
});

app.get("/user_get/:usernam", async (req, res) => {
  console.log(req.params.usernam);
  let users = await GetUser("User");
  ////console.log(users);
  let userss = users_socket.map((us) => {
    return {
      username: FindUsername(users, us.user),
      id_user: us.user,
    };
  });
  userss = userss.filter((us) => us.username !== req.params.usernam);
  //////console.log(users);
  res.json({ users: userss });
});

app.get("/game_get", async (req, res) => {
  if (users_socket.length !== 0) {
    let partite = await GetPartite("Game");
    let users = await db.getting("User");
    /*////console.log(partite);*/
    /*////console.log(users);*/
    let list_games = [];
    partite.forEach((gm, indi) => {
      let game = games.find((g) => g.room === gm.id);
      let user = [];
      console.log(game);
      if (game !== undefined) {
        game.users.forEach((u, indi) => {
          user.push(
            users.find(
              (use) =>
                use.id === users_socket.find((us) => us.socket_id === u).user,
            ).username,
          );
        });
        list_games.push({ game: game, users: user });
      }
    });
    ////console.log(list_games);
    res.json({ games: list_games });
  }
});

io.on("connection", (socket) => {
  //gestione accesso utente, invito utente, disconessione utente e unione ad una stanza
  socket.on("accesso", async (password, username) => {
    let users = await GetUser("User");
    ////console.log(users, password, username);
    let user = users.find(
      (u) => u.password === password && u.username === username,
    );
    //////console.log(user_);
    if (user !== undefined) {
      users_socket.push({ user: user.id, socket_id: socket.id });
      console.log(users_socket);
      console.log("/n");
    }
  });

  socket.on("join games", (game) => {
    socket.join(game);
    if (games.find((g) => g.room === game) === undefined) {
      games.push({ room: game, users: [socket.id] });
      db.insert("Game", { id: game, status: "false" });
    } else {
      let room = games.find((g) => g.room === game);
      list_users = room.users;
      //////console.log(list_users);
      list_users.push(socket.id);
      //////console.log(games.indexOf(room));
      games[games.indexOf(room)]["users"] = list_users;
      list_user2 = list_users.slice(0); //creo lista utenti senza il cretore della stanza perchè solo lui può iniziare la partita
      socket.broadcast
        .to(room.users[0])
        .emit("join user", list_user2.splice(0, 1));
    }
    console.log(games);
    //console.log("/n");
  });

  socket.on("invite user", async (utente) => {
    //console.log(utente);
    let users = await GetUser("User");
    let senter_user = users_socket.find((us) => us.socket_id === socket.id);
    let invited_user = users_socket.find((us) => us.user === utente);
    //console.log(invited_user);
    console.log(senter_user);
    //console.log("");
    let room = games.find((g) => g.users.includes(senter_user.socket_id));
    if (room !== undefined) {
      //console.log(room.room);
      socket.broadcast.to(invited_user.socket_id).emit("invited", {
        username: FindUsername(users, senter_user.user),
        room: room.room,
      });
      //console.log("/n");
    }
  });

  socket.on("disconnect", () => {
    ////console.log("user disconnected");
    ////console.log(users_socket.find((us) => us.socket_id === socket.id));
    if (users_socket.find((us) => us.socket_id === socket.id) !== undefined) {
      ////console.log(users_socket[0].socket_id);
      users_socket.splice(
        users_socket.indexOf(
          users_socket.find((us) => us.socket_id === socket.id),
        ),
        1,
      );
    }
    ////console.log(users_socket);
    //console.log("/n");
  });

  //gesione partita di briscola
  socket.on("start game briscola", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    let dati = await SetUpGameBriscola(room);
    let sg = dati.sg;
    let sr = dati.sr;
    started_games.push(sg);
    started_round.push(sr);
    //console.log(sg, sr);

    sr.order.forEach((u, indi) => {
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      io.to(u).emit("star", {
        hand: hands,
        briscola: sg.briscola,
        order: sr.order,
      });
    });
    io.to(sr.order[0]).emit("start_turn_briscola");
    //console.log(started_games);
    ////console.log(games);
    //console.log("/n");
  });

  socket.on("end turn briscola", async (game) => {
    let users = await GetUser("User");
    let sg = started_games.find((s) => s.room === game.room);
    let sr = started_round.find((s) => s.room === game.room);

    sr.index += 1;
    //console.log(40 / sr.order.length, sg.list_turncard.length);
    if (sr.index === sr.order.length) {
      //controllo se è finita la mano
      sr.index = 0;
      sg.list_turncard.push(sr.card_played);
      let index_order = SetOrder(sr, sg);
      console.log(index_order);
      ////console.log(sg.order);
      for (let i = 0; i < index_order; i++) {
        let posi = sr.order[0];
        sr.order.splice(0, 1);
        sr.order.push(posi);
      }
      //console.log(sr.card_played);
      sg.taken_card[
        sg.taken_card.findIndex((user) => user.user === sr.order[0])
      ].mazzo.push(...sr.card_played);
      //console.log(sg.taken_card);

      sr.card_played = [];
      io.to(sg.room).emit("updateboard", []);

      if (sg.list_turncard.length === 40 / sr.order.length) {
        //controllo se è finita la partita
        sr.order.forEach((u) => {
          let ista = sg.taken_card.find((is) => is.user === u);
          let punti = punteggi_briscola(ista);
          ista["punti"] = punti;
          console.log(punti);
          //console.log(user.mazzo);
        });
        let punteggi = sg.taken_card.map((is) => {
          return {
            username: FindUsername(
              users,
              users_socket.find((us) => us.socket_id === is.user).user,
            ),
            mazzo: is.mazzo,
            punti: is.punti,
          };
        });
        console.log(punteggi);
        io.to(sg.room).emit("fine partita", punteggi);
      } else {
        sr.order.forEach((u, indi) => {
          if (sg.deck.length > 0) {
            let card = sg.deck.slice(0, 1);
            sg.deck.splice(0, 1);
            io.to(u).emit("draw card", { card: card[0], game: sg });
          }
          if (indi === sr.index) {
            io.to(u).emit("start_turn_briscola");
          }
        });
      }
      console.log(started_games);
      console.log(started_round);
    } else {
      //passaggio tutno al prossimo giocatore
      sr.order.forEach((u, indi) => {
        //console.log(indi, sr.index);
        if (indi === sr.index) {
          io.to(u).emit("start_turn_briscola");
        }
      });
    }
    ////console.log("");
  });

  socket.on("update board", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    let sr = started_round.find((s) => s.room === game.room);
    sr.card_played.push(game.card);
    io.to(sg.room).emit("updateboard", sr.card_played);
  });

  socket.on("update scopa", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    io.to(sg.room).emit("updatescopa", game.card);
  });

  //gestione partita di scopa
  socket.on("start game scopa", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    let dati = await SetUpGameScopa(room);
    let sg = dati.sg;
    started_games.push(sg);
    //console.log(sg, sr);
    let carte_terra = sg.deck.slice(0, 4);
    sg.deck.splice(0, 4);
    sg.order.forEach((element) => {
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      io.to(element).emit("start scopa", {
        hand: hands,
        carte_terra: carte_terra,
        order: sg.order,
      });
    });
    io.to(sg.order[0]).emit("start turn scopa");
  });

  socket.on("end turn scopa", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    let user = sg.taken_card.find((is) => is.user === sg.order[sg.index]);
    sg.taken_card.find((u) => u === user).mazzo.push(sg.carte_prese);

    if (game.hand.length === 0) {
      l.push("w");
    }
    if (l.length === 2) {
      l = [];
      sg.order.forEach((u, indi) => {
        if (sg.deck.length > 0) {
          let card = sg.deck.slice(0, 3);
          sg.deck.splice(0, 3);
          io.to(u).emit("draw card", { card: card, game: sg });
        }
        if (indi === sg.index) {
          io.to(u).emit("start_turn_scopa");
        }
      });
    }

    if (game.card.length === 0) {
      punteggio = { punteggio: 1, user: user };
    }
    if (game.card.length === 0 && sg.taken_card.length === 40) {
      length_card.push({ num: carte_prese.length, user: user });
      let punti = punteggi_scopa(game.carte_prese, user);
      if (user === punteggio.user) {
        punti.punteggio += punteggio.punteggio;
      }
      io.to(sg.room).emit("fine partita", punti);
    }
    console.log(game.card);
    io.to(sg.room).emit("updatescopa", game.card);
    sg.index += 1;
    if (sg.index === sg.order.length) {
      sg.index = 0;
      io.to(sg.order[sg.index]).emit("start turn scopa");
    } else {
      io.to(sg.order[sg.index]).emit("start turn scopa");
    }
  });
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
} //funzione che randomizza array

async function SetUpGameBriscola(room) {
  let type = "b";

  let order = room.users.slice(0); //ottiene una lista di socket_id mescolata a caso
  shuffleArray(order);

  let deck = await GetCarte(); //ottiene una lista di carte (40) mescolate a caso
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

async function SetUpGameScopa(room) {
  let type = "s";

  let order = room.users.slice(0); //ottiene una lista di socket_id mescolata a caso
  shuffleArray(order);

  let deck = await GetCarte(); //ottiene una lista di carte (40) mescolate a caso
  shuffleArray(deck);

  let index = 0; //variabile che scandisce l'ordine del gioco perchè usata per emettere evento star turn
  let taken_card = order.map((p) => ({ user: p, mazzo: [] })); //crea i "mazzetti di ogni giocatore"

  let sg = {
    type: type,
    room: room.room,
    deck: deck,
    taken_card: taken_card,
    order: order,
    index: index,
  }; //crea oggetto sg (started games) il quale contiene tutte gli attributo di una partita come
  // il mazzo, gli utenti, i mazzetti

  return { sg: sg };
} //funzione che inizializa le variabili fondamentali per la partit

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
/*console.log(
  SetOrder(
    {
      card_played: [
        {
          id: 24,
          number: 3,
          suit: "Coppe",
          path: "Progetto/assets/card/treCoppe.png",
        },
        {
          id: 29,
          number: 8,
          suit: "nbhjub",
          path: "Progetto/assets/card/dCoppe.png",
        },
      ],
    },
    { briscola: { suit: "Coppe", number: "2" } },
  ),
); //se c'è una briscola funziona*/

function punteggi_briscola(user) {
  let punti_briscola = [11, 0, 10, 0, 0, 0, 0, 2, 3, 4];
  let punteggio = 0;
  user.mazzo.forEach((card) => {
    punteggio += punti_briscola[card.number - 1];
  });
  return punteggio;
}
/*console.log(
  punteggi_briscola({
    user: "a",
    mazzo: [
      { number: 10 }
    ],
  }),
);//console*/

function calcola_primiera(primiera, n, punteggio, numero) {
  let semi = ["Bastoni", "Denari", "Spade", "Coppe"];
  primiera.forEach((carta) => {
    semi.splice(semi[carta.suit], 1);
  });
  let primiera1 = carte_giocate.filter((v) => v.valore === numero);
  if (
    primiera1.length === n &&
    primiera1.filter((seme) => seme.seme === semi[0]).length > 0
  ) {
    punteggio += 1;
  }
  return { p: punteggio, pr: primiera1 };
}

function punteggi_scopa(carte_giocatore, user) {
  let punteggio = 0;
  let p;

  carte_giocatore.forEach((el) => {
    let primiera = carte_giocatore.filter((v) => v.valore === "7");
    if (primiera.length === 4) {
      punteggio += 1;
    } else if (primiera.length === 3) {
      p = calcola_primiera(primiera, 1, punteggio, "6");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 2) {
      p = calcola_primiera(primiera, 2, punteggio, "6");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 1) {
      p = calcola_primiera(primiera, 3, punteggio, "6");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    }
    if (primiera.length === 4 && punteggio === 0) {
      punteggio += 1;
    } else if (primiera.length === 3) {
      p = calcola_primiera(primiera, 1, punteggio, "5");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 2) {
      p = calcola_primiera(primiera, 2, punteggio, "5");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 1) {
      p = calcola_primiera(primiera, 3, punteggio, "5");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    }
    if (primiera.length === 4 && punteggio === 0) {
      punteggio += 1;
    } else if (primiera.length === 3) {
      p = calcola_primiera(primiera, 1, punteggio, "1");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 2) {
      p = calcola_primiera(primiera, 2, punteggio, "1");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    } else if (primiera.lenght === 1) {
      p = calcola_primiera(primiera, 3, punteggio, "1");
      punteggio += p.punteggio;
      primiera.push(p.pr);
    }
    if (el.seme === "ori" && el.valore === "7") {
      punteggio += 1;
    }
  });
  return { punteggio: punteggio, user: user };
}

/*
  { seme: "Bastoni", valore: "9", path: "Progetto/assets/card/cBastoni.png" },
*/
