const mysql = require("mysql2");
const conf = require("./conf.js");
console.log(conf);
const connection = mysql.createConnection(conf);

const executeQuery = (sql) => {
  // per eseguire qualsiasi query
  return new Promise((resolve, reject) => {
    connection.query(sql, function (err, result) {
      if (err) {
        console.error(err);
        reject();
      }
      resolve(result);
    });
  });
};

const createTable = async () => {
  await executeQuery(`
   CREATE TABLE IF NOT EXISTS User
      ( id INT PRIMARY KEY AUTO_INCREMENT, 
         username VARCHAR(255) NOT NULL, 
         password VARCHAR(255) NOT NULL,
         status BOOL NOT NULL
         ) `);

  await executeQuery(`CREATE TABLE IF NOT EXISTS Card
      ( id INT PRIMARY KEY AUTO_INCREMENT, 
         number INT NOT NULL, 
         suit VARCHAR(255) NOT NULL
         ) `);

  await executeQuery(`CREATE TABLE IF NOT EXISTS Game
         ( id INT PRIMARY KEY AUTO_INCREMENT, 
            status VARCHAR(255) NOT NULL
            ) `);

  await executeQuery(` CREATE TABLE IF NOT EXISTS Play(
       id_giocatore INT,
       id_partita INT,
       FOREIGN KEY (id_giocatore) REFERENCES User(id),
       FOREIGN KEY (id_partita) REFERENCES Game(id),
       PRIMARY KEY (id_giocatore, id_partita)
    )`);
};

const formatted_values = (values) => {
  // formattazione valori per un Insert
  let list = "";
  Object.values(values).forEach((e) => {
    if (typeof e === "string") {
      list += "'" + e + "',";
    } else {
      list += e + ",";
    }
  });
  return list.slice(0, -1);
};

const getting = async (table) => {
  return await executeQuery(`SELECT * FROM ${table}`);
};

const insert = async (table, data) => {
  return await executeQuery(
    `INSERT INTO ${table} (${Object.keys(data).join()}) VALUES (${formatted_values(data)})`,
  );
};

const get_partite_in_corso = async () => {
  return await executeQuery(`SELECT * FROM GAME WHERE status='in corso'`);
};

const checkLogin = async (username, password) => {
  // check nel database dell'esistenza dell'utente
  // ritorna 0 o 1
  return (
    await executeQuery(
      `
  SELECT * FROM User
  WHERE Utente.username = '${username}'
    AND Utente.password = '${password}'
  `,
    )
  ).length;
};

const connect = async (id_utente) => {
  return await executeQuery(`
  UPDATE User 
  SET User.status=1
  WHERE User.id= ${id_utente}
  `);
};

const disconnect = async (id_utente) => {
  return await executeQuery(`
  UPDATE User 
  SET User.status=0
  WHERE User.id= ${id_utente}
  `);
};

module.exports = {
  disconnect: disconnect,
  connect: connect,
  checkLogin: checkLogin,
  insert: insert,
  getting: getting,
  createTable: createTable,
  get_partite_in_corso: get_partite_in_corso,
};