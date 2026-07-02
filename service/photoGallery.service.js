const { ERROR_MESSAGE } = require("../config/error");
const { PhotoGallery, DanhGia, ChecklistItem, Khoa, VitriType } = require("../model");

const getListPhotoGallery = async (data) => {
    let where = { active: 1 };
    if (data.danh_gia_id) where.danh_gia_id = data.danh_gia_id;
    if (data.checklist_item_id) where.checklist_item_id = data.checklist_item_id;

    const res = await PhotoGallery.findAll({
        where: { ...where },
        order: [['id', 'desc']],
        include: [
            {
                model: DanhGia, as: 'danh_gia',
                include: [
                    { model: Khoa, as: 'khoa', attributes: ['id', 'ten_khoa'] },
                    { model: VitriType, as: 'vitri_type', attributes: ['id', 'ten_vitri'] },
                ]
            },
            { model: ChecklistItem, as: 'checklist_item', attributes: ['id', 'sub', 'tc'] },
        ]
    })

    const total = await PhotoGallery.count({ where: { ...where } })

    return { rows: res, total }
}

// Thêm 1 ảnh (url_anh phải là link đã upload sẵn - chưa có route upload thật,
// sẽ bổ sung khi làm phần upload ảnh lên Cloudinary).
const createPhotoGallery = async (data) => {
    const create = await PhotoGallery.create({ ...data, active: 1 })
    return create
}

// Thêm nhiều ảnh cùng lúc cho 1 lần đánh giá
const createManyPhotoGallery = async (data) => {
    const { danh_gia_id, photos } = data;
    if (!danh_gia_id || !Array.isArray(photos) || photos.length === 0) {
        throw new Error(ERROR_MESSAGE.REQUIRED_PARAMS);
    }

    const rows = photos.map(p => ({
        danh_gia_id,
        checklist_item_id: p.checklist_item_id || null,
        url_anh: p.url_anh,
        ten_file: p.ten_file || null,
        mime_type: p.mime_type || null,
        active: 1,
    }));

    return await PhotoGallery.bulkCreate(rows);
}

const deletePhotoGallery = async (id) => {
    const check = await PhotoGallery.findOne({ where: { id } })

    if (!check) {
        throw new Error(ERROR_MESSAGE.NOT_FOUND_PHOTO_GALLERY)
    }

    const del = await check.update({ active: 0 })
    return del
}

module.exports = {
    getListPhotoGallery,
    createPhotoGallery,
    createManyPhotoGallery,
    deletePhotoGallery
}
