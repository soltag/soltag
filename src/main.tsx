import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletContextProvider } from './contexts/WalletContextProvider.tsx'
import './index.css'
import App from './App.tsx'

// Register Mobile Wallet Adapter as a wallet option (wallet-standard-mobile)
import './registerMwa'

createRoot(document.getElementById('root')!).render(
    <WalletContextProvider>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </WalletContextProvider>
)
