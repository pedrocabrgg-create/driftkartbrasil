'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'

function KartModel() {
  const { scene } = useGLTF('/models/go_kart.glb')
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.28
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.04
  })

  return (
    <Bounds fit clip margin={1.4}>
      <Center>
        <group ref={groupRef}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  )
}

useGLTF.preload('/models/go_kart.glb')

export function KartViewer3D({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        width: 540,
        height: 400,
        opacity,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <Canvas
        camera={{ position: [0, 1, 5], fov: 42 }}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          scene.background = null
        }}
        style={{ background: 'transparent' }}
      >
        {/* Luz ambiente base */}
        <ambientLight intensity={0.6} />

        {/* Luz principal verde-brand de cima */}
        <directionalLight position={[2, 5, 4]} intensity={2.5} color="#c6f135" />

        {/* Fill lateral esquerdo */}
        <directionalLight position={[-4, 2, 1]} intensity={1.2} color="#4ade80" />

        {/* Rim light atrás para silhueta */}
        <pointLight position={[0, -1, -4]} intensity={1.5} color="#c6f135" />

        {/* Luz branca suave de baixo para tirar sombras duras */}
        <pointLight position={[0, -3, 2]} intensity={0.8} color="#ffffff" />

        <Suspense fallback={null}>
          <KartModel />
        </Suspense>
      </Canvas>
    </div>
  )
}
