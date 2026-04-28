import { useEffect, useRef, useState } from 'react'

const PAYPAL_CLIENT_ID =
  'AfspVeSF7E4c4zth33IgW7tpL6q1WxYnelERg90KXhiCY9XHI3mqRuwX8vYSqvQXE4FWJ5Q6hRBR1-9c'

const BEANIES = [
  { name: 'Princess', tag: '1997', blurb: 'Royal purple bear honoring Princess Diana.' },
  { name: 'Peanut', tag: '1995', blurb: 'Light blue elephant — the most coveted Beanie ever.' },
  { name: 'Patti', tag: '1993', blurb: 'Magenta platypus from the original nine.' },
  { name: 'Quackers', tag: '1994', blurb: 'Wingless duck variant — a true rarity.' },
  { name: 'Humphrey', tag: '1994', blurb: 'Tan camel retired early — collector gold.' },
  { name: 'Mystic', tag: '1994', blurb: 'Iridescent unicorn with a fine yarn mane.' },
]

function BeanieBabies({ onBack }) {
  const [amount, setAmount] = useState('10.00')
  const [status, setStatus] = useState('')
  const amountRef = useRef(amount)
  const buttonContainerRef = useRef(null)

  useEffect(() => {
    amountRef.current = amount
  }, [amount])

  useEffect(() => {
    let cancelled = false

    function renderButtons() {
      if (cancelled || !window.paypal || !buttonContainerRef.current) return
      buttonContainerRef.current.innerHTML = ''
      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'donate' },
          createOrder: (_data, actions) =>
            actions.order.create({
              purpose: 'DONATION',
              purchase_units: [
                {
                  description: 'Beanie Baby Fan Club donation',
                  amount: { value: amountRef.current || '1.00', currency_code: 'USD' },
                },
              ],
            }),
          onApprove: async (_data, actions) => {
            const details = await actions.order.capture()
            const name = details?.payer?.name?.given_name || 'friend'
            setStatus(`Thanks, ${name}! Your donation went through.`)
          },
          onError: () => setStatus('Something went wrong. Please try again.'),
        })
        .render(buttonContainerRef.current)
    }

    if (window.paypal) {
      renderButtons()
      return () => {
        cancelled = true
      }
    }

    const existing = document.getElementById('paypal-sdk')
    if (existing) {
      existing.addEventListener('load', renderButtons, { once: true })
    } else {
      const script = document.createElement('script')
      script.id = 'paypal-sdk'
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`
      script.async = true
      script.onload = renderButtons
      script.onerror = () => setStatus('Could not load PayPal. Check your connection.')
      document.body.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="beanie-page">
      <button type="button" className="beanie-back" onClick={onBack}>
        ← Back
      </button>

      <header className="beanie-hero">
        <h1>The Secret Beanie Baby Fan Club</h1>
        <p>
          A quiet corner of Town Pulse for collectors who remember when a plush bear
          could pay off a mortgage. Welcome home.
        </p>
      </header>

      <section className="beanie-grid">
        {BEANIES.map((b) => (
          <article key={b.name} className="beanie-card">
            <h3>{b.name}</h3>
            <span className="beanie-tag">Tag year: {b.tag}</span>
            <p>{b.blurb}</p>
          </article>
        ))}
      </section>

      <section className="beanie-donate">
        <h2>Support the Collection</h2>
        <p>
          Every dollar helps us track down rare tags, restore faded swing tags, and
          keep the heart-shaped lore alive.
        </p>

        <label className="beanie-amount">
          Donation amount (USD)
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <div ref={buttonContainerRef} className="beanie-paypal" />

        {status && <p className="beanie-status">{status}</p>}
      </section>
    </main>
  )
}

export default BeanieBabies
