const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class VitriChiTiet extends BaseModel {
  static association() {
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, { foreignKey: "vitri_type_id", as: "vitri_type", targetKey: "id" });

    const DanhGia = require("./danhGia.model");
    this.hasMany(DanhGia, { foreignKey: "vitri_chi_tiet_id", as: "danh_gia", targetKey: "id" });
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
  ma_vitri: {
    type: DataTypes.STRING(100),
    allowNull: false, // ví dụ: "E203", "Phòng mổ 1"
  },
  ghi_chu: {
    type: DataTypes.STRING(255),
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
  tableName: "vitri_chi_tiet",
};

VitriChiTiet.init(attributes, { ...options, sequelize });

module.exports = VitriChiTiet;
