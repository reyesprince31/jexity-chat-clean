import { Button } from "@/ui/button"
import Link from "next/link"

export default async function Page() {  

  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello</h1>
        <Button asChild size="lg">
          <Link href="/auth/login">Sign In / Sign Up</Link>
        </Button>
      </div>
    </div>
  )
}
