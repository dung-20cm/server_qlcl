const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class DanhGiaChiTiet extends BaseModel {
  static association() {
    const DanhGia = require("./danhGia.model");
    this.belongsTo(DanhGia, { foreignKey: "danh_gia_id", as: "danh_gia", targetKey: "id" });

    const ChecklistItem = require("./checklistItem.model");
    this.belongsTo(ChecklistItem, { foreignKey: "checklist_item_id", as: "checklist_item", targetKey: "id" });

    const KhacPhuc = require("./khacPhuc.model");
    this.hasMany(KhacPhuc, { foreignKey: "danh_gia_chi_tiet_id", as: "khac_phuc", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  danh_gia_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  checklist_item_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  ket_qua: {
    type: DataTypes.TINYINT(1),
    allowNull: true, // 1 = đạt, 0 = không đạt, NULL = chưa đánh giá
  },
  ghi_chu: {
    type: DataTypes.STRING(255),
    allowNull: true,
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
  tableName: "danh_gia_chi_tiet",
};

DanhGiaChiTiet.init(attributes, { ...options, sequelize });

module.exports = DanhGiaChiTiet;
