import type { NewWord } from '../db/words';

/**
 * Hand-written starter pack so the app has something to show before the
 * pack-building script exists. Ordered roughly from most to least useful.
 */
export const SAMPLE_PACK_NAME = 'Food & drink';

export const SAMPLE_PACK: NewWord[] = [
  { de: 'Wasser', article: 'das', pos: 'noun', en: 'water', example: 'Ein Glas Wasser, bitte.', exampleEn: 'A glass of water, please.', topic: 'Drinks' },
  { de: 'Brot', article: 'das', pos: 'noun', en: 'bread', plural: 'Brote', example: 'Wir kaufen frisches Brot.', exampleEn: 'We are buying fresh bread.', topic: 'Meals' },
  { de: 'Milch', article: 'die', pos: 'noun', en: 'milk', example: 'Die Milch ist kalt.', exampleEn: 'The milk is cold.', topic: 'Drinks' },
  { de: 'essen', pos: 'verb', en: 'to eat', note: 'er isst, aß, hat gegessen', example: 'Wir essen um sieben Uhr.', exampleEn: 'We eat at seven o\'clock.', topic: 'Meals' },
  { de: 'trinken', pos: 'verb', en: 'to drink', note: 'er trinkt, trank, hat getrunken', example: 'Ich trinke gern Tee.', exampleEn: 'I like drinking tea.', topic: 'Drinks' },
  { de: 'Apfel', article: 'der', pos: 'noun', en: 'apple', plural: 'Äpfel', example: 'Ich esse einen Apfel.', exampleEn: 'I am eating an apple.', topic: 'Fruit & veg' },
  { de: 'Kaffee', article: 'der', pos: 'noun', en: 'coffee', example: 'Ich trinke Kaffee am Morgen.', exampleEn: 'I drink coffee in the morning.', topic: 'Drinks' },
  { de: 'Tee', article: 'der', pos: 'noun', en: 'tea', plural: 'Tees', example: 'Möchtest du einen Tee?', exampleEn: 'Would you like a tea?', topic: 'Drinks' },
  { de: 'Käse', article: 'der', pos: 'noun', en: 'cheese', plural: 'Käse', example: 'Der Käse schmeckt gut.', exampleEn: 'The cheese tastes good.', topic: 'Meals' },
  { de: 'Butter', article: 'die', pos: 'noun', en: 'butter', example: 'Ich brauche Butter.', exampleEn: 'I need butter.', topic: 'Meals' },
  { de: 'Ei', article: 'das', pos: 'noun', en: 'egg', plural: 'Eier', example: 'Sie kocht zwei Eier.', exampleEn: 'She is boiling two eggs.', topic: 'Meals' },
  { de: 'Fleisch', article: 'das', pos: 'noun', en: 'meat', example: 'Ich esse kein Fleisch.', exampleEn: 'I don\'t eat meat.', topic: 'Meals' },
  { de: 'Fisch', article: 'der', pos: 'noun', en: 'fish', plural: 'Fische', example: 'Er isst gern Fisch.', exampleEn: 'He likes eating fish.', topic: 'Meals' },
  { de: 'kaufen', pos: 'verb', en: 'to buy', note: 'er kauft, kaufte, hat gekauft', example: 'Sie kauft einen Apfel.', exampleEn: 'She buys an apple.', topic: 'Shopping' },
  { de: 'kochen', pos: 'verb', en: 'to cook', note: 'er kocht, kochte, hat gekocht', example: 'Er kocht jeden Abend.', exampleEn: 'He cooks every evening.', topic: 'Kitchen' },
  { de: 'lecker', pos: 'adjective', en: 'tasty', example: 'Die Suppe ist lecker.', exampleEn: 'The soup is tasty.', topic: 'Meals' },
  { de: 'Suppe', article: 'die', pos: 'noun', en: 'soup', plural: 'Suppen', example: 'Die Suppe ist heiß.', exampleEn: 'The soup is hot.', topic: 'Meals' },
  { de: 'Banane', article: 'die', pos: 'noun', en: 'banana', plural: 'Bananen', example: 'Die Banane ist gelb.', exampleEn: 'The banana is yellow.', topic: 'Fruit & veg' },
  { de: 'Kartoffel', article: 'die', pos: 'noun', en: 'potato', plural: 'Kartoffeln', example: 'Wir kochen Kartoffeln.', exampleEn: 'We are cooking potatoes.', topic: 'Fruit & veg' },
  { de: 'Tomate', article: 'die', pos: 'noun', en: 'tomato', plural: 'Tomaten', example: 'Die Tomaten sind frisch.', exampleEn: 'The tomatoes are fresh.', topic: 'Fruit & veg' },
  { de: 'Gurke', article: 'die', pos: 'noun', en: 'cucumber', plural: 'Gurken', example: 'Ich schneide die Gurke.', exampleEn: 'I am cutting the cucumber.', topic: 'Fruit & veg' },
  { de: 'Reis', article: 'der', pos: 'noun', en: 'rice', example: 'Wir essen Reis mit Gemüse.', exampleEn: 'We eat rice with vegetables.', topic: 'Meals' },
  { de: 'Kuchen', article: 'der', pos: 'noun', en: 'cake', plural: 'Kuchen', example: 'Der Kuchen schmeckt lecker.', exampleEn: 'The cake tastes delicious.', topic: 'Meals' },
  { de: 'Frühstück', article: 'das', pos: 'noun', en: 'breakfast', plural: 'Frühstücke', example: 'Das Frühstück ist um acht.', exampleEn: 'Breakfast is at eight.', topic: 'Meals' },
  { de: 'Abendessen', article: 'das', pos: 'noun', en: 'dinner', plural: 'Abendessen', example: 'Das Abendessen ist fertig.', exampleEn: 'Dinner is ready.', topic: 'Meals' },
  { de: 'schmecken', pos: 'verb', en: 'to taste', note: 'es schmeckt, schmeckte, hat geschmeckt', example: 'Das schmeckt gut.', exampleEn: 'That tastes good.', topic: 'Meals' },
  { de: 'frisch', pos: 'adjective', en: 'fresh', example: 'Das Brot ist frisch.', exampleEn: 'The bread is fresh.', topic: 'Shopping' },
  { de: 'heiß', pos: 'adjective', en: 'hot', example: 'Der Tee ist heiß.', exampleEn: 'The tea is hot.', topic: 'Drinks' },
  { de: 'kalt', pos: 'adjective', en: 'cold', example: 'Das Wasser ist kalt.', exampleEn: 'The water is cold.', topic: 'Drinks' },
  { de: 'süß', pos: 'adjective', en: 'sweet', example: 'Der Kuchen ist süß.', exampleEn: 'The cake is sweet.', topic: 'Meals' },
  { de: 'Zucker', article: 'der', pos: 'noun', en: 'sugar', example: 'Ohne Zucker, bitte.', exampleEn: 'Without sugar, please.', topic: 'Kitchen' },
  { de: 'Salz', article: 'das', pos: 'noun', en: 'salt', example: 'Gibst du mir das Salz?', exampleEn: 'Can you pass me the salt?', topic: 'Kitchen' },
  { de: 'Teller', article: 'der', pos: 'noun', en: 'plate', plural: 'Teller', example: 'Der Teller ist leer.', exampleEn: 'The plate is empty.', topic: 'Kitchen' },
  { de: 'Glas', article: 'das', pos: 'noun', en: 'glass', plural: 'Gläser', example: 'Das Glas ist voll.', exampleEn: 'The glass is full.', topic: 'Kitchen' },
  { de: 'Speisekarte', article: 'die', pos: 'noun', en: 'menu', plural: 'Speisekarten', example: 'Die Speisekarte, bitte.', exampleEn: 'The menu, please.', topic: 'Restaurant' },
  { de: 'bitte', pos: 'other', en: 'please, you\'re welcome', example: 'Einen Kaffee, bitte.', exampleEn: 'A coffee, please.', topic: 'Restaurant' },
  { de: 'gern', pos: 'other', en: 'gladly, with pleasure', example: 'Ich esse gern Fisch.', exampleEn: 'I like eating fish.', topic: 'Meals' },
];
