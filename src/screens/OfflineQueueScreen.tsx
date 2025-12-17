import { useState } from 'react';
import { RefreshCw, Trash2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { mockQueueItems, formatDateTime } from '../data/mockData';
import type { QueueItem } from '../types';
import './OfflineQueueScreen.css';

export default function OfflineQueueScreen() {
    const [queueItems, setQueueItems] = useState<QueueItem[]>(mockQueueItems);
    const [isOnline] = useState(true); // Simulated

    const handleRetry = (itemId: string) => {
        setQueueItems(items =>
            items.map(item =>
                item.id === itemId ? { ...item, status: 'pending', retries: item.retries + 1 } : item
            )
        );
        // Simulate success after delay
        setTimeout(() => {
            setQueueItems(items => items.filter(item => item.id !== itemId));
        }, 2000);
    };

    const handleRemove = (itemId: string) => {
        setQueueItems(items => items.filter(item => item.id !== itemId));
    };

    const handleRetryAll = () => {
        queueItems.forEach(item => handleRetry(item.id));
    };

    const getStatusLabel = (status: QueueItem['status']) => {
        switch (status) {
            case 'signed': return 'Signed';
            case 'pending': return 'Submitting...';
            case 'needsResign': return 'Needs Re-sign';
            case 'failed': return 'Failed';
        }
    };

    return (
        <div className="queue-screen">
            <div className="queue-content">
                <header className="queue-header animate-fade-in">
                    <h1 className="queue-title">Offline Queue</h1>
                    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
                        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                </header>

                {queueItems.length > 0 && (
                    <button
                        className="btn btn-secondary btn-full animate-fade-in"
                        onClick={handleRetryAll}
                    >
                        <RefreshCw size={18} />
                        Retry All ({queueItems.length})
                    </button>
                )}

                {/* Queue items */}
                <div className="queue-list animate-slide-up">
                    {queueItems.length > 0 ? (
                        queueItems.map(item => (
                            <div key={item.id} className={`queue-item ${item.status}`}>
                                <div className="queue-item-info">
                                    <h3>{item.eventName}</h3>
                                    <p>Queued {formatDateTime(item.createdAt)}</p>
                                    <span className={`queue-status ${item.status}`}>
                                        {item.status === 'pending' && <RefreshCw size={12} className="animate-spin" />}
                                        {item.status === 'needsResign' && <AlertCircle size={12} />}
                                        {getStatusLabel(item.status)}
                                    </span>
                                </div>
                                <div className="queue-item-actions">
                                    <button
                                        className="queue-action-btn retry"
                                        onClick={() => handleRetry(item.id)}
                                        disabled={item.status === 'pending'}
                                        aria-label="Retry"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                    <button
                                        className="queue-action-btn remove"
                                        onClick={() => handleRemove(item.id)}
                                        aria-label="Remove"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-queue">
                            <div className="empty-icon">✓</div>
                            <h2>All Clear</h2>
                            <p>No pending transactions in queue</p>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="queue-info animate-fade-in">
                    <p>
                        Transactions are queued when you check in without network connectivity.
                        They will be submitted automatically when you're back online.
                    </p>
                </div>
            </div>

            <BottomNav activeTab="queue" />
        </div>
    );
}
