import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

console.log('[echo.js] loading, REVERB_KEY=', import.meta.env.VITE_REVERB_APP_KEY)

try {
  window.Echo = new Echo({
    broadcaster:       'reverb',
    key:               import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:            import.meta.env.VITE_REVERB_HOST ?? 'localhost',
    wsPort:            Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort:           Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS:          (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const token = localStorage.getItem('token')
        console.log('[echo.js] authorizing channel:', channel.name, 'socket:', socketId, 'token?', !!token)
        fetch('http://127.0.0.1:8000/api/v1/broadcasting/auth', {
          method:  'POST',
          headers: {
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((res) => {
            console.log('[echo.js] auth response status:', res.status)
            return res.json()
          })
          .then((data) => {
            console.log('[echo.js] auth data:', data)
            callback(null, data)
          })
          .catch((err) => {
            console.error('[echo.js] auth FAILED:', err)
            callback(err, null)
          })
      },
    }),
  })
  console.log('[echo.js] window.Echo ready:', window.Echo)
} catch (e) {
  console.error('[echo.js] FAILED to init Echo:', e)
}
