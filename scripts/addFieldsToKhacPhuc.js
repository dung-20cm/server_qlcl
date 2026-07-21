/**
 * Migration 1 lần: mở rộng bảng `khac_phuc` để hỗ trợ tạo tay (không bắt buộc
 * gắn với 1 tiêu chí đánh giá cụ thể) và lọc/hiển thị theo tuần:
 *   - Thêm cột khoa_id, vitri_type_id, s_id, mo_ta_loi, ngay_phat_hien
 *   - Cho phép danh_gia_chi_tiet_id NULL (hành động khắc phục tạo tay)
 *   - Backfill khoa_id/vitri_type_id/s_id/ngay_phat_hien cho dữ liệu cũ (lấy
 *     qua join danh_gia_chi_tiet -> danh_gia / checklist_item)
 *
 * An toàn chạy nhiều lần (tự kiểm tra cột đã tồn tại chưa trước khi ALTER):
 *   node scripts/addFieldsToKhacPhuc.js
 *
 * Yêu cầu: MySQL đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { sequelize } = require("../config/connect");

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  );
  return rows[0].cnt > 0;
}

async function run() {
  const newColumns = [
    ["khoa_id", "INT UNSIGNED NULL AFTER danh_gia_chi_tiet_id"],
    ["vitri_type_id", "INT UNSIGNED NULL AFTER khoa_id"],
    ["s_id", "VARCHAR(10) NULL AFTER vitri_type_id"],
    ["mo_ta_loi", "TEXT NULL AFTER s_id"],
    ["ngay_phat_hien", "DATE NULL AFTER mo_ta_loi"],
  ];

  for (const [column, ddl] of newColumns) {
    if (await columnExists("khac_phuc", column)) {
      console.log(`Cột ${column} đã tồn tại trong khac_phuc — bỏ qua.`);
      continue;
    }
    await sequelize.query(`ALTER TABLE khac_phuc ADD COLUMN ${column} ${ddl}`);
    console.log(`Đã thêm cột ${column} vào bảng khac_phuc.`);
  }

  await sequelize.query(
    `ALTER TABLE khac_phuc MODIFY COLUMN danh_gia_chi_tiet_id INT UNSIGNED NULL`
  );
  console.log("Đã cho phép danh_gia_chi_tiet_id NULL (hành động khắc phục tạo tay).");

  const [result] = await sequelize.query(`
    UPDATE khac_phuc kp
    JOIN danh_gia_chi_tiet dgct ON kp.danh_gia_chi_tiet_id = dgct.id
    JOIN danh_gia dg ON dgct.danh_gia_id = dg.id
    JOIN checklist_item ci ON dgct.checklist_item_id = ci.id
    SET kp.khoa_id = dg.khoa_id,
        kp.vitri_type_id = dg.vitri_type_id,
        kp.s_id = ci.s_id,
        kp.ngay_phat_hien = dg.ngay_danh_gia
    WHERE kp.danh_gia_chi_tiet_id IS NOT NULL
      AND (kp.khoa_id IS NULL OR kp.ngay_phat_hien IS NULL)
  `);
  console.log(`Đã backfill khoa_id/vitri_type_id/s_id/ngay_phat_hien cho ${result.affectedRows} dòng dữ liệu cũ.`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Migration lỗi:", err);
  process.exit(1);
});
