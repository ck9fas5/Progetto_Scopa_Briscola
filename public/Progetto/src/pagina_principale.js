if (
  Cookies.get("username") == undefined &&
  Cookies.get("password") == undefined
) {
  location.href = "/Progetto/login.html";
}
