const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class VitriType extends BaseModel {
  static association() {
    const ChecklistItem = require("./checklistItem.model");
    this.hasMany(ChecklistItem, { foreignKey: "vitri_type_id", as: "checklist_item", targetKey: "id" });

    const VitriChiTiet = require("./vitriChiTiet.model");
    this.hasMany(VitriChiTiet, { foreignKey: "vitri_type_id", as: "vitri_chi_tiet", targetKey: "id" });

    const DanhGia = require("./danhGia.model");
    this.hasMany(DanhGia, { foreignKey: "vitri_type_id", as: "danh_gia", targetKey: "id" });

    const LichPhanCong = require("./lichPhanCong.model");
    this.hasMany(LichPhanCong, { foreignKey: "vitri_type_id", as: "lich_phan_cong", targetKey: "id" });

    const Anh5sTuanVitri = require("./anh5sTuanVitri.model");
    this.hasMany(Anh5sTuanVitri, { foreignKey: "vitri_type_id", as: "anh_5s_tuan_vitri", targetKey: "id" });

    const KhacPhuc = require("./khacPhuc.model");
    this.hasMany(KhacPhuc, { foreignKey: "vitri_type_id", as: "khac_phuc", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  ten_vitri: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true, // ví dụ: "1. Buồng bệnh", "2. Buồng thủ thuật"...
  },
  thu_tu: {
    type: DataTypes.INTEGER(5),
    allowNull: true, // thứ tự hiển thị (1-20), lấy từ số đầu tên vị trí
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
  tableName: "vitri_type",
};

VitriType.init(attributes, { ...options, sequelize });

module.exports = VitriType;
