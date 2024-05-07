//in questo file è presente il codice javascript per la briscola
//in questo file è presente il codice di scopa
import { getUsers, GetPartite } from "../../src/connection.js";
import {
  render_alert,
  render_utenti,
  render_tavolo,
  render_paritite,
} from "../../src/render.js";
const img = document.getElementById("img");
img.src = "../../assets/card/assoBastoni.png";
const div_prepartita = document.getElementById("pre-game");
const b_listutenti = document.getElementById("utenti_connessi");
const b_createRoom = document.getElementById("createroom");
const n_listpartite = document.getElementById("partite_in_corso");
const tavolo = document.getElementById("tavolo"); //prova, da cancellare
const alert_invite = document.getElementById("alert_invite");
const partitemodal = document.getElementById("partitemodal");
const bodymodal = document.getElementById("bodymodal");
const logout = document.getElementById("logout");

const div_game = document.getElementById("game");

const b_startgame = document.getElementById("startgame");
const b_passturn = document.getElementById("passturn");

let hand;
let socket;

(function () {
  if (
    Cookies.get("username") == undefined &&
    Cookies.get("password") == undefined
  ) {
    location.href = "/Progetto/login.html";
  } else {
    socket = io();
    socket.emit("accesso", Cookies.get("password"), Cookies.get("username"));
  }
})();

let room = socket.id;

socket.on("invited", (utente) => {
  console.log(utente);
  console.log(render_alert(utente));
  alert_invite.innerHTML = render_alert(utente);
  alert_invite.classList.add("show");
  let ba = document.getElementById("button_accept");
  ba.onclick = () => {
    room = utente.room;
    socket.emit("join games", utente.room);
  };
});

socket.on("join user", (list_user) => {
  b_startgame.disabled = false;
  b_startgame.classList.remove("d-none");
  b_startgame.onclick = () => {
    socket.emit("start game briscola", room);
  };
  console.log(list_user);
});

socket.on("draw card", (card) => {
  hand.push(card);
});

socket.on("star", (istance) => {
  console.log(istance);
  hand = istance.hand;
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  render_tavolo(hand, game);
});

socket.on("start turn briscola", () => {
  b_passturn.classList.remove("d-none");
  b_passturn.onclick = () => {
    console.log(hand);
    let pcard = hand[Math.floor(Math.random() * hand.length)];
    hand.splice(hand.indexOf(pcard), 1);
    b_passturn.classList.add("d-none");
    socket.emit("end turn briscola", { room: room, card: pcard });
  };
  //console.log(hand);
});

b_listutenti.onclick = async () => {
  let users = await getUsers();
  console.log(users);
  bodymodal.innerHTML = render_utenti(users.users);
  let buttons = document.querySelectorAll(".invite");
  buttons.forEach((b) => {
    b.onclick = () => {
      if (room !== "") {
        socket.emit("invite user", parseInt(b.value));
      } else {
        alert_invite.innerHTML = render_alert("", "");
        alert_invite.classList.add("show");
        let myModal = new bootstrap.Modal("#listutenti", {});
        myModal.hide();
      }
    };
  });
};

n_listpartite.onclick = async () => {
  let partite = await GetPartite();
  console.log(partite.games);
  partitemodal.innerHTML = render_paritite(partite.games);
};

b_createRoom.onclick = () => {
  b_createRoom.disabled = true;
  room = socket.id;
  socket.emit("join games", room);
};

logout.onclick = () => {
  cookies.set("username", "");
  cookies.set("password", "");
  location.href = "/Progetto/login.html";
};

tavolo.onclick = () => {
  alert_invite.classList.remove("d-block");
  alert_invite.classList.add("d-none");
  render_tavolo(hand, div_game, div_prepartita);
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3
