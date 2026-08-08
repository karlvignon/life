# Compétition de naissance

Ce document décrit comment `MapManager` résout plusieurs propositions de
naissance visant la même case. Cette règle appartient au Model : elle ne dépend
ni de PixiJS, ni de l'interface joueur.

La compétition concerne les naissances de simulation. Le placement manuel est
atomique et ne peut jamais remplacer une cellule vivante par une autre essence.
Un motif qui sort de la grille ou rencontre une essence différente est refusé en
entier, avant toute dépense d'endurance.

## Identités utilisées

Chaque cellule vivante conserve une essence et un propriétaire (`playerId`). Au
début d'un tick, le `TeamResolver` fournit l'équipe actuelle de ce joueur.

Une essence expose également :

- `evolutionFamilyId` : groupe d'essences compatibles pour l'évolution ;
- `evolutionPriority` : ordre des essences dans une même famille, la plus petite
  valeur étant évaluée en premier ;
- `evolutionBehaviors` : comportements purs, ordonnés du plus prioritaire au
  moins prioritaire.

Par défaut, `evolutionFamilyId` est égal à l'identifiant de l'essence et
`evolutionPriority` vaut `0`. `MushroomEssence` et
`MushroomSproutEssence` utilisent toutes deux la famille `mushroom`, avec
Mushroom avant Sprout.

Les comportements ne connaissent ni les joueurs, ni les équipes, ni leur
priorité. Ils reçoivent un snapshot de cellules compatibles et retournent leurs
propositions avec les indices des parents réellement utilisés.

## Pipeline d'un tick

1. Le moteur regroupe les cellules par `evolutionFamilyId + teamId`.
2. Les cellules de plusieurs joueurs alliés peuvent donc compléter ensemble un
   même motif.
3. Chaque essence présente dans le groupe évalue ses comportements sur le même
   snapshot familial.
4. Les propositions restent séparées et conservent leur ordre déclaratif.
5. Les propositions sont regroupées par case cible.
6. Une proposition payable est sélectionnée pour chaque équipe.
7. Les propositions sélectionnées entrent en compétition entre équipes.
8. Le joueur propriétaire est choisi parmi les parents de l'équipe gagnante.
9. Seuls les parents de la proposition gagnante paient.
10. Le parent ayant payé le plus transmet ses comportements héritables ; en
    cas d'égalité, le parent est tiré au hasard.
11. Les survivants et les naissances acceptées sont appliqués à la grille.

Toutes les cases cibles sont traitées par index croissant. Ce choix rend la
consommation de reproductibilité déterministe quand un même parent participe à
plusieurs naissances pendant le tick.

## Priorité au sein d'une équipe

Pour une équipe donnée, les propositions sont essayées dans cet ordre :

1. `evolutionPriority` de l'essence ;
2. ordre du comportement dans `evolutionBehaviors` ;
3. ordre stable des naissances retournées par le comportement.

La première proposition dont tous les parents peuvent payer est retenue. Une
proposition prioritaire non payable n'empêche donc pas une proposition suivante
de réussir. Les listes de parents ne sont jamais fusionnées entre propositions.

## Compétition entre équipes

Chaque équipe arrive avec au maximum une proposition payable pour la case.
Elles sont comparées dans l'ordre suivant :

1. nombre de parents uniques ;
2. somme de la reproductibilité restante de ces parents.

L'équipe ayant le score lexicographiquement le plus élevé remporte la case. Une
égalité complète annule la naissance et aucun parent n'est débité.

Cette règle évite d'utiliser l'ordre d'insertion des joueurs, des équipes ou des
essences comme avantage de gameplay.

## Attribution au joueur

Quand plusieurs joueurs de l'équipe gagnante ont contribué, le propriétaire du
nouveau-né est choisi selon :

1. le plus grand nombre de parents fournis ;
2. la plus grande somme de reproductibilité fournie ;
3. en cas d'égalité complète, un départage reproductible basé sur le cycle et
   l'index de la case parmi les identifiants de joueurs triés.

Tous les parents de la proposition gagnante paient, même s'ils appartiennent à
des joueurs alliés différents. La reproductibilité du nouveau-né reste le
minimum des scores restants de ses parents après les paiements du tick.

## Héritage des comportements de cellule

Chaque comportement attaché à une cellule déclare s'il est héritable. Une
naissance choisit d'abord le parent ayant payé le coût le plus élevé pour cette
naissance. Si plusieurs parents ont payé la même valeur, l'un d'eux est tiré au
hasard. Le nouveau-né reçoit ensuite uniquement les comportements héritables de
ce parent. `SeedRange` est héritable ; `BlindSeeding`, réservé au placement
initial, ne l'est pas.

Cette règle est encapsulée par `BehaviorInheritanceModel`. Sa méthode publique
reçoit la cellule nouveau-née et toutes les contributions parentes sous la forme
`{ cell, paidPoints }`. Le moteur de compétition ne fait que calculer et exposer
ces paiements.

## Exemple Mushroom / Sprout

Dans la configuration suivante, `e` est la case disputée et `n` une cellule
Sprout déjà vivante :

```text
0 1 0
1 e 1
0 n 0
0 1 0
```

Si les cinq cellules appartiennent à la même équipe :

- l'évolution Mushroom en croix propose `e` avec quatre parents ;
- l'évolution verticale du Sprout propose aussi `e` avec deux parents ;
- la croix est prioritaire ;
- seuls ses quatre parents paient ;
- la cellule sous `n`, inutile à la croix, ne paie pas ;
- le joueur ayant fourni le plus de parents de la croix reçoit la cellule.

Les évolutions utilisent toujours le snapshot du début du tick. Une cellule
née pendant ce tick ne peut donc participer à un autre motif qu'au tick suivant.

## Appartenance aux équipes

L'équipe est résolue à chaque tick depuis le `TeamResolver`. Si un joueur change
d'équipe, ses cellules existantes suivent donc immédiatement sa nouvelle équipe.
Sans resolver (principalement dans les tests isolés), chaque `playerId` est
considéré comme sa propre équipe.

## Fichiers responsables

- `model/essences/Essence.ts` : famille, ordre et propositions de comportements ;
- `model/behaviors/BehaviorInheritanceModel.ts` : sélection du parent et
  transmission des behaviors héritables ;
- `model/evolution/EvolutionEngine.ts` : groupes famille/équipe et générations ;
- `model/evolution/BirthCompetitionResolver.ts` : arbitrage et coûts ;
- `model/evolution/GenerationMerger.ts` : application des résultats acceptés ;
- `MapModel.ts` : résolution des équipes et provenance des nouveau-nés.
