/**
 * Migration 1 lần: thêm cột `dot_danh_gia_id` vào bảng `lich_phan_cong`
 * (FK mềm -> dot_danh_gia.id) — để "Loại lịch" ở FE chọn từ danh sách Đợt
 * đánh giá thực tế (GET /api/dot-danh-gia/get-list-dot-danh-gia) thay vì 3
 * option cố định dinh_ky/mot_lan/dot_xuat.
 *
 * An toàn chạy nhiều lần (tự kiểm tra cột đã tồn tại chưa trước khi ALTER):
 *   node scripts/addDotDanhGiaIdToLichPhanCong.js
 *
 * Yêu cầu: MySQL đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { sequelize } = require("../config/connect");

async function run() {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'lich_phan_cong'
       AND COLUMN_NAME = 'dot_danh_gia_id'`
  );

  if (rows[0].cnt > 0) {
    console.log("Cột dot_danh_gia_id đã tồn tại trong lich_phan_cong — bỏ qua.");
    process.exit(0);
  }

  await sequelize.query(
    `ALTER TABLE lich_phan_cong
     ADD COLUMN dot_danh_gia_id INT UNSIGNED NULL AFTER vitri_type_id`
  );
  console.log("Đã thêm cột dot_danh_gia_id vào bảng lich_phan_cong.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration lỗi:", err);
  process.exit(1);
});
