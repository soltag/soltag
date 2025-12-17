import './WalletButton.css';

interface WalletButtonProps {
    name: string;
    icon: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

export default function WalletButton({ name, icon, onClick, disabled }: WalletButtonProps) {
    return (
        <button
            className="wallet-button"
            onClick={onClick}
            disabled={disabled}
            aria-label={`Connect with ${name}`}
        >
            <div className="wallet-icon">
                {icon}
            </div>
            <span className="wallet-name">{name}</span>
        </button>
    );
}

// Wallet icons as SVG components
export function SagaIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 11L3 7" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11L21 7" stroke="currentColor" strokeWidth="2" />
            <path d="M12 11V22" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

export function PhantomIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#AB9FF2" />
            <ellipse cx="9" cy="11" rx="1.5" ry="2" fill="white" />
            <ellipse cx="15" cy="11" rx="1.5" ry="2" fill="white" />
        </svg>
    );
}

export function SolflareIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="#FC8C00" />
        </svg>
    );
}
