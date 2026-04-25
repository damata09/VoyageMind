import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Compass, Sparkles } from 'lucide-react';
import styles from './Landing.module.css';
import { HeroGlobe } from '../components/HeroGlobe';

export function Landing() {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate('/explore', { state: { q: searchQuery } });
        } else {
            navigate('/explore');
        }
    };
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <HeroGlobe />
                    <div className={styles.overlay} style={{ background: 'linear-gradient(to bottom, transparent 60%, var(--color-bg-dark) 100%)' }} />
                </div>

                <div className={styles.heroContent}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className={styles.badge}>
                            <Sparkles size={16} className={styles.badgeIcon} />
                            <span className="text-gradient">Seu Assistente Invisível</span>
                        </span>
                        <h1 className={styles.title}>
                            Explore o mundo,<br />
                            <span className="text-gradient">curado especialmente para você.</span>
                        </h1>
                        <p className={styles.subtitle}>
                            VoyageMind entende o seu estilo de viagem e cria experiências mágicas e invisíveis.
                        </p>
                    </motion.div>

                    {/* Natural Search Bar */}
                    <motion.div
                        className={`glass-panel ${styles.searchBar}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Search className={styles.searchIcon} size={24} />
                        <input
                            type="text"
                            placeholder="Tente 'lugares tranquilos com vista bonita perto de mim'..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button className={styles.searchButton} onClick={handleSearch}>
                            <Compass size={20} />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Featured Recommendations */}
            <section className={`container ${styles.recommendations}`}>
                <div className={styles.sectionHeader}>
                    <h2>Selecionado para seu perfil <span className="text-gradient">Contemplativo</span></h2>
                </div>

                <div className={styles.cardsGrid}>
                    {[
                        {
                            id: 1,
                            title: "Jardim Zen Secreto",
                            location: "Quioto, Japão",
                            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
                            tag: "Ponto Secreto"
                        },
                        {
                            id: 2,
                            title: "Aurora da Meia-Noite",
                            location: "Tromsø, Noruega",
                            image: "/images/aurora.png",
                            tag: "Sazonal"
                        },
                        {
                            id: 3,
                            title: "Refúgio à beira do Penhasco",
                            location: "Amalfi, Itália",
                            image: "/images/amalfi.png",
                            tag: "Exclusivo"
                        }
                    ].map((item, index) => (
                        <motion.div
                            key={item.id}
                            className={`glass-panel ${styles.card}`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -10 }}
                        >
                            <div className={styles.cardImageWrapper}>
                                <img src={item.image} alt={item.title} />
                                <span className={styles.cardBadge}>{item.tag}</span>
                            </div>
                            <div className={styles.cardContent}>
                                <h3>{item.title}</h3>
                                <p className={styles.location}>{item.location}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
