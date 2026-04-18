import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Compass, Map as MapIcon, Star, Plus } from 'lucide-react';
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

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getPassports();
                setPassports(data.reverse());
            } catch (err) {
                if (err instanceof Error) {
                    // setError(err.message);
                } else {
                    // setError('Erro ao carregar passaporte. Faça login para ver seus carimbos da nuvem.');
                }
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

            try {
                await createPassport({
                    title: geoData[0].display_name.split(',')[0],
                    description: addReview,
                    tag: 'Anterior'
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
                date: dateStr
            };

            const updatedHistory = [newVisit, ...localHistory];
            setLocalHistory(updatedHistory);
            localStorage.setItem('voyagemind_visits', JSON.stringify(updatedHistory));

            setShowAddModal(false);
            setAddPlace('');
            setAddReview('');
            setAddRating(5);
            setAddDate('');

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
                                    {localHistory.map((visit, i) => (
                                        <Marker key={i} position={[visit.lat, visit.lng]}>
                                            <Popup className={styles.darkPopup}>
                                                <strong>{visit.name}</strong>
                                                <div className={styles.popupStars}>
                                                    {Array(visit.rating).fill(0).map((_, i) => <Star key={i} size={12} color="#D4AF37" fill="#D4AF37" />)}
                                                </div>
                                                <p>"{visit.review}"</p>
                                            </Popup>
                                        </Marker>
                                    ))}
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
                        {localHistory.map((visit, index) => (
                            <motion.div
                                key={`local-\${index}`}
                                className={`glass-panel \${styles.achievementCard}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className={styles.iconBox}>
                                    <Compass size={20} />
                                </div>
                                <div className={styles.cardDetails}>
                                    <div className={styles.titleRow}>
                                        <h3>{visit.name}</h3>
                                        <div className={styles.starRow}>
                                            {visit.rating} <Star size={14} fill="#D4AF37" color="#D4AF37"/>
                                        </div>
                                    </div>
                                    <p className={styles.reviewText}>"{visit.review || 'Sem comentários.'}"</p>
                                </div>
                                <div className={styles.date}>
                                    {new Date(visit.date).toLocaleDateString('pt-BR')}
                                </div>
                            </motion.div>
                        ))}

                        {/* Render Cloud Passports */}
                        {passports.map((item, index) => (
                            <motion.div
                                key={`cloud-\${item.id}`}
                                className={`glass-panel \${styles.achievementCard}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (localHistory.length + index) * 0.1 }}
                            >
                                <div className={styles.iconBoxCloud}>
                                    <Trophy size={20} />
                                </div>
                                <div className={styles.cardDetails}>
                                    <h3>{item.title}</h3>
                                    <p>{item.description ?? 'Carimbo base da API.'}</p>
                                </div>
                                <div className={styles.date}>
                                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                            </motion.div>
                        ))}

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
                            className={`glass-panel \${styles.modalContent}`}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Adicionar Viagem Baseada no Passado</h3>
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
                                    placeholder="Como foi a experiência?"
                                    value={addReview}
                                    onChange={(e) => setAddReview(e.target.value)}
                                />

                                <button 
                                    className={styles.modalSubmitBtn}
                                    onClick={handleAddPastTrip}
                                    disabled={addLoading}
                                >
                                    {addLoading ? 'Calculando Coordenadas...' : 'Carimbar Passaporte'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
