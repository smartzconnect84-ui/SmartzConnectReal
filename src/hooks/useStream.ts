import { useContext } from 'react'
import { StreamContext } from '@/contexts/StreamContext'

export function useStream() {
  return useContext(StreamContext)
}
