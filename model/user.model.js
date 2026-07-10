const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class User extends BaseModel {
  static association() {
    const UserRole = require("./userRole.model");
    this.hasOne(UserRole, {
      foreignKey: "user_id",
      as: "user_role",
      targetKey: "id",
    });

    const RefreshToken = require("./refreshToken.model");
    this.hasOne(RefreshToken, {
      foreignKey: "user_id",
      targetKey: "id",
    });

    const DanhGia = require("./danhGia.model");
    this.hasMany(DanhGia, { foreignKey: "nguoi_danh_gia_id", as: "danh_gia", targetKey: "id" });

    const KhacPhuc = require("./khacPhuc.model");
    this.hasMany(KhacPhuc, { foreignKey: "nguoi_phu_trach_id", as: "khac_phuc", targetKey: "id" });

    const LichPhanCong = require("./lichPhanCong.model");
    this.hasMany(LichPhanCong, { foreignKey: "nguoi_thuc_hien_id", as: "lich_phan_cong", targetKey: "id" });

    // Mỗi nhân viên thuộc 1 khoa/phòng/trung tâm
    const Khoa = require("./khoa.model");
    this.belongsTo(Khoa, { foreignKey: "khoa_id", as: "khoa", targetKey: "id" });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  khoa_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
    defaultValue: null,
    references: {
      model: "khoa",
      key: "id",
    },
  },
  mobile: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.TINYINT(1),
    allowNull: true,
    default: 0,
  },
  del: {
    type: DataTypes.TINYINT(1),
    allowNull: true,
    defaultValue: 0,
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
  tableName: "user",
};

User.init(attributes, { ...options, sequelize });

module.exports = User;
