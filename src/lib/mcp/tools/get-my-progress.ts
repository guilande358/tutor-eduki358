import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_progress",
  title: "Get my learning progress",
  description: "Returns the signed-in EduKI user's KI level, XP, lives, and profile name.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [{ data: progress, error: pErr }, { data: profile }] = await Promise.all([
      supabase.from("user_progress").select("ki_level, xp, lives").eq("user_id", userId).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    ]);
    if (pErr) {
      return { content: [{ type: "text", text: pErr.message }], isError: true };
    }
    const payload = {
      full_name: profile?.full_name ?? null,
      ki_level: progress?.ki_level ?? 0,
      xp: progress?.xp ?? 0,
      lives: progress?.lives ?? 0,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
