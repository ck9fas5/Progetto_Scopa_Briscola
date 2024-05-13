const mysql = require("mysql2");
const conf = require("./conf.js");
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
         suit VARCHAR(255) NOT NULL,
         code VARCHAR(255) NOT NULL
         ) `);

  await executeQuery(`CREATE TABLE IF NOT EXISTS Game
         ( id INT PRIMARY KEY, 
            status VARCHAR(255) NOT NULL
            ) `);

  await executeQuery(` CREATE TABLE IF NOT EXISTS Play(
       id_giocatore INT,
       id_partita VARCHAR(255),
       FOREIGN KEY (id_giocatore) REFERENCES User(id),
       FOREIGN KEY (id_partita) REFERENCES Game(id),
       PRIMARY KEY (id_giocatore, id_partita)
    )`);
  /*await executeQuery(` DROP TABLE Play`);*/
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
  let objects = await executeQuery(`SELECT * FROM ${table}`);
  return objects;
};

const insert = async (table, data) => {
  const query = `
   INSERT INTO ${table} (${Object.keys(data).join()})
   VALUES (${formatted_values(data)})
      `;
  return await executeQuery(query);
};

const impor = async (table, data) => {
  return await executeQuery(
    `UPDATE ${table} SET ${Object.keys(data)} = ${formatted_values(data)}`,
  );
};

const get_partite_in_corso = async () => {
  return await executeQuery(`SELECT * FROM GAME WHERE status='in corso'`);
};

const checkLogin = async (username, password) => {
  // check nel database dell'esistenza dell'utente
  // ritorna 0 o 1
  let user = await executeQuery(
    `
     SELECT * FROM User
     WHERE User.username = '${username}'
       AND User.password = '${password}'
     `,
  );
  if (user.length === 1) {
    return true;
  } else {
    return false;
  }
};

const connect = async (id_utente) => {
  await executeQuery(`
  UPDATE User 
  SET User.status=1
  WHERE User.id= ${id_utente}
  `);
  return { result: "ok" };
};

const disconnect = async (id_utente) => {
  await executeQuery(`
  UPDATE User 
  SET User.status=0
  WHERE User.id= ${id_utente}
  `);
  return { result: "ok" };
};

const svuota = async (table) => {
  await executeQuery(`
  DELETE FROM ${table}
  `);
  return { result: "ok" };
};

module.exports = {
  disconnect: disconnect,
  connect: connect,
  checkLogin: checkLogin,
  insert: insert,
  getting: getting,
  createTable: createTable,
  get_partite_in_corso: get_partite_in_corso,
  impor: impor,
  svuota: svuota,
};
