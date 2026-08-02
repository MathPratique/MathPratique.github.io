// Point d'entrée du rendu hors navigateur.
//
// Sert uniquement au pré-rendu à la compilation : il n'y a pas de serveur en
// production. Le HTML produit est écrit dans des fichiers statiques que
// GitHub Pages sert tels quels, et l'application React reprend la main au
// chargement.
//
// On utilise `prerenderToNodeStream` plutôt que `renderToString` parce que la
// page des exercices est chargée par `lazy()` : `renderToString` rendrait le
// texte d'attente à la place du contenu, ce qui viderait le HTML de tout ce
// qu'on cherche justement à faire indexer. `prerender` attend la résolution
// des Suspense avant de produire le flux.
//
// Ce que le rendu hors navigateur ne fait PAS, et dont il faut se souvenir :
//   - les `useEffect` ne s'exécutent pas. Tout ce qui règle `document.title`
//     dans un effet est donc absent : le script de pré-rendu injecte les
//     métadonnées lui-même, par route.
//   - il n'y a ni `window`, ni `document`, ni `sessionStorage`. Un composant
//     qui les touche pendant son rendu échoue ici — c'est le seul endroit où
//     ce genre d'erreur se voit avant la production.

import { StrictMode } from "react";
// `prerender` plutôt que `prerenderToNodeStream` : il rend un flux web
// standard, lisible sans `Buffer` ni types Node. Ce fichier vit dans `src/`,
// donc sous la configuration TypeScript du navigateur — y faire entrer les
// types Node pour un seul module serait payer cher une commodité.
import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./firebase/AuthContext";
// Pas d'import de feuille de style ici : le gabarit produit par Vite référence
// déjà la CSS compilée, et la faire passer par la chaîne PostCSS en mode
// serveur échoue sur `@import "tailwindcss"`.

export async function rendre(url: string): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>
  );

  return new Response(prelude).text();
}
