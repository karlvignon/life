import type { CellIndex } from "../../../../core/types/grid";
import type { PlayerId } from "../../../../core/types/player";
import type { TeamId } from "../../../../core/types/team";
import type { EssenceBirth } from "../essences/Essence";
import type {
  AcceptedBirth,
  EssenceGeneration,
  LivingCellEntry,
} from "./types";

export interface BirthCompetitionResult {
  readonly acceptedBirths: ReadonlyMap<CellIndex, AcceptedBirth>;
  readonly reproductionCosts: ReadonlyMap<CellIndex, number>;
  readonly remainingReproducibility: ReadonlyMap<CellIndex, number>;
}

interface BirthClaim {
  readonly generation: EssenceGeneration;
  readonly birth: EssenceBirth;
}

interface ClaimStrength {
  readonly parentCount: number;
  readonly reproducibility: number;
}

/**
 * Arbitre les revendications sans modifier les cellules : priorité interne à
 * l'équipe, compétition entre équipes, attribution au joueur, puis paiement.
 */
export function resolveBirthCompetition(
  generations: ReadonlyArray<EssenceGeneration>,
  living: ReadonlyArray<LivingCellEntry>,
  currentCycle: number,
): BirthCompetitionResult {
  const remainingReproducibility = new Map(
    living.map(({ index, reproducibility }) => [index, reproducibility]),
  );
  const cellsByIndex = new Map(living.map((cell) => [cell.index, cell]));
  const claimsByIndex = collectClaimsByIndex(generations);
  const acceptedBirths = new Map<CellIndex, AcceptedBirth>();
  const reproductionCosts = new Map<CellIndex, number>();

  for (const birthIndex of [...claimsByIndex.keys()].sort((a, b) => a - b)) {
    const claims = claimsByIndex.get(birthIndex)!;
    const selectedByTeam = selectClaimForEachTeam(
      claims,
      cellsByIndex,
      remainingReproducibility,
    );
    const winner = selectWinningTeamClaim(
      selectedByTeam,
      remainingReproducibility,
    );
    if (!winner) {
      continue;
    }

    const parentIndices = [...new Set(winner.birth.parentIndices)];
    const playerId = selectOwningPlayer(
      parentIndices,
      cellsByIndex,
      remainingReproducibility,
      currentCycle,
      birthIndex,
    );
    if (!playerId) {
      continue;
    }

    const reproductionCost = winner.generation.essence.getReproductionCost();
    const parentContributions = parentIndices.map((parentIndex) => ({
      index: parentIndex,
      paidPoints: reproductionCost,
    }));
    for (const parentIndex of parentIndices) {
      remainingReproducibility.set(
        parentIndex,
        remainingReproducibility.get(parentIndex)! - reproductionCost,
      );
      reproductionCosts.set(
        parentIndex,
        (reproductionCosts.get(parentIndex) ?? 0) + reproductionCost,
      );
    }

    acceptedBirths.set(birthIndex, {
      index: birthIndex,
      essence: winner.generation.essence,
      teamId: winner.generation.teamId,
      playerId,
      parentIndices,
      parentContributions,
      rotation: winner.birth.rotation ?? 0,
    });
  }

  return {
    acceptedBirths,
    reproductionCosts,
    remainingReproducibility,
  };
}

function collectClaimsByIndex(
  generations: ReadonlyArray<EssenceGeneration>,
): Map<CellIndex, BirthClaim[]> {
  const claimsByIndex = new Map<CellIndex, BirthClaim[]>();

  // L'ordre des générations et des naissances porte la priorité déclarative.
  for (const generation of generations) {
    for (const birth of generation.births ?? []) {
      const claims = claimsByIndex.get(birth.index) ?? [];
      claims.push({ generation, birth });
      claimsByIndex.set(birth.index, claims);
    }
  }

  return claimsByIndex;
}

function selectClaimForEachTeam(
  claims: ReadonlyArray<BirthClaim>,
  cellsByIndex: ReadonlyMap<CellIndex, LivingCellEntry>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): ReadonlyArray<BirthClaim> {
  const selected = new Map<TeamId, BirthClaim>();

  for (const claim of claims) {
    if (selected.has(claim.generation.teamId)) {
      continue;
    }
    if (claimCanPay(claim, cellsByIndex, remainingReproducibility)) {
      selected.set(claim.generation.teamId, claim);
    }
  }

  return [...selected.values()];
}

function claimCanPay(
  claim: BirthClaim,
  cellsByIndex: ReadonlyMap<CellIndex, LivingCellEntry>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): boolean {
  const parentIndices = [...new Set(claim.birth.parentIndices)];
  if (parentIndices.length === 0) {
    return false;
  }

  const reproductionCost = claim.generation.essence.getReproductionCost();
  return parentIndices.every((parentIndex) => {
    const parent = cellsByIndex.get(parentIndex);
    return (
      parent?.teamId === claim.generation.teamId &&
      (remainingReproducibility.get(parentIndex) ?? -Infinity) >=
        reproductionCost
    );
  });
}

function selectWinningTeamClaim(
  claims: ReadonlyArray<BirthClaim>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): BirthClaim | null {
  if (claims.length === 0) {
    return null;
  }
  if (claims.length === 1) {
    return claims[0];
  }

  const ranked = claims
    .map((claim) => ({
      claim,
      strength: getClaimStrength(claim, remainingReproducibility),
    }))
    .sort((left, right) => compareStrength(right.strength, left.strength));

  return compareStrength(ranked[0].strength, ranked[1].strength) === 0
    ? null
    : ranked[0].claim;
}

function getClaimStrength(
  claim: BirthClaim,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
): ClaimStrength {
  const parentIndices = [...new Set(claim.birth.parentIndices)];
  return {
    parentCount: parentIndices.length,
    reproducibility: parentIndices.reduce(
      (total, index) => total + remainingReproducibility.get(index)!,
      0,
    ),
  };
}

function compareStrength(left: ClaimStrength, right: ClaimStrength): number {
  return (
    left.parentCount - right.parentCount ||
    left.reproducibility - right.reproducibility
  );
}

function selectOwningPlayer(
  parentIndices: ReadonlyArray<CellIndex>,
  cellsByIndex: ReadonlyMap<CellIndex, LivingCellEntry>,
  remainingReproducibility: ReadonlyMap<CellIndex, number>,
  currentCycle: number,
  birthIndex: CellIndex,
): PlayerId | null {
  const contributions = new Map<
    PlayerId,
    { parentCount: number; reproducibility: number }
  >();

  for (const parentIndex of parentIndices) {
    const parent = cellsByIndex.get(parentIndex);
    if (!parent) {
      return null;
    }
    const contribution = contributions.get(parent.playerId) ?? {
      parentCount: 0,
      reproducibility: 0,
    };
    contribution.parentCount++;
    contribution.reproducibility +=
      remainingReproducibility.get(parentIndex) ?? 0;
    contributions.set(parent.playerId, contribution);
  }

  const ranked = [...contributions]
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .sort(([, left], [, right]) => compareStrength(right, left));
  if (ranked.length === 0) {
    return null;
  }

  const bestStrength = ranked[0][1];
  const tiedPlayers = ranked
    .filter(([, strength]) => compareStrength(strength, bestStrength) === 0)
    .map(([playerId]) => playerId);
  const tieIndex =
    ((currentCycle % tiedPlayers.length) + (birthIndex % tiedPlayers.length)) %
    tiedPlayers.length;
  return tiedPlayers[tieIndex];
}
