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

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use("/", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
server.listen(3000, () => {
  console.log("- server running");
});
const io = new socket.Server(server);

db.createTable();

app.post("/login", async (req, res) => {
  let user = await db.checkLogin(req.body.username, req.body.password);
  //console.log(user);
  if (user) {
    res.json({ result: "ok" });
  } else {
    res.json({ result: "unauthorized" });
  }
});

app.post("/singin", async (req, res) => {
  let user = await db.getting("User");
  JSON.stringify(user);
  /*console.log(
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
    //console.log("d");
    let s = db.insert("User", {
      username: req.body.username,
      password: req.body.password,
      status: true,
    });
    res.json({ result: "ok" });
  } else {
    //console.log("w");
    res.json({ result: "unauthorized" });
  }
});

app.get("/card_get", async (req, res) => {
  let cards = await db.getting("Card");
  res.json({ card: cards });
});

app.get("/user_get", async (req, res) => {
  let users = await GetUser("User");
  console.log(users);
  let userss = users_socket.map((us) => {
    return {
      username: users.find((u) => u.id === us.user).username,
      id_user: us.user,
    };
  });
  //console.log(users);
  res.json({ users: userss });
});

app.get("/game_get", async (req, res) => {
  let gam = await GetPartite("Game");
  let users = await db.getting("User");
  console.log(gam);
  console.log(users);
  let gams = [];
  let use = [];
  gam.forEach((gm, indi) => {
    let game = games.find((g = g.room === gm.id));
    let use = [];
    game.users.forEach((u, indi) => {
      use.push(
        use.find(
          (use) => use.id === users_socket.find((us) => us.socket_id === u).id,
        ).username,
      );
    });
    console.log(use);
    gams.push({ game: game, users: use });
  });
  console.log(gams);
  res.json({ games: gams });
});

io.on("connection", (socket) => {
  console.log("new user");

  socket.on("accesso", async (password, username) => {
    let users = await GetUser("User");
    //console.log(users, password, username);
    let user_ = users.find(
      (u) => u.password === password && u.username === username,
    );
    //console.log(user_);
    users_socket.push({ user: user_.id, socket_id: socket.id });
    console.log(users_socket);
  });

  socket.on("join games", (game) => {
    socket.join(game);
    if (games.find((g) => g.room === game) === undefined) {
      games.push({ room: game, users: [socket.id], state: false });
      db.insert("Game",{id:game,})
    } else {
      let room = games.find((g) => g.room === game);
      list_users = room.users;
      console.log(list_users);
      list_users.push(socket.id);
      //console.log(games.indexOf(room));
      games[games.indexOf(room)]["users"] = list_users;
      list_user2 = list_users.slice(0); //creo lista utenti senza il cretore della stanza perchè solo lui può iniziare la partita
      socket.broadcast
        .to(room.users[0])
        .emit("join user", list_user2.splice(0, 1));
    }
    console.log(games);
    console.log("");
  });

  socket.on("invite user", (utente) => {
    //console.log(utente);
    let senter_user = users_socket.find((us) => us.socket_id === socket.id);
    let invited_user = users_socket.find((us) => us.user === utente);
    console.log(invited_user);
    console.log("");
    let room = games.find((g) => g.users.includes(senter_user.socket_id));
    console.log(room.room);
    socket.broadcast
      .to(invited_user.socket_id)
      .emit("invited", { username: senter_user.user, room: room.room });
    console.log("");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    console.log(users_socket.find((us) => us.socket_id === socket.id));
    if (users_socket.find((us) => us.socket_id === socket.id) !== undefined) {
      console.log(users_socket[0].socket_id);
      users_socket.splice(
        users_socket.indexOf(
          users_socket.find((us) => us.socket_id === socket.id),
        ),
        1,
      );
    }
    console.log(users_socket);
    console.log("");
  });

  socket.on("start game briscola", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    sg = await SetUpGame(room);
    started_games.push(sg);
    sg.order.forEach((u, indi) => {
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      if (indi === 0) {
        io.to(u).emit("star", { hand: hands, briscola: sg.briscola }); //evento che lato client setapera il terreno di gioco
        io.to(u).emit("start turn briscola");
      } else {
        io.to(u).emit("star", { hand: hands, briscola: sg.briscola });
      }
    });
    console.log(started_games);
    console.log(games);
    console.log("");
  });

  socket.on("end turn briscola", (game) => {
    let sg = started_games.find((s) => s.room.room === game.room);
    /*console.log(
      started_games.find((s) => s.room.room === game.room) !== undefined,
    );*/
    sg.playedcard[sg.playedcard.length - 1].push(game.card);
    sg.index += 1;
    if (sg.deck.length === 0) {
      //controllo sbagliato per il fine partita
      console.log("fine partita");
      sg.playedcard.forEach((pc) => {
        console.log(pc);
      });
      let punteggio = punteggi_briscola(playedcard, order);
      console.log(sg.deck);
    } else if (sg.index === sg.order.length) {
      //controllo se è finita la mano
      sg.index = 0;
      playedcard = sg.playedcard[sg.playedcard.length - 1];
      calcolo_ordine();
      sg.playedcard.push([]);

      //funzione che capisce a chi va la mano
      sg.order.forEach((u, indi) => {
        let card = sg.deck.slice(0, 1);
        sg.deck.splice(0, 1);
        io.to(u).emit("draw card", card[0]);
        if (indi === sg.index) {
          io.to(u).emit("start turn briscola");
        }
      });
      console.log(playedcard);
      console.log(started_games);
    } else {
      //passaggio tutno al prossimo giocatore
      sg.order.forEach((u, indi) => {
        if (indi === sg.index) {
          io.to(u).emit("start turn briscola");
        }
      });
    }
    console.log("");
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

async function SetUpGame(room) {
  let order = room.users.slice(0);
  shuffleArray(order);

  let deck = prova_deck;
  shuffleArray(deck);

  let briscola = deck[deck.length - 1].seme;

  let index = 0;

  let sg = {
    room: room, //o intera istanza o room.room
    order: order,
    deck: deck,
    briscola: briscola,
    hands: "", //da capire se serve
    playedcard: [[]],
    index: 0,
  };
  return sg;
} //crea oggetto started_game (sg) il quale sarà quello che salvera tutii i dati della partita

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

  return punteggi;
}

function calcolo_ordine(carte, briscola) {}

let prova_deck = [
  { seme: "Cuori", valore: "1" },
  { seme: "Cuori", valore: "2" },
  { seme: "Cuori", valore: "3" },
  { seme: "Cuori", valore: "4" },
  { seme: "Cuori", valore: "5" },
  { seme: "Cuori", valore: "6" },
  { seme: "Cuori", valore: "7" },
  { seme: "Cuori", valore: "8" },
  { seme: "Cuori", valore: "9" },
  { seme: "Cuori", valore: "10" },
  // Aggiungi altre carte di Cuori...
  { seme: "Quadri", valore: "1" },
  { seme: "Quadri", valore: "2" },
  { seme: "Quadri", valore: "3" },
  { seme: "Quadri", valore: "4" },
  { seme: "Quadri", valore: "5" },
  { seme: "Quadri", valore: "6" },
  { seme: "Quadri", valore: "7" },
  { seme: "Quadri", valore: "8" },
  { seme: "Quadri", valore: "9" },
  { seme: "Quadri", valore: "10" },
  // Aggiungi altre carte di Quadri...
  { seme: "Fiori", valore: "1" },
  { seme: "Fiori", valore: "2" },
  { seme: "Fiori", valore: "3" },
  { seme: "Fiori", valore: "4" },
  { seme: "Fiori", valore: "5" },
  { seme: "Fiori", valore: "6" },
  { seme: "Fiori", valore: "7" },
  { seme: "Fiori", valore: "8" },
  { seme: "Fiori", valore: "9" },
  { seme: "Fiori", valore: "1" },
  // Aggiungi altre carte di Fiori...
  { seme: "Picche", valore: "1" },
  { seme: "Picche", valore: "2" },
  { seme: "Picche", valore: "3" },
  { seme: "Picche", valore: "4" },
  { seme: "Picche", valore: "5" },
  { seme: "Picche", valore: "6" },
  { seme: "Picche", valore: "7" },
  { seme: "Picche", valore: "8" },
  { seme: "Picche", valore: "9" },
  { seme: "Picche", valore: "10" },
  // Aggiungi altre carte di Picche...
]; //mazzo provissorio in attesa di quello vero
