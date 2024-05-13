//in questo file è presente il codice javascript per la briscola
//in questo file è presente il codice di scopa
import { getUsers, GetPartite, getCard } from "../../src/connection.js";
import {
  render_alert,
  render_utenti,
  render_partite,
  render_tavolo,
  render_playerCard,
  render_turno,
  render_board,
} from "../../src/render.js";

const div_prepartita = document.getElementById("pre-game");
const b_listutenti = document.getElementById("utenti_connessi");
const b_createRoom = document.getElementById("createroom");
const n_listpartite = document.getElementById("partite_in_corso");
const alert_invite = document.getElementById("alert_invite");
const partitemodal = document.getElementById("partitemodal");
const bodymodal = document.getElementById("bodymodal");
const logout = document.getElementById("logout");
const tavolo_button = document.getElementById("tavolo");
const div_game = document.getElementById("game");
const b_startgame = document.getElementById("startgame");

const giocatore1 = document.getElementById("giocatore_principale");
const giocatore2 = document.getElementById("giocatore2");
const giocatore3 = document.getElementById("giocatore3");
const giocatore4 = document.getElementById("giocatore4");
const div_briscola = document.getElementById("briscola");
const played_card = document.getElementById("played_card");
const deck = document.getElementById("deck");
const b_passturn = document.getElementById("passturn");

let socket;
let users;
let hand;
let room = "";

(async function () {
  if (
    Cookies.get("username") == undefined &&
    Cookies.get("password") == undefined
  ) {
    location.href = "/Progetto/login.html";
  } else {
    socket = io();
    socket.emit("accesso", Cookies.get("password"), Cookies.get("username"));
    let list_card = await getCard();
    console.log(list_card);
    let path = list_card.card[0].path.split("/");
  }
})();

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

socket.on("draw card", async (data) => {
  hand.push(data.card);
  giocatore1.innerHTML = render_playerCard(hand);
});

socket.on("star", async (istance) => {
  console.log("jdsk.j");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  console.log(istance);
  let briscola = istance.briscola;
  hand = istance.hand;
  let users = istance.order;
  tavolo(hand, users, briscola);
});

socket.on("updateboard", (cards) => {
  let html = render_board(cards);
  played_card.innerHTML = html;
});

socket.on("start_turn_briscola", () => {
  //updte gio giocatore
  console.log("dio");
  click_carte();
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
  partitemodal.innerHTML = render_partite(partite.games);
};

b_createRoom.onclick = () => {
  b_createRoom.disabled = true;
  let hash = CryptoJS.SHA256(socket.id);
  let hashInHex = hash.toString(CryptoJS.enc.Hex);
  room = hashInHex;
  socket.emit("join games", hashInHex);
};

logout.onclick = () => {
  cookies.set("username", "");
  cookies.set("password", "");
  location.href = "/Progetto/login.html";
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3
tavolo_button.onclick = () => {
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  let users = [
    { id: 1, username: "vale", password: "vale", status: 1 },
    { id: 28, username: "Ck9fas5", password: "12345", status: 1 },
  ];
  let h = [
    {
      id: 2,
      number: 1,
      suit: "Spade",
      path: "Progetto/assets/card/assoSpade.png",
    },
    {
      id: 3,
      number: 2,
      suit: "Spade",
      path: "Progetto/assets/card/dueSpade.png",
    },
    {
      id: 4,
      number: 3,
      suit: "Spade",
      path: "Progetto/assets/card/treSpade.png",
    },
  ];
  tavolo(h, users, {
    id: 11,
    number: 10,
    suit: "Spade",
    path: "Progetto/assets/card/rSpade.png",
  });
  click_carte(h);
};

function tavolo(hand, users, briscola) {
  console.log(users);
  let user_card = render_playerCard(hand);
  let htmls = render_tavolo(users, briscola);
  console.log(htmls);
  if (htmls.length === 1) {
    if (htmls[0].text !== "ok") {
      alert_invite.classList.remove("d-none");
      alert_invite.classList.add("d-block");
      div_prepartita.classList.remove("d-none");
      div_game.classList.remove("d-block");
      div_game.classList.add("d-none");
      alert_invite.innerHTML = risposta.text;
    }
  } else {
    giocatore1.innerHTML = user_card;
    div_briscola.innerHTML = htmls[0];
    deck.innerHTML = htmls[1];
    giocatore2.innerHTML = htmls[2];
    if (htmls.length === 5) {
      giocatore3.innerHTML = htmls[3];
      giocatore4.innerHTML = htmls[4];
    }
  }
}

function click_carte() {
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  console.log(carte_giocatore);
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      console.log(carta);
      let path = carta.src.split("/");
      let src = path[path.length - 1];
      let card = hand.find(
        (c) => c.path.split("/")[c.path.split("/").length - 1] === src,
      );
      console.log(card);
      hand.splice(
        hand.findIndex((c) => c.suit === card.suit && c.number === card.number),
        1,
      );
      socket.emit("update board", { room: room, card: card });
      giocatore1.innerHTML = render_playerCard(hand);
      setTimeout(() => {
        socket.emit("end turn briscola", { room: room, card: card });
      }, 2000);

      //giocatore
      console.log("carta giocata", src);
    });
  });
}
