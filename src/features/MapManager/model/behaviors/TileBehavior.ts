/** Capacité métier attachée à une tuile vivante. */
export abstract class TileBehavior {
  abstract readonly id: string;
  abstract readonly inheritable: boolean;
}
