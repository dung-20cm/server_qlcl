require("dotenv").config();
const Sequelize = require("sequelize");

const database = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || "3306",
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "mysql_server",
  dialect: "mysql",
  logging: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = {
  sequelize: new Sequelize(database),
};
