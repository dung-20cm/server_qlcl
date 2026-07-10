const User = require("./user.model");
const Role = require("./role.model");
const UserRole = require("./userRole.model");
const RefreshToken = require("./refreshToken.model");
const Permission = require("./permission.model");
const RolePermission = require("./rolePermission.model");
const Khoa = require("./khoa.model");
const VitriType = require("./vitriType.model");
const ChecklistItem = require("./checklistItem.model");
const VitriChiTiet = require("./vitriChiTiet.model");
const DanhGia = require("./danhGia.model");
const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
const KhacPhuc = require("./khacPhuc.model");
const PhotoGallery = require("./photoGallery.model");
const LichPhanCong = require("./lichPhanCong.model");
const Anh5sTuan = require("./anh5sTuan.model");
const Anh5sTuanVitri = require("./anh5sTuanVitri.model");

const { sequelize } = require("../config/db.config"); //call connect

// Đăng ký association trước để Sequelize biết các khóa ngoại khi tạo bảng
for (const m in sequelize.models) {
  sequelize.models[m].association();
}

// Sync tuần tự theo đúng thứ tự phụ thuộc (bảng cha trước, bảng có khóa ngoại sau)
// Trước đây sync() chạy đồng thời không await nên hay lỗi
// "Failed to open the referenced tabl