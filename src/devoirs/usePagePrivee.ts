// Titre de l'onglet et `noindex` d'une page réservée (devoirs, édition).
//
// Ces pages ne sont ni pré-rendues ni dans le plan du site ; le `noindex`
// couvre le cas d'un lien qui fuirait. Même mécanique que PageBrouillon :
// posé au montage, rendu tel quel au démontage.

import { useEffect } from "react";

export function usePagePrivee(titre: string): void {
  useEffect(() => {
    const titreAvant = document.title;
    document.title = `${titre} | MathPratique`;

    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const cree = robots === null;
    const robotsAvant = robots?.getAttribute("content") ?? null;
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");

    return () => {
      document.title = titreAvant;
      if (cree) robots?.remove();
      else if (robotsAvant !== null) robots?.setAttribute("content", robotsAvant);
    };
  }, [titre]);
}
