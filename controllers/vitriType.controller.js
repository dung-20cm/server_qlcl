const { vitriTypeServices } = require("../service");

const getListVitriType = async (req) => {
    return await vitriTypeServices.getListVitriType(req.query);
}

const getVitriTypeById = async (req) => {
    const id = req.params.id;
    return await vitriTypeServices.getVitriTypeById(id);
}

const createUpdateVitriType = async (req) => {
    return await vitriTypeServices.createUpdateVitriType(req.body);
}

const deleteVitriType = async (req) => {
    const id = req.params.id;
    return await vitriTypeServices.deleteVitriType(id);
}

module.exports = {
    getListVitriType,
    getVitriTypeById,
    createUpdateVitriType,
    deleteVitriType
}
