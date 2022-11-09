import Link from 'next/link'
import useSWR from 'swr'
import { supabase } from '../utils/initSupabase'
import { useEffect, useState } from 'react'
import Auth from './../components/Auth'
import { useUser } from '../lib/UserContext'

const fetcher = (url, token) =>
  fetch(url, {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json', token }),
    credentials: 'same-origin',
  }).then((res) => res.json())

const Index = () => {
  const { user, session } = useUser()
  const { data, error } = useSWR(session ? ['/api/getUser', session.access_token] : null, fetcher)
  const [authView, setAuthView] = useState('sign_in')

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setAuthView('update_password')
      if (event === 'USER_UPDATED') setTimeout(() => setAuthView('sign_in'), 1000)
      // Send session to /api/auth route to set the auth cookie.
      // NOTE: this is only needed if you're doing SSR (getServerSideProps)!
      fetch('/api/auth', {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({ event, session }),
      }).then((res) => res.json())
    })

    return () => {
      authListener.unsubscribe()
    }
  }, [])

  const View = () => {
    if (!user)
      return (
        <>
          <div>
            <h2 style={{textAlign: 'center', color: '#283a54'}}>
              CAMUS
            </h2>
          </div>
          <Auth supabaseClient={supabase} authView={authView} setAuthView={setAuthView} />
        </>
      )

    return (
      <>
        {authView === 'update_password' && <Auth.UpdatePassword supabaseClient={supabase} />}
        {user && (
          <>
            <h4>Estas logeado</h4>
            <h5>Correo: {user.email}</h5>
            <button type="outline" onClick={() => supabase.auth.signOut()}>
              Salir
            </button>
            <hr />
            {error && <div style={{ color: 'red' }}>Failed to fetch user!</div>}
            {data && !error ? (
              <>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </>
            ) : (
              <div>Loading...</div>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <div style={{ maxWidth: '520px', margin: '96px auto' }}>
      <View />
    </div>
  )
}

export default Index
