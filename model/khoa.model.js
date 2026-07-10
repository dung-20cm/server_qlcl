const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class Khoa extends BaseModel {
  static association() {
    const VitriChiTiet = require("./vitriChiTiet.model");
    this.hasMany(VitriChiTiet, { foreignKey: "khoa_id", as: "vitri_chi_tiet", targetKey: "id" });

    const DanhGia = require("./danhGia.model");
    this.hasMany(DanhGia, { foreignKey: "khoa_id", as: "danh_gia", targetKey: "id" });

    const LichPhanCong = require("./lichPhanCong.model");
    this.hasMany(LichPhanCong, { foreignKey: "khoa_id", as: "lich_phan_cong", targetKey: "id" });

    const Anh5sTuan = require("./anh5sTuan.model");
    this.hasMany(Anh5sTuan, { foreignKey: "khoa_id", as: "anh_5s_tuan", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  ten_khoa: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  nhom: {
    type: DataTypes.STRING(100),
    allowNull: true, // KHỐI PHÒNG / BAN, HỆ CẬN LÂM SÀNG, HỆ NGOẠI, HỆ NỘI, TRUNG TÂM
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
  tableName: "khoa",
};

Khoa.init(attributes, { ...options, sequelize });

module.exports = Khoa;
