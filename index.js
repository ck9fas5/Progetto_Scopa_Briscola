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
  console.log(user);
  if (user) {
    res.json({ result: "ok" });
  } else {
    res.json({ result: "unauthorized" });
  }
});

app.post("/singin", async (req, res) => {
  let user = await db.getting("User");
  JSON.stringify(user);
  console.log(
    user.filter(
      (x) =>
        x.username === req.body.username && x.password === req.body.password,
    ).length === 0,
  );
  if (
    user.filter(
      (x) =>
        x.username === req.body.username && x.password === req.body.password,
    ).length === 0
  ) {
    console.log("d");
    let s = db.insert("User", {
      username: req.body.username,
      password: req.body.password,
      status: true,
    });
    res.json({ result: "ok" });
  } else {
    console.log("w");
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
  console.log(users);
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
    if (games.find(game) == undefined) {
      games.append({ room: game, users: [socket.id] });
    } else {
      list_users =
        games[games.indexOf(games.find((g) => g.room === game))].users;
      console.log(list_users);
      list_users.push(socket.id);
      games["users"] = list_users;
    }
    console.log(games);
  });

  socket.on("invite user", (utente) => {
    //console.log(utente);
    senter_user = users_socket.find((us) => us.socket_id === socket.id);
    invited_user = users_socket.find((us) => us.user === utente);
    console.log(isocket_id);
    console.log("");
    room = games.find((g) => g.users.includes(senter_user.socket_id));
    console.log(room.room);
    socket.broadcast
      .to(invited_user.socket_id)
      .emit("invited", senter_user.user);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    users_socket.splice(
      users_socket.indexOf(
        users_socket.find((us) => us.socket_id === socket.id),
      ),
      1,
    );
    console.log(users_socket);
    console.log("");
  });
});
