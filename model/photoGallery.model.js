const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class PhotoGallery extends BaseModel {
  static association() {
    const DanhGia = require("./danhGia.model");
    this.belongsTo(DanhGia, { foreignKey: "danh_gia_id", as: "danh_gia", targetKey: "id" });

    const ChecklistItem = require("./checklistItem.model");
    this.belongsTo(ChecklistItem, { foreignKey: "checklist_item_id", as: "checklist_item", targetKey: "id" });
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
    allowNull: true, // NULL nếu là ảnh chung, không gắn 1 tiêu chí lỗi cụ thể
  },
  url_anh: {
    type: DataTypes.STRING(500),
    allowNull: false, // link ảnh sau khi upload (Cloudinary)
  },
  ten_file: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  mime_type: {
    type: DataTypes.STRING(100),
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
  tableName: "photo_gallery",
};

PhotoGallery.init(attributes, { ...options, sequelize });

module.exports = PhotoGallery;
