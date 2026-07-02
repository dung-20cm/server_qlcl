// Danh sách slug quyền (permission.slug) theo sơ đồ phân quyền map.jpg
// 4 role: Admin, Phòng QLCL, Trưởng khoa, Nhân viên
// Slug ở đây dùng làm tham số cho check_permission(action) và cũng chính
// là giá trị lưu ở cột `permission.slug` trong DB.

// ===== ADMIN =====
const XEM_TOAN_QUYEN_BAO_CAO_LICH = 'xem-toan-quyen-bao-cao-lich' // Toàn quyền xem báo cáo, xem lịch,....
const TAO_TAI_KHOAN = 'tao-tai-khoan' // Quản lý tài khoản > Tạo tài khoản
const PHAN_QUYEN_TAI_KHOAN = 'phan-quyen-tai-khoan' // Quản lý tài khoản > Phân quyền cho các tài khoản
const CAU_HINH_DOT_DANH_GIA = 'cau-hinh-dot-danh-gia' // Cấu hình tạo đợt đánh giá
const CAU_HINH_PHONG_KHOA_KIEM_TRA = 'cau-hinh-phong-khoa-kiem-tra' // Cấu hình phòng khoa nào cần kiểm tra phần nào

// ===== PHÒNG QLCL =====
const XEM_TONG_HOP_TAT_CA_KHOA = 'xem-tong-hop-tat-ca-khoa' // Xem tổng hợp, xu hướng, báo cáo, lịch,.. của tất cả các khoa
const DANH_GIA_CAC_KHOA = 'danh-gia-cac-khoa' // Đánh giá các khoa, theo lịch được phân công
const XEM_TIEN_DO_KHAC_PHUC_TAT_CA_KHOA = 'xem-tien-do-khac-phuc-tat-ca-khoa' // Xem hành động và tiến độ khắc phục của các khoa

// ===== TRƯỞNG KHOA =====
const PHAN_CONG_DANH_GIA = 'phan-cong-danh-gia' // Phân công đánh giá cho 1 nhân viên bất kỳ của khoa
const XEM_TONG_HOP_KHOA_MINH = 'xem-tong-hop-khoa-minh' // Xem tổng hợp, báo cáo, lịch, xu hướng,.. của khoa mình
const XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH = 'xem-tien-do-khac-phuc-khoa-minh' // Xem hành động và tiến độ khắc phục,... của khoa mình
const TAO_TAI_KHOAN_NHAN_VIEN = 'tao-tai-khoan-nhan-vien' // Tạo tài khoản cho nhân viên của khoa mình - mặc định role nhân viên

// ===== NHÂN VIÊN =====
const LAM_DANH_GIA = 'lam-danh-gia' // Làm đánh giá các tiêu chí theo chỉ thị của trưởng khoa

// ===== Dùng chung (mọi role đã đăng nhập) =====
const DOI_MAT_KHAU = 'doi-mat-khau'

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

    // Trưởng khoa
    PHAN_CONG_DANH_GIA,
    XEM_TONG_HOP_KHOA_MINH,
    XEM_TIEN_DO_KHAC_PHUC_KHOA_MINH,
    TAO_TAI_KHOAN_NHAN_VIEN,

    // Nhân viên
    LAM_DANH_GIA,

    // Dùng chung
    DOI_MAT_KHAU,
}
