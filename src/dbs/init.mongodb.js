// "use strict";
const mongoose = require("mongoose");
const {
  db: { host, name, port },
} = require("../configs/config.mongodb");
const connectString = `mongodb://${host}:${port}/${name}`;
// console.log('connectString', host, port, name, connectString)
class Database {
  constructor() {
    this.connect();
  }

  connect(type = "mongodb") {
    if (1 === 1) {
      // mongoose.set("debug", true);
      // mongoose.set("debug", { color: true });
    }

    mongoose
      .connect(connectString, { maxPoolSize: 50 })
      .then((_) => console.log(`Connect Mongodb Success`, {host, name, port}))
      .catch((err) => console.log(`Error Connect`, {host, name, port}));
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }

    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb;
