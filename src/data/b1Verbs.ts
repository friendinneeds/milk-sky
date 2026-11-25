import type { NewWord } from '../db/words';

/**
 * 68 verbs typical of level B1. Every verb was checked against the official
 * Goethe-Zertifikat B1 Wortliste (Goethe-Institut / ÖSD / Univ. Freiburg,
 * 2016), and the verb forms match it. That list is copyrighted, so its
 * example sentences are NOT used: the examples here were written for this app.
 *
 * Basic verbs that the B1 list also contains (machen, gehen ...) are left out
 * on purpose: this pack is the verbs you meet at B1, mostly with a preposition,
 * reflexive or separable.
 */
export const B1_VERBS_NAME = 'B1 verbs';

interface V {
  de: string;
  en: string;
  /** Preposition and case, if the verb takes one. */
  prep?: string;
  /** er-form, Präteritum, Perfekt. */
  forms: string;
  ex: string;
  exEn: string;
  extra?: string;
}

const VERBS: V[] = [
  { de: 'abhängen von', en: 'to depend on', prep: 'von + Dativ', forms: 'er hängt ab, hing ab, hat abgehangen', ex: 'Das hängt vom Wetter ab.', exEn: 'That depends on the weather.' },
  { de: 'ablehnen', en: 'to reject, turn down', forms: 'er lehnt ab, lehnte ab, hat abgelehnt', ex: 'Sie hat das Angebot abgelehnt.', exEn: 'She turned down the offer.' },
  { de: 'absagen', en: 'to cancel', forms: 'er sagt ab, sagte ab, hat abgesagt', ex: 'Ich muss den Termin leider absagen.', exEn: 'Unfortunately I have to cancel the appointment.' },
  { de: 'anbieten', en: 'to offer', forms: 'er bietet an, bot an, hat angeboten', ex: 'Darf ich Ihnen einen Kaffee anbieten?', exEn: 'May I offer you a coffee?' },
  { de: 'ankommen', en: 'to arrive', forms: 'er kommt an, kam an, ist angekommen', ex: 'Der Zug kommt um acht Uhr an.', exEn: 'The train arrives at eight.', extra: 'Es kommt darauf an. = It depends.' },
  { de: 'sich anmelden', en: 'to register, sign up', prep: 'für + Akkusativ', forms: 'er meldet sich an, meldete sich an, hat sich angemeldet', ex: 'Ich habe mich für den Kurs angemeldet.', exEn: 'I signed up for the course.' },
  { de: 'annehmen', en: 'to accept; to assume', forms: 'er nimmt an, nahm an, hat angenommen', ex: 'Er hat die Einladung angenommen.', exEn: 'He accepted the invitation.' },
  { de: 'sich ärgern über', en: 'to be annoyed about', prep: 'über + Akkusativ', forms: 'er ärgert sich, ärgerte sich, hat sich geärgert', ex: 'Ich ärgere mich über den Lärm.', exEn: 'I am annoyed about the noise.' },
  { de: 'aufhören mit', en: 'to stop (doing something)', prep: 'mit + Dativ', forms: 'er hört auf, hörte auf, hat aufgehört', ex: 'Er hat mit dem Rauchen aufgehört.', exEn: 'He stopped smoking.' },
  { de: 'aufpassen auf', en: 'to look after, watch out for', prep: 'auf + Akkusativ', forms: 'er passt auf, passte auf, hat aufgepasst', ex: 'Kannst du auf die Kinder aufpassen?', exEn: 'Can you look after the children?' },
  { de: 'sich aufregen über', en: 'to get upset about', prep: 'über + Akkusativ', forms: 'er regt sich auf, regte sich auf, hat sich aufgeregt', ex: 'Reg dich nicht so auf!', exEn: "Don't get so worked up!" },
  { de: 'ausgeben', en: 'to spend (money)', prep: 'für + Akkusativ', forms: 'er gibt aus, gab aus, hat ausgegeben', ex: 'Wir geben zu viel Geld für Essen aus.', exEn: 'We spend too much money on food.' },
  { de: 'ausmachen', en: 'to switch off; to arrange; to matter', forms: 'er macht aus, machte aus, hat ausgemacht', ex: 'Das macht mir nichts aus.', exEn: "I don't mind." },
  { de: 'sich bedanken', en: 'to say thank you', prep: 'bei + Dativ (person), für + Akkusativ (thing)', forms: 'er bedankt sich, bedankte sich, hat sich bedankt', ex: 'Ich bedanke mich für die Hilfe.', exEn: 'Thank you for the help.' },
  { de: 'sich beeilen', en: 'to hurry', forms: 'er beeilt sich, beeilte sich, hat sich beeilt', ex: 'Beeil dich, der Bus kommt!', exEn: 'Hurry up, the bus is coming!' },
  { de: 'beantragen', en: 'to apply for (officially)', forms: 'er beantragt, beantragte, hat beantragt', ex: 'Ich muss ein Visum beantragen.', exEn: 'I have to apply for a visa.' },
  { de: 'behaupten', en: 'to claim', forms: 'er behauptet, behauptete, hat behauptet', ex: 'Er behauptet, dass er nichts gewusst hat.', exEn: 'He claims that he knew nothing.' },
  { de: 'besprechen', en: 'to discuss', forms: 'er bespricht, besprach, hat besprochen', ex: 'Das besprechen wir morgen.', exEn: "We'll discuss that tomorrow." },
  { de: 'bestehen', en: 'to pass (an exam)', forms: 'er besteht, bestand, hat bestanden', ex: 'Sie hat die Prüfung bestanden.', exEn: 'She passed the exam.', extra: 'bestehen aus + Dativ = to consist of' },
  { de: 'beweisen', en: 'to prove', forms: 'er beweist, bewies, hat bewiesen', ex: 'Das kannst du nicht beweisen.', exEn: "You can't prove that." },
  { de: 'empfehlen', en: 'to recommend', forms: 'er empfiehlt, empfahl, hat empfohlen', ex: 'Kannst du mir ein gutes Restaurant empfehlen?', exEn: 'Can you recommend a good restaurant?' },
  { de: 'sich entscheiden für', en: 'to decide on', prep: 'für + Akkusativ', forms: 'er entscheidet sich, entschied sich, hat sich entschieden', ex: 'Ich habe mich für das blaue Kleid entschieden.', exEn: 'I decided on the blue dress.' },
  { de: 'sich entschuldigen', en: 'to apologise', prep: 'bei + Dativ (person), für + Akkusativ (thing)', forms: 'er entschuldigt sich, entschuldigte sich, hat sich entschuldigt', ex: 'Er hat sich bei ihr entschuldigt.', exEn: 'He apologised to her.' },
  { de: 'entwickeln', en: 'to develop', forms: 'er entwickelt, entwickelte, hat entwickelt', ex: 'Die Firma entwickelt eine neue App.', exEn: 'The company is developing a new app.' },
  { de: 'sich erholen', en: 'to recover, get some rest', forms: 'er erholt sich, erholte sich, hat sich erholt', ex: 'Im Urlaub habe ich mich gut erholt.', exEn: 'I had a good rest on holiday.' },
  { de: 'erfahren', en: 'to find out, learn', forms: 'er erfährt, erfuhr, hat erfahren', ex: 'Wann erfahren wir das Ergebnis?', exEn: 'When will we find out the result?' },
  { de: 'sich erinnern an', en: 'to remember', prep: 'an + Akkusativ', forms: 'er erinnert sich, erinnerte sich, hat sich erinnert', ex: 'Erinnerst du dich an unseren ersten Urlaub?', exEn: 'Do you remember our first holiday?' },
  { de: 'sich erkundigen nach', en: 'to ask about, enquire', prep: 'nach + Dativ', forms: 'er erkundigt sich, erkundigte sich, hat sich erkundigt', ex: 'Ich habe mich nach dem Preis erkundigt.', exEn: 'I asked about the price.' },
  { de: 'erledigen', en: 'to get done, take care of', forms: 'er erledigt, erledigte, hat erledigt', ex: 'Ich muss heute noch viel erledigen.', exEn: 'I still have a lot to get done today.' },
  { de: 'erwarten', en: 'to expect', forms: 'er erwartet, erwartete, hat erwartet', ex: 'Wir erwarten heute Abend Gäste.', exEn: 'We are expecting guests tonight.' },
  { de: 'sich freuen auf', en: 'to look forward to', prep: 'auf + Akkusativ', forms: 'er freut sich, freute sich, hat sich gefreut', ex: 'Ich freue mich auf das Wochenende.', exEn: 'I am looking forward to the weekend.', extra: 'sich freuen über + Akkusativ = to be happy about (something that happened)' },
  { de: 'es handelt sich um', en: 'it is about, it concerns', prep: 'um + Akkusativ', forms: 'es handelt sich, handelte sich, hat sich gehandelt', ex: 'Es handelt sich um ein Missverständnis.', exEn: 'It is a misunderstanding.' },
  { de: 'sich interessieren für', en: 'to be interested in', prep: 'für + Akkusativ', forms: 'er interessiert sich, interessierte sich, hat sich interessiert', ex: 'Ich interessiere mich für Musik.', exEn: 'I am interested in music.' },
  { de: 'sich kümmern um', en: 'to take care of', prep: 'um + Akkusativ', forms: 'er kümmert sich, kümmerte sich, hat sich gekümmert', ex: 'Wer kümmert sich um den Hund?', exEn: 'Who is looking after the dog?' },
  { de: 'leiden unter', en: 'to suffer from', prep: 'unter + Dativ', forms: 'er leidet, litt, hat gelitten', ex: 'Viele Menschen leiden unter Stress.', exEn: 'Many people suffer from stress.' },
  { de: 'leihen', en: 'to lend', forms: 'er leiht, lieh, hat geliehen', ex: 'Kannst du mir dein Fahrrad leihen?', exEn: 'Can you lend me your bike?', extra: 'sich (Dativ) etwas leihen = to borrow' },
  { de: 'nachdenken über', en: 'to think about', prep: 'über + Akkusativ', forms: 'er denkt nach, dachte nach, hat nachgedacht', ex: 'Ich muss darüber nachdenken.', exEn: 'I need to think about it.' },
  { de: 'sich streiten', en: 'to argue', prep: 'mit + Dativ (person), über + Akkusativ (topic)', forms: 'er streitet sich, stritt sich, hat sich gestritten', ex: 'Die Kinder streiten sich schon wieder.', exEn: 'The children are arguing again.' },
  { de: 'teilnehmen an', en: 'to take part in', prep: 'an + Dativ', forms: 'er nimmt teil, nahm teil, hat teilgenommen', ex: 'Nimmst du an dem Kurs teil?', exEn: 'Are you taking part in the course?' },
  { de: 'träumen von', en: 'to dream of', prep: 'von + Dativ', forms: 'er träumt, träumte, hat geträumt', ex: 'Sie träumt von einem Haus am Meer.', exEn: 'She dreams of a house by the sea.' },
  { de: 'überlegen', en: 'to think over, consider', forms: 'er überlegt, überlegte, hat überlegt', ex: 'Ich überlege mir das noch.', exEn: "I'll think it over.", extra: 'often: sich (Dativ) etwas überlegen' },
  { de: 'übernehmen', en: 'to take over, take on', forms: 'er übernimmt, übernahm, hat übernommen', ex: 'Wer übernimmt die Kosten?', exEn: 'Who will cover the costs?' },
  { de: 'überraschen', en: 'to surprise', forms: 'er überrascht, überraschte, hat überrascht', ex: 'Die Nachricht hat mich überrascht.', exEn: 'The news surprised me.' },
  { de: 'überzeugen', en: 'to convince', prep: 'von + Dativ', forms: 'er überzeugt, überzeugte, hat überzeugt', ex: 'Du hast mich überzeugt.', exEn: 'You have convinced me.' },
  { de: 'überweisen', en: 'to transfer (money)', forms: 'er überweist, überwies, hat überwiesen', ex: 'Ich überweise dir das Geld morgen.', exEn: "I'll transfer the money to you tomorrow." },
  { de: 'unterstützen', en: 'to support', forms: 'er unterstützt, unterstützte, hat unterstützt', ex: 'Meine Eltern unterstützen mich.', exEn: 'My parents support me.' },
  { de: 'sich unterhalten über', en: 'to talk about, chat', prep: 'über + Akkusativ', forms: 'er unterhält sich, unterhielt sich, hat sich unterhalten', ex: 'Wir haben uns lange über Politik unterhalten.', exEn: 'We talked about politics for a long time.' },
  { de: 'unterschreiben', en: 'to sign', forms: 'er unterschreibt, unterschrieb, hat unterschrieben', ex: 'Bitte unterschreiben Sie hier.', exEn: 'Please sign here.' },
  { de: 'sich verabreden', en: 'to arrange to meet', prep: 'mit + Dativ', forms: 'er verabredet sich, verabredete sich, hat sich verabredet', ex: 'Ich habe mich mit Anna verabredet.', exEn: 'I have arranged to meet Anna.' },
  { de: 'verbessern', en: 'to improve', forms: 'er verbessert, verbesserte, hat verbessert', ex: 'Ich möchte mein Deutsch verbessern.', exEn: 'I would like to improve my German.' },
  { de: 'verbieten', en: 'to forbid', forms: 'er verbietet, verbot, hat verboten', ex: 'Rauchen ist hier verboten.', exEn: 'Smoking is forbidden here.' },
  { de: 'verdienen', en: 'to earn; to deserve', forms: 'er verdient, verdiente, hat verdient', ex: 'Er verdient gut.', exEn: 'He earns well.' },
  { de: 'vereinbaren', en: 'to agree on, arrange', forms: 'er vereinbart, vereinbarte, hat vereinbart', ex: 'Wir haben einen Termin vereinbart.', exEn: 'We arranged an appointment.' },
  { de: 'vergleichen', en: 'to compare', prep: 'mit + Dativ', forms: 'er vergleicht, verglich, hat verglichen', ex: 'Vergleich die Preise, bevor du kaufst.', exEn: 'Compare the prices before you buy.' },
  { de: 'sich verlassen auf', en: 'to rely on', prep: 'auf + Akkusativ', forms: 'er verlässt sich, verließ sich, hat sich verlassen', ex: 'Du kannst dich auf mich verlassen.', exEn: 'You can rely on me.', extra: 'without sich: verlassen = to leave' },
  { de: 'verlangen', en: 'to demand', forms: 'er verlangt, verlangte, hat verlangt', ex: 'Der Chef verlangt zu viel.', exEn: 'The boss demands too much.' },
  { de: 'vermissen', en: 'to miss (someone)', forms: 'er vermisst, vermisste, hat vermisst', ex: 'Ich vermisse meine Familie.', exEn: 'I miss my family.' },
  { de: 'versprechen', en: 'to promise', forms: 'er verspricht, versprach, hat versprochen', ex: 'Ich verspreche dir, dass ich komme.', exEn: "I promise you I'll come." },
  { de: 'vertrauen', en: 'to trust', prep: '+ Dativ', forms: 'er vertraut, vertraute, hat vertraut', ex: 'Ich vertraue dir.', exEn: 'I trust you.' },
  { de: 'verwenden', en: 'to use', forms: 'er verwendet, verwendete, hat verwendet', ex: 'Welches Programm verwendest du?', exEn: 'Which program do you use?' },
  { de: 'sich vorbereiten auf', en: 'to prepare for', prep: 'auf + Akkusativ', forms: 'er bereitet sich vor, bereitete sich vor, hat sich vorbereitet', ex: 'Ich bereite mich auf die Prüfung vor.', exEn: 'I am preparing for the exam.' },
  { de: 'vorschlagen', en: 'to suggest', forms: 'er schlägt vor, schlug vor, hat vorgeschlagen', ex: 'Ich schlage vor, dass wir ins Kino gehen.', exEn: 'I suggest we go to the cinema.' },
  { de: 'sich vorstellen', en: 'to introduce yourself', forms: 'er stellt sich vor, stellte sich vor, hat sich vorgestellt', ex: 'Darf ich mich vorstellen?', exEn: 'May I introduce myself?', extra: 'sich (Dativ) etwas vorstellen = to imagine' },
  { de: 'warnen vor', en: 'to warn about', prep: 'vor + Dativ', forms: 'er warnt, warnte, hat gewarnt', ex: 'Ich habe dich vor dem Hund gewarnt.', exEn: 'I warned you about the dog.' },
  { de: 'sich wundern über', en: 'to be surprised at', prep: 'über + Akkusativ', forms: 'er wundert sich, wunderte sich, hat sich gewundert', ex: 'Ich wundere mich über seine Antwort.', exEn: 'I am surprised at his answer.' },
  { de: 'zustimmen', en: 'to agree', prep: '+ Dativ', forms: 'er stimmt zu, stimmte zu, hat zugestimmt', ex: 'Da stimme ich dir zu.', exEn: 'I agree with you there.' },
  { de: 'zweifeln an', en: 'to doubt', prep: 'an + Dativ', forms: 'er zweifelt, zweifelte, hat gezweifelt', ex: 'Ich zweifle an seiner Ehrlichkeit.', exEn: 'I doubt his honesty.' },
  { de: 'kündigen', en: 'to quit (a job), cancel (a contract)', forms: 'er kündigt, kündigte, hat gekündigt', ex: 'Sie hat ihre Wohnung gekündigt.', exEn: 'She gave notice on her flat.' },
];

/** Separable if the er-form splits off a particle, e.g. "er hört auf". */
function isSeparable(forms: string): boolean {
  const first = forms.split(',')[0].replace(/^(er|es) /, '').replace(/ sich\b/, '').trim();
  return first.includes(' ');
}

function topicOf(v: V): string {
  if (v.prep && v.prep !== '+ Dativ') return 'With a preposition';
  if (v.de.startsWith('sich ') || v.de.startsWith('es ')) return 'Reflexive';
  if (isSeparable(v.forms)) return 'Separable';
  return 'Other verbs';
}

export const B1_VERBS: NewWord[] = VERBS.map((v) => ({
  de: v.de,
  pos: 'verb',
  en: v.en,
  note: [v.prep, v.forms, v.extra].filter(Boolean).join('. '),
  example: v.ex,
  exampleEn: v.exEn,
  topic: topicOf(v),
}));
