export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 🛡️ ADMIN ENDPOINT
    if (path === "/admin") {
      const providedKey = url.searchParams.get('key');
      const adminKey = env.ADMIN_KEY || "skmtools-admin-secret-key-2026";
      
      if (providedKey !== adminKey) {
        return new Response(JSON.stringify({ "Error": "Unauthorized" }, null, 2), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ 
        "Message": "Welcome to SKMTools Admin Panel", 
        "Status": "System Online" 
      }, null, 2), { headers: { "Content-Type": "application/json" } });
    }

    // 📋 PRICES ENDPOINT
    if (path === "/prices") {
      const prices = { "Basic": "$9.99", "Pro": "$29.99", "Enterprise": "$99.99" };
      return new Response(JSON.stringify(prices, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 📊 STATS ENDPOINT
    if (path === "/stats") {
      const stats = { "Users": 1245, "Active_Workers": 3, "Uptime": "99.9%" };
      return new Response(JSON.stringify(stats, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Default 404
    return new Response("SKMTools Endpoint Not Found", { status: 404 });
  }
};
