const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class DanhGia extends BaseModel {
  static association() {
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, { foreignKey: "vitri_type_id", as: "vitri_type", targetKey: "id" });

    const VitriChiTiet = require("./vitriChiTiet.model");
    this.belongsTo(VitriChiTiet, { foreignKey: "vitri_chi_tiet_id", as: "vitri_chi_tiet", targetKey: "id" });

    const User = require("./user.model");
    this.belongsTo(User, { foreignKey: "nguoi_danh_gia_id", as: "nguoi_danh_gia", targetKey: "id" });

    const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
    this.hasMany(DanhGiaChiTiet, { foreignKey: "danh_gia_id", as: "chi_tiet", targetKey: "id" });

    const PhotoGallery = require("./photoGallery.model");
    this.hasMany(PhotoGallery, { foreignKey: "danh_gia_id", as: "anh", targetKey: "id" });

    const DotDanhGia = require("./dotDanhGia.model");
    this.belongsTo(DotDanhGia, { foreignKey: "dot_danh_gia_id", as: "dot", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  khoa_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  vitri_type_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  vitri_chi_tiet_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // NULL nếu khoa/vị trí chưa cấu hình phòng cụ thể
  },
  nguoi_danh_gia_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  // Cán bộ CÙNG tham gia đánh giá (ngoài nguoi_danh_gia_id là người chính) —
  // lưu dạng chuỗi id nối bằng dấu phẩy (VD "5,12,13"), NULL nếu chỉ 1 người.
  dong_danh_gia_ids: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ngay_danh_gia: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dot_danh_gia: {
    type: DataTypes.STRING(255),
    allowNull: true, // text tự nhập, ví dụ "Đợt 1 - Quý 1/2026"
  },
  dot_danh_gia_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // FK -> dot_danh_gia.id (NULL với lượt đánh giá cũ chỉ có text)
  },
  so_tieu_chi_dat: {
    type: DataTypes.INTEGER(5),
    allowNull: true,
  },
  so_tieu_chi_tong: {
    type: DataTypes.INTEGER(5),
    allowNull: true,
  },
  pct: {
    type: DataTypes.FLOAT,
    allowNull: true, // % đạt, lưu lại tại thời điểm đánh giá để hiển thị nhanh
  },
  xep_loai: {
    type: DataTypes.STRING(50),
    allowNull: true, // ví dụ: "✓ ĐẠT TỐT", "◎ ĐẠT", "✗ CHƯA ĐẠT"
  },
  active: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
    defaultValue: 1,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
};

const options = {
  tableName: "danh_gia",
};

DanhGia.init(attributes, { ...options, sequelize });

module.exports = DanhGia;
