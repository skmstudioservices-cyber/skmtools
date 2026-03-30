export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const providedKey = searchParams.get('key');
  const adminKey = "skmtools-admin-secret-key-2026";
  
  if (providedKey !== adminKey) {
    return new Response(JSON.stringify({ "Error": "Unauthorized Access" }, null, 2), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  const adminInfo = {
    "Message": "Welcome to SKMTools Admin Panel",
    "Server_Context": context.env && context.env.ENVIRONMENT ? context.env.ENVIRONMENT : "local-development",
    "Admin_Privileges": "Full Access"
  };
  
  return new Response(JSON.stringify(adminInfo, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
