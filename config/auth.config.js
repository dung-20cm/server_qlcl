require("dotenv").config();

const config = Object.freeze({
  SECRET: process.env.ACCESS_TOKEN_SECRET || "SECRET_TOKEN",
  SECRET_REFRESH: process.env.REFRESH_TOKEN_SECRET || "SECRET_REFRESH_TOKEN",
  // tokenLife: 3600,         // 1 hour
  tokenLife: 86400,         // 1 hour
  refreshTokenLife: 86400, // 24 hours
})

module.exports = config
