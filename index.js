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
let carte_scopa = [];
let punteggio = 0;
let length_card = [];
let l = [];
let punti = [];
let scopa = [];
let ultimi = "";
let deck = [];
let order = [];
let index;

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
  ////console.log(list_user);
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
  //////console.log("- server running");
});
const io = new socket.Server(server);

db.createTable();

app.post("/login", async (req, res) => {
  let user = await db.checkLogin(req.body.username, req.body.password);
  ////////console.log(user);
  if (user) {
    res.json({ result: "ok" });
  } else {
    res.json({ result: "unauthorized" });
  }
});

app.post("/singin", async (req, res) => {
  let user = await db.getting("User");
  JSON.stringify(user);
  /*//////console.log(
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
    ////////console.log("d");
    let s = db.insert("User", {
      username: req.body.username,
      password: req.body.password,
      status: true,
    });
    res.json({ result: "ok" });
  } else {
    ////////console.log("w");
    res.json({ result: "unauthorized" });
  }
});

app.get("/card_get", async (req, res) => {
  let cards = await db.getting("Card");
  res.json({ card: cards });
});

app.get("/user_get/:usernam", async (req, res) => {
  //console.log(req.params.usernam);
  let users = await GetUser("User");
  //////console.log(users);
  let userss = users_socket.map((us) => {
    return {
      username: FindUsername(users, us.user),
      id_user: us.user,
    };
  });

  if (req.params.usernam !== "all") {
    userss = userss.filter((us) => us.username !== req.params.usernam);
  }

  ////////console.log(users);
  res.json({ users: userss });
});

app.get("/game_get", async (req, res) => {
  if (users_socket.length !== 0) {
    let partite = await GetPartite("Game");
    let users = await db.getting("User");
    /*//////console.log(partite);*/
    /*//////console.log(users);*/
    let list_games = [];
    partite.forEach((gm, indi) => {
      let game = games.find((g) => g.room === gm.id);
      let user = [];
      //console.log(game);
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
    //////console.log(list_games);
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
    ////////console.log(user_);
    if (user !== undefined) {
      users_socket.push({ user: user.id, socket_id: socket.id });
      //console.log(users_socket);
      //console.log("/n");
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
      ////////console.log(list_users);
      list_users.push(socket.id);
      ////////console.log(games.indexOf(room));
      games[games.indexOf(room)]["users"] = list_users;
      list_user2 = list_users.slice(0); //creo lista utenti senza il cretore della stanza perchè solo lui può iniziare la partita
      socket.broadcast
        .to(room.users[0])
        .emit("join user", list_user2.splice(0, 1));
    }
    //console.log(games);
    ////console.log("/n");
  });

  socket.on("invite user", async (utente) => {
    ////console.log(utente);
    let users = await GetUser("User");
    let senter_user = users_socket.find((us) => us.socket_id === socket.id);
    let invited_user = users_socket.find((us) => us.user === utente);
    ////console.log(invited_user);
    ////console.log(senter_user);
    ////console.log("");
    let room = games.find((g) => g.users.includes(senter_user.socket_id));
    if (room !== undefined) {
      ////console.log(room.room);
      socket.broadcast.to(invited_user.socket_id).emit("invited", {
        username: FindUsername(users, senter_user.user),
        room: room.room,
      });
      ////console.log("/n");
    }
  });

  socket.on("spectate", (room) => {
    let sg = started_games.find((s) => s.room === room);
    let sr = started_round.find((s) => s.room === room);
    if (sg !== undefined) {
      if (sg.type == "b") {
        sg.spectetor.push(socket.id);
        io.to(socket.id).emit("start watch", {
          order: sr.order,
          briscola: sg.briscola,
          history: sg.list_turncard,
        });
      } else {
        sg.spectetor.push(socket.id);
        //console.log(sg.spectetor);
        io.to(socket.id).emit("start watch scopa", {
          order: sg.order,
          carte_terra: sg.card,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    //////console.log(users_socket.find((us) => us.socket_id === socket.id));
    if (users_socket.find((us) => us.socket_id === socket.id) !== undefined) {
      //////console.log(users_socket[0].socket_id);
      users_socket.splice(
        users_socket.indexOf(
          users_socket.find((us) => us.socket_id === socket.id),
        ),
        1,
      );
      let room = games.find((g) => g.users.includes(socket.id));
      if (room !== undefined) {
        ////console.log(room.users.indexOf(socket.id))
        room.users.splice(room.users.indexOf(socket.id), 1);
        carte_scopa = [];
        punteggio = 0;
        scopa = [];
        punti = [];
        socket.to(room.room).emit("quit");
        if (room.users.length === 0) {
          db.elimina("Game", { id: room.room });
          if (started_games.find((sg) => sg.room === room.room) !== undefined) {
            if (
              started_games[
                started_games.findIndex((g) => g.room === room.room)
              ].type === "b"
            ) {
              started_games.splice(
                started_games.findIndex((g) => g.room === room.room),
                1,
              );
            }
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
      //console.log(games);
      //console.log(started_games);
      //console.log(started_round);
      //////console.log(users_socket);
      ////console.log("/n");
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
    ////console.log(sg, sr);

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
    ////console.log(started_games);
    //////console.log(games);
    ////console.log("/n");
  });

  socket.on("end turn briscola", async (game) => {
    let users = await GetUser("User");
    let sg = started_games.find((s) => s.room === game.room);
    let sr = started_round.find((s) => s.room === game.room);
    if (sg !== undefined) {
      sr.index += 1;
      ////console.log(40 / sr.order.length, sg.list_turncard.length);
      if (sr.index === sr.order.length) {
        //controllo se è finita la mano
        sr.index = 0;
        sg.list_turncard.push(sr.card_played);
        let index_order = briscola.setOrder(sr, sg);
        //console.log(index_order);
        //////console.log(sg.order);
        for (let i = 0; i < index_order; i++) {
          let posi = sr.order[0];
          sr.order.splice(0, 1);
          sr.order.push(posi);
        }
        ////console.log(sr.card_played);
        sg.taken_card[
          sg.taken_card.findIndex((user) => user.user === sr.order[0])
        ].mazzo.push(...sr.card_played);
        ////console.log(sg.taken_card);

        sr.card_played = [];
        io.to(sg.room).emit("updateboard", {
          cards: [],
          deck: sg.deck,
        });
        sg.spectetor.forEach((s) => {
          io.to(s).emit("updateboard", {
            cards: [],
            deck: sg.deck,
          });
        });

        if (sg.list_turncard.length === 40 / sr.order.length) {
          //controllo se è finita la partita
          sr.order.forEach((u) => {
            let ista = sg.taken_card.find((is) => is.user === u);
            let punti = briscola.PointBriscola(ista);
            ista["punti"] = punti;
            //console.log(punti);
            ////console.log(user.mazzo);
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
          //console.log(punteggi);
          io.to(sg.room).emit("fine partita", punteggi);
          sg.spectetor.forEach((s) => {
            io.to(s).emit("fine partita", punteggi);
          });
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
        //console.log(started_games);
        //console.log(started_round);
      } else {
        //passaggio tutno al prossimo giocatore
        sr.order.forEach((u, indi) => {
          ////console.log(indi, sr.index);
          if (indi === sr.index) {
            io.to(u).emit("start_turn_briscola");
          }
        });
      }
    }
    //////console.log("");
  });

  socket.on("update board", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    let sr = started_round.find((s) => s.room === game.room);
    if (sr !== undefined) {
      sr.card_played.push(game.card);
      io.to(sg.room).emit("updateboard", {
        cards: sr.card_played,
        deck: sg.deck,
      });
      sg.spectetor.forEach((s) => {
        io.to(s).emit("updateboard", {
          cards: sr.card_played,
          deck: sg.deck,
        });
      });
    }
  });

  socket.on("update scopa", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    //console.log("f");
    io.to(sg.room).emit("updatescopa", { card: game.card, scopa: scopa });
    sg.spectetor.forEach((s) => {
      io.to(s).emit("updatescopa", { card: game.card, scopa: scopa });
    });
  });

  socket.on("update scopa2", (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    io.to(sg.room).emit("updatescopa2", {
      carte: game.carte,
      carta: game.carta,
    });
  });

  //gestione partita di scopa
  socket.on("start game scopa", async (gameRoom) => {
    console.log(gameRoom, "E");
    let room = games.find((g) => g.room === gameRoom);
    games[games.indexOf(room)]["state"] = true;
    let dati = await SetUpGameScopa(room);
    //console.log(dati);
    let sg = dati.sg;
    if (started_games.find((s) => s.room === sg.room) === undefined) {
      started_games.push(sg);
    }
    console.log(sg, "ey");
    let carte_terra = sg.deck.slice(0, 4);
    sg.card = carte_terra;
    sg.deck.splice(0, 4);
    sg.taken_card.forEach((element) => {
      element.mazzo = [];
    });
    sg.order.forEach((element) => {
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      io.to(element).emit("start scopa", {
        hand: hands,
        hand_2: 3,
        carte_terra: carte_terra,
        order: sg.order,
      });
    });
    io.to(sg.order[0]).emit("start turn scopa");
  });

  socket.on("end turn scopa", async (game) => {
    let sg = started_games.find((s) => s.room === game.room);
    let user = sg.taken_card.find((is) => is.user === sg.order[sg.index]);
    sg.deck = deck;
    sg.order = order;
    console.log(sg, "ee");
    if (game.carte_prese.length > 0) {
      game.carte_prese.forEach((card) => {
        if (card !== "") {
          user.mazzo.push(card);
        }
      });
    }
    sg.card = game.card;
    user.preso = game.preso;
    if (user.preso === true) {
      ultimi = user.user;
    }

    if (game.hand.length === 0) {
      l.push("w");
    }
    sg.taken_card.forEach((us) => {
      us.mazzo.forEach((element) => {
        if (
          carte_scopa.find((e) => e.id === element.id) === undefined &&
          element !== ""
        ) {
          carte_scopa.push(element);
        }
      });
    });

    if (game.card.length === 0 && game.preso === true) {
      if (scopa.find((u) => u.user === user.user) === undefined) {
        scopa.push({
          punteggio: punteggio + 1,
          user: user.user,
          carta: [game.carta_presa],
        });
      } else {
        scopa.find((u) => u.user === user.user).punteggio += 1;
        scopa.find((u) => u.user === user.user).carta.push(game.carta_presa);
      }
    }
    io.to(sg.room).emit("updatescopa", { card: game.card, scopa: scopa });
    sg.spectetor.forEach((s) => {
      io.to(s).emit("updatescopa", { card: game.card, scopa: scopa });
    });
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

    sg.index += 1;
    if (sg.index === sg.order.length) {
      sg.index = 0;
      io.to(sg.order[0]).emit("start turn scopa");
    }
    io.to(sg.order[sg.index]).emit("start turn scopa");
    //console.log(carte_scopa, carte_scopa.length, 222);
    if (carte_scopa.length + game.card.length === 40) {
      let punti_giocatore = [];
      if (game.card.length !== 0) {
        game.card.forEach((element) => {
          let ultimo = sg.taken_card.find((u) => u.user === ultimi);
          if (element !== "") {
            ultimo.mazzo.push(element);
          }
        });
        game.card = [];
      }

      sg.taken_card.forEach((element) => {
        let u = users_socket.find((use) => use.socket_id === element.user);
        length_card.push({ num: element.mazzo.length, user: element.user });
        punti.push(punteggi_scopa(element.mazzo, element.user, u));
      });
      punti.forEach((element) => {
        punti_giocatore.push({ punti: 0, user: element.id });
      });
      //console.log(punti, 4444);
      let p_primiera = 0; //calcolo per sapere chi vince la primiera
      let user_primiera = "";
      punti.forEach((element) => {
        if (element.primiera > p_primiera) {
          p_primiera = element.primiera;
          user_primiera = element.id;
        }
      });
      //console.log(user_primiera, "primiera");
      let p_denari = 0; //calcolo per sapere chi vince i denari
      let user_denari = "";
      punti.forEach((element) => {
        if (element.denari.length === p_denari) {
          user_denari = "";
        } else if (element.denari.length > p_denari) {
          p_denari = element.denari.length;
          user_denari = element.id;
        }
      });
      //console.log(user_denari, "denari");
      let p_carte = 0; //calcolo per sapere chi vince le carte
      let user_carte = "";
      //console.log(length_card, "e");
      length_card.forEach((element) => {
        if (element.num === p_carte) {
          user_carte = "";
        } else if (element.num > p_carte) {
          p_carte = element.num;
          user_carte = element.user;
        }
      });

      punti.forEach((element) => {
        if (element.id === user_primiera) {
          punti_giocatore.find((el) => el.user === user_primiera).punti += 1;
          //console.log("primiera:", user_primiera);
        }
        if (element.id === user_denari) {
          punti_giocatore.find((el) => el.user === user_denari).punti += 1;
          //console.log("denari:", user_denari);
        }
        if (element.user === user_carte) {
          let user_carte1 = punti.find((us) => us.user === user_carte);
          punti_giocatore.find((el) => el.user === user_carte1.id).punti += 1;
          //console.log("carte:", user_carte1);
        }
        if (element.sette_bello === true) {
          punti_giocatore.find((el) => el.user === element.id).punti += 1;
          //console.log("sette bello:", element.id);
        }
        if (scopa.find((u) => u.user === element.user) !== undefined) {
          punti_giocatore.find((el) => el.user === element.id).punti +=
            scopa.find((u) => u.user === element.user).punteggio;
        }
      });
      carte_scopa = [];
      io.to(sg.room).emit("fine partita", {
        punti: punti_giocatore,
        categorie: punti,
        scope: scopa,
        carte: length_card,
      });
    }
  });

  socket.on("reset", async (game) => {
    console.log(game.room, "!23!");
    if (game.punti.find((el) => el.punti === 11) !== undefined) {
      started_games.splice(
        started_games.findIndex((g) => g.room === game.room),
        1,
      );
      socket.to(game.room).emit("quit");
    } else {
      carte_scopa = [];
      punteggio = 0;
      length_card = [];
      l = [];
      punti = [];
      scopa = [];
      ultimi = "";
      let sg = started_games.find((s) => s.room === game.room);
      sg.taken_card.forEach((element) => {
        element.mazzo = [];
      });
    }
  });
});

async function SetUpGameScopa(room) {
  let type = "s";

  order = room.users.slice(0); //ottiene una lista di socket_id mescolata a caso
  briscola.shuffleArray(order);

  deck = await GetCarte(); //ottiene una lista di carte (40) mescolate a caso
  briscola.shuffleArray(deck);

  index = 0; //variabile che scandisce l'ordine del gioco perchè usata per emettere evento star turn
  let taken_card = order.map((p) => ({ user: p, mazzo: [], preso: false })); //crea i "mazzetti di ogni giocatore"

  let sg = {
    type: type,
    room: room.room,
    deck: deck,
    taken_card: taken_card,
    card: [],
    order: order,
    spectetor: [],
    index: index,
  }; //crea oggetto sg (started games) il quale contiene tutte gli attributo di una partita come
  // il mazzo, gli utenti, i mazzetti

  return { sg: sg };
} //funzione che inizializa le variabili fondamentali per la partit

function calcola_primiera(carte) {
  let carte_per_seme = [
    { Denari: [] },
    { Coppe: [] },
    { Bastoni: [] },
    { Spade: [] },
  ];
  let punti_primiera = 0;
  carte.forEach((element) => {
    if (element.number === 7) {
      if (element.suit === "Denari") {
        carte_per_seme[0].Denari.push(element.number);
      }
      if (element.suit === "Coppe") {
        carte_per_seme[1].Coppe.push(element.number);
      }
      if (element.suit === "Bastoni") {
        carte_per_seme[2].Bastoni.push(element.number);
      }
      if (element.suit === "Spade") {
        carte_per_seme[3].Spade.push(element.number);
      }
    } else if (element.number === 6) {
      if (element.suit === "Denari") {
        carte_per_seme[0].Denari.push(element.number);
      }
      if (element.suit === "Coppe") {
        carte_per_seme[1].Coppe.push(element.number);
      }
      if (element.suit === "Bastoni") {
        carte_per_seme[2].Bastoni.push(element.number);
      }
      if (element.suit === "Spade") {
        carte_per_seme[3].Spade.push(element.number);
      }
    } else if (element.number === 1) {
      if (element.suit === "Denari") {
        carte_per_seme[0].Denari.push(4);
      }
      if (element.suit === "Coppe") {
        carte_per_seme[1].Coppe.push(4);
      }
      if (element.suit === "Bastoni") {
        carte_per_seme[2].Bastoni.push(4);
      }
      if (element.suit === "Spade") {
        carte_per_seme[3].Spade.push(4);
      }
    }
  });
  carte_per_seme.forEach((element, i) => {
    if (i === 0) {
      if (element.Denari.length > 0) {
        punti_primiera += element.Denari[0];
      }
    } else if (i === 1) {
      if (element.Coppe.length > 0) {
        punti_primiera += element.Coppe[0];
      }
    } else if (i === 2) {
      if (element.Bastoni.length > 0) {
        punti_primiera += element.Bastoni[0];
      }
    } else if (i === 3) {
      if (element.Spade.length > 0) {
        punti_primiera += element.Spade[0];
      }
    }
  });
  return punti_primiera;
}

function punteggi_scopa(carte_giocatore, user, u) {
  let sette_bello = false;
  let Denari = [];
  let primiera = calcola_primiera(carte_giocatore);
  carte_giocatore.forEach((el) => {
    if (el.suit === "Denari" && el.number === 7) {
      sette_bello = true;
    }
    if (el.suit === "Denari") {
      Denari.push(el.number);
    }
  });

  return {
    user: user,
    id: u.user,
    sette_bello: sette_bello,
    denari: Denari,
    primiera: primiera,
  };
}

/*
  { seme: "Bastoni", valore: "9", path: "Progetto/assets/card/cBastoni.png" },
*/
