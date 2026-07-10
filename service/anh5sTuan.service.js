const { ERROR_MESSAGE } = require("../config/error");
const { sequelize } = require("../config/connect");
const { Anh5sTuan, Anh5sTuanVitri, Khoa, VitriType } = require("../model");

const getListAnh5sTuan = async (data) => {
    let where = { active: 1 };
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.tu_tuan || data.den_tuan) {
        where.tuan = {};
        const { Op } = require("sequelize");
        if (data.tu_tuan) where.tuan[Op.gte] = data.tu_tuan;
        if (data.den_tuan) where.tuan[Op.lte] = data.den_tuan;
    }
    if (data.active === 'all') delete where.active;

    const res = await Anh5sTuan.findAll({
        where: { ...where },
        order: [['tuan', 'desc'], ['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            {
                model: Anh5sTuanVitri, as: 'vi_tri',
                include: [{ model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] }]
            },
        ]
    })

    const total = await Anh5sTuan.count({ where: { ...where } })

    return { rows: res, total }
}

const getAnh5sTuanById = async (id) => {
    const data = await Anh5sTuan.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            {
                model: Anh5sTuanVitri, as: 'vi_tri',
                include: [{ model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] }]
            },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_ANH_5S_TUAN)
    }

    return data
}

// payload: { id?, khoa_id, tuan, so_luong_anh, chat_luong, ghi_chu, vitri_type_ids: [1,2,3] }
// Tạo/sửa 1 dòng anh_5s_tuan kèm danh sách vị trí đã chụp trong tuần đó,
// trong 1 transaction (giống cách làm ở createDanhGia).
const createUpdateAnh5sTuan = async (data) => {
    // Chấp nhận cả 2 tên field: `vitri_type_ids` (chuẩn) và `vi_tri` (CMS cũ gửi lên)
    const { vitri_type_ids, vi_tri, ...header } = data;
    const vitriIds = Array.isArray(vitri_type_ids) ? vitri_type_ids : vi_tri;

    return await sequelize.transaction(async (t) => {
        let anh5s;

        if (header.id) {
            anh5s = await Anh5sTuan.findOne({ where: { id: header.id }, transaction: t });
            if (!anh5s) {
                throw new Error(ERROR_MESSAGE.NOT_FOUND_ANH_5S_TUAN)
            }
            await anh5s.update({ ...header }, { transaction: t });
        } else {
            anh5s = await Anh5sTuan.create({ ...header, active: 1 }, { transaction: t });
        }

        // Nếu có gửi danh sách vị trí thì thay toàn bộ danh sách cũ bằng danh sách mới
        if (Array.isArray(vitriIds)) {
            await Anh5sTuanVitri.destroy({ where: { anh_5s_tuan_id: anh5s.id }, transaction: t });

            if (vitriIds.length > 0) {
                const rows = vitriIds.map(vitri_type_id => ({
                    anh_5s_tuan_id: anh5s.id,
                    vitri_type_id,
                }));
                await Anh5sTuanVitri.bulkCreate(rows, { transaction: t });
            }
        }

        return anh5s;
    });
}

// Xoá mềm (bảng phụ anh_5s_tuan_vitri giữ nguyên, không cần xoá vì luôn join qua active của bảng cha)
const deleteAnh5sTuan = async (id) => {
    const check = await Anh5sTuan.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_ANH_5S_TUAN)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListAnh5sTuan,
    getAnh5sTuanById,
    createUpdateAnh5sTuan,
    deleteAnh5sTuan
}
