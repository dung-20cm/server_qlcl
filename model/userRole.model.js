const { sequelize } = require("../config/connect");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");
/**
 * Define Level Model
 *
 * @export
 * @class Level
 * @extends {BaseModel}
 */
class UserRole extends BaseModel {
  static association() {
    const Role = require("./role.model");
    this.belongsTo(Role, {
      targetKey: "id",
      foreignKey: "role_id",
      as: "role",
    });
    const User = require("./user.model");
    this.belongsTo(User, {
      targetKey: "id",
      foreignKey: "user_id",
      as: "user",
    });
  }
}
/**
 * Attributes model
 */
const attributes = {
  id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  role_id: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: false,
  },
  del: {
    type: DataTypes.TINYINT(1),
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

/**
 * Options model
 */
const options = {
  tableName: "user_role",
};

/**
 * Init Model
 */
UserRole.init(attributes, { ...options, sequelize });

module.exports = UserRole;
