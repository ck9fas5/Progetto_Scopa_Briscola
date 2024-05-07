import { registra, login } from "./connection.js";
const send = document.getElementById("send");
const form = document.getElementById("form");
const div = document.getElementById("div");
const registrati = document.getElementById("registrati");
const template = ` <h2 class="text-dark text-center"><strong>Sign up</strong></h2>
          <div class="user-box">
            <input type="text" id="username" />
            <label><strong>Username</strong></label>
          </div>
          <div class="user-box">
            <input type="password" id="password" />
            <label><strong>Password</strong></label>
          </div>
          <center>
            <button type="button" class="btn btn-light" id="send">
              <strong>SEND</strong>

              <span></span>
            </button>
          </center>`;

registrati.onclick = () => {
  form.innerHTML = template;
  const send = document.getElementById("send");
  send.onclick = async () => {
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    let response = await registra(username.value, password.value);
    if (response === "ok") {
      Cookies.set("username", username.value);
      Cookies.set("password", password.value);
      location.href = "/Progetto/pagina_principale.html";
    } else {
      div.innerHTML = "Accesso non autorizzato, controlla username e password";
    }
  };
};

send.onclick = async () => {
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  let response = await login(username.value, password.value);
  console.log(response);
  if (response === "ok") {
    Cookies.set("username", username.value);
    Cookies.set(
      "password",
      password.value,
    ) /*ricordarsi quando si fara il logout di cancellare i cookie*/;

    location.href = "/Progetto/pagina_principale.html";
  } else {
    div.innerHTML =
      "<strong>Le credenziali risultano errate.<br>Non sei registrato? clicca Sign up</strong>";
  }
};

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    send.click();
  }
});
