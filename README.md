# AI-Rchivist

Ai-rchivist est une solution innovante pour l'extraction de métadonnées à partir du
contenu de documents anciens. Développée dans le cadre du projet ARKEY (Archives
de l’Etat et UCLouvain, Belgique), cette plateforme explore comment l’intelligence
artificielle (IA) peut soutenir le travail archivistique, notamment en identifiant de façon
semi-automatique les entités nommées de ces documents, ainsi qu’en proposant des
résumés multilingues.

La communication présentera les motivations qui sous-tendent le développement
d’une telle plateforme, ainsi que l’approche "machine-in-the-loop" adoptée. Nous
introduirons ensuite les bases du fonctionnement des modèles d’IA, permettant à
chacun de comprendre intuitivement leur fonctionnement et leurs limites :
fonctionnelles, architecturales, et financières.

À travers une étude de cas portant sur un corpus de lettres de rémission –
majoritairement rédigées en néerlandais moyen – datant de la période XV au XVIIe
siècle, nous montrerons en quoi l’utilisation de grands modèles de langage (LLM) peut
s’avérer problématique lorsqu’ils sont appliqués à des langues anciennes.
Différentes approches visant à s’affranchir des limitations mentionnées ci-dessus
seront ensuite évaluées. Parmi celles-ci : la compression de prompt, la quantification
de modèles, l’utilisation d’API fournis par des prestataires de services commerciaux,
ainsi que l'entraînement de modèles plus petits.

Enfin, nous donnerons une démonstration de la plateforme développée afin d’engager
la discussion avec les participants sur le potentiel transformateur de ce type d’outil,
tant pour l’accès aux archives par les publics que pour les pratiques des archivistes.
Comment, notamment, penser l’articulation entre le travail d’extraction automatisée
des données dans les documents et la nécessaire mise en contexte de ces derniers ?

## Pour nous citer:
```
@presentation{gillard:2025:airchivist,
  author    = {GILLARD, Xavier},
  title     = {The ai-rchivist: une approche “machine-in-the-loop” pour l’extraction de métadonnées de documents anciens},
  booktitle = {Forum de l'AAF},
  year      = {2025},
  month     = {Mars},
  address   = {20 Pl. Sainte-Anne, 35000 Rennes, France}
}
```