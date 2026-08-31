/**
 * InfoCardsRow — three format info cards below the upload card.
 * Matches mockup: JPG, MP4, TXT icons with labels.
 */

const cards = [
  {
    icon: (
      <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    label: 'JPG',
    description: 'JPEG and PNG images',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: 'MP4',
    description: 'AVI and MOV video files',
  },
  {
    icon: (
      <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    label: 'TXT',
    description: 'Downloadable reports',
  },
]

export default function InfoCardsRow() {
  return (
    <div className="grid grid-cols-3 gap-6 mt-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow"
        >
          {card.icon}
          <span className="text-sm font-extrabold text-primary tracking-wide">{card.label}</span>
          <span className="text-xs text-gray-500 leading-relaxed">{card.description}</span>
        </div>
      ))}
    </div>
  )
}
