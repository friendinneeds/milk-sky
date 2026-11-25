import type { NewWord } from '../db/words';
import { MY_WORDS, MY_WORDS_NAME } from './myWords';
import { SAMPLE_PACK, SAMPLE_PACK_NAME } from './sample';
import { B1_VERBS, B1_VERBS_NAME } from './b1Verbs';

export interface Pack {
  id: string;
  name: string;
  description: string;
  words: NewWord[];
}

export const PACKS: Pack[] = [
  { id: 'my-words', name: MY_WORDS_NAME, description: 'From your PDF', words: MY_WORDS },
  { id: 'b1-verbs', name: B1_VERBS_NAME, description: 'From the Goethe B1 list, with examples', words: B1_VERBS },
  { id: 'food-drink', name: SAMPLE_PACK_NAME, description: 'Starter pack', words: SAMPLE_PACK },
];
