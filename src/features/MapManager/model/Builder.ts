import { mergeChangeSets, type CellChangeSet } from "./CellChangeSet";
import { MapModel } from "../MapModel";
import { Placeable } from "./Placeable";

export class Builder {
  build(model: MapModel, placeable: Placeable): CellChangeSet {
    const cleared = model.clearLivingCells();
    const placed = this.place(model, placeable);
    return mergeChangeSets(cleared, placed);
  }

  place(model: MapModel, placeable: Placeable): CellChangeSet {
    const essence = placeable.getEssence();
    return model.placeCells(placeable.getWorldCells(), essence);
  }
}
