const { lichPhanCongServices } = require("../service");

const getListLichPhanCong = async (req) => {
    return await lichPhanCongServices.getListLichPhanCong(req.query);
}

const getLichPhanCongById = async (req) => {
    const id = req.params.id;
    return await lichPhanCongServices.getLichPhanCongById(id);
}

const createUpdateLichPhanCong = async (req) => {
    return await lichPhanCongServices.createUpdateLichPhanCong(req.body);
}

const deleteLichPhanCong = async (req) => {
    const id = req.params.id;
    return await lichPhanCongServices.deleteLichPhanCong(id);
}

module.exports = {
    getListLichPhanCong,
    getLichPhanCongById,
    createUpdateLichPhanCong,
    deleteLichPhanCong
}
