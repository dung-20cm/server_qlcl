// Danh sách slug quyền (permission.slug) theo sơ đồ phân quyền map.jpg
// 4 role: Admin, Phòng QLCL, Trưởng khoa, Nhân viên
// Slug ở đây dùng làm tham số cho check_permission(action) và cũng chính
// là giá trị lưu ở cột `permission.slug` trong DB.

// ===== ADMIN =====
const XEM_TOAN_QUYEN_BAO_CAO_LICH = 'xem-toan-quyen-bao-cao-lich' // Toàn quyền xem báo cáo, xem lịch,....
const TAO_TAI_KHOAN = 'tao-tai-khoan' // Quản lý tài khoản > CRUD tài khoản TẤT CẢ khoa/phòng
const PHAN_QUYEN_TAI_KHOAN = 'phan-quyen-tai-khoan' // Quản lý tài khoản > Phân quyền cho các tài khoản
const CAU_HINH_DOT_DANH_GIA = 'cau-hinh-dot-danh-gia' // Cấu hình tạo đợt đánh giá
const CAU_HINH_PHONG_KHOA_KIEM_TRA = 'cau-hinh-phong-khoa-kiem-tra' // Cấu hình phòng khoa nào cần kiểm tra phần nào

// ===== PHÒNG QLCL =====
const XEM_TONG_HOP_TAT_CA_KHOA = 'xem-tong-hop-tat-ca-khoa' // Xem tổng hợp, xu hướng, thống kê, báo cáo, lịch,.. của tất cả các khoa
const DANH_GIA_CAC_KHOA = 'danh-gia-cac-khoa' // Làm bảng kiểm/đánh giá các khoa (không xoá)
const XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA = 'xem-tien-do-khac-phuc-tat-ca-khoa' // Xem hành động và tiến độ khắc phục của các khoa
const QUAN_LY_ANH_5S_TAT_CA_KHOA = 'quan-ly-anh-5s-tat-ca-khoa' // Toàn quyền Nhóm Zalo 5S / Ảnh 5S của tất cả các khoa

// ===== TRƯỞNG KHOA =====
const PHAN_CONG_DANH_GIA = 'phan-cong-danh-gia' // Toàn quyền lịch đánh giá (CRUD) của khoa mình
const QUAN_LY_BANG_KIEM_KHOA_MINH = 'quan-ly-bang-kiem-khoa-minh' // Toàn quyền bảng kiểm/đánh giá (kể cả xoá) của khoa mình
const XEM_TONG_HOP_KHOA_MINH = 'xem-tong-hop-khoa-minh' // Xem tổng hợp, báo cáo, lịch, xu hướng,.. của khoa mình
const XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH = 'xem-tien-do-khac-phuc-khoa-minh' // Xem hành động và tiến độ khắc phục,... của khoa mình
const QUAN_LY_KHAC_PHUC_KHOA_MINH = 'quan-ly-khac-phuc-khoa-minh' // Toàn quyền tạo/sửa/xoá hành động khắc phục của khoa mình (Trưởng khoa)
const TAO_TAI_KHOAN_NHAN_VIEN = 'tao-tai-khoan-nhan-vien' // Quản lý tài khoản > CRUD tài khoản của khoa/phòng mình

// ===== NHÂN VIÊN =====
const LAM_DANH_GIA = 'lam-danh-gia' // Xem + tạo đánh giá (không sửa/xoá) của khoa mình

// ===== Dùng chung (mọi role đã đăng nhập) =====
const DOI_MAT_KHAU = 'doi-mat-khau'

// Nắm giữ BẤT KỲ slug nào trong danh sách này => coi là "full scope" (xem/thao
// tác được dữ liệu của TẤT CẢ khoa/phòng) khi lọc dữ liệu ở service layer.
// Admin nắm mọi slug nên luôn full scope; Phòng QLCL nắm các slug "_TAT_CA_KHOA".
const FULL_SCOPE_SLUGS = [
    XEM_TOAN_QUYEN_BAO_CAO_LICH,
    TAO_TAI_KHOAN,
    XEM_TONG_HOP_TAT_CA_KHOA,
    DANH_GIA_CAC_KHOA,
    XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA,
    QUAN_LY_ANH_5S_TAT_CA_KHOA,
]

module.exports = {
    // Admin
    XEM_TOAN_QUYEN_BAO_CAO_LICH,
    TAO_TAI_KHOAN,
    PHAN_QUYEN_TAI_KHOAN,
    CAU_HINH_DOT_DANH_GIA,
    CAU_HINH_PHONG_KHOA_KIEM_TRA,

    // Phòng QLCL
    XEM_TONG_HOP_TAT_CA_KHOA,
    DANH_GIA_CAC_KHOA,
    XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA,
    QUAN_LY_ANH_5S_TAT_CA_KHOA,

    // Trưởng khoa
    PHAN_CONG_DANH_GIA,
    QUAN_LY_BANG_KIEM_KHOA_MINH,
    XEM_TONG_HOP_KHOA_MINH,
    XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH,
    QUAN_LY_KHAC_PHUC_KHOA_MINH,
    TAO_TAI_KHOAN_NHAN_VIEN,

    // Nhân viên
    LAM_DANH_GIA,

    // Dùng chung
    DOI_MAT_KHAU,

    // Helper
    FULL_SCOPE_SLUGS,
}
