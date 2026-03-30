export async function onRequest(context) {
  const stats = {
    "Users": 1245,
    "API_Calls": 45000,
    "Server_Status": "Healthy",
    "Last_Updated": new Date().toISOString()
  };
  
  return new Response(JSON.stringify(stats, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
