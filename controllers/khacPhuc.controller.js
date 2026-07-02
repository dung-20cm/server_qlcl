const { khacPhucServices } = require("../service");

const getListKhacPhuc = async (req) => {
    return await khacPhucServices.getListKhacPhuc(req.query);
}

const getKhacPhucById = async (req) => {
    const id = req.params.id;
    return await khacPhucServices.getKhacPhucById(id);
}

const createUpdateKhacPhuc = async (req) => {
    return await khacPhucServices.createUpdateKhacPhuc(req.body);
}

const deleteKhacPhuc = async (req) => {
    const id = req.params.id;
    return await khacPhucServices.deleteKhacPhuc(id);
}

module.exports = {
    getListKhacPhuc,
    getKhacPhucById,
    createUpdateKhacPhuc,
    deleteKhacPhuc
}
