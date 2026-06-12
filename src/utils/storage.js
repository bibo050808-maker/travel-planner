import { openDB } from 'idb'

const DB_NAME = 'travel-planner'
const DB_VERSION = 4

let db = null

export async function initStorage() {
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('cities')) {
        database.createObjectStore('cities', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('flowData')) {
        const store = database.createObjectStore('flowData', { keyPath: 'key' })
        store.createIndex('cityId', 'cityId')
        store.createIndex('date', 'date')
      }
      if (!database.objectStoreNames.contains('userData')) {
        database.createObjectStore('userData', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('reviews')) {
        const reviewStore = database.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true })
        reviewStore.createIndex('cityId', 'cityId')
        reviewStore.createIndex('timestamp', 'timestamp')
      }
      if (!database.objectStoreNames.contains('cityEdits')) {
        const editStore = database.createObjectStore('cityEdits', { keyPath: 'id', autoIncrement: true })
        editStore.createIndex('cityId', 'cityId')
      }
    },
  })
  return db
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initStorage() first.')
  return db
}

// ---- City operations ----

export async function saveCities(cities) {
  const database = getDB()
  const tx = database.transaction('cities', 'readwrite')
  await Promise.all(cities.map(city => tx.store.put(city)))
  await tx.done
}

export async function getAllCities() {
  return getDB().getAll('cities')
}

export async function getCityById(id) {
  return getDB().get('cities', id)
}

// ---- Flow data operations ----

export async function saveFlowEntries(entries) {
  const database = getDB()
  const tx = database.transaction('flowData', 'readwrite')
  await Promise.all(entries.map(e => tx.store.put(e)))
  await tx.done
}

export async function getFlowForCity(cityId) {
  const database = getDB()
  const idx = database.transaction('flowData').store.index('cityId')
  return idx.getAll(cityId)
}

export async function getFlowForDate(date) {
  const database = getDB()
  const idx = database.transaction('flowData').store.index('date')
  return idx.getAll(date)
}

// ---- User data operations ----

export async function saveUserData(data) {
  return getDB().put('userData', data)
}

export async function getUserData() {
  return getDB().get('userData', 'preferences')
}

export async function loadFavorites() {
  const data = await getDB().get('userData', 'favorites')
  return data?.cityIds || []
}

export async function saveFavorites(cityIds) {
  return getDB().put('userData', { id: 'favorites', cityIds })
}

// ---- Reviews operations ----

export async function saveReview(review) {
  return getDB().add('reviews', { ...review, timestamp: Date.now() })
}

export async function getReviewsForCity(cityId) {
  const db = getDB()
  const idx = db.transaction('reviews').store.index('cityId')
  const reviews = await idx.getAll(cityId)
  return reviews.sort((a, b) => b.timestamp - a.timestamp)
}

export async function getAllReviewCounts() {
  const db = getDB()
  const reviews = await db.getAll('reviews')
  const counts = {}
  reviews.forEach(r => {
    counts[r.cityId] = (counts[r.cityId] || 0) + 1
  })
  return counts
}

// ---- City Edit operations ----

export async function saveCityEdit(edit) {
  return getDB().add('cityEdits', { ...edit, timestamp: Date.now() })
}

export async function getEditsForCity(cityId) {
  const db = getDB()
  const idx = db.transaction('cityEdits').store.index('cityId')
  return idx.getAll(cityId)
}
