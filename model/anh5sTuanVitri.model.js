const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

// Bảng phụ (junction table): 1 dòng anh_5s_tuan có thể chụp ảnh ở nhiều loại
// vị trí trong cùng 1 tuần -> tách thành nhiều dòng ở đây thay vì lưu mảng
// vitri_type_id trong 1 cột của anh_5s_tuan.
class Anh5sTuanVitri extends BaseModel {
  static association() {
    const Anh5sTuan = require("./anh5sTuan.model");
    this.belongsTo(Anh5sTuan, { foreignKey: "anh_5s_tuan_id", as: "anh_5s_tuan", targetKey: "id" });

    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, { foreignKey: "vitri_type_id", as: "vitri_type", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  anh_5s_tuan_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  vitri_type_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
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
  tableName: "anh_5s_tuan_vitri",
};

Anh5sTuanVitri.init(attributes, { ...options, sequelize });

module.exports = Anh5sTuanVitri;
