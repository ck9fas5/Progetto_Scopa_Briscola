//in questo file è presente il codice di scopa
import { getUsers } from "../../src/connection.js";

const div_prepartita = document.getElementById("pre-game");
const div_game = document.getElementById("game");
const div_prova = document.getElementById("prova");
const alert_invite = document.getElementById("alert_invite");
const b_startgame = document.getElementById("startgame");
const b_passturn = document.getElementById("passturn");

let room = "fhudsxhfierubvhdscvuk";
let hand;

const socket = io();
if (
  Cookies.get("username") == undefined &&
  Cookies.get("password") == undefined
) {
  location.href = "/Progetto/login.html";
}

socket.emit("accesso", Cookies.get("password"), Cookies.get("username"));

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
    socket.emit("start game", room);
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
});

socket.on("start turn", () => {
  b_passturn.classList.remove("d-none");
  b_passturn.onclick = () => {
    console.log(hand);
    let pcard = hand[Math.floor(Math.random() * hand.length)];
    hand.splice(hand.indexOf(pcard), 1);
    b_passturn.classList.add("d-none");
    socket.emit("end turn", { room: room, card: pcard });
  };
  //console.log(hand);
});

const render_alert = (invite) => {
  let alarm_tempalte = `<strong>Sei stato invitato da #USERNAME!</strong>
                      <p class="mb-0">
                          <button type="button" id="button_accept"class="btn btn-outline-success">Accetta</button>
                          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></p>`;
  let html = "";
  html += alarm_tempalte.replace("#USERNAME", invite.username);
  return html;
};

const render_prova = async () => {
  let template = `<div class="row p-1 mb-3 bg-primary">
              <p>#USERID</p>
              <button value="#USERVAL" class="btn btn-primary buto">Invita</button>
            </div>`;
  let html = "";
  let users = await getUsers();
  console.log(users);
  users.users.forEach((u) => {
    html += template
      .replace("#USERID", u.id_user)
      .replace("#USERVAL", u.id_user);
  });
  div_prova.innerHTML = html;
  let buttons = document.querySelectorAll(".buto");
  buttons.forEach((b) => {
    b.onclick = () => {
      socket.emit("invite user", parseInt(b.value));
    };
  });
};

document.getElementById("bprova").onclick = () => {
  render_prova();
};

document.getElementById("room").onclick = () => {
  socket.emit("join games", room);
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3
