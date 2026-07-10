const { sequelize } = require("../config/db.config");
const BaseModel = require("./BaseModel");
const { DataTypes } = require("sequelize");

class Permission extends BaseModel {
    static association() {
        const RolePermission = require("./rolePermission.model");
        this.hasMany(RolePermission, {
            foreignKey: "permission_id",
            as: "role_permission",
            sourceKey: "id",
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
    name: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    slug: {
        type: DataTypes.STRING(255),
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
    tableName: "permission",
}

Permission.init(attributes, { ...options, sequelize });

module.exports = Permission;

