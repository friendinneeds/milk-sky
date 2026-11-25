import type { NewWord } from '../db/words';
import { MY_WORDS, MY_WORDS_NAME } from './myWords';
import { SAMPLE_PACK, SAMPLE_PACK_NAME } from './sample';

export interface Pack {
  id: string;
  name: string;
  description: string;
  words: NewWord[];
}

export const PACKS: Pack[] = [
  { id: 'my-words', name: MY_WORDS_NAME, description: 'From your PDF', words: MY_WORDS },
  { id: 'food-drink', name: SAMPLE_PACK_NAME, description: 'Starter pack', words: SAMPLE_PACK },
];
