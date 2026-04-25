import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Map, Home, Search, Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import styles from './Navbar.module.css';
import { useAuth } from '../lib/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        navigate('/');
    };

    const navLinks = [
        { name: 'Início', path: '/', icon: <Home size={20} /> },
        { name: 'Explorar', path: '/explore', icon: <Map size={20} /> },
        { name: 'Passaporte', path: '/passport', icon: <BookOpen size={20} /> },
    ];

    return (
        <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.navContainer}>
                {/* Logo */}
                <Link to="/" className={styles.logo}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="var(--color-turquoise)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="var(--color-sky-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="var(--color-purple-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-gradient">VoyageMind</span>
                </Link>

                {/* Desktop Links */}
                <div className={styles.desktopNav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`${styles.navLink} ${location.pathname === link.path ? styles.active : ''}`}
                        >
                            {link.icon}
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </div>

                {/* Global Search & Profile */}
                <div className={styles.actions}>
                    <button className={styles.iconButton} aria-label="Pesquisar" onClick={() => navigate('/explore')}>
                        <Search size={20} />
                    </button>

                    <div className={styles.profileContainer} ref={dropdownRef}>
                        {user ? (
                            <button 
                                className={styles.profileLink} 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <div className={styles.profileAvatar}>
                                    {user.avatarUrl ? (
                                        <img src={`${getApiBaseUrl()}${user.avatarUrl}`} alt="Perfil" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                                            <UserIcon size={16} color="#aaa" />
                                        </div>
                                    )}
                                </div>
                                <span className={styles.profileLabel}>Olá, {user.name.split(' ')[0]}</span>
                            </button>
                        ) : (
                            <Link to="/profile" className={styles.profileLink}>
                                <div className={styles.profileAvatar}>
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)' }}>
                                        <UserIcon size={16} color="#aaa" />
                                    </div>
                                </div>
                                <span className={styles.profileLabel}>Entrar / Cadastrar</span>
                            </Link>
                        )}

                        {/* Dropdown Menu */}
                        {user && dropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                <Link to="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                    <UserIcon size={16} /> Meu Perfil
                                </Link>
                                <Link to="/passport" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                    <BookOpen size={16} /> Meu Passaporte
                                </Link>
                                <button className={`${styles.dropdownItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                                    <LogOut size={16} /> Sair da conta
                                </button>
                            </div>
                        )}
                    </div>
                    {/* Mobile Menu Toggle */}
                    <button className={styles.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className={styles.mobileNav}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={styles.mobileNavLink}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.icon}
                            {link.name}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
