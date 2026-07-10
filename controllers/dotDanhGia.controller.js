const { dotDanhGiaServices } = require("../service");

const getListDotDanhGia = async (req) => {
    return await dotDanhGiaServices.getListDotDanhGia(req.query);
}

const getDotDanhGiaById = async (req) => {
    const id = req.params.id;
    return await dotDanhGiaServices.getDotDanhGiaById(id);
}

const createUpdateDotDanhGia = async (req) => {
    return await dotDanhGiaServices.createUpdateDotDanhGia(req.body);
}

const deleteDotDanhGia = async (req) => {
    const id = req.params.id;
    return await dotDanhGiaServices.deleteDotDanhGia(id);
}

module.exports = {
    getListDotDanhGia,
    getDotDanhGiaById,
    createUpdateDotDanhGia,
    deleteDotDanhGia,
}
