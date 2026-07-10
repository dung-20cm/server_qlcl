const { lichPhanCongServices } = require("../service");

const getListLichPhanCong = async (req) => {
    return await lichPhanCongServices.getListLichPhanCong(req.query, req.authUser);
}

const getLichPhanCongById = async (req) => {
    const id = req.params.id;
    return await lichPhanCongServices.getLichPhanCongById(id);
}

const createUpdateLichPhanCong = async (req) => {
    return await lichPhanCongServices.createUpdateLichPhanCong(req.body, req.authUser);
}

const deleteLichPhanCong = async (req) => {
    const id = req.params.id;
    return await lichPhanCongServices.deleteLichPhanCong(id, req.authUser);
}

module.exports = {
    getListLichPhanCong,
    getLichPhanCongById,
    createUpdateLichPhanCong,
    deleteLichPhanCong
}
