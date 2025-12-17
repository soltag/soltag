import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import type { Credential } from '../types';
import { formatDate } from '../data/mockData';
import './CredentialCard.css';

interface CredentialCardProps {
    credential: Credential;
    variant?: 'default' | 'compact';
}

export default function CredentialCard({ credential, variant = 'default' }: CredentialCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/credential/${credential.id}`);
    };

    if (variant === 'compact') {
        return (
            <button className="credential-card compact" onClick={handleClick}>
                <div className="credential-icon">
                    <Award size={20} />
                </div>
                <div className="credential-info">
                    <span className="credential-name">{credential.event_name}</span>
                    <span className="credential-date">{formatDate(credential.issued_at)}</span>
                </div>
            </button>
        );
    }

    return (
        <button className="credential-card" onClick={handleClick}>
            {credential.image && (
                <div className="credential-image">
                    <img src={credential.image} alt={credential.event_name} />
                </div>
            )}
            <div className="credential-content">
                <div className="credential-header">
                    <Award size={16} className="credential-badge-icon" />
                    <span className="credential-label">SOLTAG Credential</span>
                </div>
                <h3 className="credential-title">{credential.event_name}</h3>
                <p className="credential-meta">
                    Issued {formatDate(credential.issued_at)}
                </p>
                {credential.category && (
                    <span className={`credential-category ${credential.category}`}>
                        {credential.category}
                    </span>
                )}
            </div>
            <div className="credential-sbt-badge">
                <span>SBT</span>
            </div>
        </button>
    );
}
