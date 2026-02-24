# API Contract: Admin Stats

**Base Path**: `/api/admin/stats`  
**Auth**: Admin only.

---

## GET `/api/admin/stats`

Get revenue report and order summary for admin dashboard.

### Response `200 OK`

```json
{
  "total_revenue": 15750000,
  "completed_orders_count": 23,
  "pending_orders_count": 5,
  "delivering_orders_count": 3,
  "cancelled_orders_count": 2,
  "total_products": 45,
  "published_products": 38,
  "low_stock_products": 4
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `total_revenue` | `bigint` | Sum of `total_amount` from orders with `status = 'completed'` (VND) |
| `completed_orders_count` | `integer` | Count of completed orders |
| `pending_orders_count` | `integer` | Count of pending orders |
| `delivering_orders_count` | `integer` | Count of orders being delivered |
| `cancelled_orders_count` | `integer` | Count of cancelled orders |
| `total_products` | `integer` | Total number of products (including unpublished) |
| `published_products` | `integer` | Number of published products |
| `low_stock_products` | `integer` | Number of products with `stock ≤ 5` |

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |

---

## GET `/api/admin/stats/categories`

Get product count per category for admin overview. **Admin only**.

### Response `200 OK`

```json
{
  "data": [
    {
      "category_id": "uuid",
      "category_name": "Thời trang",
      "product_count": 12,
      "published_count": 10
    }
  ]
}
```

### Error Responses

| Status | When |
|--------|------|
| `401` | Not authenticated |
| `403` | Not admin |
