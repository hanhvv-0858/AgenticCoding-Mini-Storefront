// Seed script: Create categories, products, and admin account
// Usage: node scripts/seed.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use service role key if available, otherwise anon key
const API_KEY = SERVICE_ROLE_KEY || ANON_KEY;

if (!SUPABASE_URL || !API_KEY) {
    console.error("❌ Missing SUPABASE_URL or API keys. Check .env.local");
    process.exit(1);
}

const headers = {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
};

async function supabaseRest(path, method = "GET", body = null) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: { ...headers, ...(method !== "GET" ? { Prefer: "return=representation,resolution=merge-duplicates" } : {}) },
        body: body ? JSON.stringify(body) : null,
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }
    return text ? JSON.parse(text) : null;
}

async function supabaseAuth(path, method = "POST", body = null) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
        method,
        headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : null,
    });
    const text = await res.text();
    if (!res.ok && res.status !== 422) {
        // 422 = user already exists, which is fine
        throw new Error(`Auth ${method} ${path} → ${res.status}: ${text}`);
    }
    return text ? JSON.parse(text) : null;
}

// ─── Categories ──────────────────────────────────────────────
const categories = [
    { id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", name: "Thời trang", slug: "thoi-trang" },
    { id: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e", name: "Điện tử", slug: "dien-tu" },
    { id: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f", name: "Gia dụng", slug: "gia-dung" },
    { id: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80", name: "Thực phẩm", slug: "thuc-pham" },
    { id: "e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091", name: "Sách", slug: "sach" },
];

// ─── Products ────────────────────────────────────────────────
const products = [
    // Thời trang
    { name: "Áo thun trắng basic", description: "Áo thun cotton 100% form regular fit, thoáng mát phù hợp mọi hoạt động.", price: 250000, stock: 50, is_published: true, category_id: categories[0].id },
    { name: "Quần jeans slim fit", description: "Quần jeans nam co giãn nhẹ, phom slim fit hiện đại.", price: 450000, stock: 30, is_published: true, category_id: categories[0].id },
    { name: "Áo khoác hoodie", description: "Áo khoác hoodie unisex chất nỉ bông dày dặn, giữ ấm tốt.", price: 380000, stock: 20, is_published: true, category_id: categories[0].id },
    { name: "Váy hoa nhí", description: "Váy nữ hoa nhí vintage, chất vải nhẹ thoáng mát mùa hè.", price: 320000, stock: 0, is_published: true, category_id: categories[0].id },
    { name: "Áo sơ mi linen", description: "Áo sơ mi nam chất linen tự nhiên, thoáng mát, form relaxed.", price: 420000, stock: 15, is_published: true, category_id: categories[0].id },

    // Điện tử
    { name: "Tai nghe Bluetooth", description: "Tai nghe không dây chống ồn chủ động, pin 30 giờ, kết nối BT 5.3.", price: 1200000, stock: 15, is_published: true, category_id: categories[1].id },
    { name: "Sạc nhanh 65W", description: "Củ sạc GaN 65W 3 cổng (2 USB-C + 1 USB-A), tương thích laptop.", price: 550000, stock: 40, is_published: true, category_id: categories[1].id },
    { name: "Chuột không dây", description: "Chuột gaming không dây 16000 DPI, pin sạc nhanh, kết nối 2.4GHz.", price: 890000, stock: 3, is_published: true, category_id: categories[1].id },
    { name: "Bàn phím cơ", description: "Bàn phím cơ switch Blue, RGB, hot-swap. Đang chuẩn bị ra mắt.", price: 1500000, stock: 10, is_published: false, category_id: categories[1].id },
    { name: "Loa Bluetooth mini", description: "Loa di động chống nước IPX7, pin 12 giờ, bass mạnh.", price: 680000, stock: 25, is_published: true, category_id: categories[1].id },

    // Gia dụng
    { name: "Nồi cơm điện", description: "Nồi cơm điện tử 1.8L, chức năng nấu đa dạng, lòng nồi chống dính.", price: 980000, stock: 25, is_published: true, category_id: categories[2].id },
    { name: "Bình giữ nhiệt 500ml", description: "Bình giữ nhiệt inox 304, giữ nóng 12h / lạnh 24h.", price: 280000, stock: 60, is_published: true, category_id: categories[2].id },
    { name: "Máy xay sinh tố", description: "Máy xay sinh tố đa năng 1.5L, 3 tốc độ, lưỡi dao inox.", price: 750000, stock: 18, is_published: true, category_id: categories[2].id },
    { name: "Bàn ủi hơi nước", description: "Bàn ủi hơi nước 2400W, mặt đế ceramic chống dính.", price: 520000, stock: 12, is_published: true, category_id: categories[2].id },

    // Thực phẩm
    { name: "Trà oolong Đài Loan", description: "Trà oolong nguyên lá nhập khẩu, hương thơm thanh mát.", price: 180000, stock: 100, is_published: true, category_id: categories[3].id },
    { name: "Cà phê rang xay", description: "Cà phê Arabica Đà Lạt rang medium, gói 500g.", price: 220000, stock: 45, is_published: true, category_id: categories[3].id },
    { name: "Mật ong rừng", description: "Mật ong hoa rừng nguyên chất, chai 500ml.", price: 350000, stock: 30, is_published: true, category_id: categories[3].id },

    // Sách
    { name: "Nhà giả kim", description: "Tiểu thuyết kinh điển của Paulo Coelho, bản dịch tiếng Việt.", price: 79000, stock: 200, is_published: true, category_id: categories[4].id },
    { name: "Tư duy nhanh và chậm", description: "Sách tâm lý học bestseller của Daniel Kahneman.", price: 169000, stock: 80, is_published: true, category_id: categories[4].id },
    { name: "Clean Code", description: "Sách kinh điển về lập trình sạch của Robert C. Martin (tiếng Anh).", price: 450000, stock: 35, is_published: true, category_id: categories[4].id },
];

// ─── Main ────────────────────────────────────────────────────
async function main() {
    console.log("🌱 Seeding database...\n");

    // 1. Seed categories
    console.log("📁 Creating categories...");
    try {
        await supabaseRest("categories", "POST", categories);
        console.log(`   ✓ ${categories.length} categories created`);
    } catch (e) {
        if (e.message.includes("409") || e.message.includes("duplicate") || e.message.includes("23505")) {
            console.log("   ⚠ Categories already exist, skipping");
        } else {
            throw e;
        }
    }

    // 2. Seed products
    console.log("📦 Creating products...");
    try {
        await supabaseRest("products", "POST", products);
        console.log(`   ✓ ${products.length} products created`);
    } catch (e) {
        if (e.message.includes("409") || e.message.includes("duplicate") || e.message.includes("23505")) {
            console.log("   ⚠ Products already exist, skipping");
        } else {
            throw e;
        }
    }

    // 3. Create admin user via Auth API
    console.log("👤 Creating admin user (admin@store.local / Admin@123)...");
    try {
        const adminUser = await supabaseAuth("admin/users", "POST", {
            email: "admin@store.local",
            password: "Admin@123",
            email_confirm: true,
            user_metadata: { full_name: "Admin" },
        });

        if (adminUser?.id) {
            // Update profile role to admin
            await supabaseRest(`profiles?id=eq.${adminUser.id}`, "PATCH", { role: "admin" });
            console.log(`   ✓ Admin user created (id: ${adminUser.id})`);
        }
    } catch (e) {
        if (e.message.includes("already") || e.message.includes("422")) {
            console.log("   ⚠ Admin user already exists, ensuring role...");
            // Try to find and update the admin user's role
            try {
                const profiles = await supabaseRest("profiles?email=eq.admin@store.local&select=id");
                if (profiles?.[0]) {
                    await supabaseRest(`profiles?id=eq.${profiles[0].id}`, "PATCH", { role: "admin" });
                    console.log("   ✓ Admin role confirmed");
                }
            } catch {
                console.log("   ⚠ Could not update admin role, please update manually in Supabase dashboard");
            }
        } else {
            throw e;
        }
    }

    // 4. Create test customer
    console.log("👤 Creating test customer (user@store.local / User@123)...");
    try {
        const customer = await supabaseAuth("admin/users", "POST", {
            email: "user@store.local",
            password: "User@123",
            email_confirm: true,
            user_metadata: { full_name: "Nguyễn Văn A" },
        });
        if (customer?.id) {
            console.log(`   ✓ Customer created (id: ${customer.id})`);
        }
    } catch (e) {
        if (e.message.includes("already") || e.message.includes("422")) {
            console.log("   ⚠ Customer already exists, skipping");
        } else {
            console.log(`   ⚠ Could not create customer: ${e.message}`);
        }
    }

    console.log("\n✅ Seed complete!\n");
    console.log("📋 Accounts:");
    console.log("   Admin:    admin@store.local / Admin@123");
    console.log("   Customer: user@store.local  / User@123");
}

main().catch((err) => {
    console.error("\n❌ Seed failed:", err.message);
    process.exit(1);
});
