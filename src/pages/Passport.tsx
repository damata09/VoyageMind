import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Compass, Map as MapIcon, Star, Plus, Lock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import styles from './Passport.module.css';
import { getPassports, type PassportItem, createPassport } from '../lib/api';

type LocalVisit = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    rating: number;
    review: string;
    date: string;
    unlockDate?: string;
};

export function Passport() {
    const [passports, setPassports] = useState<PassportItem[]>([]);
    const [localHistory, setLocalHistory] = useState<LocalVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'3D' | 'Map'>('Map');

    // Add Past Trip Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addPlace, setAddPlace] = useState('');
    const [addRating, setAddRating] = useState(5);
    const [addReview, setAddReview] = useState('');
    const [addDate, setAddDate] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    
    // Time Capsule
    const [isCapsule, setIsCapsule] = useState(false);
    const [capsuleUnlockDate, setCapsuleUnlockDate] = useState('');

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getPassports();
                setPassports(data.reverse());
            } catch (err) {
                // ignore
            } finally {
                const stored = localStorage.getItem('voyagemind_visits');
                if (stored) {
                    setLocalHistory(JSON.parse(stored).reverse());
                }
                setLoading(false);
            }
        }
        load();
    }, []);

    const initialCenter: [number, number] = localHistory.length > 0 
        ? [localHistory[0].lat, localHistory[0].lng]
        : [20, 0];

    async function handleAddPastTrip() {
        if (!addPlace.trim()) return;
        
        if (isCapsule && !capsuleUnlockDate) {
            alert("Para uma cápsula do tempo, defina a data de abertura!");
            return;
        }
        
        setAddLoading(true);

        try {
            // Geocode
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addPlace)}&limit=1`,
                { headers: { 'Accept-Language': 'pt-BR' } }
            );
            const geoData = await geoRes.json();

            if (!geoData.length) {
                alert('Local não encontrado no mapa. Tente ser mais específico.');
                setAddLoading(false);
                return;
            }

            const lat = Number(geoData[0].lat);
            const lng = Number(geoData[0].lon);
            const dateStr = addDate ? new Date(addDate).toISOString() : new Date().toISOString();
            const unlockStr = isCapsule ? new Date(capsuleUnlockDate).toISOString() : undefined;

            try {
                await createPassport({
                    title: geoData[0].display_name.split(',')[0],
                    description: addReview,
                    tag: isCapsule ? 'Cápsula' : 'Anterior',
                    unlockDate: unlockStr
                });
            } catch(e) {
               // ignore cloud errors, we save locally.
            }

            const newVisit: LocalVisit = {
                id: Date.now(),
                name: geoData[0].display_name.split(',')[0],
                lat,
                lng,
                rating: addRating,
                review: addReview,
                date: dateStr,
                unlockDate: unlockStr
            };

            const updatedHistory = [newVisit, ...localHistory];
            setLocalHistory(updatedHistory);
            localStorage.setItem('voyagemind_visits', JSON.stringify(updatedHistory));

            setShowAddModal(false);
            setAddPlace('');
            setAddReview('');
            setAddRating(5);
            setAddDate('');
            setIsCapsule(false);
            setCapsuleUnlockDate('');

        } catch (e) {
            alert('Erro ao buscar o local ou salvar. Tente novamente.');
        } finally {
            setAddLoading(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <motion.h1
                    className="text-gradient-gold"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Passaporte XP
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    Seu legado de exploração. Acompanhe sua jornada.
                </motion.p>
            </div>

            <div className={styles.contentGrid}>
                {/* Visualizer Section */}
                <div className={styles.visualizerContainer}>
                    <div className={styles.viewToggle}>
                        <button 
                            className={viewMode === 'Map' ? styles.toggleBtnActive : styles.toggleBtn}
                            onClick={() => setViewMode('Map')}
                        >
                            <MapIcon size={18} /> Mapa de Conquistas
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {viewMode === 'Map' && (
                            <motion.div 
                                className={styles.mapWrap}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <MapContainer
                                    center={initialCenter}
                                    zoom={localHistory.length > 0 ? 4 : 2}
                                    className={styles.historyMap}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; OpenStreetMap'
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    />
                                    {localHistory.map((visit, i) => {
                                        const isLocked = visit.unlockDate && new Date(visit.unlockDate) > new Date();
                                        return (
                                            <Marker key={i} position={[visit.lat, visit.lng]}>
                                                <Popup className={styles.darkPopup}>
                                                    {isLocked ? (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <Lock size={20} style={{ margin: '0 auto', color: '#D4AF37' }} />
                                                            <strong>Cápsula Trancada</strong>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <strong>{visit.name}</strong>
                                                            <div className={styles.popupStars}>
                                                                {Array(visit.rating).fill(0).map((_, i) => <Star key={i} size={12} color="#D4AF37" fill="#D4AF37" />)}
                                                            </div>
                                                            <p>"{visit.review}"</p>
                                                        </>
                                                    )}
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </MapContainer>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Achievements Timeline */}
                <div className={styles.achievementsPanel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <h2>Diário de Bordo</h2>
                            <span className={styles.stats}>{localHistory.length + passports.length} Registros</span>
                        </div>
                        <button 
                            className={styles.addTripBtn}
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus size={16} /> Historico
                        </button>
                    </div>

                    <div className={styles.timeline}>
                        {loading && <p className={styles.statusText}>Carregando carimbos...</p>}
                        
                        {/* Render Local Visited Places with Rating */}
                        {localHistory.map((visit, index) => {
                            const isLocked = visit.unlockDate && new Date(visit.unlockDate) > new Date();

                            return (
                                <motion.div
                                    key={`local-${index}`}
                                    className={`glass-panel ${styles.achievementCard} ${isLocked ? styles.lockedCard : ''}`}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className={styles.iconBox}>
                                        {isLocked ? <Lock size={20} /> : <Compass size={20} />}
                                    </div>
                                    <div className={styles.cardDetails}>
                                        <div className={styles.titleRow}>
                                            <h3>{isLocked ? 'Cápsula do Tempo Misteriosa' : visit.name}</h3>
                                            {!isLocked && (
                                                <div className={styles.starRow}>
                                                    {visit.rating} <Star size={14} fill="#D4AF37" color="#D4AF37"/>
                                                </div>
                                            )}
                                        </div>
                                        <p className={styles.reviewText}>
                                            {isLocked ? `Trancada. Abre em ${new Date(visit.unlockDate!).toLocaleDateString('pt-BR')}` : `"${visit.review || 'Sem comentários.'}"`}
                                        </p>
                                    </div>
                                    <div className={styles.date}>
                                        {new Date(visit.date).toLocaleDateString('pt-BR')}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Render Cloud Passports */}
                        {passports.map((item, index) => {
                            const isLocked = item.unlockDate && new Date(item.unlockDate) > new Date();

                            return (
                                <motion.div
                                    key={`cloud-${item.id}`}
                                    className={`glass-panel ${styles.achievementCard} ${isLocked ? styles.lockedCard : ''}`}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (localHistory.length + index) * 0.1 }}
                                >
                                    <div className={styles.iconBoxCloud}>
                                        {isLocked ? <Lock size={20} /> : <Trophy size={20} />}
                                    </div>
                                    <div className={styles.cardDetails}>
                                        <h3>{isLocked ? 'Cápsula do Tempo Misteriosa' : item.title}</h3>
                                        <p>{isLocked ? `Trancada. Abre em ${new Date(item.unlockDate!).toLocaleDateString('pt-BR')}` : (item.description ?? 'Carimbo base da API.')}</p>
                                    </div>
                                    <div className={styles.date}>
                                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {!loading && passports.length === 0 && localHistory.length === 0 && (
                            <div className={styles.emptyState}>
                                <Compass size={40} className={styles.emptyIcon} />
                                <p>Seu Passaporte está em branco.</p>
                                <span>Você pode explorar novos locais ou adicionar antigas viagens no botão acima.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Past Trip Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div 
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={`glass-panel ${styles.modalContent}`}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Registrar Memória</h3>
                                <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
                            </div>
                            
                            <div className={styles.modalBody}>
                                <label>Lugar Visitado (Cidade, País, Ponto)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Machu Picchu, Peru" 
                                    className={styles.modalInput}
                                    value={addPlace}
                                    onChange={(e) => setAddPlace(e.target.value)}
                                />

                                <label>Data da Viagem (Opcional)</label>
                                <input 
                                    type="date" 
                                    className={styles.modalInput}
                                    value={addDate}
                                    onChange={(e) => setAddDate(e.target.value)}
                                />

                                <label>Sua Nota</label>
                                <div className={styles.starsSelect}>
                                    {[1,2,3,4,5].map(s => (
                                        <Star 
                                            key={s} size={28} 
                                            className={s <= addRating ? styles.starFilled : styles.starEmpty}
                                            onClick={() => setAddRating(s)}
                                        />
                                    ))}
                                </div>

                                <label>Suas Memórias (Comentário)</label>
                                <textarea
                                    className={styles.modalInput}
                                    rows={3}
                                    placeholder="Escreva uma mensagem para o futuro..."
                                    value={addReview}
                                    onChange={(e) => setAddReview(e.target.value)}
                                />

                                <div className={styles.capsuleToggle} style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input 
                                        type="checkbox" 
                                        id="isCapsule" 
                                        checked={isCapsule} 
                                        onChange={(e) => setIsCapsule(e.target.checked)} 
                                        style={{ transform: 'scale(1.2)' }}
                                    />
                                    <label htmlFor="isCapsule" style={{ margin: 0, cursor: 'pointer', color: 'var(--color-gold)' }}>
                                        <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                        Criar Cápsula do Tempo
                                    </label>
                                </div>

                                {isCapsule && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginBottom: '1rem' }}>
                                        <label>Data de Abertura da Cápsula</label>
                                        <input 
                                            type="date" 
                                            className={styles.modalInput}
                                            value={capsuleUnlockDate}
                                            onChange={(e) => setCapsuleUnlockDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        <small style={{ color: 'var(--color-text-secondary)' }}>A memória ficará trancada no seu passaporte até esta data.</small>
                                    </motion.div>
                                )}

                                <button 
                                    className={styles.modalSubmitBtn}
                                    onClick={handleAddPastTrip}
                                    disabled={addLoading}
                                >
                                    {addLoading ? 'Calculando Coordenadas...' : (isCapsule ? 'Selar Cápsula' : 'Carimbar Passaporte')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
