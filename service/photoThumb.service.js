const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { UPLOAD_ROOT, resolveImagePath } = require("./localImageStorage.service");

// ============================================================================
// ẢNH THU NHỎ (thumbnail) cho ảnh minh chứng -- phục vụ xuất Excel/Google Sheet
// (và có thể dùng cho danh sách ảnh sau này). Ảnh gốc lưu tới 1600x1600 (vài
// trăm KB); khi xuất hàng nghìn ảnh mà trình duyệt phải tải hết ảnh gốc về rồi
// tự thu nhỏ thì rất chậm. Thumbnail ~240x180 chỉ vài KB nên nhẹ hơn khoảng 50
// lần.
//
// Tạo "lười" (lazy) + cache: lần đầu có người xin thumbnail của ảnh id=N thì
// sinh ra rồi lưu ở <UPLOAD_DIR>/_thumbs/N.jpg, các lần sau đọc thẳng file đó.
// Cách này KHÔNG phải sửa luồng upload/đổi tên/xoá ảnh và ảnh cũ có sẵn tự có
// thumbnail khi cần, không cần script chạy bù. Cache theo id (không theo đường
// dẫn) nên đổi tên file ảnh (khoa/ngày đổi, thêm _daxoa) không làm mất cache;
// so sánh mtime với ảnh gốc để tự sinh lại nếu ảnh gốc bị thay.
// ============================================================================

const THUMB_DIR = path.join(UPLOAD_ROOT, "_thumbs");
const THUMB_W = 240;
const THUMB_H = 180;
const THUMB_QUALITY = 70;

// Chống sinh trùng cùng 1 thumbnail khi nhiều request cùng xin 1 ảnh lúc cache còn trống.
const inflight = new Map();

async function writeThumb(buffer, dest) {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const tmp = `${dest}.${process.pid}.tmp`;
  await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_W, height: THUMB_H, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toFile(tmp);
  fs.renameSync(tmp, dest);
}

// Trả về đường dẫn file thumbnail (đã đảm bảo tồn tại), hoặc null nếu không có
// ảnh gốc để tạo (file mất / link ngoài lỗi).
async function ensureThumbFile(photo) {
  const dest = path.join(THUMB_DIR, `${photo.id}.jpg`);
  const isRemote = /^https?:\/\//i.test(photo.url_anh || "");

  let srcPath = null;
  let srcMtime = 0;
  if (!isRemote) {
    srcPath = resolveImagePath(photo.url_anh);
    if (!fs.existsSync(srcPath)) return null;
    srcMtime = fs.statSync(srcPath).mtimeMs;
  }

  if (fs.existsSync(dest) && (isRemote || fs.statSync(dest).mtimeMs >= srcMtime)) {
    return dest;
  }

  if (inflight.has(photo.id)) return inflight.get(photo.id);

  const job = (async () => {
    try {
      let buffer;
      if (isRemote) {
        // Ảnh cũ còn lưu link Cloudinary -- tải về 1 lần để tạo thumbnail rồi cache.
        const res = await fetch(photo.url_anh);
        if (!res.ok) return null;
        buffer = Buffer.from(await res.arrayBuffer());
      } else {
        buffer = fs.readFileSync(srcPath);
      }
      await writeThumb(buffer, dest);
      return dest;
    } catch (err) {
      console.error("Tạo thumbnail lỗi (photo id " + photo.id + "):", err.message);
      return null;
    } finally {
      inflight.delete(photo.id);
    }
  })();
  inflight.set(photo.id, job);
  return job;
}

module.exports = { ensureThumbFile, THUMB_DIR };
