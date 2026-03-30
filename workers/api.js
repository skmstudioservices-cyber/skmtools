export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 🛡️ 1. ADMIN ENDPOINT
    if (path === "/admin") {
      const providedKey = url.searchParams.get('key');
      const adminKey = env.ADMIN_KEY || "skmtools-admin-secret-key-2026";
      
      if (providedKey !== adminKey) {
        return new Response(JSON.stringify({ "Error": "Unauthorized" }, null, 2), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Check DB connectivity for admin
      const dbStatus = await env.DB.prepare("SELECT 1").first();
      
      return new Response(JSON.stringify({ 
        "Message": "Welcome to SKMTools Admin Panel", 
        "Database": dbStatus ? "Connected" : "Error",
        "Environment": env.ENVIRONMENT || "production"
      }, null, 2), { headers: { "Content-Type": "application/json" } });
    }

    // 📋 2. PRICES ENDPOINT (Real D1 Database Query)
    if (path === "/prices") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM prices").all();
        return new Response(JSON.stringify(results, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ "Error": "Database Query Failed", "Details": err.message }), { status: 500 });
      }
    }

    // 📊 3. STATS ENDPOINT
    if (path === "/stats") {
      const userCount = await env.DB.prepare("SELECT count(*) as total FROM users").first("total");
      const stats = { 
        "Registered_Users": userCount || 0,
        "System_Uptime": "99.99%",
        "Last_Audit": new Date().toISOString()
      };
      return new Response(JSON.stringify(stats, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 🚀 4. AI ENDPOINT (Optional Extra)
    if (path === "/ai-suggest") {
      const prompt = url.searchParams.get('prompt') || "Give me a coding tip";
      const response = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', { prompt });
      return new Response(JSON.stringify(response), { headers: { "Content-Type": "application/json" } });
    }

    // Default 404
    return new Response("SKMTools API: Route not found. Try /prices or /stats", { status: 404 });
  }
};
