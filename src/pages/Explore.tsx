import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocateFixed, Navigation, Search } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import styles from './Explore.module.css';

type Place = {
    id: number;
    name: string;
    type: string;
    flow?: 'Baixo' | 'Médio' | 'Alto';
    lat: number;
    lng: number;
};

const WORLD_CENTER: LatLngExpression = [20, 0];

export function Explore() {
    const [query, setQuery] = useState('');
    const [center, setCenter] = useState<LatLngExpression>(WORLD_CENTER);
    const [zoom, setZoom] = useState(2);
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

            // 1) Geocodificar cidade com Nominatim
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    trimmed,
                )}&limit=1`,
                {
                    headers: {
                        'Accept-Language': 'pt-BR',
                    },
                },
            );
            const geoData: Array<{ lat: string; lon: string }> = await geoRes.json();

            if (!geoData.length) {
                setError('Não encontrei esse lugar no mapa. Tente um nome de cidade maior ou mais conhecido.');
                return;
            }

            const { lat, lon } = geoData[0];
            const latNum = Number(lat);
            const lonNum = Number(lon);

            setCenter([latNum, lonNum]);
            setZoom(13);

            // 2) Buscar pontos turísticos e restaurantes na Overpass API
            const radiusMeters = 3000;
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["tourism"="attraction"](around:${radiusMeters},${latNum},${lonNum});
                  node["amenity"="restaurant"](around:${radiusMeters},${latNum},${lonNum});
                );
                out body 40;
            `;

            const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery,
            });
            const overpassData: { elements?: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }> } =
                await overpassRes.json();

            const parsed: Place[] =
                overpassData.elements?.map((el) => ({
                    id: el.id,
                    name: el.tags?.name ?? 'Ponto sem nome',
                    type: el.tags?.tourism === 'attraction' ? 'Ponto Turístico' : 'Restaurante',
                    lat: el.lat,
                    lng: el.lon,
                })) ?? [];

            setPlaces(parsed);
            setSelectedPlaceId(null);

            if (!parsed.length) {
                setError('Não encontrei pontos turísticos ou restaurantes próximos nesse raio.');
            }
        } catch {
            setError('Erro ao buscar esse lugar. Tente novamente em alguns instantes.');
        } finally {
            setLoading(false);
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
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {places.map((place) => (
                        <Marker
                            key={place.id}
                            position={[place.lat, place.lng]}
                            eventHandlers={{
                                click: () => setSelectedPlaceId(place.id),
                            }}
                        >
                            <Popup>
                                <strong>{place.name}</strong>
                                <br />
                                {place.type}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Floating HUD */}
            <div className={styles.hudContainer}>
                <motion.form
                    className={styles.searchBar}
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onSubmit={handleSearchSubmit}
                >
                    <Search size={20} className={styles.iconMuted} />
                    <input
                        type="text"
                        placeholder="Ex.: Paris, Rio de Janeiro, São Paulo..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className={styles.searchButton} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </motion.form>

                <div className={styles.controls}>
                    <button
                        className={styles.controlButton}
                        type="button"
                        onClick={() => {
                            setCenter(WORLD_CENTER);
                            setZoom(2);
                            setSelectedPlaceId(null);
                            setError(null);
                            setQuery('');
                            setPlaces([]);
                        }}
                    >
                        <LocateFixed size={20} />
                    </button>
                    <button
                        className={styles.controlButton}
                        type="button"
                        onClick={() => {
                            // futuro: integrar com navegação real
                        }}
                    >
                        <Navigation size={20} />
                    </button>
                </div>
            </div>

            {/* Dynamic Detail Card */}
            <AnimatePresence>
                {selectedPlace && (
                    <motion.div
                        className={`glass-panel ${styles.detailCard}`}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    >
                        <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                                    <h3>{selectedPlace.name}</h3>
                                <button
                                    className={styles.closeBtn}
                                    onClick={() => setSelectedPlaceId(null)}
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.tags}>
                                <span className={styles.tag}>{selectedPlace.type}</span>
                            </div>
                            <div className={styles.suggestionBox}>
                                    <strong>Sugestão Invisível IA:</strong>
                                <p>
                                    Aproveite esse ponto em um horário que combine com o seu estilo: mais calmo de manhã, mais vibrante à noite.
                                </p>
                            </div>
                            <button className={styles.actionButton}>
                                Navegar Até Aqui
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <p className={styles.errorMessage}>{error}</p>
            )}
        </div>
    );
}
