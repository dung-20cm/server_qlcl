const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// ============================================================================
// LƯU ẢNH CỤC BỘ TRÊN SERVER (thay Cloudinary — xem CLOUDINARY_README.txt để
// biết cách bật lại Cloudinary sau này nếu cần).
//
// Thư mục lưu ảnh nằm HẲN NGOÀI mã nguồn (không nằm trong repo server_qlcl/),
// cấu hình qua biến UPLOAD_DIR trong .env — giống hệt cách DB_HOST được cấu
// hình — để sau này đổi ổ/phân vùng chỉ cần sửa .env, không đụng code.
// ============================================================================

// Mặc định (nếu quên set UPLOAD_DIR trong .env): 1 thư mục "Anh_5S" ngay cạnh
// server_qlcl/ (ngoài mã nguồn) — KHÔNG dùng làm giá trị chính thức, chỉ để
// server không crash nếu thiếu cấu hình.
const UPLOAD_ROOT = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "Anh_5S"),
);

function ensureUploadRoot() {
  if (!fs.existsSync(UPLOAD_ROOT)) {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  }
  return UPLOAD_ROOT;
}

// Resize cạnh dài về tối đa 1600px (không phóng to ảnh nhỏ hơn) + nén JPEG
// chất lượng 78% — giảm trung bình 1 ảnh điện thoại từ ~500KB xuống còn
// ~100-150KB. Ảnh SVG giữ nguyên định dạng gốc (sharp không raster hoá SVG
// hợp lý cho mục đích ảnh minh chứng).
async function saveResizedImage(buffer, originalName, mimeType) {
  ensureUploadRoot();

  const isSvg =
    mimeType === "image/svg+xml" || /\.svg$/i.test(originalName || "");

  // Tổ chức theo yyyy/mm/dd để 1 thư mục không bị quá nhiều file, dễ dọn/archive
  // theo ngày sau này nếu cần.
  const now = new Date();
  const subDirParts = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ];
  const destDir = path.join(UPLOAD_ROOT, ...subDirParts);
  fs.mkdirSync(destDir, { recursive: true });

  if (isSvg) {
    const fileName = `${uuidv4()}.svg`;
    fs.writeFileSync(path.join(destDir, fileName), buffer);
    return {
      relativeKey: [...subDirParts, fileName].join("/"),
      mimeType: "image/svg+xml",
      sizeBytes: buffer.length,
    };
  }

  const outBuffer = await sharp(buffer)
    .rotate() // auto-xoay theo EXIF -- ảnh chụp điện thoại hay bị lật nếu bỏ qua
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();

  const fileName = `${uuidv4()}.jpg`;
  fs.writeFileSync(path.join(destDir, fileName), outBuffer);

  return {
    // Luôn dùng "/" (không dùng path.sep của Windows) để relativeKey nhất
    // quán khi lưu trong DB / dùng lại trên Linux nếu triển khai máy khác.
    relativeKey: [...subDirParts, fileName].join("/"),
    mimeType: "image/jpeg",
    sizeBytes: outBuffer.length,
  };
}

// Ghép relativeKey (lưu trong cột photo_gallery.url_anh) với UPLOAD_ROOT --
// có kiểm tra chống path traversal (phòng khi dữ liệu url_anh bất thường).
function resolveImagePath(relativeKey) {
  const root = ensureUploadRoot();
  const full = path.resolve(root, relativeKey);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error("INVALID_IMAGE_PATH");
  }
  return full;
}

// Xoá file vật lý — best-effort, không throw (dùng khi dọn ảnh cũ, không bắt
// buộc phải gọi ngay bây giờ vì photo_gallery đang xoá mềm active=0).
function deleteImageFile(relativeKey) {
  try {
    const full = resolveImagePath(relativeKey);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    // bỏ qua lỗi xoá file, không chặn luồng chính
  }
}

module.exports = {
  UPLOAD_ROOT,
  ensureUploadRoot,
  saveResizedImage,
  resolveImagePath,
  deleteImageFile,
};
