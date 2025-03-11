import Link from "next/link"

import Account from "./Account"
import { Icons } from "./Icons"

export default function NavMenu() {
  return (
    <div className="flex h-[5rem] items-center justify-between gap-4 bg-black p-4 sm:px-10">
      <Link href="/dashboard" className="flex gap-2">
        <p className="text-center text-2xl font-bold">Butter-Fi</p>
        <div className="text-center flex gap-1 text-sm text-white/40 items-center">
          Powered by{" "}
          <Icons.turnkey className="w-18 fill-white/40 stroke-none sm:h-7" />
        </div>
      </Link>
      <div className="flex items-center justify-center gap-4">
        <Account />
      </div>
    </div>
  )
}
