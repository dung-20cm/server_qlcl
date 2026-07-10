/**
 * Seed danh mục khoa/phòng/trung tâm (bảng "khoa") lấy từ KHOA_GROUPS
 * trong 5S_Dashboard_BVTB_v4.html.
 *
 * Chạy 1 lần (idempotent, chạy lại nhiều lần không bị trùng dữ liệu):
 *   node scripts/seedKhoa.js
 *
 * Yêu cầu: MySQL local đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { Khoa } = require("../model");

// Danh sách gộp từ 2 nguồn trong file HTML (KHOA_GROUPS dùng cho dropdown chọn
// khoa khi đánh giá + ALL_44_KHOA dùng cho tab Ảnh 5S) - đã loại bỏ dòng trùng
// "Trung tâm Chẩn đoán hình ảnh và Điện quang can thiệp" và giữ lại khoa
// "Khoa Bảo vệ, chăm sóc sức khoẻ cán bộ Tỉnh" (chỉ có ở ALL_44_KHOA).
// Người dùng đã xác nhận dùng bản gộp này. Tổng: 49 khoa/phòng/trung tâm.
const KHOA_GROUPS = {
  "KHỐI PHÒNG / BAN": [
    "Phòng Tài chính – Kế toán", "Phòng Kế hoạch tổng hợp", "Phòng Tổ chức hành chính",
    "Phòng Công nghệ thông tin", "Phòng Điều dưỡng", "Phòng Công tác xã hội",
    "Phòng Quản lý chất lượng", "Phòng Đào tạo, nghiên cứu khoa học và Chỉ đạo tuyến",
    "Phòng Vật tư thiết bị Y tế", "Phòng Quản trị", "Ban bảo vệ",
    "Khu vực ngoại cảnh bệnh viện",
  ],
  "HỆ CẬN LÂM SÀNG": [
    "Khoa Huyết học truyền máu", "Khoa Hoá sinh", "Khoa Vi sinh", "Khoa Giải phẫu bệnh",
    "Khoa Thăm dò chức năng", "Khoa Kiểm soát nhiễm khuẩn", "Khoa Dược",
  ],
  "HỆ NGOẠI": [
    "Khoa Ngoại tổng hợp", "Khoa Ngoại thận tiết niệu", "Khoa Chấn thương chỉnh hình",
    "Khoa Phẫu thuật thần kinh – cột sống", "Khoa Gây mê hồi sức",
    "Khoa Tai Mũi Họng", "Khoa Răng Hàm Mặt", "Khoa Mắt", "Khoa Phẫu thuật lồng ngực",
    "Khoa Hồi sức tích cực – chống độc",
  ],
  "HỆ NỘI": [
    "Khoa Khám bệnh", "Khoa Thận nhân tạo", "Khoa Nội tổng hợp Lão khoa",
    "Khoa Nội thận – Cơ xương khớp", "Khoa Bảo vệ, chăm sóc sức khoẻ cán bộ Tỉnh",
    "Khoa Nội hô hấp", "Khoa Nội tiêu hoá",
    "Khoa Nội tiết", "Khoa Huyết học lâm sàng",
    "Khoa Truyền nhiễm", "Khoa Thần kinh", "Khoa Phục hồi chức năng",
    "Khoa Y học dân tộc", "Khoa Da liễu", "Khoa Dinh dưỡng",
  ],
  "TRUNG TÂM": [
    "Trung tâm Tim mạch",
    "Trung tâm Chẩn đoán hình ảnh và Điện quang can thiệp",
    "Trung tâm Ung bướu",
    "Trung tâm Cấp cứu và Đột quỵ",
    "Trung tâm Cấp cứu ngoại viện",
  ],
};

async function run() {
  console.log("== Seed khoa ==");
  let count = 0;
  for (const nhom of Object.keys(KHOA_GROUPS)) {
    for (const ten_khoa of KHOA_GROUPS[nhom]) {
      const [khoa, created] = await Khoa.findOrCreate({
        where: { ten_khoa },
        defaults: { nhom, active: 1 },
      });
      console.log(`  ${created ? "tạo mới" : "đã có"}: "${ten_khoa}" (nhóm: ${nhom}) -> id=${khoa.id}`);
      count++;
    }
  }
  console.log(`Seed xong. Tổng: ${count} khoa.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
