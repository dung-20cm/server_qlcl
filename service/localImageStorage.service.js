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
//
// Tên file: ưu tiên đặt theo ngữ cảnh dễ đọc (xem photoNaming.service.js), VD
// "Ptchc_dungpt_12082026_anh1.jpg" -- rơi về uuid ngẫu nhiên nếu không đủ dữ
// liệu (khoa/người/ngày) để đặt tên. Khi sửa/xoá ảnh, tên file trên đĩa cũng
// được đổi theo (renameImageFile/renameToDeletedMarker) để người quản lý nhìn
// trực tiếp trong thư mục vẫn hiểu đúng trạng thái, không cần mở app.
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

// Tìm 1 tên file CHƯA tồn tại trong `destDir`, bắt đầu từ `baseName + ext`;
// nếu trùng thì thử "baseName (2)", "(3)"... -- phòng trường hợp hiếm 2 ảnh
// cùng khoa/người/ngày/thứ tự (VD 1 người làm 2 lượt đánh giá cùng khoa cùng
// ngày) để KHÔNG bao giờ ghi đè mất ảnh cũ.
function findAvailableFileName(destDir, baseName, ext) {
  let candidate = `${baseName}${ext}`;
  let attempt = 1;
  while (fs.existsSync(path.join(destDir, candidate))) {
    attempt += 1;
    candidate = `${baseName} (${attempt})${ext}`;
    if (attempt > 50) {
      // an toàn tối đa, tránh vòng lặp vô hạn trong tình huống bất thường
      candidate = `${baseName}-${uuidv4().slice(0, 8)}${ext}`;
      break;
    }
  }
  return candidate;
}

// Resize cạnh dài về tối đa 1600px (không phóng to ảnh nhỏ hơn) + nén JPEG
// chất lượng 78% — giảm trung bình 1 ảnh điện thoại từ ~500KB xuống còn
// ~100-150KB. Ảnh SVG giữ nguyên định dạng gốc (sharp không raster hoá SVG
// hợp lý cho mục đích ảnh minh chứng).
//
// `baseName` (tuỳ chọn): tên file mong muốn KHÔNG kèm đuôi, VD
// "Ptchc_dungpt_12082026_anh1" (xem buildPhotoBaseName). Không truyền thì rơi
// về uuid ngẫu nhiên như trước.
async function saveResizedImage(buffer, originalName, mimeType, baseName) {
  ensureUploadRoot();

  const isSvg =
    mimeType === "image/svg+xml" || /\.svg$/i.test(originalName || "");

  // Tổ chức theo yyyy/mm/dd (ngày UPLOAD, không phải ngày đánh giá) để 1 thư
  // mục không bị quá nhiều file, dễ dọn/archive theo thời gian sau này.
  const now = new Date();
  const subDirParts = [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ];
  const destDir = path.join(UPLOAD_ROOT, ...subDirParts);
  fs.mkdirSync(destDir, { recursive: true });

  const ext = isSvg ? ".svg" : ".jpg";
  const wantedBase = baseName || uuidv4();
  const fileName = findAvailableFileName(destDir, wantedBase, ext);

  if (isSvg) {
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

// Tách relativeKey (luôn dùng "/") thành {dirPart, base, ext} -- dùng chung
// cho các hàm đổi tên bên dưới.
function splitRelativeKey(relativeKey) {
  const lastSlash = relativeKey.lastIndexOf("/");
  const dirPart = lastSlash >= 0 ? relativeKey.slice(0, lastSlash + 1) : "";
  const fileName = lastSlash >= 0 ? relativeKey.slice(lastSlash + 1) : relativeKey;
  const dotIdx = fileName.lastIndexOf(".");
  const base = dotIdx >= 0 ? fileName.slice(0, dotIdx) : fileName;
  const ext = dotIdx >= 0 ? fileName.slice(dotIdx) : "";
  return { dirPart, base, ext };
}

// Đổi tên file vật lý sang `newBaseNoExt` (giữ nguyên thư mục + đuôi file) --
// dùng khi SỬA thông tin ảnh (khoa/người/ngày đổi -> tên phải đổi theo) hoặc
// khi đánh dấu XOÁ (thêm hậu tố _daxoa). Có xử lý trùng tên (không ghi đè).
// Trả về relativeKey MỚI, hoặc null nếu ảnh nguồn không tồn tại trên đĩa /
// đang là link Cloudinary cũ (không đổi tên được link ngoài).
function renameImageFile(relativeKey, newBaseNoExt) {
  if (!relativeKey || /^https?:\/\//i.test(relativeKey)) return null;
  let oldFull;
  try {
    oldFull = resolveImagePath(relativeKey);
  } catch {
    return null;
  }
  if (!fs.existsSync(oldFull)) return null;

  const { dirPart, base, ext } = splitRelativeKey(relativeKey);
  if (newBaseNoExt === base) return relativeKey; // tên không đổi, khỏi đụng file

  const destDirFull = path.dirname(oldFull);
  const fileName = findAvailableFileName(destDirFull, newBaseNoExt, ext);
  const newRelativeKey = `${dirPart}${fileName}`;

  fs.renameSync(oldFull, resolveImagePath(newRelativeKey));
  return newRelativeKey;
}

// Đánh dấu ảnh ĐÃ XOÁ ngay trên tên file (thêm hậu tố "_daxoa") -- để mở thư
// mục UPLOAD_DIR bằng Explorer cũng nhận ra ảnh nào đã xoá mà không cần mở
// app. Idempotent: gọi lại nhiều lần không bị lặp "_daxoa_daxoa".
function renameToDeletedMarker(relativeKey) {
  if (!relativeKey || /^https?:\/\//i.test(relativeKey)) return null;
  const { base } = splitRelativeKey(relativeKey);
  if (base.endsWith("_daxoa")) return relativeKey;
  return renameImageFile(relativeKey, `${base}_daxoa`);
}

// Lấy lại "anhN" (số thứ tự) từ tên file hiện có, dùng khi SỬA context
// (khoa/người/ngày) mà KHÔNG muốn đánh số lại thứ tự ảnh trong lượt.
function extractPhotoIndex(relativeKey) {
  if (!relativeKey) return 1;
  const { base } = splitRelativeKey(relativeKey);
  const m = /_anh(\d+)(?:_daxoa)?$/.exec(base);
  return m ? Number(m[1]) : 1;
}

// Xoá file vật lý — best-effort, không throw (dự phòng cho tác vụ dọn ảnh cũ
// sau này, KHÔNG dùng khi người dùng bấm "Xoá ảnh" -- xem renameToDeletedMarker).
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
  renameImageFile,
  renameToDeletedMarker,
  extractPhotoIndex,
  deleteImageFile,
};
