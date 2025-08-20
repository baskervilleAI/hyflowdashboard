import type { SavedState } from './types'

const KEY = 'hyflowdashboard_state_v1'

export function saveState(state: SavedState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function loadState(): SavedState | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SavedState
  } catch {
    return null
  }
}

export function clearState() {
  localStorage.removeItem(KEY)
}
