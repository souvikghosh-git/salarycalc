import { onRequestPost as __api_chat_js_onRequestPost } from "/Users/souvikghosh/workspace/salary-calculator/functions/api/chat.js"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_js_onRequestPost],
    },
  ]