import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Aside from './components/Aside'
import MapboxMap from './components/MapboxMap'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className='p-4'>
        <div>
          <Header />
        </div>
        <div className='w-[100%] flex'>
          <div className='w-[30%]'>
            <Aside />
          </div>
          <div className='w-[70%]'>
            <MapboxMap />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
