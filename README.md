# Biblio-jeunesse

Cette application permet l'enrichissement de métadonnées bibliographiques puis
l'exposition de celles-ci sur le web.

Le dossier [`src`](./src) contient l'ensemble des scripts permettant l'enrichissement
bibliographique. L'application s'appuie pour cela sur différentes sources : le
service SRU de la BnF, l'API de Google Books, et les sites Babelio et Decitre.

Un premier corpus a été constitué à partir d'une extraction de données sur un
document LibreOffice exporté en HTML. Les scripts [`extract.js`](./src/extract.js),
destiné à être ajouté au document HTML pour produire un premier fichier JSON,
puis [`enrich.js`](./src/enrich.js), exécuté en ligne de commande avec Node, ont
été utilisé pour cela.

L'exposition des données prend la forme d'un site web statique, reposant sur VueJS
et le framework CSS Bootstrap. La mise à jour des données pourra se faire par
modification du fichier [`biblio.json`](./biblio.json). Pour cela, on utilisera
l'utlitaire en ligne de commande [`enrich`](./enrich), qui permet d'ajouter des
ouvrages, enrichit leurs métadonnées et complète le JSON de référence.
