import type { Essence } from "../Essence";
import { RlePattern } from "../RlePattern";

/** Gosper glider gun — premier canon à planeurs (Bill Gosper, 1970). */
export class GosperGliderGun extends RlePattern {
  constructor(essence: Essence) {
    super(
      "24bo$22bo3bo$12b2o6bo3bo$11b3ob2o2bobo12b2o$10bo6bob2ob2o12b3o$10bo5bob2ob2o2bob2o8bo3bo$10bo5bobo3b2o2bob3o5b2o$10bo6bobo2bobo2bo2b2o3bob2o$10b2o2bo2bobo2bo2bo2bob2o4bo2bo$11bob2obobobobob2o3b2obo$4b2o4b2ob2o3b2o3bob2obo$4bo2bobobobobobobo2bo2bo$12b2o3b2ob2o2bob2o3bo$11b3o3b2o2bo2b2o4b2o$10b2o8bo2bo3bo$22b2o5b2o$24bo!",
      essence,
    );
  }
}
