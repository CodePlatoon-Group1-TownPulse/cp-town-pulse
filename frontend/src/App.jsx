import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section >
        <div className="hero">
          <img src="/image.png" style={{ width: 'auto', height: '300px' }} />
        </div>
          {/* <h1>Town Pulse</h1> */}
      </section>

      <div>
        <button className="counter">Login</button>

        <button className="counter">Create Account</button>

        <button className="counter">Search Activities</button>
      </div>      

      
    </>
  )
}

export default App
