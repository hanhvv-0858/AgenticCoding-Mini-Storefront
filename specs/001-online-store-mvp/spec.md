# Feature Specification: Mini Storefront — Online Store MVP

**Feature Branch**: `001-online-store-mvp`  
**Created**: 2026-02-23  
**Status**: Draft  
**Input**: User description: "Ứng dụng cửa hàng online đơn giản với Customer Flow (duyệt sản phẩm, giỏ hàng, checkout COD) và Admin Flow (quản lý kho, giá, publish/unpublish, đơn hàng). Responsive mobile-first với Bottom Navigation."

## Assumptions

- Chỉ hỗ trợ một loại tiền tệ duy nhất (VND). Giá lưu dạng số nguyên (đơn vị: đồng).
- Không tích hợp cổng thanh toán thật; phương thức thanh toán duy nhất là COD (tiền mặt khi nhận hàng).
- Hình ảnh sản phẩm được upload từ máy admin hoặc dán URL; không tích hợp cloud storage bên ngoài.
- Một cửa hàng duy nhất (single-tenant). Không hỗ trợ multi-store.
- Admin là một vai trò duy nhất (không phân quyền chi tiết). Tạo tài khoản admin đầu tiên khi khởi tạo hệ thống (seed).
- Báo cáo doanh thu là thống kê đơn giản (tổng doanh thu, số đơn hoàn thành), không yêu cầu biểu đồ phức tạp hay xuất file.
- Tìm kiếm sản phẩm là tìm theo tên (text search), bộ lọc theo category. Không yêu cầu full-text search engine.
- Lịch sử đơn hàng của khách hàng chỉ hiển thị cho người đã đăng nhập.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Duyệt & Xem sản phẩm (Priority: P1)

Khách hàng truy cập trang chủ cửa hàng trên điện thoại, thấy danh sách sản phẩm hiển thị dạng lưới (grid). Họ có thể lọc theo danh mục (Category), tìm kiếm theo tên, và bấm vào một sản phẩm để xem chi tiết (mô tả, giá, trạng thái còn hàng).

**Why this priority**: Đây là điểm tiếp xúc đầu tiên của khách hàng với cửa hàng. Không có trang sản phẩm hoạt động thì không có giá trị kinh doanh nào khác.

**Independent Test**: Có thể kiểm thử độc lập bằng cách seed dữ liệu sản phẩm mẫu, mở trang chủ trên trình duyệt di động, duyệt grid, lọc category, mở chi tiết — tất cả hoạt động mà không cần cart hay checkout.

**Acceptance Scenarios**:

1. **Given** cửa hàng có ≥ 1 sản phẩm published, **When** khách truy cập trang chủ, **Then** danh sách sản phẩm hiển thị dạng grid với ảnh, tên, và giá.
2. **Given** cửa hàng có nhiều category, **When** khách chọn một category, **Then** chỉ các sản phẩm thuộc category đó hiển thị.
3. **Given** khách nhập từ khóa vào ô tìm kiếm, **When** từ khóa khớp tên sản phẩm, **Then** danh sách lọc chỉ hiển thị sản phẩm phù hợp.
4. **Given** khách bấm vào một sản phẩm, **When** trang chi tiết mở ra, **Then** hiển thị ảnh, tên, mô tả, giá, và trạng thái còn hàng (Còn hàng / Hết hàng).
5. **Given** một sản phẩm có stock = 0, **When** khách xem chi tiết, **Then** hiển thị "Hết hàng" và nút thêm vào giỏ bị vô hiệu hóa.
6. **Given** trang chủ đang hiển thị trên màn hình 320 px, **When** khách cuộn danh sách, **Then** không có thanh cuộn ngang và grid tự điều chỉnh số cột phù hợp.

---

### User Story 2 — Giỏ hàng (Priority: P2)

Khách hàng thêm sản phẩm vào giỏ hàng, điều chỉnh số lượng, xóa sản phẩm, và xem tổng tiền được tính tự động. Giỏ hàng được lưu vào localStorage để không mất khi reload trang.

**Why this priority**: Giỏ hàng là bước trung gian bắt buộc giữa duyệt sản phẩm và mua hàng. Không có giỏ hàng thì không có đơn hàng.

**Independent Test**: Seed sản phẩm mẫu, thêm sản phẩm vào giỏ, điều chỉnh số lượng, xóa, kiểm tra tổng tiền, reload trang và xác nhận giỏ hàng vẫn còn.

**Acceptance Scenarios**:

1. **Given** khách đang xem chi tiết sản phẩm còn hàng, **When** bấm "Thêm vào giỏ", **Then** sản phẩm xuất hiện trong giỏ hàng với số lượng = 1 và badge trên icon giỏ hàng cập nhật.
2. **Given** giỏ hàng có sản phẩm A với số lượng 1, **When** khách tăng số lượng lên 3, **Then** tổng tiền cập nhật = giá A × 3.
3. **Given** giỏ hàng có sản phẩm A, **When** khách bấm xóa sản phẩm A, **Then** sản phẩm A biến mất khỏi giỏ và tổng tiền cập nhật.
4. **Given** giỏ hàng có sản phẩm, **When** khách reload hoặc đóng/mở lại trình duyệt, **Then** giỏ hàng phục hồi từ localStorage đúng trạng thái trước đó.
5. **Given** khách tăng số lượng vượt quá stock hiện có, **When** hệ thống validate, **Then** hiển thị cảnh báo và giới hạn số lượng tối đa bằng stock.
6. **Given** giỏ hàng trống, **When** khách mở trang giỏ hàng, **Then** hiển thị thông báo "Giỏ hàng trống" kèm nút quay lại mua sắm.

---

### User Story 3 — Checkout COD (Priority: P3)

Khách hàng từ giỏ hàng tiến hành thanh toán: nhập thông tin giao hàng (Tên, số điện thoại, địa chỉ), chọn phương thức COD, gửi đơn hàng, và nhận thông báo xác nhận.

**Why this priority**: Checkout chuyển đổi giỏ hàng thành đơn hàng — đây là điểm tạo doanh thu. Đặt sau giỏ hàng vì phụ thuộc vào giỏ hàng hoạt động.

**Independent Test**: Với giỏ hàng đã có sản phẩm, điền form checkout, gửi đơn, xác nhận đơn hàng được tạo trong hệ thống và khách thấy màn hình xác nhận.

**Acceptance Scenarios**:

1. **Given** giỏ hàng có ≥ 1 sản phẩm, **When** khách bấm "Thanh toán", **Then** form nhập thông tin giao hàng hiển thị (Họ tên, SĐT, Địa chỉ).
2. **Given** khách điền đầy đủ thông tin hợp lệ và chọn COD, **When** bấm "Đặt hàng", **Then** đơn hàng được tạo với trạng thái "Pending", stock sản phẩm giảm tương ứng, giỏ hàng được xóa, và khách thấy trang xác nhận với mã đơn hàng.
3. **Given** khách bỏ trống trường bắt buộc (vd: SĐT), **When** bấm "Đặt hàng", **Then** hiển thị lỗi validation tại trường tương ứng và đơn không được gửi.
4. **Given** trong lúc checkout, stock sản phẩm đã giảm về 0 (do người khác mua), **When** khách bấm "Đặt hàng", **Then** hệ thống thông báo sản phẩm hết hàng và không tạo đơn.

---

### User Story 4 — Tài khoản khách hàng (Priority: P4)

Khách hàng có thể tạo tài khoản bằng email + password, đăng nhập, và xem lịch sử đơn hàng cá nhân. Khách chưa đăng nhập vẫn có thể duyệt & mua hàng (giỏ hàng lưu localStorage), nhưng cần đăng nhập để xem lịch sử.

**Why this priority**: Tài khoản bổ sung giá trị nhưng không chặn luồng mua hàng chính. Khách vẫn mua được mà không cần tài khoản.

**Independent Test**: Tạo tài khoản mới, đăng nhập, đặt một đơn hàng (qua US3), rồi xem lịch sử đơn hàng hiện đúng đơn vừa đặt.

**Acceptance Scenarios**:

1. **Given** khách chưa có tài khoản, **When** bấm "Đăng ký" và nhập email + password hợp lệ, **Then** tài khoản được tạo và khách tự động đăng nhập.
2. **Given** khách đã có tài khoản, **When** nhập đúng email + password, **Then** đăng nhập thành công và tên hiển thị trên bottom nav.
3. **Given** khách đã đăng nhập và có đơn hàng trước đó, **When** mở tab "Tài khoản", **Then** danh sách đơn hàng hiển thị với mã đơn, ngày, tổng tiền, trạng thái.
4. **Given** khách nhập email đã tồn tại khi đăng ký, **When** bấm "Đăng ký", **Then** hiển thị lỗi "Email đã được sử dụng".
5. **Given** khách nhập sai password, **When** bấm "Đăng nhập", **Then** hiển thị lỗi "Email hoặc mật khẩu không đúng".

---

### User Story 5 — Admin quản lý sản phẩm (Priority: P5)

Chủ cửa hàng đăng nhập vào Admin Dashboard để quản lý sản phẩm: thêm mới, sửa thông tin (tên, mô tả, giá, ảnh, category), xóa sản phẩm, cập nhật nhanh stock và giá, publish/unpublish sản phẩm.

**Why this priority**: Không có quản lý sản phẩm thì cửa hàng không có hàng để bán. Đặt sau các user story khách hàng vì dữ liệu ban đầu có thể seed.

**Independent Test**: Đăng nhập admin, thêm sản phẩm mới, sửa giá, unpublish, kiểm tra storefront không hiện sản phẩm đó, publish lại và xác nhận storefront hiện lại.

**Acceptance Scenarios**:

1. **Given** admin đã đăng nhập, **When** mở tab "Sản phẩm", **Then** danh sách tất cả sản phẩm hiển thị (bao gồm cả unpublished) với tên, giá, stock, trạng thái published.
2. **Given** admin bấm "Thêm sản phẩm", **When** điền đầy đủ thông tin (tên, mô tả, giá, stock, category, ảnh) và lưu, **Then** sản phẩm mới xuất hiện trong danh sách admin.
3. **Given** admin chọn một sản phẩm, **When** sửa giá từ 100.000đ thành 150.000đ và lưu, **Then** giá mới hiển thị trên cả admin và storefront.
4. **Given** admin bấm "Unpublish" trên sản phẩm A, **When** lưu thay đổi, **Then** sản phẩm A biến mất khỏi storefront nhưng vẫn hiện trong admin với nhãn "Unpublished".
5. **Given** admin bấm "Publish" trên sản phẩm A (đang unpublished), **When** lưu thay đổi, **Then** sản phẩm A xuất hiện lại trên storefront.
6. **Given** admin bấm "Xóa" trên sản phẩm B, **When** xác nhận xóa, **Then** sản phẩm B bị xóa khỏi hệ thống (hoặc soft-delete).
7. **Given** admin nhập giá âm hoặc stock âm, **When** bấm lưu, **Then** hiển thị lỗi validation và không cho lưu.

---

### User Story 6 — Admin quản lý đơn hàng (Priority: P6)

Chủ cửa hàng xem danh sách đơn hàng mới (Pending), cập nhật trạng thái (Đang giao → Hoàn thành → Đã hủy), và xem báo cáo doanh thu nhanh.

**Why this priority**: Quản lý đơn hàng là luồng vận hành cốt lõi sau khi cửa hàng có đơn. Đặt sau quản lý sản phẩm vì cần sản phẩm trước khi có đơn.

**Independent Test**: Tạo vài đơn hàng qua checkout, đăng nhập admin, xem danh sách đơn, chuyển trạng thái, kiểm tra báo cáo doanh thu phản ánh đúng.

**Acceptance Scenarios**:

1. **Given** admin đã đăng nhập, **When** mở tab "Đơn hàng", **Then** danh sách đơn hàng hiển thị với mã đơn, tên khách, tổng tiền, trạng thái, ngày đặt.
2. **Given** có đơn hàng trạng thái "Pending", **When** admin chuyển sang "Đang giao", **Then** trạng thái cập nhật và khách (nếu đăng nhập) thấy trạng thái mới trong lịch sử.
3. **Given** đơn hàng trạng thái "Đang giao", **When** admin chuyển sang "Hoàn thành", **Then** đơn được đánh dấu hoàn thành và doanh thu cập nhật trong báo cáo.
4. **Given** đơn hàng trạng thái "Pending", **When** admin chuyển sang "Đã hủy", **Then** stock sản phẩm trong đơn được hoàn lại.
5. **Given** admin mở tab "Tổng quan", **When** trang tải xong, **Then** hiển thị tổng doanh thu (các đơn hoàn thành) và tổng số đơn hoàn thành.

---

### User Story 7 — Điều hướng Bottom Navigation (Priority: P7)

Hệ thống sử dụng bottom navigation bar cố định trên mobile. Nội dung thanh nav thay đổi tùy theo vai trò: Customer Mode (Cửa hàng, Tìm kiếm, Giỏ hàng, Tài khoản) và Admin Mode (Tổng quan, Sản phẩm, Đơn hàng, Cài đặt).

**Why this priority**: Bottom nav là khung điều hướng — các trang con đều đã kể ở các story trên. Story này tập trung vào hành vi chuyển đổi, badge, và responsive layout.

**Independent Test**: Mở app trên viewport mobile, kiểm tra 4 tab customer hiện đúng icon + label, bấm từng tab xác nhận chuyển trang đúng. Đăng nhập admin, kiểm tra 4 tab admin.

**Acceptance Scenarios**:

1. **Given** khách truy cập storefront trên mobile, **When** trang tải xong, **Then** bottom nav hiển thị 4 tab: 🏠 Cửa hàng, 🔍 Tìm kiếm, 🛒 Giỏ hàng, 👤 Tài khoản.
2. **Given** giỏ hàng có 3 sản phẩm, **When** khách nhìn bottom nav, **Then** icon giỏ hàng hiển thị badge số "3".
3. **Given** admin đăng nhập, **When** vào admin dashboard, **Then** bottom nav hiển thị 4 tab: 📊 Tổng quan, 📑 Sản phẩm, 📦 Đơn hàng, ⚙️ Cài đặt.
4. **Given** viewport ≥ 1024 px (desktop), **When** trang tải, **Then** bottom nav ẩn đi và thay bằng sidebar hoặc top navigation.
5. **Given** khách bấm tab "Tìm kiếm" trên bottom nav, **When** trang tìm kiếm mở, **Then** thanh tìm kiếm tự động focus và bộ lọc category hiển thị.

---

### Edge Cases

- **Stock race condition**: Hai khách cùng mua sản phẩm cuối cùng — hệ thống PHẢI đảm bảo chỉ một đơn thành công, đơn còn lại bị từ chối với lỗi "Hết hàng".
- **Giỏ hàng stale**: Sản phẩm trong localStorage bị unpublish hoặc hết hàng sau khi khách thêm — khi mở giỏ, hệ thống PHẢI cảnh báo và cho phép xóa sản phẩm không hợp lệ.
- **Admin xóa sản phẩm đang trong đơn hàng**: Sản phẩm đã thuộc đơn Pending/Đang giao KHÔNG được xóa vĩnh viễn (soft-delete hoặc từ chối xóa với cảnh báo).
- **Session hết hạn**: Khi token/session admin hết hạn giữa thao tác, hệ thống PHẢI chuyển về trang đăng nhập với thông báo rõ ràng.
- **Nhập số điện thoại sai định dạng**: Hệ thống PHẢI validate SĐT Việt Nam (10 chữ số, bắt đầu bằng 0).
- **Giá hoặc stock bị sửa giữa lúc khách đang checkout**: Hệ thống PHẢI dùng giá tại thời điểm tạo đơn (snapshot) và validate stock trước khi xác nhận.

## Requirements *(mandatory)*

### Functional Requirements

**A. Storefront (Khách hàng)**

- **FR-001**: Hệ thống PHẢI hiển thị danh sách sản phẩm published dạng grid, bao gồm ảnh, tên, và giá.
- **FR-002**: Hệ thống PHẢI hỗ trợ lọc sản phẩm theo danh mục (Category).
- **FR-003**: Hệ thống PHẢI hỗ trợ tìm kiếm sản phẩm theo tên (text match).
- **FR-004**: Hệ thống PHẢI hiển thị trang chi tiết sản phẩm gồm ảnh, tên, mô tả, giá, và trạng thái còn hàng.
- **FR-005**: Hệ thống PHẢI vô hiệu hóa nút "Thêm vào giỏ" khi sản phẩm hết hàng (stock = 0).
- **FR-006**: Hệ thống PHẢI cho phép thêm, xóa, cập nhật số lượng sản phẩm trong giỏ hàng.
- **FR-007**: Hệ thống PHẢI tự động tính tổng tiền giỏ hàng phía client khi số lượng thay đổi.
- **FR-008**: Hệ thống PHẢI lưu trạng thái giỏ hàng vào localStorage và phục hồi khi tải lại trang.
- **FR-009**: Hệ thống PHẢI không cho phép khách thêm số lượng vượt quá stock hiện có.
- **FR-010**: Hệ thống PHẢI cung cấp form checkout gồm: Họ tên, Số điện thoại, Địa chỉ giao hàng.
- **FR-011**: Hệ thống PHẢI validate các trường bắt buộc trên form checkout trước khi gửi đơn.
- **FR-012**: Hệ thống PHẢI hỗ trợ phương thức thanh toán COD (Tiền mặt khi nhận hàng).
- **FR-013**: Hệ thống PHẢI tạo đơn hàng với trạng thái "Pending", giảm stock, xóa giỏ hàng, và hiển thị trang xác nhận kèm mã đơn khi checkout thành công.
- **FR-014**: Hệ thống PHẢI validate stock tại thời điểm tạo đơn và từ chối nếu stock không đủ.
- **FR-015**: Hệ thống PHẢI lưu giá sản phẩm tại thời điểm đặt đơn (price snapshot) vào đơn hàng.

**B. Tài khoản khách hàng**

- **FR-016**: Hệ thống PHẢI cho phép khách tạo tài khoản bằng email và password.
- **FR-017**: Hệ thống PHẢI validate email hợp lệ và từ chối email đã tồn tại khi đăng ký.
- **FR-018**: Hệ thống PHẢI cho phép khách đăng nhập bằng email + password.
- **FR-019**: Hệ thống PHẢI hiển thị lịch sử đơn hàng cho khách đã đăng nhập (mã đơn, ngày, tổng tiền, trạng thái).
- **FR-019b**: Hệ thống PHẢI cho phép khách đã đăng nhập xem chi tiết đơn hàng, bao gồm: thông tin giao hàng (tên, SĐT, địa chỉ), danh sách sản phẩm (tên, đơn giá, số lượng, thành tiền), tổng tiền, trạng thái, phương thức thanh toán.
- **FR-020**: Khách chưa đăng nhập vẫn PHẢI có thể duyệt sản phẩm, sử dụng giỏ hàng, và đặt hàng.

**C. Admin Dashboard**

- **FR-021**: Hệ thống PHẢI yêu cầu đăng nhập (email + password) để truy cập Admin Dashboard.
- **FR-022**: Admin PHẢI có thể thêm sản phẩm mới với các trường: tên, mô tả, giá, stock, category, ảnh.
- **FR-023**: Admin PHẢI có thể sửa thông tin sản phẩm hiện có (tên, mô tả, giá, stock, category, ảnh).
- **FR-024**: Admin PHẢI có thể xóa sản phẩm (hệ thống cảnh báo nếu sản phẩm đang thuộc đơn hàng chưa hoàn thành).
- **FR-025**: Admin PHẢI có thể cập nhật nhanh stock và giá trực tiếp từ danh sách sản phẩm (inline edit).
- **FR-026**: Admin PHẢI có thể Publish/Unpublish sản phẩm. Sản phẩm unpublished KHÔNG hiển thị trên storefront.
- **FR-027**: Hệ thống PHẢI validate giá ≥ 0 và stock ≥ 0 khi admin thêm/sửa sản phẩm.
- **FR-028**: Admin PHẢI có thể xem danh sách đơn hàng với mã đơn, tên khách, tổng tiền, trạng thái, ngày đặt.
- **FR-029**: Admin PHẢI có thể cập nhật trạng thái đơn hàng: Pending → Đang giao → Hoàn thành, hoặc Pending → Đã hủy.
- **FR-030**: Khi admin hủy đơn hàng, hệ thống PHẢI hoàn lại stock cho các sản phẩm trong đơn.
- **FR-031**: Admin PHẢI có thể xem báo cáo nhanh gồm: tổng doanh thu (từ đơn hoàn thành) và số lượng đơn hoàn thành.

**D. Điều hướng & Responsive**

- **FR-032**: Hệ thống PHẢI sử dụng bottom navigation cố định trên mobile (viewport < 1024 px) cho cả Customer và Admin mode.
- **FR-033**: Customer bottom nav PHẢI gồm 4 tab: Cửa hàng, Tìm kiếm, Giỏ hàng, Tài khoản.
- **FR-034**: Admin bottom nav PHẢI gồm 4 tab: Tổng quan, Sản phẩm, Đơn hàng, Cài đặt.
- **FR-035**: Icon giỏ hàng PHẢI hiển thị badge với số lượng sản phẩm hiện có trong giỏ.
- **FR-036**: Trên viewport ≥ 1024 px (desktop), hệ thống PHẢI thay bottom nav bằng sidebar hoặc top navigation.
- **FR-037**: Tất cả các trang PHẢI render đúng trên viewport từ 320 px đến 1440 px, không có thanh cuộn ngang.

### Key Entities

- **Product (Sản phẩm)**: Đại diện một mặt hàng trong cửa hàng. Thuộc tính chính: ID duy nhất, tên, mô tả, giá (số nguyên, đơn vị đồng), số lượng tồn kho (stock), trạng thái published/unpublished, danh mục (category), URL ảnh. Thuộc về một Category.
- **Category (Danh mục)**: Phân loại sản phẩm. Thuộc tính: ID, tên. Một category chứa nhiều product.
- **Cart (Giỏ hàng)**: Tập hợp các sản phẩm khách đã chọn, lưu phía client. Mỗi cart item gồm: product reference, số lượng. Không lưu server-side.
- **Order (Đơn hàng)**: Đại diện một giao dịch mua hàng. Thuộc tính: ID/mã đơn duy nhất, thông tin giao hàng (tên, SĐT, địa chỉ), tổng tiền, trạng thái (Pending / Đang giao / Hoàn thành / Đã hủy), ngày đặt, phương thức thanh toán (COD). Liên kết với Customer (nếu đăng nhập) hoặc guest. Chứa nhiều Order Item.
- **Order Item (Chi tiết đơn hàng)**: Một dòng trong đơn hàng. Thuộc tính: product reference, tên sản phẩm (snapshot), giá tại thời điểm đặt (snapshot), số lượng. Thuộc về một Order.
- **Customer (Khách hàng)**: Người dùng đã đăng ký. Thuộc tính: ID, email (duy nhất), password (hashed), tên. Có nhiều Order.
- **Admin (Quản trị viên)**: Người quản lý cửa hàng. Thuộc tính: ID, email, password (hashed), tên. Vai trò duy nhất, không phân quyền chi tiết.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Khách hàng có thể hoàn thành luồng mua hàng (duyệt → thêm giỏ → checkout) trong dưới 3 phút trên thiết bị di động.
- **SC-002**: Trang danh sách sản phẩm tải xong (sẵn sàng tương tác) trong dưới 2 giây trên kết nối 4G.
- **SC-003**: 100% các trang hiển thị đúng trên viewport 320 px mà không có thanh cuộn ngang.
- **SC-004**: Admin có thể thêm một sản phẩm mới (điền form + lưu) trong dưới 2 phút.
- **SC-005**: Admin có thể cập nhật trạng thái đơn hàng (1 click chuyển trạng thái) trong dưới 5 giây.
- **SC-006**: Giỏ hàng phục hồi chính xác 100% nội dung sau khi reload trang.
- **SC-007**: Hệ thống không bao giờ cho phép stock giảm dưới 0 trong mọi kịch bản đồng thời.
- **SC-008**: 90% người dùng lần đầu có thể tìm được sản phẩm mong muốn và thêm vào giỏ hàng mà không cần hướng dẫn.
