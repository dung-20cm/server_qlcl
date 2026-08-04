/**
 * Migration 1 lần: XOÁ cột `dot_danh_gia_id` khỏi bảng `anh_5s_tuan`.
 *
 * Rollback cho scripts/addDotDanhGiaIdToAnh5sTuan.js — sau khi bàn bạc lại,
 * "Nhóm Zalo 5S" quay về ghi nhận theo TUẦN (cột `tuan`) thay vì theo đợt
 * đánh giá, nên cột này không còn dùng nữa.
 *
 * An toàn chạy nhiều lần (tự kiểm tra cột còn tồn tại hay không trước khi DROP):
 *   node scripts/removeDotDanhGiaIdFromAnh5sTuan.js
 *
 * Yêu cầu: MySQL đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { sequelize } = require("../config/connect");

async function run() {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'anh_5s_tuan'
       AND COLUMN_NAME = 'dot_danh_gia_id'`
  );

  if (rows[0].cnt === 0) {
    console.log("Cột dot_danh_gia_id không tồn tại trong anh_5s_tuan — bỏ qua.");
    process.exit(0);
  }

  await sequelize.query(`ALTER TABLE anh_5s_tuan DROP COLUMN dot_danh_gia_id`);
  console.log("Đã xoá cột dot_danh_gia_id khỏi bảng anh_5s_tuan.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration lỗi:", err);
  process.exit(1);
});
