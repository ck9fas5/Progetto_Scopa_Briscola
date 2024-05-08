//in questo file sono presenti tutte le render

export const render_alert = (invite, username) => {
  if (username !== "") {
    let alarm_tempalte = `<strong>Sei stato invitato da #USERNAME!</strong>
                        <p class="mb-0">
                            <button type="button" id="button_accept"class="btn btn-outline-info" data-bs-dismiss="alert" aria-label="Close">Accetta</button>
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

export const render_tavolo_scopa = (hand, n, briscola) => {
  const link_image = "../assets/card/";
  let list_html = [];
  let html = "";
  hand.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="carte_giocatore" width="110px" height="155px">`;
  });
  list_html.push(html);

  console.log(briscola);
  let path = briscola.path.split("/");
  let src = link_image + path[path.length - 1];
  list_html.push(
    `<img src="${src}" class="immagine_ruotata" alt="carta" width="110px" height="155px">`,
  );
  list_html.push(
    `<img src="../assets/card/back.png" class="" alt="carta" width="110px" height="155px">`,
  ); //p1,briscola,deck
  if (n.length === 2) {
    list_html.push(
      `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class=""src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
    );
  } else if (n.length === 4) {
    list_html.push(
      `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
    );
    for (let i = 0; i < 2; i++) {
      list_html.push(
        `<img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
      );
    }
  } else {
    return [{ text: "ci sono troppi giocatori (si può giocare in 2 o in 4)" }];
  }
  return list_html;
};

export const render_tavolo = (hand, n, briscola) => {
  const link_image = "../assets/card/";
  let list_html = [];
  let html = "";
  hand.forEach((element) => {
    let path = element.path.split("/");
    let src = link_image + path[path.length - 1];
    //console.log(src);
    html += `<img src="${src}" alt="carte" class="carte_giocatore" width="110px" height="155px">`;
  });
  list_html.push(html);

  console.log(briscola);
  let path = briscola.path.split("/");
  let src = link_image + path[path.length - 1];
  list_html.push(
    `<img src="${src}" class="immagine_ruotata" alt="carta" width="110px" height="155px">`,
  );
  list_html.push(
    `<img src="../assets/card/back.png" class="" alt="carta" width="110px" height="155px">`,
  ); //p1,briscola,deck
  if (n.length === 2) {
    list_html.push(
      `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class=""src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
    );
  } else if (n.length === 4) {
    list_html.push(
      `<img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
    );
    for (let i = 0; i < 2; i++) {
      list_html.push(
        `<img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px"><img class="immagine_ruotata" src="../assets/card/back.png" alt="carta" width="110px" height="155px">`,
      );
    }
  } else {
    return [{ text: "ci sono troppi giocatori (si può giocare in 2 o in 4)" }];
  }
  return list_html;
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
