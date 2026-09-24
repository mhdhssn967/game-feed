// Common games — shown in the main scrollable feed
export const commonGames = [
  { id: 'wave-rider',    url: 'https://wave-rider-roan.vercel.app' },
  { id: 'piano-tiles',   url: 'https://piano-tiles-8s8w.vercel.app' },
  { id: 'perfect-tower', url: 'https://perfect-tower.vercel.app' },
  { id: 'star-shooter',  url: 'https://star-shooter-gamma.vercel.app/' },
  { id: 'brickbreaker',  url: 'https://brickbreaker-seven-lyart.vercel.app/' },
  { id: 'flappy-bird',   url: 'https://flappy-bird-xi-liart.vercel.app/' },
  { id: 'frog-traffic',  url: 'https://frog-traffic.vercel.app/' },
];

// Brand games — shown in the Brand Zone (rewards page)
export const brandGames = [
  {
    id: 'mouzy',
    name: 'Mouzy',
    url: 'https://zuzyrun.gamefaktory.com',
    accent: 'linear-gradient(135deg, #ff6b35, #f7931e)',
    logo: '/brandlogos/mouzy.png',
  },
  {
    id: 'peni',
    name: 'Peni',
    url: 'https://peni-game.vercel.app',
    accent: 'linear-gradient(135deg, #6c00ff, #a855f7)',
    logo: '/brandlogos/peni.png',
  },
  {
    id: 'rialrolls',
    name: 'Rail Rolls',
    url: 'https://rialrolls-game.vercel.app',
    accent: 'linear-gradient(135deg, #0066ff, #38bdf8)',
    logo: '/brandlogos/railrolls.png',
  },
  {
    id: 'altaza',
    name: 'Altaza',
    url: 'https://altaza-demo.vercel.app',
    accent: 'linear-gradient(135deg, #ff4444, #f97316)',
    logo: '/brandlogos/altaza.png',
  },
  {
    id: 'game-six',
    name: 'Sign Laban',
    url: 'https://game-six-kohl-76.vercel.app',
    accent: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    logo: '/brandlogos/signlaban.png',
  },
  {
    id: 'crunchys',
    name: "Crunchy's",
    url: 'https://crunchys-game.vercel.app',
    accent: 'linear-gradient(135deg, #b45309, #f59e0b)',
    logo: '/brandlogos/crunchys.png',
  },
  {
    id: 'laban',
    name: 'Laban Studio',
    url: 'https://laban-studio.vercel.app',
    accent: 'linear-gradient(135deg, #0d9488, #06b6d4)',
    logo: '/brandlogos/labanstudio.png',
  },
  {
    id: 'fishabe',
    name: 'Fishabe 3D',
    url: 'https://fishabe-3d.vercel.app',
    accent: 'linear-gradient(135deg, #be185d, #ec4899)',
    logo: '/brandlogos/fishbae.png',
  },
];

// Legacy default export (common urls only) for backward compat
export default commonGames.map((g) => g.url);
