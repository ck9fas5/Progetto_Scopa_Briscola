//in questo file è presente il codice del server
const db = require("./database.js");
const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const bodyParser = require("body-parser");
const socket = require("socket.io");
const { user } = require("./conf.js");

let users_socket = [];
let games = [];

const GetUser = async () => {
  return await db.getting("User");
};

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use("/", express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
server.listen(80, () => {
  console.log("- server running");
});
const io = new socket.Server(server);

db.createTable();

app.post("login", async (req, res) => {
  let user = db.checkLogin(req.boby.username, req.boby.password);
  console.log(user);
  /*if (user === c'è'){
      res.json({"result":"ok"})
  }else{
    res.json({"result":"errore credenziali"})
  } */
});

app.post("singin", async (req, res) => {
  s = db.insert("User", {
    username: req.boby.username,
    password: req.boby.password,
    status: true,
  });
  console.log(s);
});

app.get("card_get", async (req, res) => {
  let cards = await db.getting("Card");
  res.json({ card: cards });
});

app.get("user_get", async (req, res) => {
  let users = users_socket.map((us) => {
    return us.user;
  });
  console.log(users);
  res.json({ user: users });
});

io.on("connection", (socket) => {
  console.log("new user");

  socket.on("accesso", (password, username) => {
    users = GetUser();
    user = users.find(
      (u) => u.password === password && u.username === username,
    );
  });
  console.log(user);
  users_socket.push({ user: user.id, socket_id: socket.id });

  socket.on("join games", (game) => {
    socket.join(game);
    if (games.find(game) == undefined) {
      games.append(game);
    }
  });

  socket.on("invite user", (utente) => {
    socket_id = users_socket.find((us) => us.user === utente);

    socket.broadcast.to(socket_id.socket_id).emit("ciao"); /*più sicuro*/
    socket.broadcast.to(utente.socket_id).emit("ciao"); /*meno sicuro*/
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
