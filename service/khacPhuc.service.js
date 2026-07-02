const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const {
    KhacPhuc, DanhGiaChiTiet, DanhGia, ChecklistItem, Khoa, VitriType, User
} = require("../model");

const getListKhacPhuc = async (data) => {
    const paging = data.page && data.limit ? Paging(data.page, data.limit) : {};
    let where = { active: 1 };
    if (data.nguoi_phu_trach_id) where.nguoi_phu_trach_id = data.nguoi_phu_trach_id;
    if (data.trang_thai) where.trang_thai = data.trang_thai;

    // Lọc theo khoa/đợt đánh giá phải đi qua join tới danh_gia_chi_tiet -> danh_gia
    let danhGiaWhere = {};
    if (data.khoa_id) danhGiaWhere.khoa_id = data.khoa_id;

    const res = await KhacPhuc.findAll({
        where: { ...where },
        ...paging,
        order: [['han_xu_ly', 'asc'], ['id', 'desc']],
        include: [
            {
                model: DanhGiaChiTiet, as: 'danh_gia_chi_tiet',
                include: [
                    { model: ChecklistItem, as: 'checklist_item', attributes: ['id', 's_id', 's_name', 'sub', 'tc'] },
                    {
                        model: DanhGia, as: 'danh_gia', where: danhGiaWhere,
                        include: [
                            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
                            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
                        ]
                    },
                ]
            },
            { model: User, as: 'nguoi_phu_trach', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await KhacPhuc.count({ where: { ...where } })

    return { rows: res, total }
}

const getKhacPhucById = async (id) => {
    const data = await KhacPhuc.findOne({
        where: { id },
        include: [
            {
                model: DanhGiaChiTiet, as: 'danh_gia_chi_tiet',
                include: [
                    { model: ChecklistItem, as: 'checklist_item' },
                    {
                        model: DanhGia, as: 'danh_gia',
                        include: [
                            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
                            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
                        ]
                    },
                ]
            },
            { model: User, as: 'nguoi_phu_trach', attributes: ['id', 'username', 'email'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
    }

    return data
}

const createUpdateKhacPhuc = async (data) => {
    if (data.id) {
        const check = await KhacPhuc.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const create = await KhacPhuc.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm
const deleteKhacPhuc = async (id) => {
    const check = await KhacPhuc.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_KHAC_PHUC)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListKhacPhuc,
    getKhacPhucById,
    createUpdateKhacPhuc,
    deleteKhacPhuc
}
