# LexiLens 

**Hệ sinh thái Đọc hiểu Học thuật, Phân tích Ngữ pháp theo Ngữ cảnh & Ôn tập Spaced Repetition (FSRS)**  
*Dành riêng cho sinh viên và người nghiên cứu chuyên ngành Ngôn ngữ Anh (English Linguistics)*

---

##  Tổng quan kiến trúc

Hệ thống LexiLens gồm 3 thành phần chính:

1. **`lexilens/` (Chrome Extension - Manifest V3):**
   - Hỗ trợ tra từ theo ngữ cảnh bài báo thực tế (bằng động cơ lai **Free Dictionary API** + **Google Gemini 2.0 Flash**).
   - Tự động bóc tách cú pháp câu phức, làm nổi bật ngữ pháp theo khối màu pastel học thuật.
   - Chế độ **Google Lens OCR** (`Alt+Shift+X`) cắt chụp ảnh trên tài liệu scan / PDF không cho bôi đen.
   - Giao diện bọc trong **Shadow DOM** tuân thủ nghiêm ngặt chuẩn thiết kế **Warm Editorial Scholar** (`DESIGN.md`).

2. **`web/` (PWA Web App - Mobile-first):**
   - Xây dựng bằng Vite + React 19 + TypeScript + Tailwind CSS.
   - Tối ưu cho thiết bị di động (PWA), hỗ trợ cài đặt ra màn hình chính điện thoại.
   - Ôn tập Flashcard theo thuật toán **FSRS (`ts-fsrs`)** với 4 cấp độ đánh giá, câu hỏi khuyết từ (Cloze).
   - Thư viện tra cứu từ vựng theo bài báo và chủ đề, biểu đồ thống kê học tập (Heatmap).

3. **`supabase/` (Backend & Cơ sở dữ liệu):**
   - Cơ sở dữ liệu PostgreSQL với bảo mật **Row Level Security (RLS)** cho từng tài khoản sinh viên.
   - Đồng bộ thời gian thực (Realtime) giữa Chrome Extension và Web App.

---

## 🎨 Ngôn ngữ thiết kế: Warm Editorial Scholar

* **Triết lý:** Loại bỏ hoàn toàn emoji, sử dụng 100% Vector Icons nét mảnh (Lucide Icons, `stroke-width="1.5"`).
* **Màu sắc:** Nền giấy ấm cổ điển Archival Parchment (`#faf9f5`), màu mực Deep Ink (`#1f1c19`), màu nhấn Đất nung Terracotta (`#9a4023`).
* **Phông chữ:** `Newsreader` (Serif học thuật cho Headwords), `Manrope` (Sans-serif cho nội dung & UI), `JetBrains Mono` (Monospace cho phiên âm IPA & tags).

---

## 🚀 Hướng dẫn phát triển

### 1. Chrome Extension
```bash
cd lexilens
bun install
bun run build
# Tải thư mục dist/ vào Chrome thông qua chrome://extensions (Bật Developer mode)
```

### 2. Web App (PWA)
```bash
cd web
bun install
bun run dev
```

---

## 📄 Bản quyền
Phát triển bởi đội ngũ LexiLens phục vụ mục đích nghiên cứu và giáo dục học thuật.
