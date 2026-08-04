const { danhGiaServices } = require("../service");

const getListDanhGia = async (req) => {
    return await danhGiaServices.getListDanhGia(req.query, req.authUser);
}

const getDanhGiaById = async (req) => {
    const id = req.params.id;
    return await danhGiaServices.getDanhGiaById(id);
}

const createDanhGia = async (req) => {
    return await danhGiaServices.createDanhGia(req.body, req.authUser);
}

const updateDanhGia = async (req) => {
    return await danhGiaServices.updateDanhGia({ id: req.params.id, ...req.body }, req.authUser);
}

const deleteDanhGia = async (req) => {
    const id = req.params.id;
    return await danhGiaServices.deleteDanhGia(id, req.authUser);
}

const getTopTieuChiLoi = async (req) => {
    return await danhGiaServices.getTopTieuChiLoi(req.query, req.authUser);
}

module.exports = {
    getListDanhGia,
    getDanhGiaById,
    createDanhGia,
    updateDanhGia,
    deleteDanhGia,
    getTopTieuChiLoi,
}
