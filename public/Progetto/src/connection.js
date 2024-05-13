//in questo file sono presenti le connessioni tra client e server
export async function registra(username, password) {
  const response = await fetch("/singin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  const statusText = await response.json();
  console.log(response);
  if (statusText.result === "ok") {
    return "ok";
  } else {
    return "unauthorized";
  }
}

export async function login(username, password) {
  const response = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });
  const statusText = await response.json();
  console.log(statusText);
  if (statusText.result === "ok") {
    return "ok";
  } else {
    return "unauthorized";
  }
}

export async function getUsers(user) {
  let response = await fetch("/user_get/" + user, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  response = await response.json();
  return response;
}

export async function GetPartite() {
  let response = await fetch("/game_get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  response = await response.json();
  return response;
}

export async function getCard() {
  let response = await fetch("/card_get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  response = await response.json();
  return response;
}
