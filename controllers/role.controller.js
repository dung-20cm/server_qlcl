const { roleServices } = require("../service");

const getListRole = async (req) => {
    return await roleServices.getListRole(req.query);
}

const getRoleById = async (req) => {
    const id = req.params.id;
    return await roleServices.getRoleById(id);
}

const createUpdateRole = async (req) => {
    return await roleServices.createUpdateRole(req.body);
}

const deleteRole = async (req) => {
    const id = req.params.id;
    return await roleServices.deleteRole(id);
}

const addRolePermission = async (req) => {
    const role_id = req.body.role_id;
    const list_permission = req.body.list_permission;
    return await roleServices.addRolePermission(role_id, list_permission);
}

module.exports = {
    getListRole,
    getRoleById,
    createUpdateRole,
    deleteRole,
    addRolePermission
}
