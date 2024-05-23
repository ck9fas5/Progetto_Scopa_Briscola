//in questo file è presente il codice di scopa
import { getUsers, GetPartite, getCard } from "../../src/connection.js";
import {
  render_utenti,
  render_alert,
  render_partite,
  render_tavolo_scopa,
  render_board_scopa,
  render_playerCard,
  render_vittoria,
  render_carta,
  render_scope,
} from "../../src/render.js";

const div_prepartita = document.getElementById("pre-game");
const div_waiting = document.getElementById("waiting");
const b_listutenti = document.getElementById("utenti_connessi");
b_listutenti.disabled = true;
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
const div_creategame = document.getElementById("creategame");
const gioca_ancora = document.getElementById("gioca_ancora");
const abbandona = document.getElementById("principale");
const modal = document.getElementById("resultmodal");
const myModal = new bootstrap.Modal(modal, {});
const giocatore1 = document.getElementById("giocatore_principale");
const giocatore2 = document.getElementById("giocatore2");
const scope = document.getElementById("giocatore3");
const deck = document.getElementById("deck");
const cerca = document.getElementById("cerca");
const div_drop = document.getElementById("pulsante");
const div_spinner = document.getElementById("spinner");
const ricarica = document.getElementById("ricarica");

const link_image = "../assets/card/";
let hand;
let carte_terra;
let room = "";
let users = [];
let lista = [];
let punteggi = [];

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
    //console.log(list_card);
    let path = list_card.card[0].path.split("/");
  }
})();

socket.on("quit", () => {
  alert("un utente si è disconnesso, partita annullata");
  setTimeout(() => {
    window.location.href = "../pagina_principale.html";
  }, 5000);
});

socket.on("invited", (utente) => {
  //console.log(utente);
  //console.log(render_alert(utente));
  alert_invite.innerHTML = render_alert(utente);
  alert_invite.classList.add("show");
  let ba = document.getElementById("button_accept");
  ba.onclick = () => {
    b_createRoom.disabled = true;
    div_waiting.classList.remove("d-none");
    div_prepartita.classList.add("d-none");
    room = utente.room;
    socket.emit("join games", utente.room);
  };
});

gioca_ancora.onclick = () => {
  myModal.hide();
  ricarica.classList.remove("d-none");
  let html = render_scope([]);
  scope.innerHTML = html;
  socket.emit("reset", { punti: punteggi, room: room });
  console.log(punteggi, room);
};

abbandona.onclick = () => {
  socket.emit("quit", room);
  window.location.href = "../pagina_principale.html";
};

socket.on("join user", (list_user) => {
  b_startgame.disabled = false;
  b_startgame.classList.remove("d-none");
  b_startgame.onclick = () => {
    socket.emit("start game scopa", room);
  };
  console.log(list_user);
});

socket.on("draw card", (card) => {
  div_spinner.classList.remove("d-none");
  hand = card.card;
  giocatore1.innerHTML = render_playerCard(hand);
  div_spinner.classList.add("d-none");
});

socket.on("updatescopa", (cards) => {
  console.log(cards);
  let html = render_board_scopa(cards.card);
  deck.innerHTML = html;
  carte_terra = cards.card;
  if (cards.scopa.length > 0) {
    let html2 = ``;
    cards.scopa.forEach((element) => {
      html2 += render_scope(element.carta);
    });
    scope.innerHTML = html2;
  }
});

socket.on("updatescopa2", (cards) => {
  let html = render_carta(cards.carte, cards.carta);
  deck.innerHTML = html;
});

socket.on("start watch scopa", (game) => {
  console.log(game);
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  lista = [{ path: "back.png" }, { path: "back.png" }, { path: "back.png" }];
  tavolo(lista, game.order, game.carte_terra);
  if (game.carte_terra.length > 0) {
    let html = render_board_scopa(game.carte_terra);
    deck.innerHTML = html;
  }
  lista.splice(0, 1);
  if (lista.length === 0) {
    lista = [{ path: "back.png" }, { path: "back.png" }, { path: "back.png" }];
  }
});

socket.on("fine partita", async (punti) => {
  let html = render_board_scopa([]);
  console.log(punti);
  deck.innerHTML = html;
  users = await getUsers("all");
  let user = [];
  punti.punti.forEach((element) => {
    if (user.find((u) => u.id_user === element.user) === undefined) {
      user.push(users.users.find((u) => u.id_user === element.user));
    }
  });
  let carte = [];
  let scp = [];
  punti.carte.forEach((e) => {
    if (punti.categorie.find((u) => u.user === e.user) !== undefined) {
      carte.push({
        carte: punti.carte.find((u) => u.user === e.user).num,
        id: punti.categorie.find((u) => u.user === e.user).id,
      });
    }
  });
  punti.scope.forEach((e) => {
    if (punti.categorie.find((u) => u.user === e.user) !== undefined) {
      scp.push({
        scope: punti.scope.find((u) => u.user === e.user).punteggio,
        id: punti.categorie.find((u) => u.user === e.user).id,
      });
    }
  });
  let sc = 0;
  user.forEach((element) => {
    if (
      punteggi.length === 0 ||
      punteggi.find((el) => el.id_user === element.id_user) === undefined
    ) {
      if (scp.find((u) => u.id === element.id_user) !== undefined) {
        sc = scp.find((u) => u.id === element.id_user).scope;
      }
      punteggi.push({
        username: element.username,
        punti: punti.punti.find((u) => u.user === element.id_user).punti,
        denari: punti.categorie.find((u) => u.id === element.id_user).denari
          .length,
        primiera: punti.categorie.find((u) => u.id === element.id_user)
          .primiera,
        scope: sc,
        carte: carte.find((u) => element.id_user === u.id).carte,
        sette_bello: punti.categorie.find((u) => u.id === element.id_user)
          .sette_bello,
      });
    } else {
      if (scp.find((u) => u.id === element.id_user) !== undefined) {
        sc = scp.find((u) => u.id === element.id_user).scope;
      }
      let persona = user.find((el) => el.id_user === element.id_user);
      console.log(persona);
      (persona.punti += punti.punti.find(
        (u) => u.user === element.id_user,
      ).punti),
        (persona.denari = punti.categorie.find(
          (u) => u.id === element.id_user,
        ).denari.length);
      persona.primiera = punti.categorie.find(
        (u) => u.id === element.id_user,
      ).primiera;
      (persona.carte = carte.find((u) => element.id_user === u.id).carte),
        (persona.scope = sc);
      persona.sette_bello = punti.categorie.find(
        (u) => u.id === element.id_user,
      ).sette_bello;
    }
  });
  let vittoria = render_vittoria(punteggi);
  turn.innerHTML = "";
  turn.classList.remove("gradiant");
  myModal.show();
  const vit = document.getElementById("vittoria");
  vit.innerHTML = vittoria;
  let secondi = 5;
  const countdownInterval = setInterval(() => {
    if (secondi > 0) {
      document.getElementById("countdown").innerHTML = secondi;
      secondi -= 1;
    } else {
      clearInterval(countdownInterval);
      gioca_ancora.click();
    }
  }, 1000);
});

function tavolo(hand, users, carte_terra) {
  console.log("si");
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
  } else if (htmls.length === 4) {
    //console.log(htmls[0]);
    giocatore1.innerHTML = htmls[0];
    div_drop.innerHTML = htmls[1];
    deck.innerHTML = htmls[2];
    giocatore2.innerHTML = htmls[3];
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

function fine_turno(hand, carte_prese, carte_terra, carta_selezionata, t) {
  let p;
  turn.innerHTML = "";
  turn.classList.remove("gradiant");
  if (t == "prese") {
    socket.emit("update scopa2", {
      carte: carte_terra,
      carta: carta_selezionata,
      room: room,
    });
    p = true;
    carte_prese.forEach((el) => {
      let index = carte_terra.indexOf(
        carte_terra.find(
          (carte) => carte.number === el.number && carte.suit === el.suit,
        ),
      );
      carte_terra.splice(index, 1);
    });
    hand.forEach((cart) => {
      if (cart.path === carta_selezionata.path) {
        carte_prese.push(cart);
      }
    });
  } else if (t == "drop") {
    carte_terra.push(carta_selezionata);
    console.log(carte_terra);
    p = false;
  }
  let car;
  hand.forEach((cart, i) => {
    if (cart.path === carta_selezionata.path) {
      car = i;
    }
  });
  hand.splice(car, 1);
  console.log(hand);
  if (t === "prese") {
    setTimeout(() => {
      socket.emit("end turn scopa", {
        room: room,
        card: carte_terra,
        carte_prese: carte_prese,
        hand: hand,
        carta_presa: carta_selezionata,
        preso: p,
      });
      tavolo(hand, users, carte_terra);
    }, 2000);
  } else {
    socket.emit("end turn scopa", {
      room: room,
      card: carte_terra,
      carte_prese: carte_prese,
      hand: hand,
      carta_presa: "",
      preso: p,
    });
    tavolo(hand, users, carte_terra);
  }
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
  let carte_prese = [];
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  const carte_a_terra = document.querySelectorAll(".carte_terra");
  const drop = document.querySelector(".droppa");
  let carta_selezionata;
  drop.disabled = false;
  drop.classList.add("button");
  turn.classList.remove("shake");
  //console.log(carte_a_terra);
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      carte_prese = [];
      carta_selezionata = "";
      carte_giocatore.forEach((card) => {
        card.classList.remove("hover");
      });
      carta.classList.add("hover");
      carta_selezionata = trasforma(hand, carta);
      console.log(carta_selezionata);
      console.log(carte_a_terra);
      console.log(carte_terra);
      console.log(carta);
      carte_a_terra.forEach((element) => {
        element.addEventListener("click", () => {
          element.classList.add("hover");
          let c = trasforma(carte_terra, element);
          if (
            carte_prese.find((element) => c.id === element.id) === undefined
          ) {
            carte_prese.push(c);
          }
          console.log(carte_prese);
          let somma = 0;
          carte_prese.forEach((element) => {
            somma += element.number;
          });
          console.log(somma);
          console.log(carta_selezionata.number);
          if (somma === carta_selezionata.number) {
            console.log(carta);
            fine_turno(
              hand,
              carte_prese,
              carte_terra,
              carta_selezionata,
              "prese",
            );
          } else if (somma > carta_selezionata.number) {
            element.classList.add("shake");
            carte_a_terra.forEach((element) => {
              element.classList.remove("hover");
            });
            carte_prese = [];
          }
        });
        drop.onclick = () => {
          //console.log(carte_terra, carta_selezionata);
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
            drop.disabled = true;
            drop.classList.remove("button");
            carte_prese = [];
            fine_turno(
              hand,
              carte_prese,
              carte_terra,
              carta_selezionata,
              "drop",
            );
          }
        };
      });
      if (carte_a_terra.length === 0) {
        drop.onclick = () => {
          drop.disabled = true;
          drop.classList.remove("button");
          carte_prese = [];
          fine_turno(hand, carte_prese, carte_terra, carta_selezionata, "drop");
        };
      }
    });
  });
}

socket.on("start scopa", (istance) => {
  console.log(istance);
  ricarica.classList.add("d-none");
  div_creategame.classList.add("d-none");
  div_waiting.classList.add("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  //console.log(istance);
  hand = istance.hand;
  carte_terra = istance.carte_terra;
  users = istance.order;
  lista = [];
  punteggi = [];
  tavolo(hand, users, carte_terra);
});

socket.on("start turn scopa", () => {
  turn.innerHTML = "Ѐ il tuo turno";
  turn.classList.add("gradiant");
  console.log("32s");
  click_carte();
});

b_listutenti.onclick = async () => {
  users = await getUsers(Cookies.get("username"));
  console.log(users.users);
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

cerca.addEventListener("input", (event) => {
  const cerca_utenti = event.target.value;
  const utenti_trovati = users.users.filter((user) =>
    user.username.toLowerCase().includes(cerca_utenti.toLowerCase()),
  );
  console.log(utenti_trovati);
  bodymodal.innerHTML = render_utenti(utenti_trovati);
});

n_listpartite.onclick = async () => {
  let partite = await GetPartite();
  console.log(partite);
  partitemodal.innerHTML = render_partite(partite.games);
  let buttons = document.querySelectorAll(".join");
  buttons.forEach((b) => {
    b.onclick = () => {
      room = b.value;
      socket.emit("spectate", room);
    };
  });
};

b_createRoom.onclick = () => {
  b_createRoom.disabled = true;
  b_listutenti.disabled = false;
  div_creategame.classList.remove("d-none");
  let hash = CryptoJS.SHA256(socket.id);
  let hashInHex = hash.toString(CryptoJS.enc.Hex);
  room = hashInHex;
  socket.emit("join games", hashInHex);
};

logout.onclick = () => {
  Cookies.set("username", "");
  Cookies.set("password", "");
  location.href = "/Progetto/login.html";
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3
