//in questo file sono presenti tutte le render
const link_image = "../assets/card/";

export const render_alert = (invite, username) => {
  if (username !== "") {
    let alarm_tempalte = `<strong>Sei stato invitato da #USERNAME!</strong>
                        <p class="mb-0">
                            <button type="button" id="button_accept"class="button btn btn-outline-info" data-bs-dismiss="alert" aria-label="Close">Accetta</button>
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
                        <td><button class="button btn btn-info invite" value="#ID" type="button" data-bs-dismiss="modal">Invita</button></td>
                      </tr>`;

  let html = "";
  users.forEach((u, indi) => {
    html += templateuser
      .replace("#USERNAME", u.username)
      .replace("#ID", u.id_user);
  });
  return html;
};

export const render_partite = (partite) => {
  const template_partite = `<tr>
                              <td colspan="3">#USERNAME</td>
                              <td><button class="btn btn-info join" value="#ID" type="button" data-bs-dismiss="modal">Assisti</button></td>
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

export const render_tavolo_scopa = (hand, n, carte_terra) => {
  const link_image = "../assets/card/";
  let list_html = [];
  let html = "";
  let h = hand.length;
  if (h === 0) {
    h = 3;
  }
  hand.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    html += `<img src="${src}" alt="carte" class="carte_giocatore" width="110px" height="155px">`;
  });
  html += `<button class="button btn-outline droppa" type="button">Tira</button> `;
  list_html.push(html);
  html = "";
  carte_terra.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    html += `<img src="${src}" alt="carta" class="carte_terra" width="110px" height="155px">`;
  });

  list_html.push(html);
  if (n.length === 2) {
    html = "";
    for (let i = 0; i < h; i++) {
      html += `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`;
    }
    list_html.push(html);
  } else if (n.length === 4) {
    html = "";

    for (let i = 0; i < h; i++) {
      html += `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`;
    }
    list_html.push(html);
    for (let i = 0; i < 2; i++) {
      html = "";
      for (let i = 0; i < h + 1; i++) {
        html += `<img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`;
      }
      list_html.push(html);
    }
  } else {
    return [{ text: "ci sono troppi giocatori (si può giocare in 2 o in 4)" }];
  }
  return list_html;
};

export const render_tavolo = (n, briscola) => {
  let list_html = [];

  console.log(briscola);
  let path = briscola.path.split("/");
  let src = link_image + path[path.length - 1];
  list_html.push(
    `<img src="${src}" class="briscola_carta" alt="carta" width="110px" height="155px">`,
  );
  list_html.push(
    `<img src="../assets/card/back.png" class="" alt="carta" width="110px" height="155px">`,
  ); //briscola,deck
  if (n.length === 2) {
    list_html.push(render_backhand());
  } else if (n.length === 4) {
    list_html.push(render_backhand());
    for (let i = 0; i < 2; i++) {
      list_html.push(render_backhand());
    }
  } else {
    return [{ text: "ci sono troppi giocatori (si può giocare in 2 o in 4)" }];
  }
  return list_html;
};

export const render_backhand = () => {
  let template_back = `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class=""src="../assets/card/back.png" alt="carta" width="110px" height="155px">`;
  return template_back;
};

export const render_winner = (data) => {
  console.log(data);
  const templatew = `<div id="winner" class="bg-success">
                      <div>#TEXT</div>
                      <div>#POINT</div>
                    </div>
                  <div id="losser" class="bg-secondary">
                      <div>#TEXT2</div>
                      <div>#POINT2</div>
                  </div></div>`;

  const templatd = `<div class="bg-secondary">
                      <div>#TEXT</div>
                      <div>#POINT</div>
                    </div>`;

  let num_user = data[0].user.length;
  let html = "";
  if (num_user === 0) {
    html = templatd.replace("#TEXT", "AVETE PAREGGIATO");
  } else if (num_user === 1) {
    html = templatew
      .replace("#TEXT", data[0].user[0] + " HA VINTO")
      .replace("#POINT", data[0].punti)
      .replace("#TEXT2", data[1].user[0] + " HA PERSO")
      .replace("#POINT2", data[1].punti);
  } else {
    html = templatew
      .replace("#TEXT", `${data[0].user[0]} e ${data[0].user[1]} HANNO VINTO`)
      .replace("#POINT", data[0].punti)
      .replace("#TEXT2", `${data[1].user[0]} e ${data[1].user[1]} HANNO PERSO`)
      .replace("#POINT2", data[1].punti);
  }
  return html;
};

export const render_playerCard = (hand) => {
  let html = "";
  hand.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="carte_giocatore" width="110px" height="155px">`;
  });
  return html;
};

export const render_turno = (decks) => {
  let html = "";
  return html;
};

export const render_board = (cards) => {
  let html = "";
  cards.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="" width="110px" height="155px">`;
  });
  return html;
};

export const render_board_scopa = (cards) => {
  let html = "";
  cards.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="carte_terra" width="110px" height="155px">`;
  });
  return html;
};

export const render_vittoria = (user) => {
  let template_punti = `<table>
        <tr><th>Username</th><th>Punti</th></tr>
        <tr><td>%username</td><td>%punti</td></tr>
        </table>`;
  let html = "";
  user.forEach((element) => {
    html += template_punti
      .replace("%username", element.user)
      .replace("punti", element.punti);
  });
  return html;
};

export function render_carta(carte,carta){
  let html = "";
  carte.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="carte_terra" width="110px" height="155px">`;
  });
  let path = carta.path.split("/");
  let src = link_image + path[path.length - 1];
  //console.log(src);
  html += `<div class="row"><img src="${src}" alt="carta" class="carte_terra" width="110px" height="155px"></div>`;
  return html;
}