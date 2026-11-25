export interface GrammarTopic {
  id: string;
  title: string;
  /** One line shown in the list. */
  summary: string;
  paragraphs: string[];
  table?: { head: string[]; rows: string[][] };
  examples: { de: string; en: string }[];
  tip?: { title: string; text: string };
}

/**
 * The 14 topics from the user's own PDF. Corrections made while importing:
 *  - Past participles: verbs in -ieren and verbs with an inseparable prefix
 *    take no ge-. The PDF said "-en for -ieren verbs", which is wrong.
 *  - "der Muster" does not exist. Only "das Muster".
 *  - The dangling "Scheren (to shear) also irregular" line was dropped.
 *  - "das Schicksal (from geschehen)" was dropped from compound nouns: it is
 *    not a compound.
 * Example sentences without a PDF source were added to make each rule concrete.
 */
export const GRAMMAR: GrammarTopic[] = [
  {
    id: 'gender',
    title: 'Article gender',
    summary: 'der, die, das: learn the article with every noun',
    paragraphs: [
      'German nouns have three genders: masculine (der), feminine (die) and neuter (das). Learn the article together with every noun, not afterwards.',
    ],
    examples: [
      { de: 'der Preis', en: 'the price (masculine)' },
      { de: 'die Schere', en: 'the scissors (feminine)' },
      { de: 'das Messer', en: 'the knife (neuter)' },
      { de: 'das Muster', en: 'the pattern (neuter). There is no "der Muster"' },
    ],
  },
  {
    id: 'reflexive',
    title: 'Reflexive verbs',
    summary: 'Verbs that need sich',
    paragraphs: [
      'Many German verbs need a reflexive pronoun. The pronoun follows the subject: subject, then the reflexive pronoun, then the verb.',
    ],
    table: {
      head: ['', 'accusative'],
      rows: [
        ['ich', 'mich'],
        ['du', 'dich'],
        ['er, sie, es', 'sich'],
        ['wir', 'uns'],
        ['ihr', 'euch'],
        ['sie, Sie', 'sich'],
      ],
    },
    examples: [
      { de: 'Ich bewerbe mich um die Stelle.', en: 'I am applying for the job.' },
      { de: 'Er gewöhnt sich an das Wetter.', en: 'He is getting used to the weather.' },
      { de: 'Ich beschäftige mich mit Grammatik.', en: 'I am occupying myself with grammar.' },
      { de: 'Sie beschwert sich über den Lärm.', en: 'She is complaining about the noise.' },
    ],
  },
  {
    id: 'participle',
    title: 'Past participle (Partizip II)',
    summary: 'ge- + stem + -t, or ge- + stem + -en',
    paragraphs: [
      'Regular (weak) verbs: ge- + stem + -t. machen becomes gemacht.',
      'Irregular (strong) verbs: ge- + stem + -en, often with a vowel change. These have to be memorized. schneiden becomes geschnitten.',
      'With a separable prefix, ge- goes between the prefix and the stem: anziehen becomes angezogen.',
      'No ge- at all: verbs with an inseparable prefix (be-, ver-, zer-, ent-, er-) and verbs ending in -ieren. zerstören becomes zerstört, studieren becomes studiert.',
    ],
    examples: [
      { de: 'verschieben → verschoben', en: 'to postpone → postponed' },
      { de: 'schneiden → geschnitten', en: 'to cut → cut' },
      { de: 'anziehen → angezogen', en: 'to put on → put on' },
      { de: 'zerstören → zerstört', en: 'to destroy → destroyed' },
      { de: 'Das Treffen wurde verschoben.', en: 'The meeting was postponed.' },
    ],
  },
  {
    id: 'subordinate',
    title: 'Subordinate clause: verb at the end',
    summary: 'After ob, the conjugated verb goes last',
    paragraphs: [
      'Conjunctions like ob (if, whether) send the conjugated verb to the end of the clause.',
      'Pattern: main clause, comma, ob + subject + the rest + verb.',
    ],
    examples: [{ de: 'Ich weiß nicht, ob er kommt.', en: "I don't know if he is coming." }],
  },
  {
    id: 'past-sein-geben',
    title: 'Past of sein and geben',
    summary: 'es war, es gab',
    paragraphs: [
      'es war = it was. It is the past of sein, third person singular.',
      'es gab = there was, there were. It is the past of es gibt, and it takes the accusative.',
    ],
    examples: [
      { de: 'Es war unerwartet für mich.', en: 'It was unexpected for me.' },
      { de: 'Es gab einen Unfall.', en: 'There was an accident.' },
    ],
  },
  {
    id: 'wuerde',
    title: 'würde + infinitive',
    summary: 'The usual way to say "would"',
    paragraphs: [
      'würde + infinitive is the conditional, "would". The infinitive goes to the end of the sentence.',
      'Ich täte is an older, formal form of "I would do" (from tun). In everyday German, würde + infinitive is the normal choice.',
    ],
    examples: [{ de: 'Ich würde das umsonst machen.', en: 'I would do this for free.' }],
  },
  {
    id: 'compounds',
    title: 'Compound nouns',
    summary: 'The last word decides the gender',
    paragraphs: [
      'German builds long nouns by joining words. The last word determines the gender.',
    ],
    examples: [
      { de: 'Wasser + Hahn = der Wasserhahn', en: 'tap. The last word, der Hahn, sets the gender.' },
      { de: 'fahren + Gast = der Fahrgast', en: 'passenger' },
      { de: 'Umwelt + freundlich + -keit = die Umweltfreundlichkeit', en: 'environmental friendliness. -keit makes it feminine.' },
    ],
  },
  {
    id: 'suffixes',
    title: 'Suffixes: -los, -reich, -heit, -keit, -ung',
    summary: 'Small endings that change the meaning',
    paragraphs: [
      '-los means without: sinnlos = senseless.',
      '-reich means rich in: erfolgreich = successful.',
      '-heit and -keit turn adjectives into feminine nouns: die Gewohnheit.',
      '-ung turns verbs into feminine nouns: die Bewegung, from bewegen.',
    ],
    examples: [
      { de: 'sinnlos', en: 'senseless, pointless' },
      { de: 'erfolgreich', en: 'successful' },
      { de: 'die Gewohnheit', en: 'habit' },
      { de: 'die Bewegung', en: 'movement' },
    ],
  },
  {
    id: 'contractions',
    title: 'Preposition + article contractions',
    summary: 'im = in + dem',
    paragraphs: ['Some prepositions merge with the article that follows them. im is in + dem, so it is dative.'],
    table: {
      head: ['short', 'long'],
      rows: [
        ['im', 'in dem'],
        ['am', 'an dem'],
        ['zum', 'zu dem'],
        ['zur', 'zu der'],
        ['vom', 'von dem'],
        ['beim', 'bei dem'],
        ['ins', 'in das'],
      ],
    },
    examples: [
      { de: 'im Zelt', en: 'in the tent' },
      { de: 'Wir schlafen im Zelt.', en: 'We sleep in the tent.' },
    ],
  },
  {
    id: 'stem-change',
    title: 'Stem-vowel change in strong verbs',
    summary: 'du stirbst, er stirbt',
    paragraphs: [
      'Many strong verbs change their stem vowel in the second and third person singular. The other persons keep the original vowel.',
    ],
    table: {
      head: ['', 'sterben', 'nehmen', 'fahren'],
      rows: [
        ['ich', 'sterbe', 'nehme', 'fahre'],
        ['du', 'stirbst', 'nimmst', 'fährst'],
        ['er', 'stirbt', 'nimmt', 'fährt'],
      ],
    },
    examples: [{ de: 'Ich sterbe, du stirbst, er stirbt.', en: 'I die, you die, he dies.' }],
  },
  {
    id: 'adjective-nouns',
    title: 'Adjective declension: der Auszubildende',
    summary: 'Nouns made from adjectives decline like adjectives',
    paragraphs: [
      'Nouns built from adjectives or participles keep adjective endings, so the ending changes with the article.',
    ],
    table: {
      head: ['', 'after der/die', 'after ein'],
      rows: [
        ['masculine', 'der Auszubildende', 'ein Auszubildender'],
        ['feminine', 'die Auszubildende', 'eine Auszubildende'],
        ['plural', 'die Auszubildenden', 'Auszubildende'],
      ],
    },
    examples: [
      { de: 'Der Auszubildende arbeitet hier.', en: 'The apprentice works here.' },
      { de: 'Ein Auszubildender hat angerufen.', en: 'An apprentice called.' },
    ],
  },
  {
    id: 'false-friends',
    title: 'False friends and common mistakes',
    summary: 'Muster, paar, schwül, Kuchen',
    paragraphs: [
      'das Muster (neuter) means pattern, sample or template. There is no "der Muster".',
      'ein paar (lower case) means a few. ein Paar (capital P) means a pair or a couple.',
      'schwül means muggy or humid, a weather word. "schwill" is not a word.',
      'der Kuchen is cake. die Küche is kitchen. One letter apart, different gender.',
    ],
    examples: [
      { de: 'ein paar Leute', en: 'a few people' },
      { de: 'ein Paar Schuhe', en: 'a pair of shoes' },
      { de: 'Es ist schwül heute.', en: 'It is muggy today.' },
      { de: 'der Kuchen / die Küche', en: 'the cake / the kitchen' },
    ],
  },
  {
    id: 'prepositions-case',
    title: 'Prepositions with a fixed case',
    summary: 'über + Akkusativ, an + Akkusativ, vor + Dativ',
    paragraphs: [
      'Some verbs always go with one preposition, and that preposition takes a fixed case. Learn them as a unit.',
      'sich beschweren über + Akkusativ: to complain about. sich gewöhnen an + Akkusativ: to get used to.',
      'verstoßen gegen + Akkusativ: to violate. bewahren vor + Dativ: to protect from.',
    ],
    examples: [
      { de: 'Ich beschwere mich über den Preis.', en: 'I am complaining about the price.' },
      { de: 'Du gewöhnst dich an die Arbeit.', en: 'You are getting used to the work.' },
      { de: 'Das verstößt gegen die Regeln.', en: 'That breaks the rules.' },
      { de: 'Das bewahrt dich vor Fehlern.', en: 'That protects you from mistakes.' },
    ],
  },
  {
    id: 'free',
    title: 'umsonst, kostenlos, gratis',
    summary: 'Three ways to say "free"',
    paragraphs: [
      'umsonst means for free, but it also means in vain.',
      'kostenlos means free of charge. There is no ambiguity.',
      'gratis also means free. It comes from Latin and is common in ads.',
    ],
    examples: [
      { de: 'Ich würde das umsonst machen.', en: 'I would do this for free.' },
      { de: 'Das war umsonst.', en: 'That was in vain.' },
      { de: 'Der Eintritt ist kostenlos.', en: 'Admission is free of charge.' },
      { de: 'Die Probe ist gratis.', en: 'The sample is free.' },
    ],
  },
];
