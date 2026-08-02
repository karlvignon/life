import { MapModel } from "./MapModel";
import { Placeable } from "./Placeable";

export class Builder {
  build(model: MapModel, placeable: Placeable): void {
    model.clearLivingCells();

    this.place(model, placeable);
  }

  place(model: MapModel, placeable: Placeable): void {
    const essence = placeable.getEssence();

    for (const { x, y } of placeable.getWorldCells()) {
      const tile = model.getTile(x, y);
      if (tile) {
        tile.setAlive(true, essence);
      }
    }
  }
}
