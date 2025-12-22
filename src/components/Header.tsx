import { ArrowUpRight } from 'lucide-react'
import type { SiteSettings } from '~/lib/sanity.queries'

export default function Header({ settings }: { settings: SiteSettings | null }) {
  if (!settings) return null

  return (
    <header className="w-full md:w-[500px] mb-8 p-2 sm:p-0  mx-auto">
      <h1 className="text-sm mb-4">{settings.name}</h1>
      
      {settings.bioText && (
        <p className="text-sm text-gray-600 whitespace-pre-line mb-4">
          {settings.bioText}
        </p>
      )}
      
      <div className="flex flex-col gap-1">
        {settings.email && (
          <a 
            href={`mailto:${settings.email}`}
            className="group text-sm flex items-center gap-1 hover:underline text-xs self-end py-0.5 px-2 border border-gray-300 hover:bg-gray-50"
          >
            {settings.email} 
            <ArrowUpRight 
                size={14}
                className={`transition-transform duration-100 group-hover:rotate-45`} />
          </a>
        )}
        {settings.phone && (
          <a 
            href={`tel:${settings.phone}`}
            className="group text-sm flex items-center gap-1 hover:underline text-xs self-end py-0.5 px-2 border border-gray-300 hover:bg-gray-50"
          >
            {settings.phone} 
            <ArrowUpRight 
                size={14}
                className={`transition-transform duration-100 group-hover:rotate-45`} />
          </a>
        )}
        {settings.socials?.map((social, i) => {
          return (
            <a
              key={i}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group text-sm flex items-center gap-1 hover:underline text-xs self-end py-0.5 px-2 border border-gray-300 hover:bg-gray-50"
            >
              {social.handle || social.platform}
              <ArrowUpRight 
                size={14}
                className={`transition-transform duration-100 group-hover:rotate-45`} />
            </a>
          )
        })}
      </div>
    </header>
  )
}