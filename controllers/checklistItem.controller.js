const { checklistItemServices } = require("../service");

const getChecklistByVitriType = async (req) => {
    const vitri_type_id = req.params.vitri_type_id;
    return await checklistItemServices.getChecklistByVitriType(vitri_type_id);
}

const getListChecklistItem = async (req) => {
    return await checklistItemServices.getListChecklistItem(req.query);
}

const getChecklistItemById = async (req) => {
    const id = req.params.id;
    return await checklistItemServices.getChecklistItemById(id);
}

const createUpdateChecklistItem = async (req) => {
    return await checklistItemServices.createUpdateChecklistItem(req.body);
}

const deleteChecklistItem = async (req) => {
    const id = req.params.id;
    return await checklistItemServices.deleteChecklistItem(id);
}

module.exports = {
    getChecklistByVitriType,
    getListChecklistItem,
    getChecklistItemById,
    createUpdateChecklistItem,
    deleteChecklistItem
}
