/**
 * Seed dữ liệu role / permission / role_permission theo sơ đồ phân quyền MỚI
 * (yêu cầu chỉnh lại ngày hiện tại — xem README ở dưới). Dùng lại đúng 3 bảng
 * đã có sẵn: role, permission, role_permission — KHÔNG tạo bảng mới.
 *
 * Script này ĐỒNG BỘ 2 CHIỀU: vừa thêm quyền còn thiếu, vừa THU HỒI
 * (soft-delete, set del=1) những quyền role đang có nhưng không còn nằm
 * trong ROLE_PERMISSION_MAP bên dưới — để tránh tình trạng role vẫn giữ
 * quyền cũ sau khi đổi sơ đồ phân quyền.
 *
 * Chạy lại an toàn nhiều lần (idempotent):
 *   node scripts/seedRolePermission.js
 *
 * Yêu cầu: MySQL đang chạy và đúng cấu hình trong .env
 *
 * Tóm tắt sơ đồ quyền (theo yêu cầu chỉnh sửa):
 * - admin: TẤT CẢ quyền của 3 role còn lại + quản lý tài khoản (mọi khoa) + cấu hình hệ thống
 * - phong-qlcl: làm bảng kiểm/đánh giá tất cả khoa, XEM lịch tất cả khoa (không được tạo/sửa/xoá lịch),
 *   toàn quyền Nhóm Zalo 5S/Ảnh 5S, tổng hợp, xu hướng, thống kê, tiến độ khắc phục, báo cáo — của TẤT CẢ khoa
 * - truong-khoa: toàn quyền bảng kiểm, lịch đánh giá, tổng hợp, xu hướng, tiến độ khắc phục, báo cáo —
 *   CHỈ của khoa/phòng mình + quản lý tài khoản (CRUD) của khoa/phòng mình
 * - nhan-vien: xem + tạo đánh giá ở bảng kiểm, xem lịch, tổng hợp, xu hướng, tiến độ khắc phục — của khoa/phòng mình
 * - lanhdao: CHỈ XEM toàn bộ hệ thống (giống Admin ở phạm vi xem — mọi khoa/phòng, mọi trang) nhưng
 *   KHÔNG có bất kỳ quyền thêm/sửa/xoá nào (không tạo tài khoản, không cấu hình, không chấm đánh giá,
 *   không quản lý ảnh 5S...). Chỉ giữ đúng 1 quyền XEM_TOAN_QUYEN_BAO_CAO_LICH (permission "xem toàn
 *   viện" vốn Admin cũng giữ, đã có sẵn trong FULL_SCOPE_SLUGS) + DOI_MAT_KHAU (tự đổi mật khẩu mình).
 *   Các route GET (xem danh sách) trước đây gate cùng 1 slug với route ghi (Ảnh 5S/Zalo 5S, danh sách
 *   tài khoản, danh sách role) đã được nới thêm XEM_TOAN_QUYEN_BAO_CAO_LICH riêng cho việc XEM — xem
 *   routes/anh5sTuan.routes.js, routes/photoGallery.routes.js, routes/user.routes.js, routes/role.routes.js.
 */
require("dotenv").config();
const { Role, Permission, RolePermission } = require("../model");
const ACTION = require("../middleware/actionDefault");

// 5 role (4 role gốc theo map.jpg + lanhdao chỉ xem, không thao tác)
const ROLES = [
  { slug: "admin", name: "Admin" },
  { slug: "phong-qlcl", name: "Phòng QLCL" },
  { slug: "truong-khoa", name: "Trưởng khoa" },
  { slug: "nhan-vien", name: "Nhân viên" },
  { slug: "lanhdao", name: "Lãnh đạo" },
];

// Toàn bộ permission hiện có trong hệ thống
const PERMISSIONS = [
  { slug: ACTION.XEM_TOAN_QUYEN_BAO_CAO_LICH, name: "Toàn quyền xem báo cáo, xem lịch" },
  { slug: ACTION.TAO_TAI_KHOAN, name: "Quản lý tài khoản (CRUD) tất cả khoa/phòng" },
  { slug: ACTION.PHAN_QUYEN_TAI_KHOAN, name: "Phân quyền cho các tài khoản" },
  { slug: ACTION.CAU_HINH_DOT_DANH_GIA, name: "Cấu hình tạo đợt đánh giá" },
  { slug: ACTION.CAU_HINH_PHONG_KHOA_KIEM_TRA, name: "Cấu hình phòng khoa nào cần kiểm tra phần nào" },

  { slug: ACTION.XEM_TONG_HOP_TAT_CA_KHOA, name: "Xem tổng hợp, xu hướng, thống kê, báo cáo, lịch của tất cả các khoa" },
  { slug: ACTION.DANH_GIA_CAC_KHOA, name: "Làm bảng kiểm/đánh giá các khoa" },
  { slug: ACTION.XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, name: "Xem hành động và tiến độ khắc phục của các khoa" },
  { slug: ACTION.QUAN_LY_ANH_5S_TAT_CA_KHOA, name: "Toàn quyền Nhóm Zalo 5S / Ảnh 5S của tất cả các khoa" },

  { slug: ACTION.PHAN_CONG_DANH_GIA, name: "Toàn quyền lịch đánh giá (CRUD) của khoa mình" },
  { slug: ACTION.QUAN_LY_BANG_KIEM_KHOA_MINH, name: "Toàn quyền bảng kiểm/đánh giá (kể cả xoá) của khoa mình" },
  { slug: ACTION.XEM_TONG_HOP_KHOA_MINH, name: "Xem tổng hợp, báo cáo, lịch, xu hướng của khoa mình" },
  { slug: ACTION.XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH, name: "Xem hành động và tiến độ khắc phục của khoa mình" },
  { slug: ACTION.QUAN_LY_KHAC_PHUC_KHOA_MINH, name: "Toàn quyền tạo/sửa/xoá hành động khắc phục của khoa mình" },
  { slug: ACTION.TAO_TAI_KHOAN_NHAN_VIEN, name: "Quản lý tài khoản (CRUD) của khoa/phòng mình" },

  { slug: ACTION.LAM_DANH_GIA, name: "Xem + tạo đánh giá (bảng kiểm) của khoa mình" },

  { slug: ACTION.DOI_MAT_KHAU, name: "Đổi mật khẩu" },
];

// Quyền của Phòng QLCL, Trưởng khoa, Nhân viên — Admin = union của cả 3 + quyền riêng admin (xem bên dưới)
const QLCL_PERMS = [
  ACTION.DANH_GIA_CAC_KHOA, // bảng kiểm đánh giá được các khoa
  ACTION.XEM_TONG_HOP_TAT_CA_KHOA, // xem lịch + tổng hợp/xu hướng/thống kê của tất cả khoa
  ACTION.XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA, // tiến độ khắc phục tất cả khoa
  ACTION.QUAN_LY_ANH_5S_TAT_CA_KHOA, // toàn quyền zalo 5s/ảnh 5s tất cả khoa
  ACTION.DOI_MAT_KHAU,
];

const TRUONG_KHOA_PERMS = [
  ACTION.QUAN_LY_BANG_KIEM_KHOA_MINH, // toàn quyền bảng kiểm khoa mình
  ACTION.PHAN_CONG_DANH_GIA, // toàn quyền lịch đánh giá khoa mình
  ACTION.XEM_TONG_HOP_KHOA_MINH, // tổng hợp/xu hướng khoa mình
  ACTION.XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH, // tiến độ khắc phục khoa mình
  ACTION.QUAN_LY_KHAC_PHUC_KHOA_MINH, // toàn quyền tạo/sửa/xoá khắc phục khoa mình
  ACTION.TAO_TAI_KHOAN_NHAN_VIEN, // CRUD tài khoản khoa mình
  ACTION.DOI_MAT_KHAU,
];

const NHAN_VIEN_PERMS = [
  ACTION.LAM_DANH_GIA, // xem + tạo đánh giá khoa mình
  ACTION.XEM_TONG_HOP_KHOA_MINH, // xem lịch + tổng hợp/xu hướng khoa mình
  ACTION.XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH, // xem tiến độ khắc phục khoa mình
  ACTION.DOI_MAT_KHAU,
];

// Lãnh đạo: CHỈ xem (mọi khoa/phòng, mọi trang) -- không giữ bất kỳ slug thêm/
// sửa/xoá nào. XEM_TOAN_QUYEN_BAO_CAO_LICH nằm sẵn trong FULL_SCOPE_SLUGS nên
// đủ để mọi service tính isFullScope=true (thấy dữ liệu tất cả khoa như Admin).
const LANHDAO_PERMS = [
  ACTION.XEM_TOAN_QUYEN_BAO_CAO_LICH,
  ACTION.DOI_MAT_KHAU,
];

// Gán permission cho từng role
const ROLE_PERMISSION_MAP = {
  "admin": [
    // Quyền riêng của Admin
    ACTION.XEM_TOAN_QUYEN_BAO_CAO_LICH,
    ACTION.TAO_TAI_KHOAN,
    ACTION.PHAN_QUYEN_TAI_KHOAN,
    ACTION.CAU_HINH_DOT_DANH_GIA,
    ACTION.CAU_HINH_PHONG_KHOA_KIEM_TRA,
    // + toàn bộ quyền của 3 role còn lại (Admin có tất cả các quyền)
    ...new Set([...QLCL_PERMS, ...TRUONG_KHOA_PERMS, ...NHAN_VIEN_PERMS]),
  ],
  "phong-qlcl": QLCL_PERMS,
  "truong-khoa": TRUONG_KHOA_PERMS,
  "nhan-vien": NHAN_VIEN_PERMS,
  "lanhdao": LANHDAO_PERMS,
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
    // Đồng bộ tên nếu đã đổi mô tả
    if (perm.name !== p.name) {
      await perm.update({ name: p.name });
    }
    permBySlug[p.slug] = perm;
    console.log(`  permission "${p.slug}" -> id=${perm.id}`);
  }

  console.log("== Đồng bộ role_permission (thêm mới + thu hồi quyền không còn trong map) ==");
  for (const roleSlug of Object.keys(ROLE_PERMISSION_MAP)) {
    const role = roleBySlug[roleSlug];
    const wantedSlugs = ROLE_PERMISSION_MAP[roleSlug];
    const wantedPermIds = wantedSlugs.map((s) => permBySlug[s].id);

    // Thêm các quyền còn thiếu
    for (const permSlug of wantedSlugs) {
      const perm = permBySlug[permSlug];
      const [rp, created] = await RolePermission.findOrCreate({
        where: { role_id: role.id, permission_id: perm.id },
        defaults: { del: 0 },
      });
      if (!created && rp.del !== 0) {
        await rp.update({ del: 0 }); // hồi phục nếu trước đó đã bị thu hồi
      }
    }

    // Thu hồi (soft-delete) các quyền role đang giữ nhưng KHÔNG còn trong map mới
    const current = await RolePermission.findAll({ where: { role_id: role.id, del: 0 } });
    let revoked = 0;
    for (const rp of current) {
      if (!wantedPermIds.includes(rp.permission_id)) {
        await rp.update({ del: 1 });
        revoked++;
      }
    }

    console.log(`  role "${roleSlug}" -> ${wantedSlugs.length} quyền (đã thu hồi ${revoked} quyền cũ không còn dùng)`);
  }

  console.log("Seed xong.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed lỗi:", err);
  process.exit(1);
});
