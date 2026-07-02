const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class KhacPhuc extends BaseModel {
  static association() {
    const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
    this.belongsTo(DanhGiaChiTiet, { foreignKey: "danh_gia_chi_tiet_id", as: "danh_gia_chi_tiet", targetKey: "id" });

    const User = require("./user.model");
    this.belongsTo(User, { foreignKey: "nguoi_phu_trach_id", as: "nguoi_phu_trach", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  danh_gia_chi_tiet_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false, // tiêu chí không đạt nào cần khắc phục (khoa/vị trí/lỗi lấy qua join)
  },
  nguoi_phu_trach_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // có thể chưa phân công ngay lúc tạo
  },
  hanh_dong_khac_phuc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  han_xu_ly: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  tuan: {
    type: DataTypes.STRING(100),
    allowNull: true, // text tự nhập, ví dụ "Tuần 27/2026"
  },
  trang_thai: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "Chưa bắt đầu", // "Chưa bắt đầu" | "Đang xử lý" | "Đã xong"
  },
  ghi_chu: {
    type: DataTypes.TEXT,
    allowNull: true,
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
  tableName: "khac_phuc",
};

KhacPhuc.init(attributes, { ...options, sequelize });

module.exports = KhacPhuc;
