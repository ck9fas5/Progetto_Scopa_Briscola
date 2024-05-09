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

async function click_carte(hand, carte_terra) {
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  const carte_a_terra = document.querySelectorAll(".carte_terra");
  console.log(carte_a_terra);
  let carte_prese = [];
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      carta.classList.add("hover");

      carte_terra.forEach((card) => {
        let c = hand.filter((ca) => carta.number == card.number);
        console.log(c);
        if (c.length > 0) {
          c.forEach((element) => {
            let index = carte_terra.indexOf(
              carte_terra.find(
                (carte) =>
                  carte.number === element.number &&
                  carte.suit === element.suit,
              ),
            );
            console.log(index);
            carte_a_terra[index].classList.add("hover");
            carte_a_terra[index].addEventListener("click", () => {
              carte_prese.push(element);
              carte_terra.splice(index, 1);
              let path = carta.src.split("/");
              let src = link_image + path[path.length - 1];
              let c = "Progetto/assets/card/" + path[path.length - 1];
              let car;
              hand.forEach((carta, i) => {
                if (carta.path === c) {
                  car = i;
                }
              });
              hand.splice(car, 1);
              console.log(carte_terra);
              //socket.emit("end turn scopa", { room: room, card: src });
              console.log("carta giocata", src);
              tavolo(hand, users, carte_terra);
              click_carte(hand, carte_terra);
            });
          });
        } else {
          carte_a_terra.forEach((element) => {
            element.addEventListener("click", () => {
              element.classList.add("hover");
              let path = element.src.split("/");
              let src = "Progetto/assets/card/" + path[path.length - 1];
              carte_prese.push(carte_terra.find((carte) => carte.path === src));
              console.log(carte_prese);
              if (
                carte_prese.reduce((acc, curr) => acc + curr) === carta.number
              ) {
                carte_prese.forEach((element) => {
                  let index = carte_terra.indexOf(
                    carte_terra.find(
                      (carte) =>
                        carte.number === element.number &&
                        carte.suit === element.suit,
                    ),
                  );
                  carte_terra.splice(index, 1);
                });
                let path = carta.src.split("/");
                let src = link_image + path[path.length - 1];
                let c = "Progetto/assets/card/" + path[path.length - 1];
                let car;
                hand.forEach((carta, i) => {
                  if (carta.path === c) {
                    car = i;
                  }
                });
                hand.splice(car, 1);
                console.log(carte_terra);
                //socket.emit("end turn scopa", { room: room, card: src });
                console.log("carta giocata", src);
                tavolo(hand, users, carte_terra);
                click_carte(hand, carte_terra);
              } else {
                element.classList.remove("hover");
                element.classList.add("rotazione");
                console.log("dd")
              }
            });
          });
        }
      });
    });
    console.log(carte_prese);
  });
}

socket.on("star", (istance) => {
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  console.log(istance);
  briscola = istance.briscola;
  hand = istance.hand;
  let users = istance.order;
  tavolo(hand, users, carte_terra);
  click_carte(hand, carte_terra);
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
      suit: "Bastoni",
      path: "Progetto/assets/card/seiBastoni.png",
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
  click_carte(h, carte_terra);
};
