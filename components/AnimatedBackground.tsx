'use client';

import { Box, keyframes } from '@mui/material';

const flow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(20px, -20px) scale(1.02);
  }
  50% {
    transform: translate(0, -40px) scale(0.98);
  }
  75% {
    transform: translate(-20px, -20px) scale(1.01);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.55;
  }
`;

export default function AnimatedBackground() {
  return (
    <Box
      id="animated-background"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#0f172a',
        pointerEvents: 'none',
      }}
    >
      {/* Animated gradient mesh */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(ellipse at 30% 20%, rgba(37, 99, 235, 0.25) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(124, 58, 237, 0.2) 0%, transparent 50%)',
          backgroundSize: '60% 60%',
          animation: `${flow} 15s ease-in-out infinite`,
        }}
      />
      
      {/* Primary blue orb */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '50vw',
          height: '50vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 60%)',
          animation: `${float} 12s ease-in-out infinite`,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Secondary purple orb */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: '45vw',
          height: '45vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 60%)',
          animation: `${float} 14s ease-in-out infinite reverse`,
          filter: 'blur(60px)',
        }}
      />
      
      {/* Accent orb */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '35vw',
          height: '35vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 50%)',
          animation: `${pulse} 8s ease-in-out infinite`,
          filter: 'blur(80px)',
        }}
      />
      
      {/* Subtle noise texture */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}