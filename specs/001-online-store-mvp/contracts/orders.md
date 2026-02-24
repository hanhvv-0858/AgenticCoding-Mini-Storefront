# API Contract: Orders

**Base Path**: `/api/orders`  
**Auth**: Mixed — checkout is public (guest allowed); order listing requires auth.

---

## POST `/api/orders`

Create a new order (checkout). Available to both guests and authenticated users.

### Request Body

```json
{
  "customer_name": "Nguyễn Văn A",
  "customer_phone": "0901234567",
  "customer_address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "items": [
    { "product_id": "uuid", "quantity": 2 },
    { "product_id": "uuid", "quantity": 1 }
  ]
}
```

### Validation (Zod)

| Field | Rules |
|-------|-------|
| `customer_name` | Required, 1–200 chars |
| `customer_phone` | Required, matches `^0\d{9}$` (VN phone format) |
| `customer_address` | Required, 1–500 chars |
| `items` | Required, non-empty array |
| `items[].product_id` | Required, valid UUID |
| `items[].quantity` | Required, integer ≥ 1 |

### Response `201 Created`

```json
{
  "order_id": "uuid",
  "order_number": "ORD-20260223-001",
  "total_amount": 750000,
  "status": "pending",
  "created_at": "2026-02-23T10:30:00Z"
}
```

### Error Responses

| Status | When |
|--------|------|
| `400` | Validation error |
| `409` | Stock insufficient — includes details on which product(s) |
| `404` | Product not found or unpublished |

### Error `409` Example

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Không đủ hàng tồn kho",
    "details": [
      {
        "product_id": "uuid",
        "product_name": "Áo thun trắng",
        "requested": 5,
        "available": 2
      }
    ]
  }
}
```

### Notes

- If the user is authenticated, `customer_id` is automatically set from the session.
- Stock is validated and decremented atomically via `fn_create_order` RPC.
- Price snapshot is captured at order creation time.
- Cart is cleared client-side after successful response.

---

## GET `/api/orders`

List orders. Behavior depends on role:

- **Customer**: Returns only their own orders (requires auth).
- **Admin**: Returns all orders (requires admin auth).

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `string` | No | Filter by status: `pending`, `delivering`, `completed`, `cancelled` |
| `page` | `number` | No | Page number (default: 1) |
| `limit` | `number` | No | Items per page (default: 20, max: 100) |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-20260223-001",
      "customer_name": "Nguyễn Văn A",
      "customer_phone": "0901234567",
      "total_amount": 750000,
      "status": "pending",
      "payment_method": "cod",
      "created_at": "2026-02-23T10:30:00Z",
      "items_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "total_pages": 1
  }
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |

---

## GET `/api/orders/[id]`

Get order detail with items.

### Response `200 OK`

```json
{
  "id": "uuid",
  "order_number": "ORD-20260223-001",
  "customer_name": "Nguyễn Văn A",
  "customer_phone": "0901234567",
  "customer_address": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "total_amount": 750000,
  "status": "pending",
  "payment_method": "cod",
  "created_at": "2026-02-23T10:30:00Z",
  "updated_at": "2026-02-23T10:30:00Z",
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "Áo thun trắng",
      "unit_price": 250000,
      "quantity": 2
    },
    {
      "id": "uuid",
      "product_id": "uuid",
      "product_name": "Quần jeans",
      "unit_price": 250000,
      "quantity": 1
    }
  ]
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Customer trying to view another customer's order |
| `404` | Order not found |

---

## PATCH `/api/orders/[id]`

Update order status. **Admin only**.

### Request Body

```json
{
  "status": "delivering"
}
```

### Valid Transitions

| From | To | Side Effect |
|------|----|-------------|
| `pending` | `delivering` | None |
| `delivering` | `completed` | None |
| `pending` | `cancelled` | Stock restored for all items |

Any other transition returns `400`.

### Response `200 OK`

```json
{
  "id": "uuid",
  "order_number": "ORD-20260223-001",
  "status": "delivering",
  "updated_at": "2026-02-23T11:00:00Z"
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |
| `400` | Invalid status transition |
| `404` | Order not found |

---

## Common Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": []
  }
}
```
