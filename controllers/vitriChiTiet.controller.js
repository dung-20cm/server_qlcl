const { vitriChiTietServices } = require("../service");

const getListVitriChiTiet = async (req) => {
    return await vitriChiTietServices.getListVitriChiTiet(req.query);
}

const getVitriChiTietById = async (req) => {
    const id = req.params.id;
    return await vitriChiTietServices.getVitriChiTietById(id);
}

const createUpdateVitriChiTiet = async (req) => {
    return await vitriChiTietServices.createUpdateVitriChiTiet(req.body);
}

const deleteVitriChiTiet = async (req) => {
    const id = req.params.id;
    return await vitriChiTietServices.deleteVitriChiTiet(id);
}

module.exports = {
    getListVitriChiTiet,
    getVitriChiTietById,
    createUpdateVitriChiTiet,
    deleteVitriChiTiet
}
