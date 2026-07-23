import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProgress from "./tools/get-my-progress";
import listMyWrongAnswers from "./tools/list-my-wrong-answers";
import listMyAchievements from "./tools/list-my-achievements";
import listMyConversations from "./tools/list-my-conversations";

// Build the OAuth issuer from the Supabase project ref so it stays on the
// direct supabase.co host regardless of any proxied SUPABASE_URL.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "eduki-mcp",
  title: "EduKI",
  version: "0.1.0",
  instructions:
    "Tools for the EduKI learning app. All tools act as the signed-in user and expose their own learning data (KI level, XP, mistakes, achievements, tutor conversations).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProgress, listMyWrongAnswers, listMyAchievements, listMyConversations],
});
