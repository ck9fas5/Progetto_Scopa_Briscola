//in questo file è presente il codice del server
const db = require("./database.js");
const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const socket = require("socket.io");
const { user } = require("./conf.js");
const { start } = require("repl");
const { setDefaultResultOrder } = require("dns");

let users_socket = [];
let games = [];
let started_games = [];

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

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use("/", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
server.listen(3000, () => {
  //console.log("- server running");
});
const io = new socket.Server(server);

db.createTable();

app.post("/login", async (req, res) => {
  let user = await db.checkLogin(req.body.username, req.body.password);
  ////console.log(user);
  if (user) {
    res.json({ result: "ok" });
  } else {
    res.json({ result: "unauthorized" });
  }
});

app.post("/singin", async (req, res) => {
  let user = await db.getting("User");
  JSON.stringify(user);
  /*//console.log(
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
    ////console.log("d");
    let s = db.insert("User", {
      username: req.body.username,
      password: req.body.password,
      status: true,
    });
    res.json({ result: "ok" });
  } else {
    ////console.log("w");
    res.json({ result: "unauthorized" });
  }
});

app.get("/card_get", async (req, res) => {
  let cards = await db.getting("Card");
  res.json({ card: cards });
});

app.get("/user_get", async (req, res) => {
  let users = await GetUser("User");
  //console.log(users);
  let userss = users_socket.map((us) => {
    return {
      username: users.find((u) => u.id === us.user).username,
      id_user: us.user,
    };
  });
  ////console.log(users);
  res.json({ users: userss });
});

app.get("/game_get", async (req, res) => {
  if (users_socket.length !== 0) {
    let partite = await GetPartite("Game");
    let users = await db.getting("User");
    /*//console.log(partite);*/
    /*//console.log(users);*/
    let list_games = [];
    partite.forEach((gm, indi) => {
      let game = games.find((g) => g.room === gm.id);
      let user = [];
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
    //console.log(list_games);
    res.json({ games: list_games });
  }
});

io.on("connection", (socket) => {
  //console.log("new user");

  socket.on("accesso", async (password, username) => {
    let users = await GetUser("User");
    //console.log(users, password, username);
    let user = users.find(
      (u) => u.password === password && u.username === username,
    );
    ////console.log(user_);
    if (user !== undefined) {
      users_socket.push({ user: user.id, socket_id: socket.id });
      console.log(users_socket);
      console.log("/n")
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
      ////console.log(list_users);
      list_users.push(socket.id);
      ////console.log(games.indexOf(room));
      games[games.indexOf(room)]["users"] = list_users;
      list_user2 = list_users.slice(0); //creo lista utenti senza il cretore della stanza perchè solo lui può iniziare la partita
      socket.broadcast
        .to(room.users[0])
        .emit("join user", list_user2.splice(0, 1));
    }
    console.log(games);
    console.log("/n")
  });

  socket.on("invite user", (utente) => {
    ////console.log(utente);
    let senter_user = users_socket.find((us) => us.socket_id === socket.id);
    let invited_user = users_socket.find((us) => us.user === utente);
    //console.log(invited_user);
    //console.log("");
    let room = games.find((g) => g.users.includes(senter_user.socket_id));
    if (room !== undefined) {
      //console.log(room.room);
      socket.broadcast
        .to(invited_user.socket_id)
        .emit("invited", { username: senter_user.user, room: room.room });
      console.log("/n")
    }
  });

  socket.on("disconnect", () => {
    //console.log("user disconnected");
    //console.log(users_socket.find((us) => us.socket_id === socket.id));
    if (users_socket.find((us) => us.socket_id === socket.id) !== undefined) {
      //console.log(users_socket[0].socket_id);
      users_socket.splice(
        users_socket.indexOf(
          users_socket.find((us) => us.socket_id === socket.id),
        ),
        1,
      );
    }
    //console.log(users_socket);
    console.log("/n")
  });

  socket.on("start game briscola", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    sg = await SetUpGameBriscola(room);
    started_games.push(sg);
    sg.order.forEach((u, indi) => {
      ////console.log(u);
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      io.to(u).emit("star", {
        hand: hands,
        briscola: sg.briscola,
        order: sg.order,
      });
    });
    io.to(sg.order[0]).emit("start_turn_briscola");
    console.log(started_games);
    //console.log(games);
    console.log("/n")
  });

  socket.on("end turn briscola", (game) => {
    let sg = started_games.find((s) => s.room.room === game.room);
    /*//console.log(
      started_games.find((s) => s.room.room === game.room) !== undefined,
    );*/
    sg.playedcard[sg.playedcard.length - 1].push(game.card);
    sg.index += 1;
    if (sg.deck.length === 0) {
      //controllo sbagliato per il fine partita
      //console.log("fine partita");
      sg.playedcard.forEach((pc) => {
        //console.log(pc);
      });
      let punteggio = punteggi_briscola(playedcard, order);
      //console.log(sg.deck);
    }
    else if (sg.index === sg.order.length) {
      //controllo se è finita la mano
      sg.index = 0;
      let index_order = SetOrder(sg);
      console.log(index_order);
      //console.log(sg.order);
      for (let i = 0; i < index_order; i++) {
        let posi = sg.order[0];
        sg.order.splice(0, 1);
        sg.order.push(posi);
      }
      console.log(sg.order);

      sg.playedcard.push([]);

      //funzione che capisce a chi va la mano
      sg.order.forEach((u, indi) => {
        let card = sg.deck.slice(0, 1);
        sg.deck.splice(0, 1);
        io.to(u).emit("draw card", { card: card[0], game: sg });
        if (indi === sg.index) {
          io.to(u).emit("start_turn_briscola");
        }
      });
      //console.log(started_games);
    } else {
      //passaggio tutno al prossimo giocatore
      sg.order.forEach((u, indi) => {
        if (indi === sg.index) {
          io.to(u).emit("start_turn_briscola");
        }
      });
    }
    //console.log("");
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

  let order = room.users.slice(0);
  shuffleArray(order);

  let deck = await GetCarte();
  shuffleArray(deck);

  let briscola = deck[deck.length - 1];

  let taken_card = [];

  let index = 0;

  let sg = {
    type: type,
    room: room, //o intera istanza o room.room
    order: order,
    deck: deck,
    taken_card: taken_card,
    briscola: briscola,
    hands: "", //da capire se serve
    playedcard: [[]],
    index: 0,
  };
  return sg;
} //crea oggetto started_game (sg) il quale sarà quello che salvera tutii i dati della partita

function SetOrder(game) {
  let playedcard = game.playedcard[game.playedcard.length - 1];
  console.log(playedcard);
  let card_briscola = playedcard.filter(
    (card) => card.suit === game.briscola.suit,
  );

  if (card_briscola.length === 0) {
    let mometum_briscola = playedcard[0];
    card_briscola = playedcard.filter(
      (card) => card.suit === mometum_briscola.suit,
    );
    //console.log(card_briscola);
    if (card_briscola.length === 1) {
      return 0;
    } else {
      if (card_briscola.find((c) => parseInt(c.number) === 1) !== undefined) {
        let index = playedcard.findIndex(
          (c) => c.suit === mometum_briscola.suit && parseInt(c.number) == 1,
        );
        ////console.log(index);
        return index;
      } else if (
        card_briscola.find((c) => parseInt(c.number) === 3) !== undefined
      ) {
        let index = playedcard.findIndex(
          (c) => c.suit === mometum_briscola.suit && parseInt(c.number) == 3,
        );
        ////console.log(index);
        return index;
      } else {
        let high_card = card_briscola.find(
          (c) =>
            parseInt(c.number) ===
            Math.max(...card_briscola.map((ca) => ca.number)),
        );
        ////console.log(high_card);
        let index = playedcard.findIndex(
          (c) =>
            c.suit === high_card.suit && parseInt(c.number) == high_card.number,
        );
        ////console.log(index);
        return index;
      }
    }
  } else {
    let high_card = card_briscola.find(
      (c) =>
        parseInt(c.number) ===
        Math.max(...card_briscola.map((ca) => ca.number)),
    );
    //console.log(high_card);
    let index = playedcard.findIndex(
      (c) => c.suit === high_card.suit && c.number == high_card.number,
    );
    ////console.log(index);
    return index;
  }
}

/*//console.log(
  SetOrder({
    playedcard: [
      [
        
        { suit: "Denari", number: "1" },
        { suit: "Coppe", number: "7" },
        { suit: "Denari", number: "3" },
        { suit: "Coppe", number: "8" },
      ],
    ],
    briscola: { suit: "Spade", number: "2" },
  }),
); //se c'è una briscola funziona*/

let punti_briscola = [
  { valore: 1, punteggio: 11 },
  { valore: 2, punteggio: 0 },
  { valore: 3, punteggio: 10 },
  { valore: 4, punteggio: 0 },
  { valore: 5, punteggio: 0 },
  { valore: 6, punteggio: 0 },
  { valore: 7, punteggio: 0 },
  { valore: 8, punteggio: 2 },
  { valore: 9, punteggio: 3 },
  { valore: 10, punteggio: 4 },
];

function punteggi_briscola(carte, ordine) {
  let punteggio = 0;
  let punteggi;
  let carte_giocatore = [];
  ordine.users.forEach((element) => {
    carte_giocatore = carte.filter((c) => c.user === element);
    carte_giocatore.forEach((el) => {
      punti_briscola.filter((p) => p.valore === el.valore);
      punti_briscola.forEach((v) => {
        punteggio += v.punteggio;
        punteggi = { punteggio: punteggio, user: element };
      });
    });
  });
  return punteggi;
}

function calcola_primiera(primiera, n, punteggio, numero) {
  let semi = ["bastoni", "ori", "spade", "coppe"];
  primiera.forEach((carta) => {
    semi.splice(semi[carta.seme], 1);
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

function punteggi_scopa(carte, ordine) {
  let punteggio = 0;
  let punteggi;
  let l = 0;
  let p;
  let carte_giocatore = [];
  ordine.users.forEach((element) => {
    carte_giocatore = carte.filter((c) => c.user === element);
    carte_giocatore.forEach((el) => {
      let primiera = carte_giocate.filter((v) => v.valore === "7");
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
      if (carte_giocatore.length > l) {
        l = element;
      }
    });
  });
  let cart = ordine.users.find((c) => c == l);
  return punteggi;
}

/*
  { seme: "Bastoni", valore: "9", path: "Progetto/assets/card/cBastoni.png" },
*/
