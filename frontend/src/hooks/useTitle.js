import { useEffect } from 'react'

export default function useTitle(title) {
  useEffect(() => {
    document.title = `${title} | BookXchange`
    return () => { document.title = 'BookXchange' }
  }, [title])
}
