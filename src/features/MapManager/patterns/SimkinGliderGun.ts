import type { Essence } from "../Essence";
import { RlePattern } from "../RlePattern";

/** Simkin glider gun — canon compact (Michael Simkin, 2015). */
export class SimkinGliderGun extends RlePattern {
  constructor(essence: Essence) {
    super(
      "2o$4o2o$2o2b2o$2o2b2o$4o2o$2o$33bo$31bo3bo$21b2o6bo3bo$20b3ob2o2bobo12b2o$19bo6bob2ob2o12b3o$19bo5bob2ob2o2bob2o8bo3bo$19bo5bobo3b2o2bob3o5b2o$19bo6bobo2bobo2bo2b2o3bob2o$19b2o2bo2bobo2bo2bo2bob2o4bo2bo$20bob2obobobobob2o3b2obo$13b2o4b2ob2o3b2o3bob2obo$13bo2bobobobobobobo2bo2bo$21b2o3b2ob2o2bob2o3bo$20b3o3b2o2bo2b2o4b2o$19b2o8bo2bo3bo$31b2o5b2o$33bo!",
      essence,
    );
  }
}
