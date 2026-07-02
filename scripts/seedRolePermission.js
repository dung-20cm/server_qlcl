/**
 * Seed dữ liệu role / permission / role_permission theo sơ đồ phân quyền (map.jpg).
 * Dùng lại đúng 3 bảng đã có sẵn: role, permission, role_permission — KHÔNG tạo bảng mới.
 *
 * Chạy 1 lần (idempotent, chạy lại nhiều lần không bị trùng dữ liệu):
 *   node scripts/seedRolePermission.js
 *
 * Yêu cầu: MySQL local đang chạy và đúng cấu hình trong .env
 */
require("dotenv").config();
const { Role, Permission, RolePermission } = require("../model");
const ACTION = require("../middleware/actionDefault");

// 4 role theo map.jpg
const ROLES = [
  { slug: "admin", name: "Admin" },
  { slug: "phong-qlcl", name: "Phòng QLCL" },
  { slug: "truong-khoa", name: "Trưởng khoa" },
  { slug: "nhan-vien", name: "Nhân viên" },
];

// Toàn bộ permission theo từng nhánh lá trong map.jpg
const PERMISSIONS = [
  { slug: ACTION.XEM_TOAN_QUYEN_BAO_CAO_LICH, name: "Toàn quyền xem báo cáo, xem lịch" },
  { slug: ACTION.TAO_TAI_KHOAN, name: "Tạo tài khoản" },
  { slug: ACTION.PHAN_QUYEN_TAI_KHOAN, name: "Phân quyền cho các tài khoản" },
  { slug: ACTION.CAU_HINH_DOT_DANH_GIA, name: "Cấu hình tạo đợt đánh giá" },
  { slug: ACTION.CAU_HINH_PHONG_KHOA_KIEM_TRA, name: "Cấu hình phòng khoa nào cần kiểm tra phần nào" },

  { slug: ACTION.XEM_TONG_HOP_TAT_CA_KHOA, name: "Xem tổng hợp, xu hướng, báo cáo, lịch của tất cả các khoa" },
  { slug: ACTION.DANH_GIA_CAC_KHOA, name: "Đánh giá các khoa theo lịch được phân công" },
  { slug: ACTION.XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, name: "Xem hành động và tiến độ khắc phục của các khoa" },

  { slug: ACTION.PHAN_CONG_DANH_GIA, name: "Phân công đánh giá cho 1 nhân viên bất kỳ của khoa" },
  { slug: ACTION.XEM_TONG_HOP_KHOA_MINH, name: "Xem tổng hợp, báo cáo, lịch, xu hướng của khoa mình" },
  { slug: ACTION.XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH, name: "Xem hành động và tiến độ khắc phục của khoa mình" },
  { slug: ACTION.TAO_TAI_KHOAN_NHAN_VIEN, name: "Tạo tài khoản cho nhân viên của khoa mình (mặc định role nhân viên)" },

  { slug: ACTION.LAM_DANH_GIA, name: "Làm đánh giá các tiêu chí theo chỉ thị của trưởng khoa" },

  { slug: ACTION.DOI_MAT_KHAU, name: "Đổi mật khẩu" },
];

// Gán permission cho từng role, đúng theo nhánh trong map.jpg
const ROLE_PERMISSION_MAP = {
  "admin": [
    ACTION.XEM_TOAN_QUYEN_BAO_CAO_LICH,
    ACTION.TAO_TAI_KHOAN,
    ACTION.PHAN_QUYEN_TAI_KHOAN,
    ACTION.CAU_HINH_DOT_DANH_GIA,
    ACTION.CAU_HINH_PHONG_KHOA_KIEM_TRA,
    ACTION.DOI_MAT_KHAU,
  ],
  "phong-qlcl": [
    ACTION.XEM_TONG_HOP_TAT_CA_KHOA,
    ACTION.DANH_GIA_CAC_KHOA,
    ACTION.XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA,
    ACTION.DOI_MAT_KHAU,
  ],
  "truong-khoa": [
    ACTION.PHAN_CONG_DANH_GIA,
    ACTION.XEM_TONG_HOP_KHOA_MINH,
    ACTION.XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH,
    ACTION.TAO_TAI_KHOAN_NHAN_VIEN,
    ACTION.DOI_MAT_KHAU,
  ],
  "nhan-vien": [
    ACTION.LAM_DANH_GIA,
    ACTION.DOI_MAT_KHAU,
  ],
};

async function run() {
  console.log("== Seed role ==");
  const roleBySlug = {};
  for (const r of ROLES) {
    const [role] = await Role.findOrCreate({
      where: { slug: r.slug },
      defaults: { name: r.name, del: 0 },
    });
    roleBySlug[r.slug] = role;
    console.log(`  role "${r.slug}" -> id=${role.id}`);
  }

  console.log("== Seed permission ==");
  const permBySlug = {};
  for (const p of PERMISSIONS) {
    const [perm] = await Permission.findOrCreate({
      where: { slug: p.slug },
      defaults: { name: p.name, del: 0 },
    });
    permBySlug[p.slug] = perm;
    console.log(`  permission "${p.slug}" -> id=${perm.id}`);
  }

  console.log("== Seed role_permission ==");
  for (const roleSlug of Object.keys(ROLE_PERMISSION_MAP)) {
    const role = roleBySlug[roleSlug];
    for (const permSlug of ROLE_PERMISSION_MAP[roleSlug]) {
      const perm = permBySlug[permSlug];
      await RolePermission.findOrCreate({
        where: { role_id: role.id, permission_id: perm.id },
        defaults: { del: 0 },
      });
    }
    console.log(`  role "${roleSlug}" -> ${ROLE_PERMISSION_MAP[roleSlug].length} permission`);
  }

  console.log("Seed xong.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
