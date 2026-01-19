'use client'

export default function RoboticIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="5" y="2" width="14" height="8" rx="2" />
            <rect x="9" y="10" width="6" height="12" rx="1" />
            <path d="M8 10v2" />
            <path d="M16 10v2" />
            <circle cx="9" cy="6" r="1" />
            <circle cx="15" cy="6" r="1" />
            <path d="M9 18h6" />
            <path d="M10 15h4" />
        </svg>
    )
}
