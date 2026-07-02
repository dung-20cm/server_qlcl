const { sequelize } = require("../config/db.config");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class RolePermission extends BaseModel {
    static association() {
        const Permission = require("./permission.model");
        this.belongsTo(Permission, {
            foreignKey: "permission_id",
            as: "permission",
        });

        const Role = require("./role.model");
        this.belongsTo(Role, {
            foreignKey: "role_id",
            as: "role",
            targetKey: "id",
        })
    }
}

const attributes = {
    id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    role_id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        allowNull: false,
    },
    permission_id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
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
    }
}

const options = {
    tableName: "role_permission",
}

RolePermission.init(attributes, { ...options, sequelize });

module.exports = RolePermission;