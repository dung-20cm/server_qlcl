const { Op } = require("sequelize");
const { ERROR_MESSAGE } = require("../config/error");
const { ChecklistItem, VitriType } = require("../model");

// Lấy toàn bộ tiêu chí của 1 vị trí (dùng để hiển thị bảng kiểm khi làm đánh giá),
// nhóm sẵn theo S1..S5 cho tiện render ngoài client.
const getChecklistByVitriType = async (vitri_type_id) => {
    const rows = await ChecklistItem.findAll({
        where: { vitri_type_id, active: 1 },
        order: [['s_id', 'asc'], ['thu_tu', 'asc']],
    })

    const grouped = {};
    for (const row of rows) {
        if (!grouped[row.s_id]) {
            grouped[row.s_id] = {
                id: row.s_id,
                name: row.s_name,
                color: row.s_color,
                lt: row.s_lt,
                items: []
            };
        }
        grouped[row.s_id].items.push({
            id: row.id,
            sub: row.sub,
            tc: row.tc,
        });
    }

    return Object.values(grouped);
}

const getListChecklistItem = async (data) => {
    let where = { active: 1 };
    if (data.vitri_type_id) {
        where.vitri_type_id = data.vitri_type_id;
    }
    if (data.s_id) {
        where.s_id = data.s_id;
    }
    if (data.tc && data.tc != '') {
        where.tc = { [Op.like]: `%${data.tc}%` };
    }
    if (data.active === 'all') {
        delete where.active;
    }

    const res = await ChecklistItem.findAll({
        where: { ...where },
        order: [['vitri_type_id', 'asc'], ['s_id', 'asc'], ['thu_tu', 'asc']],
        include: [
            { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] }
        ]
    })

    const total = await ChecklistItem.count({ where: { ...where } })

    return { rows: res, total }
}

const getChecklistItemById = async (id) => {
    const data = await ChecklistItem.findOne({ where: { id: id } })

    if (!data) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_CHECKLIST_ITEM)
    }

    return data
}

const createUpdateChecklistItem = async (data) => {
    if (data.id) {
        const check = await ChecklistItem.findOne({ where: { id: data.id } })

        if (!check) {
            throw new Error(ERROR_MESSAGE.NOT_FOUND_CHECKLIST_ITEM)
        }

        const update = await check.update({ ...data })
        return update
    } else {
        const create = await ChecklistItem.create({ ...data, active: 1 })
        return create
    }
}

// Xoá mềm: chỉ ẩn (active=0), giữ dữ liệu lịch sử của các đánh giá đã dùng tiêu chí này
const deleteChecklistItem = async (id) => {
    const check = await ChecklistItem.findOne({ where: { id: id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_CHECKLIST_ITEM)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getChecklistByVitriType,
    getListChecklistItem,
    getChecklistItemById,
    createUpdateChecklistItem,
    deleteChecklistItem
}
