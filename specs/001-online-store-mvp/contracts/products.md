# API Contract: Products

**Base Path**: `/api/products`  
**Auth**: Public read (storefront). Admin-only write.

---

## GET `/api/products`

List published products for storefront. Admin sees all products.

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `string` | No | Filter by category slug |
| `search` | `string` | No | Search by product name (case-insensitive partial match) |
| `page` | `number` | No | Page number (default: 1) |
| `limit` | `number` | No | Items per page (default: 20, max: 100) |
| `all` | `boolean` | No | Admin-only: include unpublished products (default: false) |

### Response `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Áo thun trắng",
      "description": "Áo thun cotton 100%",
      "price": 250000,
      "stock": 15,
      "is_published": true,
      "category": {
        "id": "uuid",
        "name": "Thời trang",
        "slug": "thoi-trang"
      },
      "image_url": "https://xxx.supabase.co/storage/v1/object/public/product-images/path.jpg",
      "created_at": "2026-02-23T10:00:00Z",
      "updated_at": "2026-02-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### Error Responses

| Status | When |
|--------|------|
| `400` | Invalid query parameters |

---

## GET `/api/products/[id]`

Get single product detail.

### Response `200 OK`

```json
{
  "id": "uuid",
  "name": "Áo thun trắng",
  "description": "Áo thun cotton 100%",
  "price": 250000,
  "stock": 15,
  "is_published": true,
  "category": {
    "id": "uuid",
    "name": "Thời trang",
    "slug": "thoi-trang"
  },
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/product-images/path.jpg",
  "created_at": "2026-02-23T10:00:00Z",
  "updated_at": "2026-02-23T10:00:00Z"
}
```

### Error Responses

| Status | When |
|--------|------|
| `404` | Product not found or not published (for non-admin) |

---

## POST `/api/products`

Create a new product. **Admin only**.

### Request Body

```json
{
  "name": "Áo thun trắng",
  "description": "Áo thun cotton 100%",
  "price": 250000,
  "stock": 10,
  "category_id": "uuid",
  "is_published": false
}
```

Image upload is handled separately via Supabase Storage, then `image_path` is set via PUT.

### Validation (Zod)

| Field | Rules |
|-------|-------|
| `name` | Required, 1–200 chars |
| `description` | Optional, max 2000 chars |
| `price` | Required, integer ≥ 0 |
| `stock` | Required, integer ≥ 0 |
| `category_id` | Required, valid UUID |
| `is_published` | Optional, boolean (default: false) |

### Response `201 Created`

```json
{
  "id": "uuid",
  "name": "Áo thun trắng",
  "...": "..."
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |
| `400` | Validation error (details in body) |

---

## PUT `/api/products/[id]`

Update a product. **Admin only**.

### Request Body

All fields optional (partial update):

```json
{
  "name": "Áo thun đen",
  "price": 280000,
  "stock": 20,
  "is_published": true,
  "image_path": "products/ao-thun-den.jpg"
}
```

### Validation

Same rules as POST, but all fields optional. At least one field must be provided.

### Response `200 OK`

Updated product object.

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |
| `400` | Validation error |
| `404` | Product not found |

---

## DELETE `/api/products/[id]`

Delete (soft-delete) a product. **Admin only**.

Sets `is_published = false` and marks as deleted. If product belongs to pending/delivering orders, returns warning but still soft-deletes.

### Response `200 OK`

```json
{
  "message": "Product deleted",
  "had_active_orders": true
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |
| `404` | Product not found |

---

## Common Error Format

All error responses follow:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "price", "message": "Must be >= 0" }
    ]
  }
}
```
