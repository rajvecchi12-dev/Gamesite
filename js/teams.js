const TEAMS = [
  { id: 'brasil',     name: 'Brasil',      flag: '🇧🇷', colors: ['#009739','#FEDD00'] },
  { id: 'argentina',  name: 'Argentina',   flag: '🇦🇷', colors: ['#74ACDF','#FFFFFF'] },
  { id: 'alemanha',   name: 'Alemanha',    flag: '🇩🇪', colors: ['#FFFFFF','#000000'] },
  { id: 'franca',     name: 'França',      flag: '🇫🇷', colors: ['#002395','#FFFFFF'] },
  { id: 'espanha',    name: 'Espanha',     flag: '🇪🇸', colors: ['#C60B1E','#FFC400'] },
  { id: 'italia',     name: 'Itália',      flag: '🇮🇹', colors: ['#0066CC','#FFFFFF'] },
  { id: 'portugal',   name: 'Portugal',    flag: '🇵🇹', colors: ['#DA291C','#006847'] },
  { id: 'inglaterra', name: 'Inglaterra',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#FFFFFF','#CF081F'] },
  { id: 'holanda',    name: 'Holanda',     flag: '🇳🇱', colors: ['#FF6C00','#FFFFFF'] },
  { id: 'belgica',    name: 'Bélgica',     flag: '🇧🇪', colors: ['#ED2939','#000000'] },
  { id: 'uruguai',    name: 'Uruguai',     flag: '🇺🇾', colors: ['#5DADE2','#FFFFFF'] },
  { id: 'colombia',   name: 'Colômbia',    flag: '🇨🇴', colors: ['#FCD116','#003893'] },
];

const MODE_CONFIG = {
  '1v1': { players: 3, label: '1 vs 1' },
  '2v2': { players: 5, label: '2 vs 2' },
  '3v3': { players: 7, label: '3 vs 3' },
};
