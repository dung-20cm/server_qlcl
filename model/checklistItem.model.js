const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class ChecklistItem extends BaseModel {
  static association() {
    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, {
      foreignKey: "vitri_type_id",
      as: "vitri_type",
      targetKey: "id",
    });

    const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
    this.hasMany(DanhGiaChiTiet, { foreignKey: "checklist_item_id", as: "danh_gia_chi_tiet", targetKey: "id" });

    const PhotoGallery = require("./photoGallery.model");
    this.hasMany(PhotoGallery, { foreignKey: "checklist_item_id", as: "anh", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  vitri_type_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  // Nhóm S (S1 Sàng lọc, S2 Sắp xếp, S3 Sạch sẽ, S4 Săn sóc, S5 Sẵn sàng).
  // Nhúng trực tiếp thay vì tách bảng riêng vì 5 nhóm này cố định, không đổi.
  s_id: {
    type: DataTypes.STRING(10),
    allowNull: false, // "S1".."S5"
  },
  s_name: {
    type: DataTypes.STRING(50),
    allowNull: false, // "Sàng lọc", "Sắp xếp",...
  },
  s_color: {
    type: DataTypes.STRING(20),
    allowNull: true, // mã màu chính, ví dụ "#D85A30"
  },
  s_lt: {
    type: DataTypes.STRING(20),
    allowNull: true, // mã màu nền nhạt, ví dụ "#FAECE7"
  },
  sub: {
    type: DataTypes.STRING(100),
    allowNull: true, // mã tiêu chí con, ví dụ "AT1", "3 Không (1)"
  },
  tc: {
    type: DataTypes.TEXT,
    allowNull: false, // nội dung tiêu chí đầy đủ
  },
  thu_tu: {
    type: DataTypes.INTEGER(5),
    allowNull: true, // thứ tự hiển thị trong nhóm S của vị trí đó
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
  tableName: "checklist_item",
};

ChecklistItem.init(attributes, { ...options, sequelize });

module.exports = ChecklistItem;
