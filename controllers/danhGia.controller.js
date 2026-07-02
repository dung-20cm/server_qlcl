const { danhGiaServices } = require("../service");

const getListDanhGia = async (req) => {
    return await danhGiaServices.getListDanhGia(req.query);
}

const getDanhGiaById = async (req) => {
    const id = req.params.id;
    return await danhGiaServices.getDanhGiaById(id);
}

const createDanhGia = async (req) => {
    return await danhGiaServices.createDanhGia(req.body);
}

const deleteDanhGia = async (req) => {
    const id = req.params.id;
    return await danhGiaServices.deleteDanhGia(id);
}

module.exports = {
    getListDanhGia,
    getDanhGiaById,
    createDanhGia,
    deleteDanhGia
}
