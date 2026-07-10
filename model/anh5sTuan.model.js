const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class Anh5sTuan extends BaseModel {
  static association() {
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

    const Anh5sTuanVitri = require("./anh5sTuanVitri.model");
    this.hasMany(Anh5sTuanVitri, { foreignKey: "anh_5s_tuan_id", as: "vi_tri", targetKey: "id" });
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
  tuan: {
    type: DataTypes.DATEONLY,
    allowNull: false, // mốc ngày thứ 2 đầu tuần
  },
  so_luong_anh: {
    type: DataTypes.INTEGER(5).UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  chat_luong: {
    type: DataTypes.STRING(50),
    allowNull: true, // ví dụ: "Tot", "Kha", "Trung binh"
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
  tableName: "anh_5s_tuan",
};

Anh5sTuan.init(attributes, { ...options, sequelize });

module.exports = Anh5sTuan;
