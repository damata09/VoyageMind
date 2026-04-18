import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LocateFixed, Search, Sparkles, MapPin, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import styles from './Explore.module.css';
import { getAiSuggestions, createPassport } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

type Place = {
    id: number;
    name: string;
    type: string;
    lat: number;
    lng: number;
};

const WORLD_CENTER: LatLngExpression = [20, 0];

function MapFlyTo({ center, zoom }: { center: LatLngExpression; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }, [center, zoom, map]);
    return null;
}

export function Explore() {
    const [query, setQuery] = useState('');
    const [center, setCenter] = useState<LatLngExpression>(WORLD_CENTER);
    const [zoom, setZoom] = useState(2);
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // AI Planner State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiBudget, setAiBudget] = useState('Médio');
    const [aiDays, setAiDays] = useState(3);
    const [aiResult, setAiResult] = useState<{ title: string; overview: string; itinerary: string[]; tags: string[] } | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    // Review / Map History State (Mocked via LocalStorage for offline ratings due to DB constraints)
    const [reviewing, setReviewing] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

    async function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            setCenter(WORLD_CENTER);
            setZoom(2);
            setPlaces([]);
            setSelectedPlaceId(null);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    trimmed,
                )}&limit=1`,
                { headers: { 'Accept-Language': 'pt-BR' } },
            );
            const geoData = await geoRes.json();

            if (!geoData.length) {
                setError('Não encontrei esse lugar. Tente uma cidade maior.');
                return;
            }

            const latNum = Number(geoData[0].lat);
            const lonNum = Number(geoData[0].lon);

            setCenter([latNum, lonNum]);
            setZoom(13);

            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["tourism"="attraction"](around:5000,${latNum},${lonNum});
                  node["historic"](around:5000,${latNum},${lonNum});
                  node["natural"="viewpoint"](around:5000,${latNum},${lonNum});
                );
                out body 40;
            `;

            const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery,
            });
            const overpassData = await overpassRes.json();

            const parsed: Place[] =
                overpassData.elements?.map((el: any) => ({
                    id: el.id,
                    name: el.tags?.name ?? 'Ponto sem nome',
                    type: el.tags?.tourism === 'attraction' ? 'Ponto Turístico' :
                          el.tags?.historic ? 'Local Histórico' : 'Mirante/Natureza',
                    lat: el.lat,
                    lng: el.lon,
                })) ?? [];

            setPlaces(parsed);
            setSelectedPlaceId(null);
            setReviewing(false); // reset view
            setAiResult(null);

            if (!parsed.length) {
                setError('Não encontrei pontos turísticos próximos nesse raio.');
            }
        } catch {
            setError('Erro ao buscar esse lugar. Tente novamente em alguns instantes.');
        } finally {
            setLoading(false);
        }
    }

    async function handleAiSuggest() {
        if (!query.trim()) {
             setError("Por favor, informe um Destino (Cidade) para gerar o roteiro.");
             return;
        }
        setAiLoading(true);
        try {
             const result = await getAiSuggestions({
                 place: query,
                 budget: aiBudget,
                 days: aiDays
             });
             setAiResult(result);
        } catch (e) {
             console.error(e);
             setError("Falha ao gerar o roteiro. Nossa IA pode estar indisponível.");
        } finally {
             setAiLoading(false);
        }
    }

    async function handleCheckIn() {
        if (!selectedPlace) return;

        if (!user) {
            alert('Para registrar seu Check-in e ganhar XP, você precisa entrar na conta!');
            navigate('/profile');
            return;
        }

        try {
            await createPassport({
                title: selectedPlace.name,
                description: reviewText,
                tag: 'Visitado'
            });

            // Save the extra geo data locally to show on map later
            const localVisits = JSON.parse(localStorage.getItem('voyagemind_visits') || '[]');
            localVisits.push({
                id: selectedPlace.id,
                name: selectedPlace.name,
                lat: selectedPlace.lat,
                lng: selectedPlace.lng,
                rating,
                review: reviewText,
                date: new Date().toISOString(),
            });
            localStorage.setItem('voyagemind_visits', JSON.stringify(localVisits));

            setReviewing(false);
            setReviewText('');
            setRating(5);
            alert("Check-in e avaliação salvos no seu Passaporte!");
        } catch (e) {
            alert("Erro ao salvar no Passaporte. Faça login primeiro!");
        }
    }

    return (
        <div className={styles.container}>
            {/* Map Section */}
            <div className={styles.mapContainer}>
                <MapContainer
                    center={center}
                    zoom={zoom}
                    className={styles.leafletMap}
                    scrollWheelZoom={true}
                    zoomControl={false}
                    minZoom={2}
                    maxBounds={[[-90, -180], [90, 180]]}
                    maxBoundsViscosity={1.0}
                >
                    <MapFlyTo center={center} zoom={zoom} />
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        noWrap={true}
                    />

                    {places.map((place) => (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            eventHandlers={{
                                click: () => {
                                    setSelectedPlaceId(place.id);
                                    setCenter([place.lat, place.lng]);
                                    setZoom(15);
                                    setReviewing(false);
                                },
                            }}
                        >
                            <Popup className={styles.popupCustom}>
                                <strong>{place.name}</strong>
                                <span>{place.type}</span>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
                {/* Floating Map Fade overlay */}
                <div className={styles.mapOverlay} />
            </div>

            {/* Floating HUD */}
            <div className={styles.hudContainer}>
                <div className={styles.topHud}>
                    <motion.form
                        className={styles.searchBar}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        onSubmit={handleSearchSubmit}
                    >
                        <Search size={20} className={styles.iconMuted} />
                        <input
                            type="text"
                            placeholder="Descubra um novo destino..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" className={styles.searchButton} disabled={loading}>
                            {loading ? <div className={styles.spinner} /> : 'Buscar'}
                        </button>
                    </motion.form>

                    <motion.button 
                        className={styles.aiGlowButton}
                        onClick={() => setShowAiModal(true)}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Sparkles size={18} />
                        <span>Roteiro com IA</span>
                    </motion.button>
                </div>

                <div className={styles.controls}>
                    <button
                        className={styles.controlButton}
                        onClick={() => {
                            setCenter(WORLD_CENTER);
                            setZoom(2);
                            setSelectedPlaceId(null);
                            setQuery('');
                            setPlaces([]);
                            setAiResult(null);
                        }}
                    >
                        <LocateFixed size={20} />
                    </button>
                </div>
            </div>

            {/* AI Modal Panel */}
            <AnimatePresence>
                {showAiModal && (
                    <motion.div 
                        className={styles.aiModalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div 
                            className={`glass-panel ${styles.aiModalContent}`}
                            initial={{ y: 50, scale: 0.95 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 50, scale: 0.95 }}
                        >
                            <div className={styles.aiHeader}>
                                <h3><Sparkles size={20} className={styles.goldText} /> Planejador IA</h3>
                                <button onClick={() => setShowAiModal(false)} className={styles.closeBtn}>×</button>
                            </div>

                            {!aiResult ? (
                                <div className={styles.aiForm}>
                                    <p>A IA criará um roteiro mágico inspirado no seu estilo.</p>
                                    
                                    <label>Destino Principal</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Kyoto, Orlando, Paris..."
                                        value={query} 
                                        onChange={e => setQuery(e.target.value)}
                                        className={styles.aiInput}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    
                                    <label>Orçamento da Viagem</label>
                                    <div className={styles.btnGroup}>
                                        {['Baixo', 'Médio', 'Alto'].map(b => (
                                            <button 
                                                key={b} 
                                                className={aiBudget === b ? styles.btnGroupActive : styles.btnGroupItem}
                                                onClick={() => setAiBudget(b)}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>

                                    <label>Duração (Dias)</label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        max={30} 
                                        value={aiDays} 
                                        onChange={e => setAiDays(Number(e.target.value))}
                                        className={styles.aiInput}
                                    />

                                    <button 
                                        className={styles.actionButton} 
                                        onClick={handleAiSuggest}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? 'Gerando...' : 'Gerar Roteiro Inteligente'}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.aiResult}>
                                    <h4>{aiResult.title}</h4>
                                    <p className={styles.aiOverview}>{aiResult.overview}</p>
                                    <ul className={styles.itineraryList}>
                                        {aiResult.itinerary.map((item, i) => (
                                            <motion.li 
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                            >
                                                <div className={styles.dot} />
                                                <p>{item}</p>
                                            </motion.li>
                                        ))}
                                    </ul>
                                    <button className={styles.secondaryButton} onClick={() => setAiResult(null)}>Novo Roteiro</button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dynamic Detail Card */}
            <AnimatePresence>
                {selectedPlace && !showAiModal && (
                    <motion.div
                        className={`glass-panel ${styles.detailCard}`}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>{selectedPlace.name}</h3>
                                    <span className={styles.tag}>{selectedPlace.type}</span>
                                </div>
                                <button className={styles.closeBtn} onClick={() => setSelectedPlaceId(null)}>×</button>
                            </div>

                            {!reviewing ? (
                                <>
                                    <div className={styles.suggestionBox}>
                                        <strong>Dica Voyage:</strong>
                                        <p>Faça o check-in neste local para registrá-lo no seu Passaporte e ganhar XP de viajante!</p>
                                    </div>
                                    <button className={styles.actionButton} onClick={() => setReviewing(true)}>
                                        <MapPin size={16} /> Fazer Check-in (Avaliar)
                                    </button>
                                </>
                            ) : (
                                <motion.div 
                                    className={styles.reviewSection}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <h4>Como foi a sua experiência?</h4>
                                    <div className={styles.stars}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star 
                                                key={s} 
                                                size={24} 
                                                className={s <= rating ? styles.starFilled : styles.starEmpty}
                                                onClick={() => setRating(s)}
                                            />
                                        ))}
                                    </div>
                                    <textarea 
                                        placeholder="Escreva sobre o que você achou do lugar..."
                                        value={reviewText}
                                        onChange={e => setReviewText(e.target.value)}
                                        className={styles.reviewInput}
                                        rows={3}
                                    />
                                    <div className={styles.reviewActions}>
                                        <button className={styles.cancelBtn} onClick={() => setReviewing(false)}>Cancelar</button>
                                        <button className={styles.submitBtn} onClick={handleCheckIn}>Salvar no Passaporte</button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div className={styles.errorToast} initial={{ y: 50 }} animate={{ y: 0 }}>
                    {error}
                </motion.div>
            )}
        </div>
    );
}
