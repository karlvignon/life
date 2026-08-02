import type { Essence } from "../Essence";
import { RlePattern } from "../RlePattern";

/** Puffer 2 — puffeur compact (c/2). */
export class Puffer2 extends RlePattern {
  constructor(essence: Essence) {
    super("b2o$2o$o2bo$3o$2o2bo$bo$o2bo$3o$2o$o$2o$b2o!", essence);
  }
}
