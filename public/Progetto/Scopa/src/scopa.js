//in questo file è presente il codice di scopa
import { getUsers, GetPartite, getCard } from "../../src/connection.js";
import {
  render_utenti,
  render_alert,
  render_partite,
  render_tavolo_scopa,
  render_board_scopa,
  render_playerCard,
} from "../../src/render.js";

const div_prepartita = document.getElementById("pre-game");
const b_listutenti = document.getElementById("utenti_connessi");
const b_createRoom = document.getElementById("createroom");
const n_listpartite = document.getElementById("partite_in_corso");
const alert_invite = document.getElementById("alert_invite");
const partitemodal = document.getElementById("partitemodal");
const bodymodal = document.getElementById("bodymodal");
const logout = document.getElementById("logout");
const button_tavolo = document.getElementById("tavolo");
const div_game = document.getElementById("game");
const b_startgame = document.getElementById("startgame");
const turn = document.getElementById("turn");

const giocatore1 = document.getElementById("giocatore_principale");
const giocatore2 = document.getElementById("giocatore2");
const giocatore3 = document.getElementById("giocatore3");
const giocatore4 = document.getElementById("giocatore4");
const deck = document.getElementById("deck");

const link_image = "../assets/card/";
let hand;
let carte_terra;
let room = "";
let users = [];

let socket = io();
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
    socket.emit("start game scopa", room);
  };
  console.log(list_user);
});

socket.on("draw card", (card) => {
  hand = card.card;
  giocatore1.innerHTML =
    render_playerCard(hand) +
    `<button class="button btn-outline droppa" type="button">Tira</button> `;
});

socket.on("updatescopa", (cards) => {
  let html = render_board_scopa(cards);
  deck.innerHTML = html;
  carte_terra = cards;
  click_carte();
});

socket.on("fine partita", (punti) => {
  console.log(punti);
});

function tavolo(hand, users, carte_terra) {
  b_startgame.classList.add("d-none");
  let htmls = render_tavolo_scopa(hand, users, carte_terra);
  if (htmls.length === 1) {
    if (htmls[0].text !== "ok") {
      alert_invite.classList.remove("d-none");
      alert_invite.classList.add("d-block");
      div_prepartita.classList.remove("d-none");
      div_game.classList.remove("d-block");
      div_game.classList.add("d-none");
      alert_invite.innerHTML = htmls[0].text;
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

function trasforma(lista_carte, carta) {
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
  turn.innerHTML = "";
  turn.classList.remove("gradiant");
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
  console.log(hand);
  socket.emit("end turn scopa", {
    room: room,
    card: carte_terra,
    carte_prese: carte_prese,
    hand: hand,
  });

  tavolo(hand, users, carte_terra);
  click_carte();
}

function somme(array, targetSum) {
  const result = [];

  function backtrack(startIndex, currentCombination, currentSum, usedIndices) {
    if (currentSum === targetSum) {
      result.push(currentCombination.slice());
      return;
    }

    for (let i = startIndex; i < array.length; i++) {
      if (!usedIndices[i] && currentSum + array[i].number <= targetSum) {
        usedIndices[i] = true;
        currentCombination.push(array[i]);
        backtrack(
          i + 1,
          currentCombination,
          currentSum + array[i].number,
          usedIndices,
        );
        currentCombination.pop();
        usedIndices[i] = false;
      }
    }
  }

  backtrack(0, [], 0, Array(array.length).fill(false));
  return result;
}

async function click_carte() {
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  const carte_a_terra = document.querySelectorAll(".carte_terra");
  const drop = document.querySelector(".droppa");
  console.log(carte_a_terra);
  let carte_prese = [];
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      carta.classList.add("hover");
      let carta_selezionata = trasforma(hand, carta);
      console.log(carta_selezionata);
      carte_a_terra.forEach((element) => {
        element.addEventListener("click", () => {
          element.classList.add("hover");
          console.log(trasforma(carte_terra, element));
          if (!carte_prese.includes(trasforma(carte_terra, element))) {
            carte_prese.push(trasforma(carte_terra, element));
          }
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
          console.log(carte_terra, carta_selezionata);
          let somme_possibili = somme(carte_terra, carta_selezionata.number);
          if (somme_possibili.length > 0) {
            if (somme_possibili[0].length === 1) {
              turn.innerHTML = "Devi prendere " + somme_possibili[0][0].number;
            } else if (somme_possibili[0].length === 2) {
              turn.innerHTML =
                "Devi prendere " +
                somme_possibili[0][0].number +
                " e " +
                somme_possibili[0][1].number;
            } else if (somme_possibili[0].length === 3) {
              turn.innerHTML =
                "Devi prendere " +
                somme_possibili[0][0].number +
                " e " +
                somme_possibili[0][1].number +
                " e " +
                somme_possibili[0][2].number;
            } else if (somme_possibili[0].length === 4) {
              turn.innerHTML =
                "Devi prendere " +
                somme_possibili[0][0].number +
                " e " +
                somme_possibili[0][1].number +
                " e " +
                somme_possibili[0][2].number;
              +" e " + somme_possibili[0][3].number;
            }
            turn.classList.add("gradiant");
            turn.classList.add("shake");
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
  turn.innerHTML = "Ѐ il tuo turno";
  turn.classList.add("gradiant");
  click_carte();
});

b_listutenti.onclick = async () => {
  let users = await getUsers(Cookies.get("username"));
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
