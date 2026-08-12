HƯỚNG DẪN BẬT LẠI LƯU ẢNH LÊN CLOUDINARY (thay vì lưu cục bộ trên server)
============================================================================
Cập nhật: 2026-08-12

TRẠNG THÁI HIỆN TẠI (mặc định từ 2026-08-12):
  Ảnh minh chứng 5S được resize (cạnh dài <=1600px) + nén JPEG (chất lượng
  78%) rồi ghi CỐ ĐỊNH ra đĩa server, tại thư mục cấu hình trong biến
  UPLOAD_DIR (file .env) -- KHÔNG còn gọi Cloudinary nữa.

  File liên quan:
    - server.js                              (route "POST /api/upload/uploadImage")
    - service/localImageStorage.service.js   (resize/nén + ghi/đọc file trên đĩa)
    - service/photoGallery.service.js        (getImageForServing -- kiểm tra
                                               khoa trước khi trả ảnh)
    - controllers/photoGallery.controller.js (serveImage)
    - routes/photoGallery.routes.js          (GET /api/photo-gallery/image/:id)
    - .env                                   (UPLOAD_DIR, các biến CLOUDINARY_*
                                               đang bị comment lại)

  Toàn bộ code Cloudinary CŨ vẫn còn nguyên trong server.js, chỉ bị COMMENT
  lại (không xoá) -- xem 2 khối đánh dấu "CLOUDINARY (ĐANG TẮT)".

MUỐN QUAY LẠI DÙNG CLOUDINARY?
Làm theo đúng thứ tự sau:

Bước 1 -- Mở .env, bỏ dấu "#" ở đầu 3 dòng CLOUDINARY_CLOUD_NAME /
  CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET (đang comment trong khối
  "===== CLOUDINARY (ĐANG TẮT) ====="). Có thể giữ nguyên UPLOAD_DIR (không
  bắt buộc phải xoá).

Bước 2 -- Trong server.js, tìm khối:
    // ============================================================================
    // CLOUDINARY (ĐANG TẮT — 2026-08-12) ...
    // ============================================================================
    // const cloudinary = require("cloudinary").v2;
    //
    // cloudinary.config({ ... });
  Bỏ hết dấu "//" ở đầu mỗi dòng để kích hoạt lại require + config Cloudinary.

Bước 3 -- Trong cùng file, bên trong route
  app.post("/api/upload/uploadImage", ...), tìm khối code Cloudinary đang bị
  comment (bắt đầu bằng "// try {", có gọi cloudinary.uploader.upload_stream)
  -- bỏ comment lại TOÀN BỘ khối đó.

  Ngay phía dưới là khối "Lưu ảnh CỤC BỘ trên server" (đang active) -- COMMENT
  lại khối này để tắt (không xoá, đề phòng cần dùng lại đường lưu cục bộ).

Bước 4 -- (Nếu muốn) Đổi lại field trả về cho khớp cách cũ: Cloudinary trả
  `result.secure_url` là URL CÔNG KHAI đầy đủ, khác hẳn với cách lưu cục bộ
  hiện tại (trả về 1 KEY tương đối, không phải URL công khai). Nghĩa là khi
  dùng lại Cloudinary, ảnh sẽ hiển thị được trực tiếp qua `photo.url_anh` mà
  KHÔNG cần đi qua route GET /api/photo-gallery/image/:id nữa -- nên đồng thời
  cân nhắc revert luôn phần frontend đã đổi sang gọi photoImageUrl(id)
  (CMS_Dashboard_QLCL/src/features/qlcl/api.ts) về lại dùng thẳng
  `photo.url_anh`, HOẶC đơn giản hơn là GIỮ NGUYÊN route serveImage (nó đã tự
  nhận diện url_anh dạng "http..." và redirect sang Cloudinary -- xem
  getImageForServing trong photoGallery.service.js) -- không bắt buộc phải
  sửa gì thêm ở frontend nếu chọn cách này.

Bước 5 -- Khởi động lại server:
    npm run dev

LƯU Ý:
  - Ảnh ĐÃ upload lên đĩa cục bộ (trong lúc dùng chế độ hiện tại) sẽ KHÔNG tự
    chuyển lên Cloudinary khi bật lại -- 2 nguồn lưu trữ tồn tại song song.
    Route serveImage (GET /api/photo-gallery/image/:id) vẫn phục vụ đúng cả 2
    loại: url_anh dạng "http..." (Cloudinary) thì redirect, dạng key tương đối
    thì đọc từ đĩa qua UPLOAD_DIR -- không cần script migrate dữ liệu cũ.
  - Nếu ngừng hẳn dùng lưu cục bộ, thư mục UPLOAD_DIR (VD
    D:\My-project\Hospital\Anh_5S) vẫn còn ảnh cũ trên đó -- tự dọn tay nếu
    muốn giải phóng đĩa.
