const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { Paging } = require("../config/paging");
const { sequelize } = require("../config/connect");
const {
    DanhGia, DanhGiaChiTiet, Khoa, VitriType, VitriChiTiet, User, ChecklistItem
} = require("../model");

const getListDanhGia = async (data, authUser) => {
    const paging = data.page && data.limit ? Paging(data.page, data.limit) : {};
    let where = { active: 1 };
    if (data.khoa_id) where.khoa_id = data.khoa_id;
    if (data.vitri_type_id) where.vitri_type_id = data.vitri_type_id;
    if (data.nguoi_danh_gia_id) where.nguoi_danh_gia_id = data.nguoi_danh_gia_id;
    if (data.dot_danh_gia) where.dot_danh_gia = data.dot_danh_gia;
    if (data.tu_ngay || data.den_ngay) {
        where.ngay_danh_gia = {};
        if (data.tu_ngay) where.ngay_danh_gia[Op.gte] = data.tu_ngay;
        if (data.den_ngay) where.ngay_danh_gia[Op.lte] = data.den_ngay;
    }
    // Trưởng khoa / Nhân viên (không full scope) chỉ xem đánh giá của khoa mình,
    // bất kể client có truyền khoa_id khác hay không.
    if (authUser && !authUser.isFullScope) where.khoa_id = authUser.khoa_id;

    const res = await DanhGia.findAll({
        where: { ...where },
        ...paging,
        order: [['ngay_danh_gia', 'desc'], ['id', 'desc']],
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: VitriChiTiet, as: 'vitri_chi_tiet', attributes: ['id', 'ma_vitri'] },
            { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
        ]
    })

    const total = await DanhGia.count({ where: { ...where } })

    return { rows: res, total }
}

// Lấy 1 phiếu đánh giá kèm toàn bộ chi tiết từng tiêu chí, nhóm sẵn theo S
// (để hiển thị lại bảng kiểm giống lúc làm đánh giá, hoặc để in báo cáo).
const getDanhGiaById = async (id) => {
    const data = await DanhGia.findOne({
        where: { id },
        include: [
            { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
            { model: VitriChiTiet, as: 'vitri_chi_tiet', attributes: ['id', 'ma_vitri'] },
            { model: User, as: 'nguoi_danh_gia', attributes: ['id', 'username', 'email'] },
        ]
    })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_DANH_GIA)
    }

    const chiTiet = await DanhGiaChiTiet.findAll({
        where: { danh_gia_id: id },
        include: [{ model: ChecklistItem, as: 'checklist_item' }]
    })

    // Nhóm theo S1..S5 + tính điểm từng nhóm động (không lưu sẵn trong DB)
    const grouped = {};
    for (const row of chiTiet) {
        const ci = row.checklist_item;
        const sId = ci?.s_id || 'KHONG_RO';
        if (!grouped[sId]) {
            grouped[sId] = {
                id: sId,
                name: ci?.s_name,
                color: ci?.s_color,
                lt: ci?.s_lt,
                ok: 0,
                total: 0,
                items: []
            };
        }
        grouped[sId].total++;
        if (row.ket_qua === 1) grouped[sId].ok++;
        grouped[sId].items.push({
            id: row.id,
            checklist_item_id: row.checklist_item_id,
            sub: ci?.sub,
            tc: ci?.tc,
            ket_qua: row.ket_qua,
            ghi_chu: row.ghi_chu,
        });
    }
    Object.values(grouped).forEach(g => { g.pct = g.total ? Math.round((g.ok / g.total) * 100) : 0; });

    return { ...data.toJSON(), sScores: Object.values(grouped) }
}

// Tạo 1 phiếu đánh giá kèm toàn bộ chi tiết tiêu chí trong 1 transaction.
// payload: { khoa_id, vitri_type_id, vitri_chi_tiet_id, nguoi_danh_gia_id,
//   ngay_danh_gia, dot_danh_gia, chi_tiet: [{ checklist_item_id, ket_qua, ghi_chu }] }
const createDanhGia = async (data, authUser) => {
    const { chi_tiet, ...header } = data;

    if (!Array.isArray(chi_tiet) || chi_tiet.length === 0) {
        throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
    }

    // Trưởng khoa / Nhân viên (không full scope) chỉ được tạo đánh giá cho khoa của chính mình.
    if (authUser && !authUser.isFullScope && Number(header.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const so_tieu_chi_tong = chi_tiet.length;
    const so_tieu_chi_dat = chi_tiet.filter(c => c.ket_qua === 1).length;
    const pct = so_tieu_chi_tong ? Math.round((so_tieu_chi_dat / so_tieu_chi_tong) * 100) : 0;
    const xep_loai = pct >= 85 ? '✓ ĐẠT TỐT' : pct >= 70 ? '◎ ĐẠT' : '✗ CHƯA ĐẠT';

    return await sequelize.transaction(async (t) => {
        const danhGia = await DanhGia.create({
            ...header,
            so_tieu_chi_tong,
            so_tieu_chi_dat,
            pct,
            xep_loai,
            active: 1,
        }, { transaction: t });

        const rows = chi_tiet.map(c => ({
            danh_gia_id: danhGia.id,
            checklist_item_id: c.checklist_item_id,
            ket_qua: c.ket_qua,
            ghi_chu: c.ghi_chu || null,
        }));
        await DanhGiaChiTiet.bulkCreate(rows, { transaction: t });

        return danhGia;
    });
}

// Xoá mềm: chỉ ẩn (active=0), giữ dữ liệu lịch sử (KP, ảnh đã liên kết đánh giá này)
const deleteDanhGia = async (id, authUser) => {
    const check = await DanhGia.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_DANH_GIA)
    }

    // Trưởng khoa (không full scope) chỉ được xoá đánh giá của khoa mình.
    if (authUser && !authUser.isFullScope && Number(check.khoa_id) !== Number(authUser.khoa_id)) {
        throw new Error(ERROR_MESSAGE.FORBIDDEN);
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListDanhGia,
    getDanhGiaById,
    createDanhGia,
    deleteDanhGia
}
