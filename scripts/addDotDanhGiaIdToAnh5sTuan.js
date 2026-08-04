/**
 * Migration 1 lần: thêm cột `dot_danh_gia_id` vào bảng `anh_5s_tuan`
 * (FK mềm -> dot_danh_gia.id) — để trang "Nhóm Zalo 5S" ghi nhận/lọc theo
 * đúng đợt đánh giá thay vì chỉ lọc theo tuần.
 *
 * An toàn chạy nhiều lần (tự kiểm tra cột đã tồn tại chưa trước khi ALTER):
 *   node scripts/addDotDanhGiaIdToAnh5sTuan.js
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

  if (rows[0].cnt > 0) {
    console.log("Cột dot_danh_gia_id đã tồn tại trong anh_5s_tuan — bỏ qua.");
    process.exit(0);
  }

  await sequelize.query(
    `ALTER TABLE anh_5s_tuan
     ADD COLUMN dot_danh_gia_id INT UNSIGNED NULL AFTER khoa_id`
  );
  console.log("Đã thêm cột dot_danh_gia_id vào bảng anh_5s_tuan.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration lỗi:", err);
  process.exit(1);
});
