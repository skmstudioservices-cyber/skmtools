export async function onRequest(context) {
  const prices = {
    "Basic": "$9.99/mo",
    "Professional": "$29.99/mo",
    "Enterprise": "$99.99/mo"
  };
  
  return new Response(JSON.stringify(prices, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
