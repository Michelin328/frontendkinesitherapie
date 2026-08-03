const fs = require('fs');
const path = 'src/components/layout/TopBar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Ajouter la fonction rangUrgence
const a1 = `function styleUrgence(u: string) {`;
const b1 = `function rangUrgence(u: string) {
  if (u === 'TRES_URGENT') return 0
  if (u === 'URGENT') return 1
  return 2
}

function styleUrgence(u: string) {`;
if (!content.includes(a1)) { console.log('ERREUR bloc 1 non trouve'); process.exit(1); }
content = content.replace(a1, b1);

// 2. Modifier le tri pour prioriser l'urgence
const a2 = `  const triees = [...enAttente].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })`;
const b2 = `  const triees = [...enAttente].sort((a, b) => {
    const diff = rangUrgence(a.urgence) - rangUrgence(b.urgence)
    if (diff !== 0) return diff
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })`;
if (!content.includes(a2)) { console.log('ERREUR bloc 2 non trouve'); process.exit(1); }
content = content.replace(a2, b2);

fs.writeFileSync(path, content);
console.log('Tri par urgence applique avec succes !');
