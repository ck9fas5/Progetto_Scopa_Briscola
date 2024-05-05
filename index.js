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
  let users = users_socket.map((us) => {
    return { id_user: us.user };
  });
  //console.log(users);
  res.json({ users: users });
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

  socket.on("start game", async (game) => {
    let room = games.find((g) => g.room === game);
    games[games.indexOf(room)]["state"] = true;
    sg = await SetUpGame(room);
    started_games.push(sg);
    sg.order.forEach((u, indi) => {
      let hands = sg.deck.slice(0, 3);
      sg.deck.splice(0, 3);
      if (indi === 0) {
        io.to(u).emit("star", { hand: hands, briscola: sg.briscola }); //evento che lato client setapera il terreno di gioco 
        io.to(u).emit("start turn"); //avento che da inizio al turno
      } else {
        io.to(u).emit("star", { hand: hands, briscola: sg.briscola });
      }
    });
    console.log(started_games);
    console.log(games);
    console.log("");
  });

  socket.on("end turn", (game) => {
    let sg = started_games.find((s) => s.room.room === game.room);
    /*console.log(
      started_games.find((s) => s.room.room === game.room) !== undefined,
    );*/
    sg.playedcard[sg.playedcard.length - 1].push(game.card);
    sg.index += 1;
    if (sg.deck.length === 0) { //controllo sbagliato per il fine partita
      console.log("fine partita");
      sg.playedcard.forEach((pc) => {
        console.log(pc);
      });
      console.log(sg.deck);
    } else if (sg.index === sg.order.length) { //controllo se è finita la mano
      sg.index = 0;
      playedcard = sg.playedcard[sg.playedcard.length - 1];

      sg.playedcard.push([]);
      //funzione che capisce a chi va la mano
      sg.order.forEach((u, indi) => {
        let card = sg.deck.slice(0, 1);
        sg.deck.splice(0, 1);
        io.to(u).emit("draw card", card[0]);
        if (indi === sg.index) {
          io.to(u).emit("start turn");
        }
      });
      console.log(playedcard);
      console.log(started_games);
    } else {  //passaggio tutno al prossimo giocatore
      sg.order.forEach((u, indi) => {
        if (indi === sg.index) {
          io.to(u).emit("start turn");
        }
      });
    }
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
