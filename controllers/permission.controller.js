const { permissionServices } = require("../service");

const getListPermissions = async (req) => {
    return await permissionServices.getListPermissions(req.query);
}

const getPermissionById = async (req) => {
    const id = req.params.id;
    return await permissionServices.getPermissionById(id);
}

const createUpdatePermission = async (req) => {
    return await permissionServices.createUpdatePermission(req.body);
}

const deletePermission = async (req) => {
    const id = req.params.id;
    return await permissionServices.deletePermission(id);
}

const getListPermissionByRoleId = async (req) => {
    const role_id = req.params.role_id;
    return await permissionServices.getListPermissionByRoleId(role_id);
}

module.exports = {
    getListPermissions,
    getPermissionById,
    createUpdatePermission,
    deletePermission,
    getListPermissionByRoleId
}
