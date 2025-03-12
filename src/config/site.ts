import { SiteConfig } from "@/types"

const baseUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000"
  : process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`

export const siteConfig: SiteConfig = {
  name: "Butter Finance",
  author: "Butter Finance",
  description:
    "AI trading assistant for monad with best security solution powered by turnkey.",
  keywords: [
    "Butter-Finance",
    "AI trading assistant",
    "Web3",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Radix UI",
    "shadcn/ui",
  ],
  url: {
    base: baseUrl,
    author: "https://butter-finance.com",
  },
  links: {
    github: "https://github.com/jill6666/butter-fi-app",
  },
  ogImage: `${baseUrl}/og.jpg`,
}
