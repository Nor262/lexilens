# LexiLens 

**Hệ sinh thái Đọc hiểu Học thuật, Phân tích Ngữ pháp theo Ngữ cảnh & Ôn tập Spaced Repetition (FSRS)**  
*Dành riêng cho sinh viên và người nghiên cứu chuyên ngành Ngôn ngữ Anh (English Linguistics)*

---

## 1. Giới thiệu dự án

**LexiLens** là tiện ích mở rộng Chrome (Manifest V3) giải quyết triệt để 4 nỗi đau lớn nhất của người đọc tài liệu và báo chí tiếng Anh:
1. **Từ đa nghĩa (Polysemy):** Không liệt kê hàng chục nghĩa như từ điển truyền thống, LexiLens dùng AI để **chọn chính xác nghĩa phù hợp nhất trong ngữ cảnh câu văn đang đọc**.
2. **Lý giải ngữ cảnh (Contextual Reasoning):** Mục *"Vì sao nghĩa này?"* chỉ rõ các từ xung quanh (context clues) quyết định sắc thái ngữ nghĩa của từ.
3. **Bóc tách cú pháp câu phức (Syntax Anatomy):** Phân chia mệnh đề chính, mệnh đề phụ, mệnh đề quan hệ và cụm phân từ rút gọn theo các khối màu pastel học thuật trực quan.
4. **Học ngắt quãng (FSRS Spaced Repetition):** 1-Click lưu thẻ nhớ kèm trọn vẹn câu gốc và link bài báo; ôn tập trực tiếp trên **Chrome Side Panel** bằng thuật toán FSRS thế hệ mới.
5. **Nhận diện chữ trên ảnh/PDF (Google Lens Mode):** Nhấn phím tắt `Alt+Shift+X` để kéo chọn bất kỳ vùng tài liệu nào không cho bôi đen (slide bài giảng, PDF scan, hình ảnh) để OCR và tra cứu tức thì.

---

## 2. Ngôn ngữ thiết kế: "Warm Editorial Scholar"

LexiLens được thiết kế nghiêm ngặt theo bộ quy chuẩn **`DESIGN.md`**:
* **Không dùng emoji:** 100% sử dụng hệ thống vector icon nét mảnh (Lucide Icons, `stroke-width="1.5"`).
* **Màu sắc giấy sách cổ điển:** Nền Warm Parchment (`#faf9f5`), màu nhấn Đất nung Terracotta Clay (`#9a4023`), viền mảnh hairline `1px solid #e5e2d9`.
* **Phối hợp Typography chuẩn học thuật:**
  * Từ vựng & Tiêu đề: **Newsreader** (Serif)
  * Nội dung & Giao diện: **Manrope** (Sans-serif)
  * Phiên âm IPA & Thẻ kỹ thuật: **JetBrains Mono** (Monospace)
* **Shadow DOM:** Toàn bộ popup được cô lập trong Shadow DOM, đảm bảo 100% không bị CSS của các trang báo lớn (BBC, The New York Times, CNN, Nature...) làm vỡ bố cục.

---

## 3. Kiến trúc Động cơ Lai (Hybrid Engine)

* **Tầng 1 (Chuẩn mực học thuật):** `Free Dictionary API` (dữ liệu Wiktionary mã nguồn mở, miễn phí 100%) cung cấp phiên âm IPA chuẩn xác và file âm thanh MP3 phát âm bản xứ.
* **Tầng 2 (Ngữ cảnh & Sư phạm):** `Google Gemini 2.0 Flash / 1.5 Flash` (Gói Free Tier, 1.500 lượt tra/ngày) giải nghĩa theo ngữ cảnh, bóc tách cú pháp và nhận diện ảnh Multimodal OCR.
* **Tầng 3 (Thuật toán ghi nhớ):** `ts-fsrs` (Free Spaced Repetition Scheduler thế hệ mới) tính toán chu kỳ ôn tập tối ưu cho từng thẻ từ vựng.

---

## 4. Hướng dẫn cài đặt vào Google Chrome (Demo & Phát triển)

### Bước 1: Build mã nguồn
Dự án đã được biên dịch sẵn vào thư mục `dist/`. Nếu có thay đổi code, chỉ cần chạy:
```bash
bun install
bun run build
# hoặc: npm install && npm run build
```

### Bước 2: Cài đặt vào Chrome
1. Mở trình duyệt Chrome, truy cập: `chrome://extensions/`
2. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải.
3. Bấm vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
4. Chọn thư mục:
   ```
   /home/nor/Storage/Projects/extension/lexilens/dist
   ```
5. Tiện ích **LexiLens** sẽ xuất hiện trên thanh công cụ của Chrome!

### Bước 3: Cấu hình Gemini API Key
1. Bấm vào biểu tượng LexiLens trên thanh công cụ Chrome ➔ Bấm icon Cài đặt (bánh răng).
2. Nhập API Key miễn phí lấy từ [Google AI Studio](https://aistudio.google.com/).
3. Bấm **"Kiểm tra Key"** để xác nhận kết nối và độ trễ.
4. Bấm **"Lưu thay đổi"**.

---

## 5. Kịch bản Demo 30 giây trên sân khấu

1. **Tra từ ngữ cảnh:** Mở một bài báo bất kỳ (ví dụ Reuters/The Economist), bôi đen từ *"table"* trong cụm *"table the motion"*.
2. **Xem phân tích:** Icon thấu kính lấp lánh xuất hiện ➔ Bấm vào ➔ Popup hiện nghĩa *"hoãn bàn đề xuất"* kèm lý do chọn nghĩa trong cuộc họp. Bấm nút loa nghe phát âm chuẩn.
3. **Lưu thẻ nhớ:** Bấm nút *"Lưu vào kho ôn tập (Spaced Repetition)"* ➔ Nút chuyển trạng thái tích xanh thành công.
4. **Ôn tập tức thì:** Bấm icon LexiLens ➔ Chọn *"Mở thanh học tập Sidepanel"* ➔ Màn hình trượt từ bên phải xuất hiện thẻ bài vừa lưu, bấm *"Lật thẻ"* và đánh giá 4 mức nhớ (Quên, Khó, Nhớ, Dễ).
5. **Chụp vùng OCR:** Mở một file slide PDF không bôi đen được ➔ Nhấn `Alt+Shift+X` ➔ Kéo chọn đoạn văn ➔ Gemini OCR nhận diện chữ và phân tích trọn vẹn ngữ pháp.
