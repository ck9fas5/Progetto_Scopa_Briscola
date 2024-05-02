const fs = require('fs');
module.exports = {
   "host": "mysql-2e47529d-itis-77f1.a.aivencloud.com",
   "user": "avnadmin",
   "password": "AVNS_KpH4vYisOLr7J1xqgTA",
   "database": "defaultdb",
    "port": 26193,
  "ssl": {
    "ca" : fs.readFileSync('ca.pem'),
    "rejectUnauthorized": true
  }
}
