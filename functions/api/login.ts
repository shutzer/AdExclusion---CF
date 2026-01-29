
type PagesFunction<Env = any> = (context: {
  request: Request;
  env: Env;
  [key: string]: any;
}) => Response | Promise<Response>;

interface Env {
  ADMIN_PASS?: string;
  USER_PASS?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { user, pass } = await context.request.json();
    const adminPass = context.env.ADMIN_PASS;
    const userPass = context.env.USER_PASS;

    // DEBUGGING: Log available env keys (SAFETY: Do not log values!)
    // Ovo će se ispisati u Cloudflare Logs tabu ako dođe do greške
    const availableEnvKeys = Object.keys(context.env || {});
    
    if (!adminPass) {
      console.error("[CRITICAL] ADMIN_PASS secret is missing.");
      console.error("[DEBUG] Available ENV keys:", availableEnvKeys.join(", "));
      
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Server configuration error: ADMIN_PASS missing. Please Redeploy." 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check Admin
    if (user === 'admin' && pass === adminPass) {
      const token = btoa(`${user}:${pass}`);
      return new Response(JSON.stringify({ success: true, token, role: 'admin' }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check Standard User
    if (user === 'user' && userPass && pass === userPass) {
      const token = btoa(`${user}:${pass}`);
      return new Response(JSON.stringify({ success: true, token, role: 'user' }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Neispravni podaci za prijavu" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return new Response(JSON.stringify({ success: false, message: "Neispravan zahtjev" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
};
