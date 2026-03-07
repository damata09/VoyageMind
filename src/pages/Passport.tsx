import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Html, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Trophy, Compass, Lock } from 'lucide-react';
import styles from './Passport.module.css';
import { getPassports, type PassportItem } from '../lib/api';

// --- 3D Components ---

function Stamp({ position, unlocked, label }: { position: [number, number, number], unlocked: boolean, label: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Create a procedural golden stamp texture material
    const material = new THREE.MeshStandardMaterial({
        color: unlocked ? '#D4AF37' : '#2A2A35',
        metalness: unlocked ? 0.8 : 0.2,
        roughness: unlocked ? 0.2 : 0.8,
        transparent: true,
        opacity: unlocked ? 0.9 : 0.4,
    });

    useFrame((state) => {
        if (meshRef.current && hovered && unlocked) {
            meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.position.z = position[2] + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        } else if (meshRef.current) {
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
            meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, position[2], 0.1);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                material={material}
            >
                <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
                <meshStandardMaterial attach="material" color={unlocked ? '#D4AF37' : '#333'} />
                {unlocked && (
                    <Html position={[0, -0.4, 0]} center className={styles.stampLabelHtml}>
                        <div className={hovered ? styles.stampLabelHover : styles.stampLabel}>
                            {label}
                        </div>
                    </Html>
                )}
            </mesh>
            {/* Decorative inner ring */}
            {unlocked && (
                <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.22, 0.25, 32]} />
                    <meshStandardMaterial color="#FFF" opacity={0.5} transparent />
                </mesh>
            )}
        </group>
    );
}

function PassportBook() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <group ref={groupRef} rotation={[0.4, -0.2, 0]}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Book Cover / Base */}
                <mesh position={[0, 0, -0.1]} castShadow receiveShadow>
                    <boxGeometry args={[3, 4, 0.2]} />
                    <meshStandardMaterial color="#020617" roughness={0.6} />
                </mesh>

                {/* Book Page (Left) */}
                <mesh position={[-1.4, 0, 0.05]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 3.8, 0.02]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>

                {/* Book Page (Right - Open) */}
                <mesh position={[0, 0, 0.02]} castShadow receiveShadow>
                    <boxGeometry args={[2.8, 3.8, 0.05]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.9} />
                </mesh>

                <Text
                    position={[0, 1.5, 0.06]}
                    fontSize={2.5}
                    color="#020617"
                    font="https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NJtEtq.woff"
                    anchorX="center"
                    anchorY="middle"
                >
                    PASSAPORTE
                </Text>

                {/* Stamps grid */}
                <Stamp position={[-0.8, 0.5, 0.1]} unlocked={true} label="Explorador Urbano" />
                <Stamp position={[0.8, 0.5, 0.1]} unlocked={true} label="Notívago" />
                <Stamp position={[-0.8, -0.5, 0.1]} unlocked={true} label="Ponto Secreto" />
                <Stamp position={[0.8, -0.5, 0.1]} unlocked={false} label="Secreto" />
                <Stamp position={[0, 0, 0.1]} unlocked={false} label="Secreto" />

            </Float>
        </group>
    );
}

// --- Main Page Component ---

export function Passport() {
    const [passports, setPassports] = useState<PassportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const data = await getPassports();
                setPassports(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Erro ao carregar passaporte. Faça login para ver seus carimbos.');
                }
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

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
                    Seu legado de exploração, belamente registrado.
                </motion.p>
            </div>

            <div className={styles.contentGrid}>

                {/* 3D Canvas Section */}
                <div className={styles.canvasContainer}>
                    <div className={styles.canvasGlow} />
                    <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} />

                        <PassportBook />

                        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                        <Environment preset="city" />
                        <OrbitControls
                            enableZoom={false}
                            enablePan={false}
                            minPolarAngle={Math.PI / 3}
                            maxPolarAngle={Math.PI / 1.5}
                            minAzimuthAngle={-Math.PI / 4}
                            maxAzimuthAngle={Math.PI / 4}
                        />
                    </Canvas>
                    <div className={styles.dragHint}>Arraste para inspecionar seu Passaporte</div>
                </div>

                {/* Achievements List */}
                <div className={styles.achievementsPanel}>
                    <div className={styles.panelHeader}>
                        <h2>Coleção</h2>
                        <span className={styles.stats}>3 / 50 Carimbos</span>
                    </div>

                    <div className={styles.timeline}>
                        {loading && (
                            <p className={styles.statusText}>Carregando seus carimbos...</p>
                        )}

                        {error && !loading && (
                            <p className={styles.errorText}>{error}</p>
                        )}

                        {!loading && !error && passports.length === 0 && (
                            <p className={styles.statusText}>
                                Nenhum carimbo ainda. Explore e crie novos passports pela API!
                            </p>
                        )}

                        {!loading && !error && passports.map((item, index) => (
                            <motion.div
                                key={item.id}
                                className={`glass-panel ${styles.achievementCard}`}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (index * 0.1) }}
                                whileHover={{ scale: 1.02 }}
                            >
                                <div className={styles.iconBox}>
                                    {item.tag === 'Notívago' ? <Trophy size={20} /> : <Compass size={20} />}
                                </div>
                                <div className={styles.cardDetails}>
                                    <h3>{item.title}</h3>
                                    <p>{item.description ?? 'Carimbo criado pelo seu VoyageMind.'}</p>
                                </div>
                                <div className={styles.date}>
                                    {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                            </motion.div>
                        ))}

                        {/* Locked placeholders */}
                        <motion.div
                            className={`glass-panel ${styles.lockedCard}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            <Lock size={20} className={styles.lockedIcon} />
                            <div className={styles.cardDetails}>
                                <div className={styles.lockedText}>Carimbo Sazonal (Inverno)</div>
                                <div className={styles.progressText}>0/3 Montanhas visitadas</div>
                            </div>
                        </motion.div>

                    </div>
                </div>

            </div>
        </div>
    );
}
