import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Map, Home, Search, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const storedName = localStorage.getItem('voyagemind_user_name');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

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
                    <button className={styles.iconButton} aria-label="Pesquisar">
                        <Search size={20} />
                    </button>

                    <Link to="/profile" className={styles.profileLink}>
                        <div className={styles.profileAvatar}>
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Perfil" />
                        </div>
                        <span className={styles.profileLabel}>
                            {userName ? `Olá, ${userName}` : 'Entrar/Cadastrar'}
                        </span>
                    </Link>
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
