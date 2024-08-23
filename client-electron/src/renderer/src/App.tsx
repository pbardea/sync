import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { Team } from './models/team'
import { observer } from 'mobx-react'
import { useEffect } from 'react'
import { mockApi } from './api'

const App: (props: { team: Team }) => JSX.Element = observer((props: { team: Team }) => {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  useEffect(() => {
    setTimeout(() => {
      const user = props.team?.members.find((x) => x.id === '6f73afd5-b171-4ea5-80af-7e5040c178b2')
      if (user === undefined) {
        return
      }
      user.email = 'hhahhaaha'
      user.save()
    }, 1000)
    setTimeout(() => {
      mockApi.runWorker()
    }, 5000)
  }, [])

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span> <br />
        123 {props.team?.name ?? 'Nothing'} 456 <br />
        {props.team?.members.map((x) => x.email).join(', ')} <br />
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
})

export default App
