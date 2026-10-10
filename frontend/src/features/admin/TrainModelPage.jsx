/**
 * TrainModelPage — Model training simulation for admin.
 * UI consistent with dark admin theme (#0d1b2a background, teal accents).
 */

import { useState, useRef } from 'react'
import AdminNavbar from './AdminNavbar'

const EPOCHS = 10

const CNN_EPOCHS = [
  { epoch: 1,  loss: 0.693, accuracy: 51.2, val_accuracy: 50.8 },
  { epoch: 2,  loss: 0.621, accuracy: 63.4, val_accuracy: 61.9 },
  { epoch: 3,  loss: 0.548, accuracy: 71.8, val_accuracy: 70.2 },
  { epoch: 4,  loss: 0.478, accuracy: 78.3, val_accuracy: 76.7 },
  { epoch: 5,  loss: 0.402, accuracy: 83.1, val_accuracy: 81.4 },
  { epoch: 6,  loss: 0.341, accuracy: 87.6, val_accuracy: 85.9 },
  { epoch: 7,  loss: 0.289, accuracy: 90.2, val_accuracy: 88.7 },
  { epoch: 8,  loss: 0.241, accuracy: 92.1, val_accuracy: 91.3 },
  { epoch: 9,  loss: 0.198, accuracy: 93.5, val_accuracy: 92.8 },
  { epoch: 10, loss: 0.163, accuracy: 94.4, val_accuracy: 94.1 },
]

const LSTM_EPOCHS = [
  { epoch: 1,  loss: 0.701, accuracy: 50.4, val_accuracy: 49.9 },
  { epoch: 2,  loss: 0.645, accuracy: 59.7, val_accuracy: 58.3 },
  { epoch: 3,  loss: 0.581, accuracy: 67.2, val_accuracy: 65.8 },
  { epoch: 4,  loss: 0.512, accuracy: 73.5, val_accuracy: 71.9 },
  { epoch: 5,  loss: 0.447, accuracy: 78.1, val_accuracy: 76.4 },
  { epoch: 6,  loss: 0.389, accuracy: 81.9, val_accuracy: 80.2 },
  { epoch: 7,  loss: 0.334, accuracy: 84.6, val_accuracy: 83.1 },
  { epoch: 8,  loss: 0.285, accuracy: 86.3, val_accuracy: 85.0 },
  { epoch: 9,  loss: 0.244, accuracy: 87.5, val_accuracy: 86.8 },
  { epoch: 10, loss: 0.211, accuracy: 88.0, val_accuracy: 87.4 },
]

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function IconImage() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14
           M8 10a2 2 0 100-4 2 2 0 000 4zm-4 10h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function IconVideo() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14
           M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function IconCpu() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 3H7a2 2 0 00-2 2v2M9 3h6M9 3v18m6-18h2a2 2 0 012 2v2m-4-4v18
           M3 9h18M3 15h18M21 9v6M3 9v6m18-6v6" />
    </svg>
  )
}

// ── File Drop Zone ────────────────────────────────────────────────────────────
function FileDropZone({ label, labelColor, accept, files, onFiles, isReal }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    onFiles(prev => [...prev, ...dropped])
  }

  function handleChange(e) {
    const selected = Array.from(e.target.files)
    onFiles(prev => [...prev, ...selected])
    e.target.value = ''
  }

  const borderColor  = isReal ? 'border-success/30 hover:border-success/60' : 'border-danger/30 hover:border-danger/60'
  const dragColor    = isReal ? 'border-success bg-success/5' : 'border-danger bg-danger/5'
  const iconBg       = isReal ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
  const badgeColor   = isReal ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'

  return (
    <div>
      {/* Label */}
      <div className={`flex items-center gap-2 mb-2`}>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1
                          rounded-full border ${badgeColor}`}>
          {isReal ? <IconCheck /> : <IconX />}
          {label}
        </span>
        <span className="text-gray-500 text-xs">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
          ${dragging ? dragColor : `border-white/10 hover:bg-white/5 ${borderColor}`}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
            <IconUpload />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">
              Drop <span className={labelColor}>{label}</span> files
            </p>
            <p className="text-xs text-gray-500 mt-0.5">or click to browse · {accept}</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
          {files.map((f, i) => (
            <div key={i}
              className="flex items-center justify-between bg-white/5 border border-white/5
                         rounded-lg px-3 py-1.5 group">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isReal ? 'bg-success' : 'bg-danger'}`} />
                <span className="text-xs text-gray-300 truncate">{f.name}</span>
              </div>
              <button
                onClick={e => { e.stopPropagation(); onFiles(prev => prev.filter((_, j) => j !== i)) }}
                className="text-gray-600 hover:text-danger transition-colors ml-2 shrink-0
                           opacity-0 group-hover:opacity-100"
              >
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Epoch Log Row ─────────────────────────────────────────────────────────────
function EpochRow({ data, visible, isLast }) {
  if (!visible) return null
  const isDone = isLast
  return (
    <div className={`grid grid-cols-4 gap-2 py-2 border-b border-white/5 text-xs font-mono
                     ${isDone ? 'text-success' : 'text-gray-300'}`}>
      <span className="text-gray-500">
        Epoch {String(data.epoch).padStart(2, '0')}/{EPOCHS}
      </span>
      <span>
        loss: <span className="text-yellow-400">{data.loss.toFixed(4)}</span>
      </span>
      <span>
        acc: <span className="text-accent">{data.accuracy.toFixed(1)}%</span>
      </span>
      <span>
        val: <span className={data.val_accuracy >= 80 ? 'text-success' : 'text-yellow-400'}>
          {data.val_accuracy.toFixed(1)}%
        </span>
        {isDone && <span className="text-success ml-2">✓</span>}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrainModelPage() {
  const [modelType, setModelType]         = useState('cnn')
  const [realFiles, setRealFiles]         = useState([])
  const [fakeFiles, setFakeFiles]         = useState([])
  const [stage, setStage]                 = useState('idle')
  const [currentEpoch, setCurrentEpoch]   = useState(0)
  const [visibleEpochs, setVisibleEpochs] = useState([])

  const isCNN      = modelType === 'cnn'
  const epochData  = isCNN ? CNN_EPOCHS : LSTM_EPOCHS
  const finalAcc   = isCNN ? 94.4 : 88.0
  const modelName  = isCNN ? 'CNN Model' : 'LSTM Model'
  const modelSub   = isCNN ? 'Image Detection' : 'Video Detection'
  const accept     = isCNN ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime,video/x-msvideo'
  const acceptLbl  = isCNN ? 'JPG, PNG, WebP' : 'MP4, MOV, AVI'
  const totalFiles = realFiles.length + fakeFiles.length
  const canTrain   = realFiles.length >= 1 && fakeFiles.length >= 1
  const progress   = stage === 'done' ? 100 : Math.round((currentEpoch / EPOCHS) * 100)

  async function handleTrain() {
    if (!canTrain) return
    setStage('training')
    setVisibleEpochs([])
    setCurrentEpoch(0)
    for (let i = 0; i < EPOCHS; i++) {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 500))
      setCurrentEpoch(i + 1)
      setVisibleEpochs(prev => [...prev, i])
    }
    await new Promise(r => setTimeout(r, 500))
    setStage('done')
  }

  function handleReset() {
    setStage('idle')
    setCurrentEpoch(0)
    setVisibleEpochs([])
    setRealFiles([])
    setFakeFiles([])
  }

  return (
    <div className="min-h-screen bg-[#0d1b2a] text-white">
      <AdminNavbar title="Admin dashboard" />

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-12">

        {/* Page header */}
        <p className="text-xs uppercase tracking-widest font-semibold text-accent mb-3">
          Model Training
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
          Train Detection Model
        </h1>
        <p className="text-gray-400 text-sm mb-10 max-w-2xl leading-relaxed">
          Upload labeled datasets to train our AI detection models.
          Provide <span className="text-success font-medium">Real</span> and{' '}
          <span className="text-danger font-medium">Fake</span> samples
          to fine-tune the model for improved accuracy.
        </p>

        {/* Model selector */}
        <div className="bg-[#162739] rounded-xl border border-white/5 p-6 mb-6">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
            Select Model
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CNN */}
            <button
              onClick={() => { setModelType('cnn'); handleReset() }}
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                ${modelType === 'cnn'
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                ${modelType === 'cnn' ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'}`}>
                <IconImage />
              </div>
              <div>
                <p className={`font-semibold ${modelType === 'cnn' ? 'text-white' : 'text-gray-300'}`}>
                  CNN Model
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Image Detection · 94.4% accuracy</p>
              </div>
              {modelType === 'cnn' && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full" />
              )}
            </button>

            {/* LSTM */}
            <button
              onClick={() => { setModelType('lstm'); handleReset() }}
              className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                ${modelType === 'lstm'
                  ? 'border-accent bg-accent/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                ${modelType === 'lstm' ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'}`}>
                <IconVideo />
              </div>
              <div>
                <p className={`font-semibold ${modelType === 'lstm' ? 'text-white' : 'text-gray-300'}`}>
                  LSTM Model
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Video Detection · 88.0% accuracy</p>
              </div>
              {modelType === 'lstm' && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Dataset upload — only show when idle */}
        {stage === 'idle' && (
          <div className="bg-[#162739] rounded-xl border border-white/5 p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
                Upload Dataset
              </h2>
              {totalFiles > 0 && (
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-success rounded-full" />
                    Real: <strong className="text-success ml-1">{realFiles.length}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-danger rounded-full" />
                    Fake: <strong className="text-danger ml-1">{fakeFiles.length}</strong>
                  </span>
                  <span className="text-gray-500">
                    Total: <strong className="text-white ml-1">{totalFiles}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <FileDropZone
                label="Real (Authentic)"
                labelColor="text-success"
                accept={acceptLbl}
                files={realFiles}
                onFiles={setRealFiles}
                isReal={true}
              />
              <FileDropZone
                label="Fake (AI-Generated)"
                labelColor="text-danger"
                accept={acceptLbl}
                files={fakeFiles}
                onFiles={setFakeFiles}
                isReal={false}
              />
            </div>

            {/* Hint */}
            {!canTrain && (
              <p className="text-xs text-gray-500 text-center mb-4">
                Add at least 1 Real and 1 Fake {isCNN ? 'image' : 'video'} to begin training
              </p>
            )}

            {/* Train button */}
            <button
              onClick={handleTrain}
              disabled={!canTrain}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2
                ${canTrain
                  ? 'bg-accent hover:bg-accent/80 text-white shadow-lg shadow-accent/20'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/10'}`}
            >
              <IconCpu />
              {canTrain ? `Start Training ${modelName}` : 'Waiting for dataset…'}
            </button>
          </div>
        )}

        {/* Training progress */}
        {(stage === 'training' || stage === 'done') && (
          <div className="bg-[#162739] rounded-xl border border-white/5 p-6 mb-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                  {isCNN ? <IconImage /> : <IconVideo />}
                </div>
                <div>
                  <p className="text-white font-semibold">{modelName}</p>
                  <p className="text-gray-500 text-xs">{modelSub} · {totalFiles} training samples</p>
                </div>
              </div>
              {stage === 'done' ? (
                <span className="flex items-center gap-1.5 bg-success/10 text-success
                                 border border-success/20 text-xs font-semibold px-3 py-1.5 rounded-full">
                  <IconCheck />
                  Complete
                </span>
              ) : (
                <span className="flex items-center gap-1.5 bg-accent/10 text-accent
                                 border border-accent/20 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Training…
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Epoch {currentEpoch} of {EPOCHS}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-6 overflow-hidden">
              <div
                className="h-2 rounded-full bg-accent transition-all duration-500
                           shadow-[0_0_8px_rgba(0,188,212,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Epoch stats row */}
            {currentEpoch > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Current Loss',      value: epochData[currentEpoch - 1]?.loss.toFixed(4),          color: 'text-yellow-400' },
                  { label: 'Train Accuracy',    value: `${epochData[currentEpoch - 1]?.accuracy.toFixed(1)}%`, color: 'text-accent'     },
                  { label: 'Val Accuracy',      value: `${epochData[currentEpoch - 1]?.val_accuracy.toFixed(1)}%`, color: 'text-success'  },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0d1b2a] rounded-xl p-3 text-center border border-white/5">
                    <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Training log */}
            <div className="bg-[#0d1b2a] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <span className="text-gray-500 text-xs font-mono ml-1">
                  training_log — {modelName.toLowerCase().replace(' ', '_')}.py
                </span>
              </div>
              <div className="p-4 max-h-52 overflow-y-auto">
                {/* Header row */}
                <div className="grid grid-cols-4 gap-2 py-1 mb-1 text-xs font-mono text-gray-600 border-b border-white/5">
                  <span>EPOCH</span>
                  <span>LOSS</span>
                  <span>ACCURACY</span>
                  <span>VAL_ACC</span>
                </div>
                {epochData.map((data, i) => (
                  <EpochRow
                    key={i}
                    data={data}
                    visible={visibleEpochs.includes(i)}
                    isLast={i === EPOCHS - 1 && stage === 'done'}
                  />
                ))}
                {stage === 'training' && (
                  <p className="text-xs text-accent font-mono animate-pulse mt-2">
                    ▶ Processing epoch {currentEpoch + 1}…
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success result */}
        {stage === 'done' && (
          <div className="bg-success/5 border border-success/20 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success shrink-0">
                <IconCheck />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-lg">Model Trained Successfully</p>
                <p className="text-gray-400 text-sm mt-1">
                  <span className="text-white font-medium">{modelName}</span> achieved{' '}
                  <span className="text-success font-bold text-lg">{finalAcc}%</span>{' '}
                  accuracy on the validation set using {totalFiles} training samples.
                </p>
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-white/10 text-gray-300
                               hover:bg-white/5 transition text-sm font-medium"
                  >
                    Train Again
                  </button>
                  <button
                    onClick={() => { setModelType(isCNN ? 'lstm' : 'cnn'); handleReset() }}
                    className="px-4 py-2 rounded-lg bg-accent text-white text-sm
                               font-medium hover:bg-accent/80 transition flex items-center gap-2"
                  >
                    {isCNN ? <IconVideo /> : <IconImage />}
                    Train {isCNN ? 'LSTM' : 'CNN'} Model
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-[#162739] rounded-xl border border-white/5 p-6">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
            How Training Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { step: '01', title: 'Upload Dataset',    desc: `Add labeled ${isCNN ? 'images' : 'videos'} — both Real and Fake samples` },
              { step: '02', title: 'Data Preparation',  desc: 'Dataset is split into training and validation sets' },
              { step: '03', title: 'Model Fine-Tuning', desc: `${modelName} trains over ${EPOCHS} epochs using cross-entropy loss` },
              { step: '04', title: 'Evaluation',        desc: 'Final model is evaluated on validation set to confirm accuracy' },
            ].map(item => (
              <div key={item.step} className="flex gap-3 p-3 bg-[#0d1b2a] rounded-xl border border-white/5">
                <span className="text-accent font-bold text-sm shrink-0 w-6">{item.step}</span>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
