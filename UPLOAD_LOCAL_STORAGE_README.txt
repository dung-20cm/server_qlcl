HƯỚNG DẪN BẬT LẠI LƯU ẢNH VÀO static/uploads/ (LƯU FILE TẠM TRÊN ĐĨA SERVER)
============================================================================
Cập nhật: 2026-07-09

TRẠNG THÁI HIỆN TẠI (mặc định từ 2026-07-09):
  Ảnh upload chỉ giữ trong RAM (multer.memoryStorage) rồi đẩy thẳng buffer lên
  Cloudinary qua upload_stream — KHÔNG còn ghi file nào vào ổ đĩa server
  (static/uploads/) nữa. Lý do: tiết kiệm dung lượng đĩa server.

  File liên quan: hospital_server/server.js và
  hospital_server/server_qlcl_push/server.js (route "POST /api/upload/uploadImage").
  Hai file này cần sửa ĐỒNG BỘ như nhau.

MUỐN BẬT LẠI CHẾ ĐỘ GHI FILE TẠM RA static/uploads/ TRƯỚC KHI ĐẨY CLOUDINARY?
(Ví dụ: cần debug xem ảnh gốc client gửi lên, hoặc đã có đủ dung lượng đĩa)

Làm theo đúng thứ tự sau, trong CẢ HAI file server.js và server_qlcl_push/server.js:

Bước 1 — Xoá (hoặc comment lại) dòng này:
    const storage = multer.memoryStorage();

Bước 2 — Ngay phía trên dòng đó là khối code cũ đã bị comment, bắt đầu bằng:
    // --- (ĐANG TẮT) Lưu ảnh vào static/uploads trên đĩa server ---
    // const storage = multer.diskStorage({
    ...
    // });
  Bỏ hết dấu "//" ở đầu mỗi dòng trong khối này để kích hoạt lại.

Bước 3 — Trong route app.post("/api/upload/uploadImage", ...), tìm đoạn:
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "uploads" },
        (uploadError, uploadResult) => {
          if (uploadError) return reject(uploadError);
          resolve(uploadResult);
        },
      );
      Readable.from(file.buffer).pipe(uploadStream);
    });
  Đổi thành (dùng file.path thay vì file.buffer, vì lúc này multer đã ghi file
  thật ra đĩa rồi):
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "uploads",
    });

Bước 4 — (Khuyến nghị) Thêm lại đoạn dọn file tạm sau khi xử lý xong, để ảnh
  không tích luỹ vĩnh viễn trên đĩa (đây chính là nguyên nhân từng gây đầy
  dung lượng trước đây) — bọc đoạn cloudinary.uploader.upload ở trên bằng
  try/catch/finally, thêm:
    } finally {
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) console.log("Xoá file tạm thất bại:", unlinkErr.message);
      });
    }

Bước 5 — Khởi động lại server:
    npm run dev

LƯU Ý:
  - Nếu bỏ qua Bước 4 (không dọn file tạm), mỗi lần upload ảnh sẽ để lại 1 file
    trong static/uploads/ mãi mãi — dễ làm đầy đĩa lại như trước, nên cân nhắc kỹ.
  - Có thể dùng cron/script định kỳ xoá file cũ trong static/uploads/ (ví dụ
    file quá 7 ngày) thay vì xoá ngay sau upload, nếu muốn giữ lại ảnh gốc một
    thời gian để đối chiếu.
