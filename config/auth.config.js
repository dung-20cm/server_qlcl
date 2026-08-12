require("dotenv").config();

const config = Object.freeze({
  SECRET: process.env.ACCESS_TOKEN_SECRET || "SECRET_TOKEN",
  SECRET_REFRESH: process.env.REFRESH_TOKEN_SECRET || "SECRET_REFRESH_TOKEN",
  // tokenLife không còn dùng để phát access token nữa (login/getProfile/changePassword
  // đều dùng generateToken() mặc định hết hạn cuối ngày -- xem secondsUntilEndOfDay
  // trong middleware/auth.js) -- giữ lại phòng khi cần fallback thời lượng cố định.
  tokenLife: 86400,
  refreshTokenLife: 86400, // 24 hours
})

module.exports = config
