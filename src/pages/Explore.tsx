import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LocateFixed, Search, Sparkles, MapPin, Star, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import styles from './Explore.module.css';
import { sendAiChatMessage, createPassport } from '../lib/api';
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
    const location = useLocation();
    const [query, setQuery] = useState(location.state?.q || '');
    const [center, setCenter] = useState<LatLngExpression>(WORLD_CENTER);
    const [zoom, setZoom] = useState(2);
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // AI Planner State
    const [showAiModal, setShowAiModal] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "model", text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [blindMode, setBlindMode] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);

    async function handleExportPDF() {
        const element = document.getElementById('pdf-content');
        if (!element) return;
        
        setPdfGenerating(true);
        element.style.display = 'block';
        
        const opt = {
            margin:       0.5,
            filename:     'Roteiro-VoyageMind.pdf',
            image:        { type: 'jpeg' as const, quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        try {
            await html2pdf().set(opt as any).from(element).save();
        } finally {
            element.style.display = 'none';
            setPdfGenerating(false);
        }
    }

    const { user } = useAuth();
    const navigate = useNavigate();

    // Review / Map History State (Mocked via LocalStorage for offline ratings due to DB constraints)
    const [reviewing, setReviewing] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

    async function handleSearchSubmit(e?: React.FormEvent, searchStr?: string) {
        if (e) e.preventDefault();
        const trimmed = (searchStr !== undefined ? searchStr : query).trim();
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
                  nwr["tourism"](around:5000,${latNum},${lonNum});
                  nwr["historic"](around:5000,${latNum},${lonNum});
                  nwr["leisure"="park"](around:5000,${latNum},${lonNum});
                  nwr["amenity"="restaurant"](around:5000,${latNum},${lonNum});
                );
                out center 100;
            `;

            const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery,
            });
            const overpassData = await overpassRes.json();

            const parsed: Place[] =
                overpassData.elements?.map((el: any) => ({
                    id: el.id,
                    name: el.tags?.name ?? 'Local Turístico',
                    type: el.tags?.tourism ? 'Ponto Turístico' :
                          el.tags?.historic ? 'Local Histórico' : 
                          el.tags?.leisure ? 'Parque/Lazer' : 'Restaurante/Café',
                    lat: el.lat ?? el.center?.lat,
                    lng: el.lon ?? el.center?.lon,
                })).filter((p: any) => p.name !== 'Local Turístico' && p.lat && p.lng) ?? [];

            setPlaces(parsed);
            setSelectedPlaceId(null);
            setReviewing(false); // reset view

            if (!parsed.length) {
                setError('Não encontrei pontos turísticos próximos nesse raio.');
            }
        } catch {
            setError('Erro ao buscar esse lugar. Tente novamente em alguns instantes.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (location.state?.q) {
            handleSearchSubmit(undefined, location.state.q);
            window.history.replaceState({}, document.title);
        }
    }, [location.state?.q]);

    async function handleAiSuggest() {
        if (!chatInput.trim()) return;
        
        const userMsg = chatInput.trim();
        setChatInput('');
        
        const newHistory = [...chatHistory, { role: "user" as const, text: userMsg }];
        setChatHistory(newHistory);
        setAiLoading(true);

        try {
             const apiHistory = chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
             
             const result = await sendAiChatMessage({
                 message: userMsg,
                 history: apiHistory,
                 blindMode
             });
             
             setChatHistory([...newHistory, { role: "model" as const, text: result.text }]);
             
             if (blindMode) {
                 document.documentElement.setAttribute('data-theme', 'mystery');
             } else {
                 document.documentElement.setAttribute('data-theme', 'urban');
             }
        } catch (e) {
             console.error(e);
             setError("Falha ao comunicar com a IA. A chave GEMINI_API_KEY está configurada no backend?");
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

                                    if (place.type === 'Mirante/Natureza') {
                                        document.documentElement.setAttribute('data-theme', 'nature');
                                    } else if (place.type === 'Local Histórico') {
                                        document.documentElement.setAttribute('data-theme', 'historic');
                                    } else {
                                        document.documentElement.setAttribute('data-theme', 'urban');
                                    }
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
                            document.documentElement.removeAttribute('data-theme');
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
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {chatHistory.length > 0 && (
                                        <button onClick={handleExportPDF} disabled={pdfGenerating} style={{ background: 'rgba(212, 175, 55, 0.2)', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', borderRadius: '4px', padding: '0.3rem 0.8rem', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Download size={14} /> {pdfGenerating ? 'Gerando...' : 'Baixar PDF'}
                                        </button>
                                    )}
                                    <button onClick={() => setShowAiModal(false)} className={styles.closeBtn}>×</button>
                                </div>
                            </div>

                            <div className={styles.aiForm}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem', border: '1px dashed rgba(212, 175, 55, 0.4)' }} onClick={() => setBlindMode(!blindMode)}>
                                    <input type="checkbox" checked={blindMode} onChange={(e) => setBlindMode(e.target.checked)} />
                                    <div>
                                        <strong style={{ color: 'var(--color-gold)', display: 'block', fontSize: '0.9rem' }}>Modo Misterioso</strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Esconda o destino de mim nas respostas!</span>
                                    </div>
                                </div>

                                <div style={{ maxHeight: '300px', height: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', padding: '0.5rem' }}>
                                    {chatHistory.length === 0 && (
                                        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>Comece a planejar seu roteiro conversando com a IA real!</p>
                                    )}
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? 'var(--color-turquoise)' : 'rgba(255,255,255,0.05)', color: msg.role === 'user' ? '#000' : '#fff', padding: '0.8rem', borderRadius: '8px', maxWidth: '85%', overflowX: 'auto' }}>
                                            {msg.role === 'model' ? (
                                                <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{msg.text}</p>
                                            )}
                                        </div>
                                    ))}
                                    {aiLoading && <div className={styles.spinner} style={{ alignSelf: 'center', marginTop: '1rem' }} />}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Vou para Paris, me ajude a planejar?"
                                        value={chatInput} 
                                        onChange={e => setChatInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAiSuggest()}
                                        className={styles.aiInput}
                                        style={{ flex: 1, padding: '0.8rem' }}
                                    />
                                    <button className={styles.actionButton} onClick={handleAiSuggest} disabled={aiLoading} style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                                        Enviar
                                    </button>
                                </div>
                            </div>
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
            {/* Hidden PDF Template */}
            <div id="pdf-content" style={{ display: 'none', padding: '2rem', color: '#333', background: '#fff', fontFamily: 'sans-serif' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#d4af37', borderBottom: '2px solid #d4af37', paddingBottom: '0.5rem', display: 'inline-block' }}>Seu Roteiro - VoyageMind</h1>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Um planejamento exclusivo gerado por Inteligência Artificial.</p>
                </div>
                
                {chatHistory.filter(m => m.role === 'model').map((msg, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem', lineHeight: '1.6' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                ))}
                
                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>
                    <p>Planejado via VoyageMind Platform • {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
