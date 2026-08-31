/**
 * UploadTabs — Image / Video tab switcher.
 * Wraps ImageUploadCard and VideoUploadCard.
 */

import { useState } from 'react'
import ImageUploadCard from './ImageUploadCard'
import VideoUploadCard from './VideoUploadCard'

const TABS = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
]

export default function UploadTabs() {
  const [activeTab, setActiveTab] = useState('image')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm border border-gray-300'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      

      {/* Tab content */}
      {activeTab === 'image' ? <ImageUploadCard /> : <VideoUploadCard />}
    </div>
  )
}
