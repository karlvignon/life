# AGENTS.md — Architecture & bonnes pratiques

Guide d'architecture pour le développement du jeu **life** (PixiJS 8, TypeScript, Vite).
Ce document s'adresse aux agents IA et aux développeurs : il définit comment structurer le code, séparer les responsabilités et concevoir une nouvelle fonctionnalité de zéro.

---

## Principes fondamentaux

1. **Séparation des responsabilités** — Chaque module a une seule raison de changer.
2. **Dépendances unidirectionnelles** — Le sens des imports va toujours du haut (orchestration) vers le bas (détails). Le Model ne connaît jamais la View.
3. **Données vs affichage** — L'état du jeu (positions, HP, inventaire) vit dans le Model ; PixiJS (sprites, containers) vit dans la View.
4. **Testabilité** — La logique métier doit pouvoir être testée sans initialiser PixiJS ni le DOM.
5. **Feature-first** — Organiser le code par domaine métier (`MapManager`, `Player`, `Combat`), pas par type technique (`models/`, `views/` à la racine).

---

## Architecture MVC adaptée au jeu vidéo

En jeu vidéo, le MVC se traduit ainsi :

| Couche | Rôle | Contient | Ne contient pas |
|--------|------|----------|-----------------|
| **Model** | État et règles du jeu | Données, calculs, validation, transitions d'état | Sprites, textures, `Application`, DOM |
| **View** | Représentation visuelle | Containers PixiJS, sprites, animations, particules | Logique métier, gestion d'input, règles de jeu |
| **Controller** | Orchestration | Input, boucle de jeu, coordination Model ↔ View | Rendu direct, état persistant du jeu |

### Flux de données

```
Input (clavier, souris, touch)
        ↓
   Controller  ──→  met à jour  ──→  Model
        ↑                                │
        └────  lit l'état et rafraîchit ───┘
                        ↓
                      View
```

- Le **Controller** reçoit les inputs et appelle des méthodes du **Model**.
- Le **Model** émet des changements (callback, event, ou retour de méthode).
- Le **Controller** (ou la View via un contrat explicite) synchronise la **View** avec le Model.
- La **View** ne modifie jamais le Model directement.

### Boucle de jeu : Update vs Render

Séparer clairement les deux phases dans le ticker PixiJS :

```typescript
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;

  // UPDATE — logique pure, sans toucher aux sprites
  gameController.update(dt);

  // RENDER — synchroniser l'affichage avec l'état
  gameController.render();
});
```

- `update(dt)` : déplacements, collisions, timers, IA, transitions d'état.
- `render()` : positionner les sprites, jouer les animations, mettre à jour l'UI.

Ne jamais mélanger calcul de collision et `sprite.position.set()` dans la même fonction.

---

## Structure des dossiers

```
src/
├── main.ts                  # Bootstrap : init PixiJS, lance le Game
├── core/                    # Infrastructure transversale
│   ├── Game.ts              # Point d'entrée du jeu, possède l'Application
│   ├── EventBus.ts          # Pub/sub pour découpler les features
│   └── types/               # Types partagés entre features
├── features/                # Une feature = un domaine métier
│   └── MapManager/
│       ├── main.ts          # Controller / façade publique de la feature
│       ├── MapModel.ts      # État : grille, tuiles, dimensions
│       ├── MapView.ts       # Affichage PixiJS de la carte
│       └── types.ts         # Types propres à la feature
└── shared/                  # Utilitaires réutilisables (math, assets, etc.)
```

### Conventions de nommage

| Fichier | Suffixe | Exemple |
|---------|---------|---------|
| État et logique | `*Model.ts` | `PlayerModel.ts` |
| Affichage PixiJS | `*View.ts` | `PlayerView.ts` |
| Orchestration | `main.ts` ou `*Controller.ts` | `MapManager/main.ts` |
| Types locaux | `types.ts` | `MapManager/types.ts` |

Le fichier `main.ts` d'une feature est sa **façade** : c'est le seul point d'export public. Les autres fichiers internes ne sont pas importés depuis l'extérieur de la feature.

---

## Règles par couche

### Model

```typescript
// ✅ BON — pur TypeScript, testable
export class MapModel {
  private tiles: Tile[][] = [];

  setTile(x: number, y: number, tile: Tile): void {
    if (!this.isInBounds(x, y)) return;
    this.tiles[y][x] = tile;
  }

  getTile(x: number, y: number): Tile | null {
    return this.isInBounds(x, y) ? this.tiles[y][x] : null;
  }

  private isInBounds(x: number, y: number): boolean { /* ... */ }
}
```

```typescript
// ❌ MAUVAIS — le Model ne doit pas importer PixiJS
import { Sprite } from "pixi.js";

export class MapModel {
  sprite: Sprite; // couplage visuel
}
```

**Règles :**
- Pas d'import `pixi.js`, pas de DOM, pas de `window`/`document`.
- Exposer l'état via getters ou snapshots immutables.
- Valider les entrées dans le Model (bounds, règles métier).

### View

```typescript
// ✅ BON — la View reflète un état, sans le modifier
export class MapView extends Container {
  private tileSprites: Sprite[][] = [];

  syncFromModel(model: MapModel): void {
    // Lire le model, mettre à jour les sprites
  }

  destroy(): void {
    this.removeChildren();
    super.destroy();
  }
}
```

**Règles :**
- La View reçoit des données, elle ne les calcule pas.
- Gérer le cycle de vie PixiJS (`destroy()`, pooling si besoin).
- Pas de logique de gameplay dans la View (pas de "si HP < 0 alors game over").

### Controller

```typescript
// ✅ BON — orchestre Model et View
export class MapManager {
  private model = new MapModel();
  private view = new MapView();

  constructor(private stage: Container) {
    this.stage.addChild(this.view);
  }

  update(dt: number): void {
    // Logique temporelle, input, appels au model
  }

  render(): void {
    this.view.syncFromModel(this.model);
  }

  destroy(): void {
    this.view.destroy();
    this.stage.removeChild(this.view);
  }
}
```

**Règles :**
- Le Controller est le seul à connaître Model et View simultanément.
- Gérer les inputs ici (ou déléguer à un `InputController` dédié).
- Exposer une API minimale vers l'extérieur (`main.ts` de la feature).

---

## Communication entre features

Les features ne s'importent **pas** directement les unes les autres. Utiliser :

1. **EventBus** (préféré pour les événements ponctuels)

```typescript
// core/EventBus.ts
type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<T>(event: string, handler: Handler<T>): () => void { /* ... */ }
  emit<T>(event: string, payload: T): void { /* ... */ }
}

// Usage
eventBus.emit("player:died", { playerId: "p1" });
eventBus.on("player:died", ({ playerId }) => { /* ... */ });
```

2. **Injection de dépendances** (pour les services partagés)

```typescript
// Le Game injecte les dépendances au bootstrap
const mapManager = new MapManager(app.stage);
const playerManager = new PlayerManager(app.stage, mapManager.getCollisionLayer());
```

3. **Interfaces partagées** dans `core/types/` (contrats stables, pas d'implémentation).

---

## Concevoir une nouvelle feature de zéro

Suivre cette checklist dans l'ordre. Ne pas coder la View avant d'avoir clarifié le Model.

### 1. Définir le périmètre

Répondre par écrit (commentaire ou issue) :

- **Quoi** : que fait la feature ? (ex. "afficher et éditer une grille de tuiles")
- **Entrées** : quels inputs reçoit-elle ? (clavier, données JSON, events)
- **Sorties** : quels events ou états expose-t-elle ?
- **Hors périmètre** : ce qu'elle ne fait *pas* (ex. pathfinding → feature séparée)

### 2. Modéliser les données (Model)

1. Créer `features/<FeatureName>/types.ts` avec les types et enums.
2. Créer `features/<FeatureName>/<Feature>Model.ts`.
3. Implémenter l'état initial, les mutations et les getters.
4. Vérifier : aucun import PixiJS, logique testable isolément.

```typescript
// features/Inventory/types.ts
export type ItemId = string;

export interface InventorySlot {
  itemId: ItemId | null;
  quantity: number;
}

// features/Inventory/InventoryModel.ts
export class InventoryModel {
  private slots: InventorySlot[] = [];

  addItem(itemId: ItemId, quantity: number): boolean { /* ... */ }
  removeItem(itemId: ItemId, quantity: number): boolean { /* ... */ }
  getSlots(): ReadonlyArray<InventorySlot> { return this.slots; }
}
```

### 3. Concevoir l'affichage (View)

1. Créer `features/<FeatureName>/<Feature>View.ts` (extends `Container` ou composant PixiJS).
2. Définir une méthode de sync explicite (`syncFromModel`, `setState`, etc.).
3. Précharger les assets dans le Controller ou un `AssetLoader` partagé, pas dans la View.

### 4. Orchestrer (Controller)

1. Créer `features/<FeatureName>/main.ts` — la façade publique.
2. Instancier Model + View, brancher la boucle update/render.
3. Exposer uniquement ce qui est nécessaire aux autres features.

```typescript
// features/Inventory/main.ts
export class InventoryManager {
  private model = new InventoryModel();
  private view = new InventoryView();

  constructor(stage: Container) {
    stage.addChild(this.view);
  }

  update(dt: number): void { /* input, timers */ }
  render(): void { this.view.syncFromModel(this.model); }
  destroy(): void { this.view.destroy(); }

  // API publique minimale
  addItem(itemId: ItemId, qty: number): boolean {
    return this.model.addItem(itemId, qty);
  }
}
```

### 5. Intégrer au jeu

1. Instancier la feature dans `main.ts` ou `core/Game.ts`.
2. L'ajouter à la boucle de jeu (update + render).
3. Brancher les events inter-features via EventBus si nécessaire.

### 6. Valider

- [ ] Le Model compile et fonctionne sans PixiJS.
- [ ] La View ne contient aucune règle métier.
- [ ] Le Controller est le seul lien Model ↔ View.
- [ ] La feature s'intègre via sa façade (`main.ts`) uniquement.
- [ ] `destroy()` libère les ressources PixiJS.
- [ ] Pas de dépendance circulaire entre features.

---

## Anti-patterns à éviter

| Anti-pattern | Problème | Alternative |
|--------------|----------|-------------|
| **God class** (`Game.ts` de 2000 lignes) | Impossible à maintenir | Découper en features autonomes |
| **Sprite = Model** | Logique mélangée au rendu | Model séparé, View synchronisée |
| **Logique dans le ticker global** | Couplage fort, difficile à tester | Chaque feature expose `update()` / `render()` |
| **Import croisé entre features** | Couplage caché, régressions en cascade | EventBus ou injection |
| **État global mutable** | Bugs de synchronisation | État encapsulé dans les Models |
| **Magic numbers** | Lisibilité, équilibrage difficile | Constantes nommées ou fichiers de config |
| **Créer des sprites dans le Model** | Violation MVC | Controller crée la View, View crée les sprites |

---

## Gestion des assets

- Centraliser le chargement dans `shared/AssetLoader.ts` ou au bootstrap.
- Les Views reçoivent des `Texture` déjà chargées, elles n'appellent pas `Assets.load()`.
- Nommer les assets de façon cohérente : `public/assets/<feature>/<name>.png`.

---

## Cycle de vie d'une feature

```
create → init(model, view) → update/render loop → destroy
```

Chaque feature doit implémenter :

```typescript
interface GameFeature {
  update(dt: number): void;
  render(): void;
  destroy(): void;
}
```

Le `Game` maintient une liste de features et itère dessus à chaque frame.

---

## Exemple concret : MapManager

État actuel du projet et cible recommandée :

```
features/MapManager/
├── main.ts          # MapManager — Controller / façade
├── MapModel.ts      # Grille, tuiles, dimensions (renommer TilesMap)
├── MapView.ts       # Container PixiJS affichant les tuiles
└── types.ts         # Tile, TileType, MapConfig
```

```typescript
// types.ts
export enum TileType {
  Grass = "grass",
  Water = "water",
}

export interface Tile {
  type: TileType;
}

// MapModel.ts — pur état
export class MapModel {
  constructor(
    public readonly width: number,
    public readonly height: number,
  ) {}

  private tiles: Tile[][] = [];

  init(defaultTile: Tile): void { /* ... */ }
  getTile(x: number, y: number): Tile | null { /* ... */ }
  setTile(x: number, y: number, tile: Tile): void { /* ... */ }
}

// MapView.ts — affichage uniquement
export class MapView extends Container {
  syncFromModel(model: MapModel): void { /* ... */ }
}

// main.ts — orchestration
export class MapManager implements GameFeature {
  private model: MapModel;
  private view: MapView;

  constructor(stage: Container, config: MapConfig) {
    this.model = new MapModel(config.width, config.height);
    this.view = new MapView();
    stage.addChild(this.view);
  }

  update(_dt: number): void {}
  render(): void { this.view.syncFromModel(this.model); }
  destroy(): void { this.view.destroy(); }
}
```

---

## Quand utiliser ECS plutôt que MVC

Le pattern **Entity-Component-System** devient pertinent quand :

- Des centaines d'entités homogènes coexistent (projectiles, ennemis, particules).
- La composition dynamique remplace l'héritage (un ennemi peut gagner/perdre des capacités).
- Les systèmes doivent traiter des groupes d'entités indépendamment (rendu, physique, IA).

Pour ce projet, **rester en MVC/feature-based** tant que le nombre d'entités reste modéré. Migrer vers ECS uniquement si la complexité le justifie, feature par feature.

---

## Résumé pour les agents IA

Lors de toute modification ou création de code :

1. Identifier la couche (Model / View / Controller) avant d'écrire du code.
2. Placer le code dans `features/<NomFeature>/` avec le suffixe approprié.
3. Ne jamais importer `pixi.js` dans un Model.
4. Exposer les features via leur `main.ts` uniquement.
5. Séparer `update()` et `render()` dans la boucle de jeu.
6. Pour une nouvelle feature : types → Model → View → Controller → intégration.
7. Préférer EventBus aux imports directs entre features.
8. Implémenter `destroy()` pour chaque feature avec des ressources PixiJS.
