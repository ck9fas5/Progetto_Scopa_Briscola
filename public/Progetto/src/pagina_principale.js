console.log(Cookies.get("credentials"));
if (Cookies.get("credentials") == "") {
  location.href = "/Progetto/login.html";
}
