const { khoaServices } = require("../service");

const getListKhoa = async (req) => {
    return await khoaServices.getListKhoa(req.query);
}

const getKhoaById = async (req) => {
    const id = req.params.id;
    return await khoaServices.getKhoaById(id);
}

const createUpdateKhoa = async (req) => {
    return await khoaServices.createUpdateKhoa(req.body);
}

const deleteKhoa = async (req) => {
    const id = req.params.id;
    return await khoaServices.deleteKhoa(id);
}

module.exports = {
    getListKhoa,
    getKhoaById,
    createUpdateKhoa,
    deleteKhoa
}
