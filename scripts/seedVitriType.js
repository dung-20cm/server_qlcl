/**
 * Seed danh mục loại vị trí (bảng "vitri_type") lấy từ BANGKIEM_VITRI
 * trong 5S_Dashboard_BVTB_v4.html (20 loại vị trí cần đánh giá 5S).
 *
 * Chạy 1 lần (idempotent, chạy lại nhiều lần không bị trùng dữ liệu):
 *   node scripts/seedVitriType.js
 *
 * Yêu cầu: MySQL local đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { VitriType } = require("../model");

const VITRI_LIST = [
  "1. Buồng bệnh",
  "2. Buồng thủ thuật",
  "3. Phòng mổ",
  "4. Phòng khám bệnh",
  "5. Tủ thuốc cấp cứu",
  "6. Xe tiêm",
  "7. Kho thuốc / tủ thuốc khoa",
  "8. Tủ vật tư",
  "9. Phòng xét nghiệm",
  "10. Phòng lấy mẫu xét nghiệm",
  "11. Phòng X-quang / CT Scanner / MRI",
  "12. Phòng siêu âm",
  "13. Phòng nội soi",
  "14. Phòng hành chính khoa/phòng/TT",
  "15. Phòng trực nhân viên",
  "16. Phòng máy / phòng kỹ thuật",
  "17. Hành lang / khu vực công cộng",
  "18. Khu xử lý rác thải / KSNK",
  "19. Kho hồ sơ / lưu trữ bệnh án",
  "20. Nhà vệ sinh",
];

async function run() {
  console.log("== Seed vitri_type ==");
  let count = 0;
  for (const ten_vitri of VITRI_LIST) {
    const thu_tu = parseInt(ten_vitri.split(".")[0], 10);
    const [vt, created] = await VitriType.findOrCreate({
      where: { ten_vitri },
      defaults: { thu_tu, active: 1 },
    });
    console.log(`  ${created ? "tạo mới" : "đã có"}: "${ten_vitri}" -> id=${vt.id}`);
    count++;
  }
  console.log(`Seed xong. Tổng: ${count} loại vị trí.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
