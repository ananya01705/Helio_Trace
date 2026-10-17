
export interface LinkedEvent {
  activityID?: string;
}

export interface SolarEvent {
  flrID?: string;
  activityID?: string;
  linkedEvents?: LinkedEvent[];
  [key: string]: unknown;
}

export interface EventMatch {
  flare: SolarEvent;
  cme: SolarEvent;
  matched_by: 'NASA linkedEvents';
}

export function correlateSolarEvents(
  flares: SolarEvent[],
  cmes: SolarEvent[]
): {
  matches: EventMatch[];
  unmatchedFlareIds: string[];
  unmatchedCmeIds: string[];
} {
  const flareById = new Map<string, SolarEvent>();
  const cmeById = new Map<string, SolarEvent>();

  for (const flare of flares) {
    if (typeof flare.flrID === 'string') {
      flareById.set(flare.flrID, flare);
    }
  }

  for (const cme of cmes) {
    if (typeof cme.activityID === 'string') {
      cmeById.set(cme.activityID, cme);
    }
  }

  const matches: EventMatch[] = [];
  const matchedPairs = new Set<string>();

  function addMatch(flare: SolarEvent, cme: SolarEvent) {
    if (
      typeof flare.flrID !== 'string' ||
      typeof cme.activityID !== 'string'
    ) {
      return;
    }

    const key = JSON.stringify([flare.flrID, cme.activityID]);

    if (matchedPairs.has(key)) {
      return;
    }

    matchedPairs.add(key);
    matches.push({
      flare,
      cme,
      matched_by: 'NASA linkedEvents'
    });
  }

  for (const flare of flares) {
    for (const linked of flare.linkedEvents ?? []) {
      if (typeof linked?.activityID !== 'string') continue;

      const cme = cmeById.get(linked.activityID);
      if (cme) addMatch(flare, cme);
    }
  }

  for (const cme of cmes) {
    for (const linked of cme.linkedEvents ?? []) {
      if (typeof linked?.activityID !== 'string') continue;

      const flare = flareById.get(linked.activityID);
      if (flare) addMatch(flare, cme);
    }
  }

  const matchedFlareIds = new Set(
    matches.map((match) => match.flare.flrID)
  );

  const matchedCmeIds = new Set(
    matches.map((match) => match.cme.activityID)
  );

  return {
    matches,
    unmatchedFlareIds: flares
      .filter(
        (flare) =>
          typeof flare.flrID === 'string' &&
          !matchedFlareIds.has(flare.flrID)
      )
      .map((flare) => flare.flrID as string),

    unmatchedCmeIds: cmes
      .filter(
        (cme) =>
          typeof cme.activityID === 'string' &&
          !matchedCmeIds.has(cme.activityID)
      )
      .map((cme) => cme.activityID as string)
  };
}
