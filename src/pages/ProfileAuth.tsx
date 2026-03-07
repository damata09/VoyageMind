import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import styles from './ProfileAuth.module.css';
import { loginUser, registerUser } from '../lib/api';

export function ProfileAuth() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const toggleAuthMode = () => setIsLogin(!isLogin);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!email || !password || (!isLogin && !name)) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }

        try {
            setLoading(true);

            if (!isLogin) {
                await registerUser({ name, email, password });
            }

            const result = await loginUser({ email, password });

            localStorage.setItem('voyagemind_token', result.token);
            localStorage.setItem('voyagemind_user_name', result.user.name);

            navigate('/passport');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Erro ao autenticar. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            {/* Dynamic Background */}
            <div className={styles.backgroundElement} />

            <div className={styles.authWrapper}>
                <motion.div
                    className={`glass-panel ${styles.authCard}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className={styles.cardHeader}>
                        <motion.h1
                            key={isLogin ? 'login' : 'register'}
                            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-gradient"
                        >
                            {isLogin ? 'Bem-vindo de volta' : 'Crie seu Passaporte'}
                        </motion.h1>
                        <p className={styles.subtitle}>
                            {isLogin
                                ? 'Continue sua jornada com o VoyageMind.'
                                : 'Junte-se a nós e desbloqueie o mundo.'}
                        </p>
                    </div>

                    <form className={styles.authForm} onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {!isLogin && (
                                <motion.div
                                    key="name-input"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={styles.inputGroup}
                                >
                                    <label htmlFor="name">Como prefere ser chamado?</label>
                                    <div className={styles.inputWrapper}>
                                        <User size={18} className={styles.inputIcon} />
                                        <input
                                            type="text"
                                            id="name"
                                            placeholder="Seu nome"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email</label>
                            <div className={styles.inputWrapper}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">Senha</label>
                            <div className={styles.inputWrapper}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <a href="#" className={styles.forgotPassword}>
                                Esqueceu a senha?
                            </a>
                        )}

                        {error && (
                            <p className={styles.errorMessage}>
                                {error}
                            </p>
                        )}

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            <span>{loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Começar Aventura'}</span>
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className={styles.cardFooter}>
                        <p>
                            {isLogin ? 'Ainda não tem um passaporte?' : 'Já é um explorador?'}
                            <button type="button" onClick={toggleAuthMode} className={styles.toggleButton}>
                                {isLogin ? 'Cadastre-se' : 'Entrar'}
                            </button>
                        </p>
                    </div>
                </motion.div>

                {/* Feature Promo Side */}
                <div className={styles.promoSide}>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={styles.promoContent}
                    >
                        <h2>Viaje Diferente.</h2>
                        <ul>
                            <li>
                                <div className={styles.promoIcon}>✨</div>
                                <div>
                                    <h3>Inteligência Invisível</h3>
                                    <p>Descubra rotas personalizadas sem precisar buscar.</p>
                                </div>
                            </li>
                            <li>
                                <div className={styles.promoIcon}>🏆</div>
                                <div>
                                    <h3>Passaporte XP</h3>
                                    <p>Colecione carimbos digitais imersivos em suas viagens.</p>
                                </div>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
