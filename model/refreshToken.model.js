const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class RefreshToken extends BaseModel {
  static association() {
    const User = require("./user.model");
    this.belongsTo(User, {
      targetKey: "id",
      foreignKey: "user_id",
      // as: "user",
    });
  }
}

const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  exprityDate: {
    type: DataTypes.DATE,
    allowNull: false,
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
  tableName: "refreshToken",
};

RefreshToken.init(attributes, { ...options, sequelize });

module.exports = RefreshToken;
