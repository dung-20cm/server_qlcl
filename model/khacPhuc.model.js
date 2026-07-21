const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class KhacPhuc extends BaseModel {
  static association() {
    const DanhGiaChiTiet = require("./danhGiaChiTiet.model");
    this.belongsTo(DanhGiaChiTiet, { foreignKey: "danh_gia_chi_tiet_id", as: "danh_gia_chi_tiet", targetKey: "id" });

    const User = require("./user.model");
    this.belongsTo(User, { foreignKey: "nguoi_phu_trach_id", as: "nguoi_phu_trach", targetKey: "id" });

    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });

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
  danh_gia_chi_tiet_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // NULL với hành động khắc phục tạo tay (không gắn 1 tiêu chí đánh giá cụ thể)
  },
  // Luôn được set (tự tạo lấy từ đánh giá gốc, tạo tay do người dùng chọn) --
  // cho phép lọc theo khoa/tuần và kiểm tra phân quyền mà không cần join qua
  // danh_gia_chi_tiet -> danh_gia (vốn không tồn tại với hành động tạo tay).
  khoa_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
  },
  vitri_type_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
  },
  s_id: {
    type: DataTypes.STRING(10),
    allowNull: true, // "S1".."S5"
  },
  mo_ta_loi: {
    type: DataTypes.TEXT,
    allowNull: true, // mô tả lỗi/tiêu chí chưa đạt -- tự nhập khi tạo tay; hành động
    // tự tạo từ Bảng kiểm lấy mô tả qua danh_gia_chi_tiet.checklist_item.tc
  },
  ngay_phat_hien: {
    type: DataTypes.DATEONLY,
    allowNull: true, // ngày phát hiện lỗi -- dùng để lọc/hiển thị theo tuần
  },
  nguoi_phu_trach_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true, // có thể chưa phân công ngay lúc tạo
  },
  hanh_dong_khac_phuc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  han_xu_ly: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  tuan: {
    type: DataTypes.STRING(100),
    allowNull: true, // text tự nhập, ví dụ "Tuần 27/2026"
  },
  trang_thai: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: "Chưa bắt đầu", // "Chưa bắt đầu" | "Đang xử lý" | "Đã xong"
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
  tableName: "khac_phuc",
};

KhacPhuc.init(attributes, { ...options, sequelize });

module.exports = KhacPhuc;
