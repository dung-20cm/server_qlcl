const { anh5sTuanServices } = require("../service");

const getListAnh5sTuan = async (req) => {
    return await anh5sTuanServices.getListAnh5sTuan(req.query);
}

const getAnh5sTuanById = async (req) => {
    const id = req.params.id;
    return await anh5sTuanServices.getAnh5sTuanById(id);
}

const createUpdateAnh5sTuan = async (req) => {
    return await anh5sTuanServices.createUpdateAnh5sTuan(req.body);
}

const deleteAnh5sTuan = async (req) => {
    const id = req.params.id;
    return await anh5sTuanServices.deleteAnh5sTuan(id);
}

module.exports = {
    getListAnh5sTuan,
    getAnh5sTuanById,
    createUpdateAnh5sTuan,
    deleteAnh5sTuan
}
