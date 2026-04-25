import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function RotatingGlobe() {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Rotação contínua da Terra
            groupRef.current.rotation.y += 0.002;
            
            // Reação leve ao movimento do mouse holográfico
            const mouseY = (state.pointer.y * Math.PI) / 10;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, mouseY, 0.1);
        }
    });

    return (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <group ref={groupRef}>
                {/* Globo Sólido Noturno */}
                <Sphere args={[2, 64, 64]}>
                    <meshStandardMaterial 
                        color="#020617" 
                        roughness={0.7} 
                        metalness={0.2} 
                        transparent 
                        opacity={0.9} 
                    />
                </Sphere>

                {/* Grade Holográfica de Mapeamento (Stylized Map Grid) */}
                <Sphere args={[2.02, 32, 24]}>
                    <meshBasicMaterial 
                        color="#40E0D0" 
                        wireframe={true} 
                        transparent 
                        opacity={0.15} 
                    />
                </Sphere>
                
                {/* Pins aleatórios piscando */}
                {Array(10).fill(0).map((_, i) => {
                    const phi = Math.acos(-1 + (2 * i) / 10);
                    const theta = Math.sqrt(10 * Math.PI) * phi;
                    const r = 2.05;
                    return (
                        <mesh 
                            key={`pin-${i}`} 
                            position={[
                                r * Math.cos(theta) * Math.sin(phi),
                                r * Math.sin(theta) * Math.sin(phi),
                                r * Math.cos(phi)
                            ]}
                        >
                            <sphereGeometry args={[0.04, 16, 16]} />
                            <meshBasicMaterial color="#D4AF37" />
                        </mesh>
                    );
                })}
            </group>
        </Float>
    );
}

export function HeroGlobe() {
    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'auto', background: 'radial-gradient(circle at center, #0B112D 0%, #020617 100%)' }}>
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <directionalLight position={[10, 10, 5]} intensity={2} color="#40E0D0" />
                <directionalLight position={[-10, -10, -5]} intensity={1} color="#D4AF37" />
                <RotatingGlobe />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={1} fade speed={1} />
            </Canvas>
        </div>
    );
}
