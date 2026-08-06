import type { CellIndex } from "../../../../core/types/grid";
import type { TeamId } from "../../../../core/types/team";
import type { Essence } from "../essences/Essence";
import { resolveBirthCompetition } from "./BirthCompetitionResolver";
import { mergeGenerations } from "./GenerationMerger";
import type {
  AcceptedBirth,
  EssenceGeneration,
  EvolutionInput,
  EvolutionOutput,
  LivingCellEntry,
} from "./types";

export function computeNextGeneration(input: EvolutionInput): EvolutionOutput {
  const globalLiving = new Set<CellIndex>(
    input.living.map((cell) => cell.index),
  );
  const generations = computeFamilyTeamGenerations(
    input.living,
    input.essenceOrder,
    input.bounds,
    globalLiving,
    input.currentCycle,
  );
  const competition = resolveBirthCompetition(
    generations,
    input.living,
    input.currentCycle,
  );
  const nextLiving = mergeGenerations(
    input.living,
    generations,
    competition.acceptedBirths,
  );
  const newbornReproducibility = collectNewbornReproducibility(
    competition.acceptedBirths,
    competition.remainingReproducibility,
  );
  const newbornPlayerIds = new Map(
    [...competition.acceptedBirths].map(([index, birth]) => [
      index,
      birth.playerId,
    ]),
  );

  return {
    nextLiving,
    reproductionCosts: competition.reproductionCosts,
    newbornReproducibility,
    newbornPlayerIds,
  };
}

function collectNewbornReproducibility(
  acceptedBirths: ReadonlyMap<CellIndex, AcceptedBirth>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): Map<CellIndex, number> {
  const inheritedScores = new Map<CellIndex, number>();

  for (const [birthIndex, { parentIndices }] of acceptedBirths) {
    inheritedScores.set(
      birthIndex,
      Math.min(
        ...parentIndices.map((parentIndex) =>
          remainingReproducibility.get(parentIndex)!,
        ),
      ),
    );
  }

  return inheritedScores;
}

function computeFamilyTeamGenerations(
  living: ReadonlyArray<LivingCellEntry>,
  essenceOrder: ReadonlyArray<Essence>,
  bounds: EvolutionInput["bounds"],
  globalLivingIndices: ReadonlySet<CellIndex>,
  currentCycle: number,
): EssenceGeneration[] {
  const familyGroups = groupByEvolutionFamilyAndTeam(living);
  const essenceRanks = new Map(
    essenceOrder.map((essence, index) => [essence, index]),
  );
  const generations: EssenceGeneration[] = [];

  for (const group of familyGroups) {
    const familyAliveIndices = new Set(
      group.entries.map((entry) => entry.index),
    );
    const essences = [
      ...new Set(group.entries.map((entry) => entry.essence)),
    ].sort(
      (left, right) =>
        left.evolutionPriority - right.evolutionPriority ||
        (essenceRanks.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (essenceRanks.get(right) ?? Number.MAX_SAFE_INTEGER),
    );

    for (const essence of essences) {
      const sourceIndices = new Set(
        group.entries
          .filter((entry) => entry.essence === essence)
          .map((entry) => entry.index),
      );
      const result = essence.evolve({
        bounds,
        aliveIndices: familyAliveIndices,
        essenceIndices: sourceIndices,
        globalLivingIndices,
        currentCycle,
      });
      const resultSet = new Set(result.aliveIndices);
      const survivingSourceIndices = [...sourceIndices].filter((index) =>
        resultSet.has(index),
      );
      const births = result.births ?? [];
      const outputIndices = [
        ...new Set([
          ...survivingSourceIndices,
          ...births.map((birth) => birth.index),
        ]),
      ];

      generations.push({
        essence,
        teamId: group.teamId,
        inputIndices: sourceIndices,
        outputIndices,
        outputSet: new Set(outputIndices),
        births,
      });
    }
  }

  return generations;
}

interface EvolutionFamilyTeamGroup {
  readonly teamId: TeamId;
  readonly entries: ReadonlyArray<LivingCellEntry>;
}

interface MutableEvolutionFamilyTeamGroup {
  readonly teamId: TeamId;
  readonly entries: LivingCellEntry[];
}

function groupByEvolutionFamilyAndTeam(
  living: ReadonlyArray<LivingCellEntry>,
): EvolutionFamilyTeamGroup[] {
  const groups = new Map<
    string,
    Map<TeamId, MutableEvolutionFamilyTeamGroup>
  >();

  for (const entry of living) {
    const familyId = entry.essence.evolutionFamilyId;
    const byTeam = groups.get(familyId) ?? new Map();
    const group = byTeam.get(entry.teamId) ?? {
      teamId: entry.teamId,
      entries: [],
    };
    group.entries.push(entry);
    byTeam.set(entry.teamId, group);
    groups.set(familyId, byTeam);
  }

  return [...groups.values()].flatMap((byTeam) => [...byTeam.values()]);
}
