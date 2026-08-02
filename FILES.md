# FILES.md — Unity Project File Organization

This document defines the file and folder organization rules for this Unity project.

**Cursor MUST follow these rules when creating, moving, renaming, or reorganizing files.**

---

## 1. Core Principles

### 1.1 Organize files consistently

All project files must follow the folder structure defined in this document.

Do not introduce new top-level folders without a clear reason.

Before creating a new folder, check whether an existing folder already matches the purpose.

Prefer extending the existing structure over creating a new parallel structure.

---

### 1.2 Keep project assets inside `Assets/`

Unity project content should generally live inside the `Assets/` directory.

Do not create additional project-content folders at the repository root unless they are required by Unity or a specific external tool.

Typical Unity root-level folders include:

```text
Assets/
Packages/
ProjectSettings/
```

Do not move Unity-managed root folders.

---

### 1.3 Separate internal assets from third-party assets

Project-owned assets must be separated from third-party assets.

Do not mix project code or assets with imported packages, Asset Store assets, or external plugins.

Recommended structure:

```text
Assets/
├── _Project/
└── ThirdParty/
```

All project-owned content belongs under:

```text
Assets/_Project/
```

Third-party content belongs under:

```text
Assets/ThirdParty/
```

Do not modify third-party files unless explicitly required.

If a third-party asset needs significant project-specific modifications, consider creating a project-owned wrapper, adapter, subclass, or integration layer instead of modifying the original asset.

---

## 2. Recommended Project Structure

The default project structure is:

```text
Assets/
├── _Project/
│   ├── Art/
│   │   ├── Animations/
│   │   ├── Materials/
│   │   ├── Models/
│   │   ├── Shaders/
│   │   ├── Textures/
│   │   ├── VFX/
│   │   └── Sprites/
│   │
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   ├── Ambience/
│   │   └── Voice/
│   │
│   ├── Code/
│   │   ├── Runtime/
│   │   ├── Editor/
│   │   └── Tests/
│   │
│   ├── Prefabs/
│   │
│   ├── Scenes/
│   │   ├── Production/
│   │   ├── Development/
│   │   └── Sandbox/
│   │
│   ├── ScriptableObjects/
│   │
│   ├── UI/
│   │   ├── Fonts/
│   │   ├── Icons/
│   │   ├── Sprites/
│   │   └── Themes/
│   │
│   ├── Settings/
│   │
│   ├── Resources/
│   │
│   ├── StreamingAssets/
│   │
│   └── Gizmos/
│
├── ThirdParty/
│
└── ScriptTemplates/
```

Only create folders when they are actually needed.

Do not create empty folders just to match the template.

---

## 3. Asset-Type Organization

Project assets should primarily be organized by **asset type**.

Use the following rules:

| Asset                   | Folder                |
| ----------------------- | --------------------- |
| C# runtime scripts      | `Code/Runtime/`       |
| Editor scripts          | `Code/Editor/`        |
| Tests                   | `Code/Tests/`         |
| 3D models               | `Art/Models/`         |
| Textures                | `Art/Textures/`       |
| Materials               | `Art/Materials/`      |
| Shaders                 | `Art/Shaders/`        |
| Animations              | `Art/Animations/`     |
| Visual effects          | `Art/VFX/`            |
| Sprites                 | `Art/Sprites/`        |
| Music                   | `Audio/Music/`        |
| Sound effects           | `Audio/SFX/`          |
| Ambient sounds          | `Audio/Ambience/`     |
| Voice/audio dialogue    | `Audio/Voice/`        |
| Prefabs                 | `Prefabs/`            |
| Production scenes       | `Scenes/Production/`  |
| Development scenes      | `Scenes/Development/` |
| Experimental scenes     | `Scenes/Sandbox/`     |
| ScriptableObjects       | `ScriptableObjects/`  |
| Fonts                   | `UI/Fonts/`           |
| UI icons                | `UI/Icons/`           |
| UI sprites              | `UI/Sprites/`         |
| UI themes               | `UI/Themes/`          |
| Project settings assets | `Settings/`           |

When a new asset is created, place it in the most specific existing folder matching its asset type.

---

## 4. Code Organization

Code must be organized by namespace and responsibility.

The folder structure should reflect the namespace structure whenever practical.

Example:

```text
Assets/_Project/Code/Runtime/
├── Game/
│   ├── Player/
│   │   ├── PlayerController.cs
│   │   └── PlayerHealth.cs
│   │
│   ├── Enemies/
│   │   └── EnemyController.cs
│   │
│   └── GameManager.cs
│
├── UI/
│   ├── MainMenu/
│   │   └── MainMenuController.cs
│   │
│   └── HUD/
│       └── HudController.cs
│
└── Systems/
    ├── Audio/
    │   └── AudioManager.cs
    │
    └── Save/
        └── SaveManager.cs
```

Namespaces should follow the project structure.

Example:

```csharp
namespace ProjectName.Game.Player
{
    public class PlayerController
    {
    }
}
```

For code that belongs to a specific domain, prefer:

```text
Code/Runtime/<Domain>/<Feature>/
```

over putting everything directly into:

```text
Code/Runtime/
```

Avoid generic dumping-ground folders such as:

```text
Misc/
Utils/
Helpers/
Common/
Stuff/
Temp/
```

Only create such folders when their purpose is clearly defined and justified.

---

## 5. Runtime vs Editor vs Tests

Runtime code must be separated from Editor-only code and tests.

Use:

```text
Code/
├── Runtime/
├── Editor/
└── Tests/
```

Editor-only scripts must never be placed inside runtime folders unless Unity's assembly/package structure explicitly requires it.

Tests must be placed in the test assembly/folder appropriate for the code being tested.

Prefer:

```text
Code/Tests/
```

or feature-specific test folders when the project uses assembly definitions.

---

## 6. Scenes

Do not create one giant scene when the project can reasonably be split into smaller scenes.

Prefer multiple focused scenes:

```text
Scenes/
├── Production/
│   ├── Bootstrap.unity
│   ├── MainMenu.unity
│   ├── Level01.unity
│   └── Level02.unity
│
├── Development/
│   └── TestLevel.unity
│
└── Sandbox/
    └── Experimental.unity
```

Production scenes contain content used by the actual game.

Development scenes contain temporary scenes used for testing or development.

Sandbox scenes contain experiments and prototypes.

Do not move experimental content into production folders until it is actually part of the production project.

When possible, prefer smaller scenes and additive scene loading over a single massive scene.

---

## 7. Prefabs

Reusable GameObjects should be created as Prefabs whenever practical.

Store Prefabs in:

```text
Prefabs/
```

Organize them by category if the number of Prefabs grows:

```text
Prefabs/
├── Characters/
├── Environment/
├── Props/
├── UI/
├── VFX/
└── Systems/
```

Do not duplicate large GameObject hierarchies across multiple scenes when a Prefab would be more appropriate.

Prefer modifying the Prefab over making identical changes manually in multiple scenes.

Use Nested Prefabs when they improve reuse and maintainability.

---

## 8. Third-Party Assets

All third-party assets must be isolated from project-owned assets.

Use:

```text
Assets/ThirdParty/
```

Example:

```text
Assets/ThirdParty/
├── SomeAssetStorePackage/
├── SomePlugin/
└── SomeSDK/
```

Do not reorganize third-party assets unless there is a specific technical reason.

Do not rename third-party files casually.

Do not move project files into third-party folders.

When integrating a third-party system, prefer project-owned integration code:

```text
Code/Runtime/Integrations/
├── SomePlugin/
│   ├── SomePluginAdapter.cs
│   └── SomePluginService.cs
```

rather than modifying the third-party package directly.

---

## 9. Sandbox and Experimental Content

Experimental work must be isolated from production content.

Use:

```text
Scenes/Sandbox/
```

for experimental scenes.

For experimental assets, use a clearly identified location such as:

```text
Development/
```

or:

```text
Scenes/Sandbox/
```

Do not mix prototypes with production assets.

If experimental content becomes production-ready, move it into the appropriate production folder and clean up the original experimental files.

---

## 10. Naming Conventions

Do not use spaces in file or folder names.

Bad:

```text
My Game Assets/
Player Character.cs
Main Menu/
```

Good:

```text
MyGameAssets/
PlayerCharacter.cs
MainMenu/
```

Use a consistent naming convention throughout the project.

Recommended conventions:

### C# files

Use `PascalCase`:

```text
PlayerController.cs
GameManager.cs
AudioManager.cs
SaveSystem.cs
```

### Folders

Use `PascalCase`:

```text
Scenes/
Prefabs/
ScriptableObjects/
```

### Scenes

Use descriptive `PascalCase` names:

```text
MainMenu.unity
Level01.unity
TestLevel.unity
```

### Prefabs

Use descriptive `PascalCase` names:

```text
Player.prefab
EnemyGoblin.prefab
HealthPotion.prefab
```

### ScriptableObjects

Use descriptive `PascalCase` names:

```text
PlayerSettings.asset
WeaponConfig.asset
GameSettings.asset
```

Do not introduce abbreviations unless they are already established project-wide.

Do not rename files only for stylistic reasons if doing so would create unnecessary version-control churn.

---

## 11. Moving and Renaming Files

When moving or renaming Unity assets, preserve the associated `.meta` file.

Prefer performing moves and renames through the Unity Editor whenever possible.

Do not manually move Unity assets using the operating system file explorer if doing so could separate the asset from its `.meta` file.

When Cursor performs a filesystem operation, ensure that the corresponding `.meta` file is moved or renamed together with the asset when applicable.

Example:

```text
Player.prefab
Player.prefab.meta
```

must remain paired.

Do not delete `.meta` files arbitrarily.

---

## 12. `.meta` Files

Unity `.meta` files are part of the project's source-controlled data.

They contain important asset metadata, including import settings and GUIDs.

Therefore:

* `.meta` files must be committed to version control.
* Do not manually delete `.meta` files unless intentionally regenerating an asset.
* Do not separate an asset from its `.meta` file.
* When moving an asset, move its `.meta` file with it.
* When renaming an asset, rename its `.meta` file accordingly.

Example:

```text
PlayerController.cs
PlayerController.cs.meta
```

Both files belong together.

---

## 13. Empty Folders

Do not create empty folders unless there is a concrete reason.

Only create a folder when:

1. It contains files, or
2. The folder is intentionally part of the project's established structure.

Do not generate dozens of empty folders simply to reproduce the full recommended template.

If a folder is not currently needed, do not create it preemptively.

---

## 14. Resources

Use `Resources/` sparingly.

Do not place assets in `Resources/` merely because they need to be accessed at runtime.

Prefer explicit references, Addressables, or another appropriate asset-loading strategy when possible.

If `Resources/` is used, organize its contents clearly.

Example:

```text
Resources/
├── Config/
├── Prefabs/
└── Data/
```

Do not duplicate the same asset in both `Resources/` and another project folder.

---

## 15. ScriptTemplates

Project-specific Unity script templates may be stored in:

```text
Assets/ScriptTemplates/
```

Use this folder only if the project actually customizes Unity script creation templates.

Do not place normal C# source files here.

---

## 16. Presets

Use Unity Presets to enforce consistent default settings when appropriate.

Presets should be stored in a dedicated location:

```text
Settings/Presets/
```

Example:

```text
Settings/
└── Presets/
    ├── Components/
    ├── Importers/
    └── Other/
```

Use Presets when they reduce repetitive configuration or enforce project-wide defaults.

---

## 17. Cursor File Organization Rules

When asked to organize or clean up the project:

1. Inspect the existing folder structure first.
2. Identify the asset type of each file.
3. Identify whether the file is project-owned or third-party.
4. Identify whether code is Runtime, Editor, or Test code.
5. Identify whether a scene is Production, Development, or Sandbox.
6. Move files into the most appropriate existing folder.
7. Create a new folder only when no existing folder is appropriate.
8. Preserve `.meta` files when moving or renaming Unity assets.
9. Do not modify third-party assets unless explicitly requested.
10. Do not create unnecessary empty folders.
11. Do not create new root-level folders without a strong justification.
12. Do not rename files purely for cosmetic reasons if it creates unnecessary churn.
13. Prefer consistency with the existing project over blindly applying this document.
14. If the existing project intentionally uses a different established convention, preserve that convention unless explicitly asked to migrate it.
15. Before performing a large reorganization, summarize the planned changes and identify potentially risky moves.

---

## 18. Decision Tree

When deciding where a file belongs, use this order:

### Step 1 — Is it third-party?

If yes:

```text
Assets/ThirdParty/
```

Do not reorganize it unless necessary.

### Step 2 — Is it project-owned?

If yes:

```text
Assets/_Project/
```

### Step 3 — What type of asset is it?

Use the appropriate category:

```text
Code/
Art/
Audio/
Prefabs/
Scenes/
ScriptableObjects/
UI/
Settings/
```

### Step 4 — Is it code?

Determine whether it is:

```text
Runtime/
Editor/
Tests/
```

### Step 5 — Is it a scene?

Determine whether it is:

```text
Production/
Development/
Sandbox/
```

### Step 6 — Does a suitable subfolder already exist?

If yes, use it.

If no, create the smallest meaningful folder required.

### Step 7 — Is the file experimental?

If yes, keep it isolated from production content.

---

## 19. Example Final Structure

A mature project might look like:

```text
Assets/
├── _Project/
│   ├── Art/
│   │   ├── Animations/
│   │   ├── Materials/
│   │   ├── Models/
│   │   ├── Shaders/
│   │   ├── Textures/
│   │   └── VFX/
│   │
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   └── Ambience/
│   │
│   ├── Code/
│   │   ├── Runtime/
│   │   │   ├── Game/
│   │   │   ├── UI/
│   │   │   ├── Systems/
│   │   │   └── Integrations/
│   │   │
│   │   ├── Editor/
│   │   └── Tests/
│   │
│   ├── Prefabs/
│   │   ├── Characters/
│   │   ├── Environment/
│   │   ├── Props/
│   │   ├── UI/
│   │   └── VFX/
│   │
│   ├── Scenes/
│   │   ├── Production/
│   │   ├── Development/
│   │   └── Sandbox/
│   │
│   ├── ScriptableObjects/
│   │
│   ├── UI/
│   │   ├── Fonts/
│   │   ├── Icons/
│   │   ├── Sprites/
│   │   └── Themes/
│   │
│   ├── Settings/
│   │   └── Presets/
│   │
│   ├── Resources/
│   │
│   └── Gizmos/
│
├── ThirdParty/
│
└── ScriptTemplates/
```

---

## 20. Important Principle

The goal is not to maximize the number of folders.

The goal is to make every file:

* easy to find,
* logically grouped,
* consistently named,
* separated from third-party content,
* safe to collaborate on,
* and predictable for every developer working on the project.

**Prefer a simple, consistent structure over unnecessary hierarchy.**
