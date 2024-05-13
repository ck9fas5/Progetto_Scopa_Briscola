//in questo file è presente il codice di scopa
import { getUsers } from "../../src/connection.js";
import {
  render_utenti,
  render_alert,
  render_partite,
  render_tavolo_scopa,
} from "../../src/render.js";
const div_prepartita = document.getElementById("pre-game");
const div_game = document.getElementById("game");
const div_prova = document.getElementById("div_utenti");
const alert_invite = document.getElementById("alert_invite");
const b_startgame = document.getElementById("startgame");
const b_passturn = document.getElementById("passturn");
const logout = document.getElementById("logout");
const button_tavolo = document.getElementById("tavolo");

const giocatore1 = document.getElementById("giocatore_principale");
const giocatore2 = document.getElementById("giocatore2");
const giocatore3 = document.getElementById("giocatore3");
const giocatore4 = document.getElementById("giocatore4");
const deck = document.getElementById("deck");

const link_image = "../assets/card/";
let hand;
let carte_terra;
let room = "";
let users = [
  { id: 1, username: "vale", password: "vale", status: 1 },
  { id: 28, username: "Ck9fas5", password: "12345", status: 1 },
];

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

function tavolo(hand, users, carte_terra) {
  let htmls = render_tavolo_scopa(hand, users, carte_terra);
  if (htmls.length === 1) {
    if (htmls[0].text !== "ok") {
      alert_invite.classList.remove("d-none");
      alert_invite.classList.add("d-block");
      div_prepartita.classList.remove("d-none");
      div_game.classList.remove("d-block");
      div_game.classList.add("d-none");
      alert_invite.innerHTML = risposta.text;
    }
  } else if (htmls.length === 3) {
    //console.log(htmls[0]);
    giocatore1.innerHTML = htmls[0];
    deck.innerHTML = htmls[1];
    giocatore2.innerHTML = htmls[2];
  } else if (htmls.length === 5) {
    giocatore1.innerHTML = htmls[0];
    deck.innerHTML = htmls[1];
    giocatore3.innerHTML = htmls[3];
    giocatore4.innerHTML = htmls[4];
  }
}

function calcola_path(elemento) {
  let path = elemento.src.split("/");
  return "Progetto/assets/card/" + path[path.length - 1];
}

function da_carte_a_terra_a_hand(lista_carte, carta) {
  let c = calcola_path(carta);
  let elemento = "";
  lista_carte.forEach((element) => {
    if (element.path === c) {
      elemento = element;
    }
  });
  return elemento;
}

function fine_turno(
  hand,
  carte_prese,
  carte_terra,
  carta_selezionata,
  carta,
  t,
) {
  if (t == "prese") {
    carte_prese.forEach((el) => {
      let index = carte_terra.indexOf(
        carte_terra.find(
          (carte) => carte.number === el.number && carte.suit === el.suit,
        ),
      );
      carte_terra.splice(index, 1);
    });
  } else if (t == "drop") {
    carte_terra.push(carta_selezionata);
  }
  let car;
  let c = calcola_path(carta);
  hand.forEach((carta, i) => {
    if (carta.path === c) {
      carte_prese.push(carta);
      car = i;
    }
  });
  hand.splice(car, 1);

  socket.emit("end turn scopa", {
    room: room,
    card: carte_terra,
    carte_prese: carte_prese,
  });

  tavolo(hand, users, carte_terra);
  click_carte();
}

async function click_carte() {
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  const carte_a_terra = document.querySelectorAll(".carte_terra");
  let carte_prese = [];
  let drop = document.querySelector(".droppa");
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      carta.classList.add("hover");
      let carta_selezionata = da_carte_a_terra_a_hand(hand, carta);
      console.log(carta_selezionata);
      carte_a_terra.forEach((element) => {
        element.addEventListener("click", () => {
          element.classList.add("hover");
          console.log(da_carte_a_terra_a_hand(carte_terra, element));
          carte_prese.push(da_carte_a_terra_a_hand(carte_terra, element));
          console.log(carte_prese);
          let somma = 0;
          carte_prese.forEach((element) => {
            somma += element.number;
          });
          if (somma === carta_selezionata.number) {
            fine_turno(
              hand,
              carte_prese,
              carte_terra,
              carta_selezionata, //da ,mettere l'elemento di carte_prese
              carta,
              "prese",
            );
          } else if (somma > carta_selezionata.number) {
            element.classList.add("shake");
            element.classList.remove("hover");
          }
        });
        drop.onclick = () => {
          let somme_possibili = somme(carta_selezionata, carte_terra);
          if (somme_possibili.length > 0) {
            //forEach e poi far ingrandire le carte che potrebbe prendere
          } else {
            fine_turno(
              hand,
              carte_prese,
              carte_terra,
              carta_selezionata,
              carta,
              "drop",
            );
          }
        };
      });
    });
  });
}

socket.on("start scopa", (istance) => {
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  console.log(istance);
  hand = istance.hand;
  carte_terra = istance.carte_terra;
  users = istance.order;
  tavolo(hand, users, carte_terra);
});

socket.on("start turn scopa", () => {
  click_carte();
});

document.getElementById("utenti_connessi").onclick = () => {
  render_utenti();
};

document.getElementById("room").onclick = () => {
  socket.emit("join games", room);
};

logout.onclick = () => {
  cookies.set("username", "");
  cookies.set("password", "");
  location.href = "/Progetto/login.html";
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3

button_tavolo.onclick = () => {
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");

  let carte_terra = [
    {
      id: 37,
      number: 6,
      suit: "Bastoni",
      path: "Progetto/assets/card/seiBastoni.png",
    },
    {
      id: 3,
      number: 4,
      suit: "Spade",
      path: "Progetto/assets/card/quattroSpade.png",
    },
    {
      id: 4,
      number: 3,
      suit: "Spade",
      path: "Progetto/assets/card/treSpade.png",
    },
    {
      id: 39,
      number: 8,
      suit: "Bastoni",
      path: "Progetto/assets/card/dBastoni.png",
    },
  ];
  let h = [
    {
      id: 37,
      number: 6,
      suit: "Denari",
      path: "Progetto/assets/card/seiDenari.png",
    },
    {
      id: 38,
      number: 7,
      suit: "Bastoni",
      path: "Progetto/assets/card/setteBastoni.png",
    },
    {
      id: 40,
      number: 9,
      suit: "Bastoni",
      path: "Progetto/assets/card/cBastoni.png",
    },
  ];
  tavolo(h, users, carte_terra);
  click_carte();
};
