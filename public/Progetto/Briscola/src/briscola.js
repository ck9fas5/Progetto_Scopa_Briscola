//in questo file è presente il codice javascript per la briscola
//in questo file è presente il codice di scopa
import { getUsers, GetPartite, getCard } from "../../src/connection.js";
import {
  render_alert,
  render_utenti,
  render_partite,
  render_tavolo,
  render_playerCard,
  render_backhand,
  render_turno,
  render_board,
  render_winner,
} from "../../src/render.js";
const { Scene, Sprite } = spritejs;

const pagina_game = "/Progetto/Briscola/briscola.html";
const pagina_princi = "/Progetto/pagina_principale.html";
const div_prepartita = document.getElementById("pre-game");
const div_waiting = document.getElementById("waiting");
const div_game = document.getElementById("game");
const container = document.querySelector("#game");

const play_div = document.getElementById("play_div");
const win_div = document.getElementById("win_div");

const b_listutenti = document.getElementById("utenti_connessi");
const b_createRoom = document.getElementById("createroom");
const n_listpartite = document.getElementById("partite_in_corso");
const b_startgame = document.getElementById("startgame");
const b_back = document.getElementById("back");

const alert_invite = document.getElementById("alert_invite");
const partitemodal = document.getElementById("partitemodal");
const bodymodal = document.getElementById("bodymodal");

const logout = document.getElementById("logout");
const tavolo_button = document.getElementById("tavolo");
const modal = document.getElementById("resultmodal");
const myModal = new bootstrap.Modal(modal, {
  keyboard: false,
});

const giocatore1 = document.getElementById("giocatore_principale");
const giocatore2 = document.getElementById("giocatore2");
const giocatore3 = document.getElementById("giocatore3");
const giocatore4 = document.getElementById("giocatore4");
const div_briscola = document.getElementById("briscola");
const played_card = document.getElementById("played_card");
const deck = document.getElementById("deck");
const num_deck = document.getElementById("num_deck");
const turn_find = document.getElementById("turn_find");
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
    //console.log(list_card);
    let path = list_card.card[0].path.split("/");
  }
})();

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

socket.on("join user", (list_user) => {
  b_startgame.disabled = false;
  b_startgame.classList.remove("d-none");
  b_startgame.onclick = () => {
    socket.emit("start game briscola", room);
  };
  //console.log(list_user);
});

socket.on("start watch", (game) => {
  console.log(game);
  div_prepartita.classList.add("d-none");
  b_back.classList.remove("d-none");
  div_game.classList.remove("d-none");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  tavolo("", game.order, game.briscola);
  if (game.history.length > 0) {
    //console.log(game.history[game.history.length - 1]);
    let html = render_board(game.history[game.history.length - 1]);
    played_card.innerHTML = html;
  }
});

socket.on("star", async (istance) => {
  div_waiting.classList.add("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  //console.log(istance);
  let briscola = istance.briscola;
  hand = istance.hand;
  let users = istance.order;
  tavolo(hand, users, briscola);
});

socket.on("draw card", async (data) => {
  hand.push(data.card);
  console.log(data);
  if (data.game.deck.length - (data.game.taken_card.length - 1) <= 0) {
    div_briscola.innerHTML = "";
    deck.innerHTML = "";
  }
  giocatore1.innerHTML = render_playerCard(hand);
});

socket.on("updateboard", (game) => {
  console.log(game);
  const num_deck = document.getElementById("num_deck");
  console.log(num_deck);
  if (num_deck !== null) {
    num_deck.innerHTML = game.deck.length;
  }
  let html = render_board(game.cards);
  played_card.innerHTML = html;
});

socket.on("start_turn_briscola", () => {
  turn_find.innerHTML = "Ѐ il tuo turno";
  turn_find.classList.add("gradiant");
  click_carte();
});

socket.on("fine partita", (punti) => {
  play_div.classList.add("d-none");
  console.log(punti);
  myModal.show();
  win_div.innerHTML = render_winner(FindWinner(punti));
  win_div.classList.remove("d-none");
  modal.addEventListener("hidden.bs.modal", (event) => {
    window.location.href = pagina_princi;
  });
});

socket.on("quit", () => {
  alert("un utente si è disconnesso, partita annullata");
  setTimeout(() => {
    window.location.href = pagina_game;
  }, 5000);
});

b_listutenti.onclick = async () => {
  let users = await getUsers(Cookies.get("username"));
  //console.log(users);
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
  console.log(partite);
  partitemodal.innerHTML = render_partite(partite.games);
  let buttons = document.querySelectorAll(".join");
  buttons.forEach((b) => {
    b.onclick = () => {
      room = b.value;
      socket.emit("spectate", b.value);
    };
  });
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

b_back.onclick = () => {
  b_back.classList.add("d-none");
  socket.emit("quit watch", room);
  window.location.href = pagina_game;
};

//https://uiverse.io/Navarog21/ordinary-rat-19 usare questo bottone bellissimo
//ciao <3

function FindWinner(list_poits) {
  console.log(list_poits);
  let s1 = { user: [], punti: 0 };
  let s2 = { user: [], punti: 0 };
  list_poits.forEach((player, indi) => {
    if (indi % 2 === 0) {
      s1.user.push(player.username);
      s1.punti += player.punti;
    } else {
      s2.user.push(player.username);
      s2.punti += player.punti;
    }
  });

  if (s1.punti > s2.punti) {
    return [s1, s2];
  } else if (s1.punti < s2.punti) {
    return [s2, s1];
  } else {
    return [[]];
  }
}

tavolo_button.onclick = () => {
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_prepartita.classList.add("d-none");
  div_game.classList.remove("d-none");
  div_game.classList.add("d-block");
  alert_invite.classList.remove("show");
  alert_invite.classList.add("d-none");
  let g = [
    { username: "pippo", punti: 110 },
    { username: "mirco", punti: 110 },
    { username: "manni", punti: 110 },
    { username: "gino", punti: 140 },
  ];
  win_div.innerHTML = render_winner(FindWinner(g));
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
  modal.addEventListener("hidden.bs.modal", (event) => {
    window.location.href = "/Progetto/pagina_principale.html";
  });
};

function tavolo(hand, users, briscola) {
  //console.log(users);
  b_startgame.classList.add("d-none");
  let user_card;
  if (hand === "") {
    user_card = render_backhand();
  } else {
    user_card = render_playerCard(hand);
  }

  let htmls = render_tavolo(users, briscola);
  //console.log(htmls);
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
    deck.innerHTML = deck.innerHTML + htmls[1];
    giocatore2.innerHTML = htmls[2];
    if (htmls.length === 5) {
      giocatore3.innerHTML = htmls[3];
      giocatore4.innerHTML = htmls[4];
    }
  }
}

function click_carte() {
  const carte_giocatore = document.querySelectorAll(".carte_giocatore");
  //console.log(carte_giocatore);
  carte_giocatore.forEach((carta) => {
    carta.addEventListener("click", () => {
      //console.log(carta);
      let carta_src = carta.src;
      let path = carta.src.split("/");
      let src = path[path.length - 1];
      let card = hand.find(
        (c) => c.path.split("/")[c.path.split("/").length - 1] === src,
      );
      //console.log(card);
      hand.splice(
        hand.findIndex((c) => c.suit === card.suit && c.number === card.number),
        1,
      );
      socket.emit("update board", { room: room, card: card });

      giocatore1.innerHTML = render_playerCard(hand);
      setTimeout(() => {
        turn_find.innerHTML = "";
        turn_find.classList.remove("gradiant");
        socket.emit("end turn briscola", { room: room, card: card });
      }, 2000);

      //giocatore
      //console.log("carta giocata", src);
    });
  });
}
