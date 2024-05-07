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
                        <td colspan="3">#USERNAME</td>
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

export const render_tavolo = async (hand, game, pre_game) => {
  pre_game.classList.add("d-none");
  game.classList.remove("d-none");
  game.classList.add("d-block");
  const template = `
  <div id="game-table">
    <div class="player-card1">Carte1</div>
    <div class="player-card2">Carte2</div>
    <div class="player-card3">Carte3</div>
    <div class="player-card4">Carte4</div>
    <div id="deck">Mazzo</div>
  </div>`;
};

export const render_paritite = (partite) => {
  const template_partite = `<tr>
                              <td colspan="3">#ID</td>
                              <td colspan="3">#USERNAME</td>
                              <td><button class="btn btn-info invite" value="#ID" type="button" data-bs-dismiss="modal">Assisti</button></td>
                            </tr>`;
  let html = "";
  partite.forEach((p) => {
    let text_user = "";
    p.users.forEach((u) => {
      text_user += u + ", ";
    });
    html += template_partite
      .replaceAll("#ID", p.game.room)
      .replace("#USERNAME", text_user);
  });
  return html;
};
