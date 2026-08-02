import type { Essence } from "../Essence";
import { RlePattern } from "../RlePattern";

/** Replicator HighLife — motif canonique B36/S23 qui se copie le long d'une diagonale. */
export class HighLifeReplicator extends RlePattern {
  constructor(essence: Essence) {
    super("2b3o$bo2bo$o3bo$o2bo$3o!", essence);
  }
}
