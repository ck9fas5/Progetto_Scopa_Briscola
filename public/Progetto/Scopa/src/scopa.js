//in questo file è presente il codice di scopa
import { getUsers } from "../../src/connection.js";

const div_prova = document.getElementById("prova");
const socket = io();

socket.emit("accesso", Cookies.get("password"), Cookies.get("username"));

socket.on("invited", (utente) => {
  console.log(utente);
});

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
  socket.emit("join games", "fhudsxhfierubvhdscvuk");
};
