const { xuatDuLieuServices } = require("../service");

const getBangDuLieu = async (req) => {
  return await xuatDuLieuServices.getBangDuLieu(req.query);
};

module.exports = {
  getBangDuLieu,
};
