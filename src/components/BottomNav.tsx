import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Clock, Settings } from 'lucide-react';
import type { TabName } from '../types';
import './BottomNav.css';

interface BottomNavProps {
    activeTab?: TabName;
}

const navItems: { name: TabName; icon: typeof Home; label: string; path: string }[] = [
    { name: 'home', icon: Home, label: 'Home', path: '/' },
    { name: 'events', icon: Calendar, label: 'Events', path: '/events' },
    { name: 'profile', icon: User, label: 'Profile', path: '/profile' },
    { name: 'queue', icon: Clock, label: 'Queue', path: '/queue' },
    { name: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
];

export default function BottomNav({ activeTab }: BottomNavProps) {
    return (
        <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;

                return (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
}
