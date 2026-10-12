const { xuatDuLieuServices } = require("../service");

const getBangDuLieu = async (req) => {
  return await xuatDuLieuServices.getBangDuLieu(req.query);
};

// Thông tin gói ZIP ảnh (số ảnh, dung lượng) -- popup xác nhận trước khi tải.
const getZipAnh5SInfo = async (req) => {
  return await xuatDuLieuServices.getAnh5SZipInfo(req.query);
};

// Stream ZIP ảnh gốc thẳng vào response (không bọc JSON envelope).
const downloadZipAnh5S = async (req, res) => {
  try {
    await xuatDuLieuServices.streamAnh5SZip(req.query, res);
  } catch (err) {
    console.error("Xuất ZIP ảnh lỗi:", err.message);
    if (!res.headersSent) res.status(500).send({ statusCode: 500, message: "Xuất ZIP ảnh thất bại" });
    else res.destroy(err);
  }
};

module.exports = {
  getBangDuLieu,
  getZipAnh5SInfo,
  downloadZipAnh5S,
};
