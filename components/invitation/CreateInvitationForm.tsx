'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInvitationSchema, type CreateInvitationSchema } from '@/lib/validations'
import {
  PRIMARY_CATEGORIES,
  OTHER_CATEGORY_ICONS,
  MAX_LOCATION_OPTIONS,
  MAX_TIME_OPTIONS,
} from '@/lib/constants'
import { API_ROUTES, ROUTES } from '@/lib/routes'
import { CopyButton } from '@/components/ui/CopyButton'

const STEPS = ['Message', 'Options', 'Preview'] as const
type Step = 0 | 1 | 2

export function CreateInvitationForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [submitting, setSubmitting] = useState(false)
  const [createdShortId, setCreatedShortId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateInvitationSchema, any, CreateInvitationSchema>({
    resolver: zodResolver(createInvitationSchema) as any,
    defaultValues: {
      recipientName: '',
      personalMessage: '',
      locationOptions: [{ name: '', category: '', imageUrl: '', address: '' }],
      timeOptions: [{ label: '', isWholeDay: false, datetime: '' }],
    },
  })

  const { register, control, handleSubmit, watch, formState: { errors } } = form

  const {
    fields: locationFields,
    append: appendLocation,
    remove: removeLocation,
  } = useFieldArray({ control, name: 'locationOptions' })

  const {
    fields: timeFields,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({ control, name: 'timeOptions' })

  const watchedTimeOptions = watch('timeOptions')

  async function onSubmit(data: CreateInvitationSchema) {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(API_ROUTES.INVITATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Something went wrong.')
      }
      const { data: invitation } = await res.json()
      setCreatedShortId(invitation.shortId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Success screen ────────────────────────────────────────────────────────

  if (createdShortId) {
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.INVITE(createdShortId)}`
    return (
      <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center">
        <p className="text-4xl mb-4">🎉</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation created!</h2>
        <p className="text-gray-500 mb-6">Share this link with your crush.</p>
        <div className="flex gap-2 mb-6">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          />
          <CopyButton text={shareUrl} />
        </div>
        <div className="flex gap-3 justify-center">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Share on WhatsApp
          </a>
          <button
            onClick={() => router.push(ROUTES.DASHBOARD)}
            className="text-pink-500 hover:underline text-sm font-medium"
          >
            Go to dashboard →
          </button>
        </div>
      </div>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i <= step ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${i === step ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Personal Message ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who are you inviting? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              {...register('recipientName')}
              type="text"
              maxLength={60}
              placeholder="e.g. Liza, Alex, Sarah…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {errors.recipientName && (
              <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal message <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('personalMessage')}
              rows={4}
              maxLength={280}
              placeholder="Hey, I'd love to take you out this weekend… 🌸"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
            {errors.personalMessage && (
              <p className="text-red-500 text-sm mt-1">{errors.personalMessage.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Locations & Times ── */}
      {step === 1 && (
        <div className="space-y-8">
          {/* Location options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📍 Location Options</h2>
            <div className="space-y-4">
              {locationFields.map((field, i) => (
                <div key={field.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Location {i + 1}</span>
                    {locationFields.length > 1 && (
                      <button type="button" onClick={() => removeLocation(i)} className="text-red-400 hover:text-red-600 text-sm">
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <input
                    {...register(`locationOptions.${i}.name`)}
                    placeholder="e.g. Café Lula, Riverside Park…"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  {errors.locationOptions?.[i]?.name && (
                    <p className="text-red-500 text-xs">{errors.locationOptions[i]?.name?.message}</p>
                  )}

                  {/* Category picker */}
                  <Controller
                    control={control}
                    name={`locationOptions.${i}.category`}
                    render={({ field: { value, onChange } }) => (
                      <CategoryPicker value={value ?? ''} onChange={onChange} />
                    )}
                  />

                  {/* Address */}
                  <input
                    {...register(`locationOptions.${i}.address`)}
                    placeholder="Address (optional)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              ))}
            </div>
            {locationFields.length < MAX_LOCATION_OPTIONS && (
              <button
                type="button"
                onClick={() => appendLocation({ name: '', category: '', imageUrl: '', address: '' })}
                className="mt-3 text-pink-500 hover:text-pink-600 text-sm font-medium"
              >
                + Add another location
              </button>
            )}
          </div>

          {/* Time options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🗓️ Time Options</h2>
            <div className="space-y-4">
              {timeFields.map((field, i) => (
                <div key={field.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Time option {i + 1}</span>
                    {timeFields.length > 1 && (
                      <button type="button" onClick={() => removeTime(i)} className="text-red-400 hover:text-red-600 text-sm">
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    {...register(`timeOptions.${i}.label`)}
                    placeholder="e.g. Saturday 8 PM"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  {errors.timeOptions?.[i]?.label && (
                    <p className="text-red-500 text-xs">{errors.timeOptions[i]?.label?.message}</p>
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`timeOptions.${i}.isWholeDay`)}
                      className="rounded text-pink-500"
                    />
                    Any time — whole day
                  </label>
                  {!watchedTimeOptions?.[i]?.isWholeDay && (
                    <input
                      type="datetime-local"
                      {...register(`timeOptions.${i}.datetime`)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  )}
                </div>
              ))}
            </div>
            {timeFields.length < MAX_TIME_OPTIONS && (
              <button
                type="button"
                onClick={() => appendTime({ label: '', isWholeDay: false, datetime: '' })}
                className="mt-3 text-pink-500 hover:text-pink-600 text-sm font-medium"
              >
                + Add another time option
              </button>
            )}
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              ← Back
            </button>
            <button type="button" onClick={() => setStep(2)} className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2.5 rounded-full transition-colors">
              Preview →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ── */}
      {step === 2 && (
        <PreviewStep
          data={watch()}
          submitting={submitting}
          error={error}
          onBack={() => setStep(1)}
        />
      )}
    </form>
  )
}

// ─── Category Picker ──────────────────────────────────────────────────────────

function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showOther, setShowOther] = useState(
    // Show the "other" grid if the current value is one of the other icons
    OTHER_CATEGORY_ICONS.some((o) => o.value === value)
  )

  const isPrimary = PRIMARY_CATEGORIES.some((c) => c.value === value)
  const isOtherIcon = OTHER_CATEGORY_ICONS.some((o) => o.value === value)

  function selectPrimary(cat: string) {
    setShowOther(false)
    onChange(cat)
  }

  function toggleOther() {
    setShowOther((s) => !s)
    if (!isOtherIcon) onChange('')
  }

  return (
    <div className="space-y-2">
      {/* Primary category buttons */}
      <div className="flex flex-wrap gap-2">
        {PRIMARY_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => selectPrimary(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
              value === cat.value
                ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium'
                : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}

        {/* Other toggle */}
        <button
          type="button"
          onClick={toggleOther}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
            showOther || isOtherIcon
              ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium'
              : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
          }`}
        >
          <span>✨</span>
          <span>Other</span>
        </button>

        {/* Clear */}
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setShowOther(false) }}
            className="px-3 py-1.5 rounded-full text-xs border border-gray-200 text-gray-400 hover:text-gray-600"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Other icon grid */}
      {showOther && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-white border border-gray-100 rounded-xl">
          {OTHER_CATEGORY_ICONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                value === opt.value
                  ? 'bg-pink-100 ring-2 ring-pink-400'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-gray-500 leading-tight text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Current selection display */}
      {value && (
        <p className="text-xs text-gray-400">
          Selected: {isPrimary
            ? PRIMARY_CATEGORIES.find((c) => c.value === value)?.icon + ' ' + value
            : value}
        </p>
      )}
    </div>
  )
}

// ─── Preview Step ─────────────────────────────────────────────────────────────

function PreviewStep({
  data,
  submitting,
  error,
  onBack,
}: {
  data: CreateInvitationSchema
  submitting: boolean
  error: string | null
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-pink-100 rounded-2xl p-6">
        <p className="text-2xl text-center mb-4">💕</p>
        <p className="text-center text-xl font-bold text-gray-900 mb-4">
          Will you go on a date with me?
        </p>
        {data.personalMessage && (
          <blockquote className="border-l-4 border-pink-300 pl-4 text-gray-600 italic text-sm mb-4">
            {data.personalMessage}
          </blockquote>
        )}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Locations</p>
            {data.locationOptions.map((opt, i) => (
              <p key={i} className="text-sm text-gray-700">
                {opt.category
                  ? OTHER_CATEGORY_ICONS.find((o) => o.value === opt.category)?.icon
                    ?? PRIMARY_CATEGORIES.find((c) => c.value === opt.category)?.icon
                    ?? '📍'
                  : '📍'}{' '}
                {opt.name || <span className="text-gray-400">unnamed</span>}
              </p>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Time options</p>
            {data.timeOptions.map((opt, i) => (
              <p key={i} className="text-sm text-gray-700">
                🗓️ {opt.label || <span className="text-gray-400">unnamed</span>}
              </p>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
          ← Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-full transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Invitation 💕'}
        </button>
      </div>
    </div>
  )
}
