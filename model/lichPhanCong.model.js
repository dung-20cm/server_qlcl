const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class LichPhanCong extends BaseModel {
  static association() {
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

    const VitriType = require("./vitriType.model");
    this.belongsTo(VitriType, { foreignKey: "vitri_type_id", as: "vitri_type", targetKey: "id" });

    const User = require("./user.model");
    this.belongsTo(User, { foreignKey: "nguoi_thuc_hien_id", as: "nguoi_thuc_hien", targetKey: "id" });

    const DotDanhGia = require("./dotDanhGia.model");
    this.belongsTo(DotDanhGia, { foreignKey: "dot_danh_gia_id", as: "dot", targetKey: "id" });
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
    allowNull: true, // NULL = áp dụng cho tất cả vị trí của khoa
  },
  dot_danh_gia_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // FK -> dot_danh_gia.id (đợt đánh giá lịch này thuộc về, chọn ở FE thay cho "loại lịch" cố định)
  },
  loai_lich: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "dinh_ky", // "dinh_ky" (lặp hàng tuần theo thu_trong_tuan) | "mot_lan" (theo ngay_thuc_hien)
  },
  thu_trong_tuan: {
    type: DataTypes.INTEGER(1).UNSIGNED,
    allowNull: true, // 1-7, chỉ dùng khi loai_lich = dinh_ky
  },
  ngay_thuc_hien: {
    type: DataTypes.DATEONLY,
    allowNull: true, // mot_lan/dot_xuat: ngày thực hiện. dinh_ky: ngày bắt đầu áp dụng (mốc), lặp lại hàng tuần theo thu_trong_tuan kể từ ngày này trở đi.
  },
  nguoi_thuc_hien_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false, // 1 dòng = 1 người; phân công nhiều người thì tạo nhiều dòng
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
  tableName: "lich_phan_cong",
};

LichPhanCong.init(attributes, { ...options, sequelize });

module.exports = LichPhanCong;
