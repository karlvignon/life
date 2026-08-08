# Cycle de vie d'une cellule dans `MapModel`

Ce document décrit le cycle de vie réel d'une cellule tel qu'il est orchestré
par `MapModel`. Une cellule occupe toujours une tuile de la grille et alterne
entre deux états : **morte** (tuile vide) et **vivante** (tuile portant une
essence et ses données).

## État d'une cellule vivante

Une cellule vivante possède :

- une `Essence`, qui définit ses propriétés initiales et ses règles
  d'évolution, de météo et de cycle de vie ;
- des `TileData` : `life`, `maximumLife` et `reproducibility` ;
- une provenance et un joueur propriétaire ;
- une rotation ;
- des comportements propres, éventuellement hérités de ses parents ;
- un `lifeId`, unique pour son incarnation actuelle.

Le `lifeId` identifie une vie, et non une position. Une cellule qui meurt puis
renaît sur la même tuile reçoit donc un nouvel identifiant. Il permet notamment
de rattacher les effets et les modificateurs à la cellule qui les a produits.

`LivingCellRegistry` maintient en parallèle l'index des cellules vivantes. La
tuile contient l'état détaillé ; le registre permet au modèle de parcourir
efficacement les cellules actives.

## Vue d'ensemble

```text
Tuile vide
   │
   │ placement, naissance simulée ou effet de hook
   ▼
Naissance ── onBirth ──► effets mis en file puis résolus
   │
   ▼
Cellule vivante
   │
   ├── à chaque step : onCycle, évolution, météo
   │
   ├── survie ────────────────────────────────┐
   │                                          │
   └── dégâts, évolution, météo, remplacement │
       ▼                                      │
     Mort ── onDeath ──► effets résolus       │
       │                                      │
       ▼                                      │
     Tuile vide ◄─────────────────────────────┘
```

## 1. Naissance

Une nouvelle incarnation est créée dans les cas suivants :

- placement par un joueur (`seedCells` ou `placeCells`) ;
- naissance produite par les règles d'évolution ;
- effet de cycle de vie `spawn-essence` ;
- appel direct à `setCellAlive` sur une tuile morte ou portant une autre
  essence.

La naissance initialise la tuile avec l'essence, ses données, sa provenance,
sa rotation et ses comportements. Elle crée un nouveau `lifeId`, ajoute la
cellule au registre, puis exécute les comportements `onBirth`.

La cause transmise au hook est :

| Cause | Situation |
|---|---|
| `player-placement` | placement effectué par un joueur |
| `simulation` | naissance issue de l'évolution ou d'un placement non joueur |
| `hook` | naissance produite par un effet `spawn-essence` |

Réappliquer la **même essence** sur une cellule déjà vivante ne constitue pas
une nouvelle vie : son `lifeId` et ses données courantes sont conservés. En
revanche, remplacer son essence provoque d'abord une mort avec la cause
`replacement`, puis une nouvelle naissance.

### Naissance par évolution et héritage

Lors d'une naissance simulée, le modèle :

1. arbitre les propositions concurrentes de naissance ;
2. débite le coût de reproduction des parents ;
3. initialise la reproductibilité du nouveau-né à partir des parents ;
4. attribue le propriétaire et la rotation déterminés par l'arbitrage ;
5. hérite les comportements avant d'exécuter `onBirth`.

Les nouveau-nés sont matérialisés avant les morts d'évolution afin que les
parents soient encore disponibles pendant l'héritage.

## 2. Déroulement d'un cycle (`step`)

`step(currentCycle, weather)` exige un numéro de cycle positif correspondant
au cycle du snapshot météo. Son ordre d'exécution est volontairement fixe.

### 2.1 Expiration des modificateurs

Les modificateurs temporaires arrivés à expiration sont retirés au début du
cycle.

### 2.2 Hooks `onCycle`

Le modèle prend un snapshot des cellules vivantes au début du cycle, puis
exécute leurs comportements `onCycle`. Les comportements de l'essence sont
évalués avant les comportements propres à la tuile.

Les effets produits sont placés dans une file et résolus dans leur ordre de
création. Une naissance provoquée à ce moment peut exécuter immédiatement son
`onBirth`, mais elle ne reçoit pas de `onCycle` avant le cycle suivant, car elle
n'appartenait pas au snapshot initial.

### 2.3 Évolution et reproduction

Le moteur d'évolution regroupe les cellules compatibles par famille
d'évolution et par équipe. Chaque essence propose ses survivants, ses morts et
ses naissances. Les compétitions de naissance sont arbitrées, les coûts de
reproduction sont appliqués, puis le nouvel ensemble de cellules vivantes est
calculé.

- Les naissances sont créées et leur `onBirth` est mis en file.
- Les cellules éliminées meurent avec la cause `evolution`.
- Les effets de naissance et de mort sont ensuite entièrement résolus.

Une évolution ne remplace jamais directement une cellule vivante par une autre
essence : une case déjà occupée ne peut pas recevoir une naissance d'évolution.

### 2.4 Météo

Chaque survivante applique les répercussions météo définies par son essence.
Les modificateurs présents sur sa tuile transforment d'abord les valeurs météo,
puis l'essence calcule les deltas appliqués à ses `TileData`.

Après cette application, toute cellule dont `life <= 0` meurt avec la cause
`weather`. Les hooks de mort correspondants sont enfin résolus.

La condition de survie porte sur une vie **strictement positive**. Une valeur
de vie égale à zéro signifie donc la mort.

## 3. Mort

La transition de mort suit cet ordre :

1. prendre un snapshot immuable de la cellule encore vivante ;
2. exécuter ses comportements `onDeath` et mettre leurs effets en file ;
3. retirer les modificateurs dont la durée dépend de son `lifeId` ;
4. retirer la cellule du registre ;
5. vider la tuile (`essence`, données, provenance, comportements, rotation et
   `lifeId`) ;
6. résoudre la file d'effets au point prévu par l'opération en cours.

Les causes possibles sont :

| Cause | Situation |
|---|---|
| `damage` | un effet de dégâts fait tomber `life` à zéro ou moins |
| `evolution` | les règles d'évolution ne conservent pas la cellule |
| `weather` | les répercussions météo font tomber `life` à zéro ou moins |
| `replacement` | une autre essence remplace la cellule |

Le snapshot donné à `onDeath` reste exploitable même si la tuile est vidée
avant la résolution des effets. Chaque effet conserve également sa source :
`lifeId`, comportement, phase, position, essence et propriétaire.

## 4. Effets des hooks

Les hooks `onBirth`, `onCycle` et `onDeath` sont purs : ils lisent un snapshot
de la cellule et une interface de lecture de la carte, puis retournent des
effets. Seul `MapModel` applique ces effets.

| Effet | Résultat |
|---|---|
| `spawn-essence` | crée une cellule si la cible est vide, ou la remplace si la collision vaut `replace` |
| `damage` | retire de la vie et provoque une mort `damage` si nécessaire |
| `heal` | rend de la vie sans dépasser `maximumLife` |
| `tile-data:add` | ajoute une valeur à une propriété de `TileData` |
| `modifier:add` | ajoute un modificateur météo sur la tuile cible |
| `modifier:remove` | retire un modificateur ciblé |

Les effets peuvent produire d'autres hooks, donc former une cascade : une mort
peut faire naître une cellule, dont `onBirth` peut à son tour produire d'autres
effets. La file est vidée jusqu'à stabilisation. Un budget de sécurité limite
la cascade à `max(1000, largeur × hauteur × 20)` effets afin d'éviter une boucle
infinie.

Un effet visant une position hors de la carte est ignoré. Les dégâts et soins
sur une tuile vide sont également ignorés.

## 5. Cas particuliers hors cycle normal

Certaines opérations administratives restaurent ou suppriment un état sans
rejouer son histoire :

- `clearLivingCells()` tue toutes les cellules et efface les effets et
  modificateurs, **sans exécuter `onDeath`** ;
- `setLivingCells()` restaure des snapshots, **sans exécuter `onBirth`** ;
- `resize()` conserve les cellules encore dans les nouvelles limites et
  abandonne celles situées hors grille, **sans hooks de naissance ou de mort**.

Ces méthodes servent à la réinitialisation, à la restauration et à la gestion
structurelle de la carte. Elles ne représentent pas des événements de gameplay.

## 6. Synchronisation du rendu

Le modèle retourne un `CellChangeSet` contenant les changements visuels de vie,
de mort ou d'essence. Lorsque ce jeu de changements n'est pas vide, il augmente
sa `renderRevision`. La View peut alors synchroniser les sprites avec l'état du
modèle.

Les modifications internes qui ne changent pas directement l'apparence d'une
cellule, comme un soin, un changement de reproductibilité ou l'ajout d'un
modificateur météo, ne produisent pas nécessairement une entrée visuelle.
