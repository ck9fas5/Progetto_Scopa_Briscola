const username = document.getElementById("username");
const password = document.getElementById("password");
const send = document.getElementById("send");
const form = document.getElementById("form");
const registrati = document.getElementById("registrati");
const template = ` <h2 class="text-dark text-center"><strong>Login</strong></h2>
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
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const send = document.getElementById("send");
  
};

send.onclick=()=>{
  fetch("/")
}