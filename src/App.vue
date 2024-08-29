<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Ref } from 'vue'
import type { Emoji, Leader } from './types.ts'
import { createClient } from '@supabase/supabase-js'

import Card from './components/Card.vue'

const emojis: Ref<Emoji[]> = ref([]),
  leaderboard: Ref<Leader[]> = ref([]),
  username = ref(""),
  win = ref(false),
  moves = ref(0),
  milliseconds = ref(0),
  seconds = ref(0),
  minutes = ref(0),
  matches = ref(0),
  clock: Ref<NodeJS.Timeout | undefined> = ref(undefined);

const parsedTime = computed(() =>
  `${minutes.value.toString().padStart(2, '0')}:${seconds.value.toString().padStart(2, '0')}:${milliseconds.value.toString().padStart(2, '0')}`
)

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const fetchEmojis = async () => {
  const { data: data, error } = await supabase
    .from('emojis')
    .select('*')
    .returns<Emoji[]>();

  if (error) {
    console.log(error);
    return [];
  }

  return data;
}

const getRandomEmoji = (emojisList: Emoji[]) => {
  const randomIndex = Math.floor(Math.random() * emojisList.length);
  const randomElement = emojisList[randomIndex];
  return randomElement;
}

const randomEmojis = (emojisList: Emoji[], size: number) => {
  const newList: Emoji[] = []
  for (let index = 0; index < size; index++) {
    newList.push(getRandomEmoji(emojisList))
  }

  return newList
}

const getEmojiGameboardList = (emojiList: Emoji[]) => {
  const aux = [...emojiList, ...emojiList];
  let currentIndex = aux.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [aux[currentIndex], aux[randomIndex]] = [
      aux[randomIndex], aux[currentIndex]];
  }

  return aux.map((emoji, index) => { return { ...emoji, index: index, show: false, checked: false } })
}

const showCard = (card: Emoji) => {
  if (card.show === true) return

  const visibleCards = emojis.value.filter(item => item.show)

  if (visibleCards.length < 2) {
    card.show = true

    visibleCards.push(card)
  }

  setTimeout(() => {
    if (visibleCards.length === 2) {
      const match = visibleCards.every(card => card.id === visibleCards[0].id)

      if (match) {
        visibleCards[0].checked = true
        visibleCards[1].checked = true

        visibleCards[0].show = false
        visibleCards[1].show = false

        matches.value++

        if (matches.value === 8) {
          win.value = true
          stopStopwatch()
        }
      } else {
        visibleCards[0].show = false
        visibleCards[1].show = false
      }

      moves.value++
    }
  }, 1000);


}

const resetStopwatch = () => {
  clearInterval(clock.value);
  milliseconds.value = 0
}

const stopStopwatch = () => {
  clearInterval(clock.value);
}

const newGame = async () => {
  resetStopwatch();
  win.value = false;
  moves.value = 0
  matches.value = 0
  milliseconds.value = 0
  seconds.value = 0
  minutes.value = 0

  const fetchedEmojis = await fetchEmojis();
  const emojiList = randomEmojis(fetchedEmojis, 8);
  const gameboardList = getEmojiGameboardList(emojiList);

  emojis.value = gameboardList;

  clock.value = setInterval(() => {
    milliseconds.value++;
    if (milliseconds.value >= 100) {
      seconds.value++;
      milliseconds.value = 0;
    } else if (seconds.value >= 60) {
      minutes.value++;
      seconds.value = 0;
    }
  }, 10)
}

const fetchLeaderboard = async () => {
  const { data: data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('seconds', { ascending: true })
    .limit(10)
    .returns<Leader[]>();

  if (error) {
    console.log(error);
    return [];
  }

  leaderboard.value = data;
}

const saveScore = async (e: Event) => {
  e.preventDefault()
  const body = [
    {
      username: username.value,
      time: parsedTime.value,
      moves: moves.value,
      seconds: (minutes.value * 60) + seconds.value + (milliseconds.value / 1000)
    }
  ]

  const { data, error } = await supabase
    .from('leaderboard')
    .insert(body)
    .select()

  if (error) return

  if (data) fetchLeaderboard()
}

onMounted(async () => {
  newGame();
  fetchLeaderboard();
})
</script>

<template>
  <div v-show="win" class="win--shadown">
    <div class="win">
      <h3 class="win__title">
        Congrats! You win!
      </h3>
      <form class="win__form">
        <label class="win__label">Name</label>
        <div class="win__action">
          <input v-model="username" type="text" class="win__input">
          <button @click="saveScore" class="win__button">Save</button>
        </div>
      </form>
      <div>
        <button @click="newGame" class="win__new">New game</button>
      </div>
    </div>
  </div>
  <header>
    <h1>Memorama</h1>
  </header>
  <main>
    <div class="stats">
      <div class="stats__item">
        <span class="stats__label">Matches</span>
        <span class="stats__value">{{ matches }}</span>
      </div>
      <div class="stats__item">
        <span class="stats__label">Moves</span>
        <span class="stats__value">{{ moves }}</span>
      </div>
      <div class="stats__item">
        <span class="stats__label">Time</span>
        <span class="stats__value">{{ parsedTime }}</span>
      </div>
    </div>
    <div class="gameboard">
      <Card v-for="emoji in emojis" :character="emoji.character" :hexadecimal="emoji.hexadecimal"
        :key="emoji.id + emoji.index" @show-card="showCard(emoji)" :show="emoji.show || emoji.checked" />
    </div>
  </main>
  <footer>
    <h2>Leaderboard</h2>
    <table class="leaderboard">
      <tr>
        <th>Date</th>
        <th>Username</th>
        <th>Time</th>
        <th>Moves</th>
      </tr>
      <tr v-for="leader in leaderboard">
        <td v-text="new Date(leader.date).toLocaleDateString()"></td>
        <td v-text="leader.username"></td>
        <td v-text="leader.time"></td>
        <td v-text="leader.moves"></td>
      </tr>
    </table>
  </footer>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats__item {
  display: flex;
  flex-direction: column;
  align-items: start;
  align-items: start;
}

.stats__label {
  font-weight: 300;
  font-size: 0.8rem;
}

.stats__value {
  font-weight: 600;
  font-size: 1.2rem;
}

.gameboard {
  max-width: 376px;
  widows: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.win--shadown {
  width: 100%;
  height: 100vh;
  position: fixed;

  top: 0;
  left: 0;

  background-color: #000000db;
}

.win {
  position: fixed;
  width: 20rem;
  height: 11rem;
  top: 50%;
  left: 50%;
  margin-top: -5.5rem;
  margin-left: -11rem;

  padding: 1rem;
  background-color: #000;
  border-radius: 5px;
  border: 1px solid #04aa6d;

  display: flex;
  flex-direction: column;
  row-gap: 1rem;
}

.win__title {
  margin: 0;
}

.win__form {
  display: flex;
  flex-direction: column;
  row-gap: 0.5rem;
}

.win__input {
  border-radius: 8px 0 0 8px;
  border: 1px solid #04aa6d;
  padding: 0.7em 1.2em;
  font-size: 1em;
  font-weight: 500;
  background-color: transparent;
}

.win__button {
  border-radius: 0 8px 8px 0;
  border: 1px solid #04aa6d;
  background-color: #04aa6d50;
}

.win__new {
  border: 1px solid #04aa6d;
  background-color: #04aa6d;
  font-size: 1.1rem;
}

table {
  border-collapse: collapse;
  width: 100%;
}

tr {

  border: 1px solid #dddddd;
}

td,
th {
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #131313;
}
</style>
