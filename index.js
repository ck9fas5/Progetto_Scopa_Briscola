//in questo file è presente il codice del server
const db = require("./database.js");
const briscola = require("./briscola.js");
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
    //console.log(users, password, username);
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
    //console.log(senter_user);
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
    ////console.log(users_socket.find((us) => us.socket_id === socket.id));
    if (users_socket.find((us) => us.socket_id === socket.id) !== undefined) {
      ////console.log(users_socket[0].socket_id);
      users_socket.splice(
        users_socket.indexOf(
          users_socket.find((us) => us.socket_id === socket.id),
        ),
        1,
      );
      let room = games.find((g) => g.users.includes(socket.id));
      if (room !== undefined) {
        //console.log(room.users.indexOf(socket.id))
        room.users.splice(room.users.indexOf(socket.id), 1);
        socket.to(room.room).emit("quit");
        if (room.users.length === 0) {
          db.elimina("Game", { id: room.room });
          if (started_games.find((sg) => sg.room === room.room) !== undefined) {
            started_games.splice(
              started_games.findIndex((g) => g.room === room.room),
              1,
            );
            started_round.splice(
              started_round.findIndex((g) => g.room === room.room),
              1,
            );
          }
          games.splice(
            games.findIndex((g) => g.room === room.room),
            1,
          );
        }
      }
      console.log(games);
      console.log(started_games);
      console.log(started_round);
      ////console.log(users_socket);
      //console.log("/n");
    }
  });

  //gesione partita di briscola
  socket.on("start game briscola", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    let dati = await briscola.SetUpGameBriscola(room, await GetCarte());
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
      let index_order = briscola.setOrder(sr, sg);
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
          let punti = briscola.PointBriscola(ista);
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
        started_games.splice(
          started_games.findIndex((s) => s.room === sg.room),
          1,
        );
        started_round.splice(
          started_games.findIndex((s) => s.room === sr.room),
          1,
        );
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

    user.mazzo.push(game.carte_prese);
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
      scopa = { punteggio: punteggio + 1, user: user };
    }
    console.log(sg.taken_card, 222);
    let carte_scopa = [];
    sg.taken_card.forEach((is) => {
      is.mazzo.forEach((element) => {
        element.forEach((el) => {
          carte_scopa.push(el);
        });
      });
    });
    if (carte_scopa.length + game.card.length === 40) {
      if (game.card.length !== 0 && game.preso === true) {
        user.mazzo.push(game.card);
        game.card = [];
      }
      length_card.push({ num: game.carte_prese.length, user: user });
      let punti = punteggi_scopa(game.carte_prese, user);
      console.log(punti, 4444);
      if (punti.find((us) => us.user === user) !== undefined) {
        punti.punteggio += punteggio.punteggio;
        if (scopa !== "" && scopa.find((us) => us.user === user)) {
          let u = scopa.find((us) => us.user === user);
          punti.punteggio += u.punteggio;
        }
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

async function SetUpGameScopa(room) {
  let type = "s";

  let order = room.users.slice(0); //ottiene una lista di socket_id mescolata a caso
  briscola.shuffleArray(order);

  let deck = await GetCarte(); //ottiene una lista di carte (40) mescolate a caso
  briscola.shuffleArray(deck);

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
