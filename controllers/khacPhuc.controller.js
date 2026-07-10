const { khacPhucServices } = require("../service");

const getListKhacPhuc = async (req) => {
    return await khacPhucServices.getListKhacPhuc(req.query, req.authUser);
}

const getKhacPhucById = async (req) => {
    const id = req.params.id;
    return await khacPhucServices.getKhacPhucById(id);
}

const createUpdateKhacPhuc = async (req) => {
    return await khacPhucServices.createUpdateKhacPhuc(req.body, req.authUser);
}

const deleteKhacPhuc = async (req) => {
    const id = req.params.id;
    return await khacPhucServices.deleteKhacPhuc(id, req.authUser);
}

module.exports = {
    getListKhacPhuc,
    getKhacPhucById,
    createUpdateKhacPhuc,
    deleteKhacPhuc
}
