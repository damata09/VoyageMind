import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, LayoutDashboard, Compass, LogOut, Camera } from 'lucide-react';
import styles from './ProfileAuth.module.css';
import { loginUser, registerUser, getApiBaseUrl } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { uploadAvatar } from '../lib/upload';

export function ProfileAuth() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const navigate = useNavigate();
    const { user, login, logout, updateAvatar } = useAuth();
    
    const toggleAuthMode = () => setIsLogin(!isLogin);

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        try {
            setUploadingAvatar(true);
            setError(null);
            const { avatarUrl } = await uploadAvatar(file);
            updateAvatar(avatarUrl);
        } catch (err) {
            setError("Erro ao salvar foto no backend.");
        } finally {
            setUploadingAvatar(false);
        }
    };

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

            // Usa o Context API
            login(result.token, { id: result.user.id, name: result.user.name, email: result.user.email });

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

    if (user) {
        return (
            <div className={styles.container}>
                <div className={styles.backgroundElement} />
                <div className={styles.authWrapper} style={{ justifyContent: 'center' }}>
                    <motion.div
                        className={`glass-panel ${styles.authCard}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ maxWidth: '600px', width: '100%' }}
                    >
                        <div className={styles.cardHeader}>
                            <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <LayoutDashboard size={28} /> Dashboard do Explorador
                            </h2>
                            <p className={styles.subtitle}>Bem-vindo de volta, {user.name}!</p>
                        </div>
                        <div style={{ padding: 'var(--spacing-lg) 0', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                    {user.avatarUrl ? (
                                        <img src={`${getApiBaseUrl()}${user.avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={40} color="#aaa" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                                    )}
                                    {uploadingAvatar && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{fontSize:'12px'}}>...</span></div>}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', paddingBottom: '8px' }}>Foto de Perfil</h3>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()} 
                                        className={styles.changePhotoBtn}
                                        disabled={uploadingAvatar}
                                    >
                                        <Camera size={16} /> Alterar Foto
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
                                </div>
                            </div>

                            {error && <p className={styles.errorMessage} style={{ margin: 0 }}>{error}</p>}

                            <div className={styles.inputGroup}>
                                <label>Seu Nome</label>
                                <div className={styles.inputWrapper}>
                                    <User size={18} className={styles.inputIcon} />
                                    <input type="text" readOnly value={user.name} style={{ opacity: 0.7 }} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Email da Conta</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input type="text" readOnly value={user.email} style={{ opacity: 0.7 }} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.dashboardActions}>
                            <button
                                type="button"
                                className={styles.submitButton}
                                onClick={() => navigate('/passport')}
                                style={{ flex: 1, display: 'flex', justifyContent: 'center' }}
                            >
                                <Compass size={18} /> <span>Meu Passaporte</span>
                            </button>
                            <button
                                type="button"
                                className={styles.submitButton}
                                onClick={() => { logout(); navigate('/'); }}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255, 99, 71, 0.1)',
                                    color: 'var(--color-coral)',
                                    border: '1px solid rgba(255,99,71,0.2)'
                                }}
                            >
                                <LogOut size={18} /> <span>Sair da Conta</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
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
