import Link from 'next/link'
import { useRouter } from 'next/router'


export default function Container({ children }: { children: React.ReactNode }) {
  const router = useRouter()



  return (
    <div>
      <main>{children}</main>
    </div>
  )
}