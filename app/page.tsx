'use client'
export const dynamic = "force-dynamic"


import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  // 🔐 Listen to auth changes properly
  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        window.location.href = '/login'
      } else {
        setUser(data.session.user)
        fetchBookmarks(data.session.user.id)
      }
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          window.location.href = '/login'
        } else {
          setUser(session.user)
          fetchBookmarks(session.user.id)
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setBookmarks(data || [])
  }

  const addBookmark = async () => {
    if (!title || !url || !user) return

    const { error } = await supabase.from('bookmarks').insert([
      {
        title,
        url,
        user_id: user.id
      }
    ])

    if (!error) {
      fetchBookmarks(user.id)
      setTitle('')
      setUrl('')
    }
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
    if (user) fetchBookmarks(user.id)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) return <p className="p-10">Loading...</p>

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Welcome {user.email}
      </h1>

      <button
        onClick={logout}
        className="mb-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>

      <div className="mb-4">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-2 rounded"
        />
        <input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="border p-2 w-full mb-2 rounded"
        />
        <button
          onClick={addBookmark}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Bookmark
        </button>
      </div>

      <ul>
        {bookmarks.map((b) => (
          <li
            key={b.id}
            className="flex justify-between items-center border-b py-2"
          >
            <a
              href={b.url.startsWith('http') ? b.url : `https://${b.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              {b.title}
            </a>

            <button
              onClick={() => deleteBookmark(b.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
