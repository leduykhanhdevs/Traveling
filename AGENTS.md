# AGENTS.md — Traveling

Quy tắc cho mọi AI agent (GitLab Duo) làm việc trong repo này. Áp dụng cho tất cả các phiên/cửa sổ chat.

> Lưu ý: `context-mill/AGENTS.md` là quy tắc riêng của thư mục con `context-mill/` (dự án khác), không áp dụng cho phần còn lại của repo.

## 1. Chế độ tự động (auto-run)

Agent được phép tự thực hiện KHÔNG cần hỏi xác nhận:

- Đọc, tạo, sửa file trong workspace
- Chạy: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm install`, script trong `scripts/`
- Tạo branch, commit, push lên **feature branch**
- Tạo MR, tạo/cập nhật issue, comment vào issue/MR
- Chạy Prisma: `prisma generate`, `prisma migrate dev` trên database local

Agent PHẢI DỪNG và hỏi trước khi:

- Merge vào `master` (chỉ Cửa sổ 4 hoặc Khanh bấm merge)
- Force push, xóa branch, revert commit đã merge
- Lệnh phá hủy: drop/reset database, xóa dữ liệu, `rm -rf`
- Thao tác liên quan tiền thật: đổi giá gói, đổi số tài khoản ngân hàng, gọi API thanh toán production
- Cần credentials/API key thật chưa có (xem mục 5)

Khi gặp lựa chọn kỹ thuật: chọn phương án an toàn nhất, ghi chú quyết định trong mô tả MR, tiếp tục làm — không dừng lại hỏi.

## 2. Phân công 4 cửa sổ (ownership)

| Cửa sổ | Phạm vi ĐƯỢC sửa | Issue | Branch |
|---|---|---|---|
| 1 – Backend | `apps/backend` | #1 | `feat/backend-*` |
| 2 – Mobile | `apps/mobile` | #2 | `feat/mobile-*` |
| 3 – Shared & Data | `packages/shared`, `apps/mobile/utils/offlinePhrases.ts`, `apps/mobile/i18n/locales/` | #3 | `feat/shared-*` |
| 4 – QA | `**/__tests__/**`, `*.test.ts`, CI config | #4 | `fix/qa-*` |

- KHÔNG sửa file ngoài phạm vi của mình. Nếu cần thay đổi ở vùng khác: comment vào issue của cửa sổ phụ trách vùng đó.
- Thứ tự merge: **shared → backend → mobile → QA**.
- Sau khi shared thay đổi và được merge, các cửa sổ khác rebase trước khi làm tiếp.

## 3. Quality gates (bắt buộc trước khi tạo/cập nhật MR)

```bash
npm run typecheck   # phải pass cả 3 workspace
npm run lint        # phải pass
npm test --workspace apps/backend   # 78+ tests phải pass
npm test --workspace apps/mobile    # phải pass (sau khi issue #4 sửa xong 4 test)
```

Không tạo MR khi bất kỳ gate nào đỏ. Nếu test fail do test cũ lỗi thời (không phải do code sai), báo Cửa sổ 4 trong issue #4 thay vì tự sửa test ngoài phạm vi.

## 4. Chính sách "mọi thứ phải thật" (không mock, không tượng trưng)

Đây là dự án triển khai thực tế, có tiền thật (subscription) và tính năng an toàn (SOS):

- Mọi tính năng user-facing phải đọc/ghi dữ liệu thật qua database/API. Cấm hardcode dữ liệu mẫu, người dùng giả, hội thoại giả, bản dịch giả dạng `[XX] ...`
- Cấm để chữ "mock", "fake", "TODO later" mới trong code user-facing
- Mọi giới hạn free/premium phải enforce **server-side** (`getEntitlementStatus`, `checkAndIncrementUsage`), không chỉ client
- Mọi resource theo user phải có ownership check: `findFirst({ where: { id, userId } })`
- Webhook thanh toán phải verify chữ ký và idempotent
- Compliance: bank-transfer là external payment (mở browser/hiển thị QR), KHÔNG nhúng thành purchase flow trong app — không được gộp với IAP

## 5. Placeholder cần giá trị thật (không được bịa)

Khi gặp các giá trị sau, giữ nguyên placeholder + ghi vào Setup Checklist (issue #4), tuyệt đối không bịa:

- `MB_BANK_ACCOUNT_NAME` (payment.controller.ts) — tên chủ tài khoản MB Bank
- `SEPAY_WEBHOOK_SECRET` — secret từ SePay
- `EXPO_PUBLIC_REVENUECAT_APPLE_KEY` / `EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY`
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER`
- Apple Team ID (`server.ts`), `ascAppId` (eas.json)
- `DATABASE_URL` / `DIRECT_URL` (Supabase)

Cấm commit secret thật vào repo — chỉ đưa vào `.env` (đã gitignore) và cập nhật `.env.example` với placeholder.

## 6. Quy ước code

- TypeScript strict, theo ESLint + Prettier config sẵn có của repo
- Backend: pattern controller → service → prisma, lỗi qua `AppError`, response qua `sendSuccess`, wrap bằng `asyncHandler`
- Mobile: Expo Router, NativeWind className, strings qua `useTranslation` (i18n), không hardcode text user-facing mới
- Commit message: tiếng Anh, dạng `type: summary` (feat/fix/chore/test/refactor)
- Mỗi MR link tới issue của cửa sổ mình (`Closes #N` hoặc `Related to #N`)
