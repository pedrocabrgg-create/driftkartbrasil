'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Center, Bounds } from '@react-three/drei'
import * as THREE from 'three'

function LogoModel() {
  const { scene } = useGLTF('/models/logo-3d.glb')
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.18
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.03
  })

  return (
    <Bounds fit clip margin={1.6}>
      <Center>
        <group ref={groupRef}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  )
}

useGLTF.preload('/models/logo-3d.glb')

export function LogoViewer3D({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 38 }}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0)
          scene.background = null
        }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={3.0} color="#c6f135" />
        <directionalLight position={[-4, 2, -2]} intensity={1.2} color="#4ade80" />
        <pointLight position={[0, -2, 3]} intensity={1.0} color="#c6f135" />
        <pointLight position={[0, 3, -3]} intensity={0.6} color="#ffffff" />
        <Suspense fallback={null}>
          <LogoModel />
        </Suspense>
      </Canvas>
    </div>
  )
}
