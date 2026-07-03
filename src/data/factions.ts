import type { FactionId } from '../types/game';

export interface FactionConfig {
  id: FactionId;
  displayName: string;
  accentColor: number;
}

export const factions: Record<FactionId, FactionConfig> = {
  usaf: { id: 'usaf', displayName: '美国空军', accentColor: 0x6fd8ff },
  israel: { id: 'israel', displayName: '以色列方面', accentColor: 0xf2f7ff },
  iran: { id: 'iran', displayName: '伊朗方面', accentColor: 0x6bd28a }
};
