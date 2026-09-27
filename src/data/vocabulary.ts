import type { Topic, VocabWord } from "../types";

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const topics: Topic[] = [
  { id: "colors", name: "Colors", emoji: "🎨", colorClass: "bg-fuchsia-400" },
  { id: "animals", name: "Animals", emoji: "🐶", colorClass: "bg-amber-400" },
  { id: "family", name: "Family", emoji: "👪", colorClass: "bg-rose-400" },
  { id: "food", name: "Food", emoji: "🍎", colorClass: "bg-orange-400" },
  { id: "body", name: "Body", emoji: "🖐️", colorClass: "bg-teal-400" },
  { id: "numbers", name: "Numbers", emoji: "🔢", colorClass: "bg-indigo-400" },
  { id: "toys", name: "Toys", emoji: "🧸", colorClass: "bg-sky-400" },
  { id: "weather", name: "Weather", emoji: "⛅", colorClass: "bg-cyan-400" },
  { id: "clothes", name: "Clothes", emoji: "👕", colorClass: "bg-violet-400" },
  { id: "actions", name: "Actions", emoji: "🏃", colorClass: "bg-lime-500" },
  { id: "school", name: "School", emoji: "🎒", colorClass: "bg-yellow-400" },
  { id: "nature", name: "Nature", emoji: "🌳", colorClass: "bg-green-500" },
  { id: "places", name: "Places", emoji: "🏠", colorClass: "bg-blue-400" },
];

const rawWords: Record<string, Array<[string, string]>> = {
  colors: [
    ["Red", "🔴"],
    ["Orange", "🟠"],
    ["Yellow", "🟡"],
    ["Green", "🟢"],
    ["Blue", "🔵"],
    ["Purple", "🟣"],
    ["Brown", "🟤"],
    ["Black", "⚫"],
    ["White", "⚪"],
    ["Pink", "💗"],
  ],
  animals: [
    ["Dog", "🐶"],
    ["Cat", "🐱"],
    ["Fish", "🐟"],
    ["Bird", "🐦"],
    ["Rabbit", "🐰"],
    ["Horse", "🐴"],
    ["Cow", "🐮"],
    ["Pig", "🐷"],
    ["Sheep", "🐑"],
    ["Duck", "🦆"],
    ["Lion", "🦁"],
    ["Tiger", "🐯"],
    ["Elephant", "🐘"],
    ["Monkey", "🐒"],
    ["Bear", "🐻"],
    ["Frog", "🐸"],
    ["Owl", "🦉"],
  ],
  family: [
    ["Mom", "👩"],
    ["Dad", "👨"],
    ["Sister", "👧"],
    ["Brother", "👦"],
    ["Baby", "👶"],
    ["Grandma", "👵"],
    ["Grandpa", "👴"],
    ["Family", "👨‍👩‍👧‍👦"],
    ["Aunt", "👩"],
    ["Uncle", "👨"],
    ["Cousin", "🧒"],
    ["Pet", "🐾"],
  ],
  food: [
    ["Apple", "🍎"],
    ["Banana", "🍌"],
    ["Bread", "🍞"],
    ["Milk", "🥛"],
    ["Egg", "🥚"],
    ["Rice", "🍚"],
    ["Cake", "🎂"],
    ["Ice Cream", "🍦"],
    ["Juice", "🧃"],
    ["Cheese", "🧀"],
    ["Pizza", "🍕"],
    ["Cookie", "🍪"],
    ["Sandwich", "🥪"],
    ["Soup", "🍲"],
  ],
  body: [
    ["Eye", "👁️"],
    ["Ear", "👂"],
    ["Nose", "👃"],
    ["Mouth", "👄"],
    ["Hand", "✋"],
    ["Foot", "🦶"],
    ["Leg", "🦵"],
    ["Arm", "💪"],
  ],
  numbers: [
    ["One", "1️⃣"],
    ["Two", "2️⃣"],
    ["Three", "3️⃣"],
    ["Four", "4️⃣"],
    ["Five", "5️⃣"],
    ["Six", "6️⃣"],
    ["Seven", "7️⃣"],
    ["Eight", "8️⃣"],
    ["Nine", "9️⃣"],
    ["Ten", "🔟"],
  ],
  toys: [
    ["Ball", "⚽"],
    ["Teddy Bear", "🧸"],
    ["Kite", "🪁"],
    ["Car", "🚗"],
    ["Train", "🚂"],
    ["Balloon", "🎈"],
    ["Robot", "🤖"],
    ["Puzzle", "🧩"],
    ["Blocks", "🧱"],
    ["Drum", "🥁"],
    ["Yo-yo", "🪀"],
  ],
  weather: [
    ["Sun", "☀️"],
    ["Rain", "🌧️"],
    ["Cloud", "☁️"],
    ["Snow", "❄️"],
    ["Wind", "💨"],
    ["Storm", "⛈️"],
    ["Rainbow", "🌈"],
    ["Hot", "🥵"],
    ["Cold", "🥶"],
    ["Lightning", "⚡"],
  ],
  clothes: [
    ["Shirt", "👕"],
    ["Pants", "👖"],
    ["Shoes", "👟"],
    ["Hat", "🧢"],
    ["Socks", "🧦"],
    ["Dress", "👗"],
    ["Jacket", "🧥"],
    ["Scarf", "🧣"],
    ["Gloves", "🧤"],
    ["Boots", "🥾"],
  ],
  actions: [
    ["Run", "🏃"],
    ["Walk", "🚶"],
    ["Swim", "🏊"],
    ["Jump", "🤸"],
    ["Eat", "🍽️"],
    ["Drink", "🥤"],
    ["Sleep", "😴"],
    ["Read", "📖"],
    ["Sing", "🎤"],
    ["Dance", "💃"],
    ["Write", "✍️"],
    ["Fly", "🕊️"],
  ],
  school: [
    ["Pencil", "✏️"],
    ["Ruler", "📏"],
    ["Scissors", "✂️"],
    ["Crayon", "🖍️"],
    ["Paper", "📄"],
    ["Book", "📕"],
    ["Bag", "🎒"],
    ["Teacher", "👩‍🏫"],
    ["Notebook", "📓"],
    ["Chair", "🪑"],
    ["Clock", "🕐"],
    ["Globe", "🌍"],
  ],
  nature: [
    ["Tree", "🌳"],
    ["Flower", "🌸"],
    ["Grass", "🌱"],
    ["Moon", "🌙"],
    ["Star", "⭐"],
    ["Mountain", "⛰️"],
    ["Sea", "🌊"],
    ["Leaf", "🍃"],
    ["Rock", "🪨"],
    ["Beach", "🏖️"],
    ["Butterfly", "🦋"],
  ],
  places: [
    ["House", "🏠"],
    ["Hospital", "🏥"],
    ["Farm", "🚜"],
    ["Shop", "🏪"],
    ["Library", "📚"],
    ["Airport", "✈️"],
    ["Park", "🏞️"],
    ["Street", "🚦"],
  ],
};

export const words: VocabWord[] = Object.entries(rawWords).flatMap(([topicId, entries]) =>
  entries.map(([word, emoji]) => ({
    id: `${topicId}-${slugify(word)}`,
    word,
    topicId,
    emoji,
  }))
);

export function getWordsForTopic(topicId: string): VocabWord[] {
  return words.filter((w) => w.topicId === topicId);
}

export function getTopicById(topicId: string): Topic | undefined {
  return topics.find((t) => t.id === topicId);
}

export function getWordById(wordId: string): VocabWord | undefined {
  return words.find((w) => w.id === wordId);
}
