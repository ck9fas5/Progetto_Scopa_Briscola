//in questo file sono presenti tutte le rendere

export const render_alert = (invite, username) => {
  if (username !== "") {
    let alarm_tempalte = `<strong>Sei stato invitato da #USERNAME!</strong>
                        <p class="mb-0">
                            <button type="button" id="button_accept"class="btn btn-outline-info">Accetta</button>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></p>`;
    let html = "";
    html += alarm_tempalte.replace("#USERNAME", invite.username);
    return html;
  } else {
    let html = `<strong>Devi prima creare una stanza</strong>
      <p class="mb-0">
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></p>`;
    return html;
  }
};

export const render_utenti = (users) => {
  const templateuser = `<tr>
                        <td colspan="2">#USERNAME</td>
                        <td><button class="btn btn-info invite" value="#ID" type="button" data-bs-dismiss="modal">Invita</button></td>
                      </tr>`;

  let html = "";
  users.forEach((u, indi) => {
    html += templateuser
      .replace("#USERNAME", u.username)
      .replace("#ID", u.id_user);
  });
  return html;
};

export const render_tavolo = async (hand, game) => {
  const pre_game = document.getElemebtById("pre-game");
  pre_game.classlist.add("d-none");
  game.classList.remove("d-none");
  game.classList.add("d-flex");
  const template = `<div class="container">
  
  </div>`;
};

export const render_paritite = (partite) => {
  const template_partite = "";
  let html = "";
  return html;
};
