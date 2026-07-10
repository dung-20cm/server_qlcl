const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class PhotoGallery extends BaseModel {
  static association() {
    const DanhGia = require("./danhGia.model");
    this.belongsTo(DanhGia, { foreignKey: "danh_gia_id", as: "danh_gia", targetKey: "id" });

    const ChecklistItem = require("./checklistItem.model");
    this.belongsTo(ChecklistItem, { foreignKey: "checklist_item_id", as: "checklist_item", targetKey: "id" });

    // Cho phép thêm ảnh 5S "độc lập" (không gắn 1 lượt đánh giá cụ thể) -
    // ví dụ ảnh gửi nhanh từ nhóm Zalo 5S. Khi đó khoa_id/vitri_type_id/... được
    // điền trực tiếp trên chính bản ghi ảnh thay vì lấy qua danh_gia.
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, { foreignKey: "vitri_type_id", as: "vitri_type", targetKey: "id" });

    const User = require("./user.model");
    this.belongsTo(User, { foreignKey: "nguoi_gui_id", as: "nguoi_gui", targetKey: "id" });
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
    allowNull: true, // NULL nếu là ảnh gửi độc lập (không qua Bảng kiểm) — xem khoa_id bên dưới
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
  // ── Các field chỉ dùng khi ảnh KHÔNG gắn với 1 lượt đánh giá (danh_gia_id = NULL) ──
  khoa_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
  },
  vitri_type_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
  },
  ngay_chup: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nguoi_gui_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
  },
  ket_qua: {
    type: DataTypes.STRING(20),
    allowNull: true, // "Đạt tốt" | "Đạt" | "Chưa đạt"
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
  tableName: "photo_gallery",
};

PhotoGallery.init(attributes, { ...options, sequelize });

module.exports = PhotoGallery;
