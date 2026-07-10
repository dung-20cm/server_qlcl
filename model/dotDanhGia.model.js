const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

// Bảng "đợt đánh giá" — cấu hình các đợt/chiến dịch đánh giá 5S (map.jpg: "Cấu hình tạo đợt đánh giá").
// Liên kết: 1 đợt có nhiều lượt đánh giá (danh_gia.dot_danh_gia_id — FK nullable,
// giữ tương thích các lượt đánh giá cũ chỉ lưu text ở cột danh_gia.dot_danh_gia).
class DotDanhGia extends BaseModel {
  static association() {
    const DanhGia = require("./danhGia.model");
    this.hasMany(DanhGia, { foreignKey: "dot_danh_gia_id", as: "danh_gia", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  ten_dot: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // ví dụ: "Đợt 1 - Quý 1/2026", "Định kỳ tháng 7/2026"
  },
  tu_ngay: {
    type: DataTypes.DATEONLY,
    allowNull: true, // ngày bắt đầu đợt
  },
  den_ngay: {
    type: DataTypes.DATEONLY,
    allowNull: true, // ngày kết thúc đợt
  },
  mo_ta: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  trang_thai: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "dang-mo", // dang-mo | da-dong
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
  tableName: "dot_danh_gia",
};

DotDanhGia.init(attributes, { ...options, sequelize });

module.exports = DotDanhGia;
