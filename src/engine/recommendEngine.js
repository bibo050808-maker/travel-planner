import cities from './cities'
import { getFlowForCity } from '../utils/storage'

// Weight distribution: crowd 30%, cost 25%, food 20%, type 15%, season 10%
const WEIGHTS = { crowd: 0.30, cost: 0.25, food: 0.20, type: 0.15, season: 0.10 }

function scoreCrowd(city, prefer) {
  if (!prefer || prefer === '无所谓') return 1.0
  // Prefer uses current flow data, scoring is done against city characteristics
  // Lower costLevel cities tend to be less crowded in general
  if (prefer === '人少') return city.costLevel <= 3 ? 1.0 : 0.4
  if (prefer === '适中') return (city.costLevel >= 3 && city.costLevel <= 4) ? 1.0 : 0.6
  return 1.0
}

function scoreCost(city, prefer) {
  if (!prefer || prefer === '无所谓') return 1.0
  if (prefer === '便宜') return city.costLevel <= 2 ? 1.0 : city.costLevel === 3 ? 0.5 : 0.2
  if (prefer === '适中') return city.costLevel >= 3 && city.costLevel <= 4 ? 1.0 : 0.6
  return 1.0
}

function scoreFood(city, prefers) {
  if (!prefers || prefers.length === 0 || prefers.includes('无所谓')) return 1.0
  let max = 0
  for (const p of prefers) {
    if (city.cuisines.some(c => c.includes(p))) max = Math.max(max, 1.0)
    else if (city.tags.includes('美食')) max = Math.max(max, 0.6)
    else max = Math.max(max, 0.3)
  }
  return max
}

function scoreType(city, prefers) {
  if (!prefers || prefers.length === 0 || prefers.includes('无所谓')) return 1.0
  let max = 0
  for (const p of prefers) {
    if (city.tags.some(t => t.includes(p))) max = Math.max(max, 1.0)
    else max = Math.max(max, 0.3)
  }
  return max
}

function scoreSeason(city, month) {
  if (!month || month === '无所谓') return 1.0
  const m = parseInt(month)
  if (city.bestMonths && city.bestMonths.includes(m)) return 1.0
  // Near best months still get partial score
  if (city.bestMonths && city.bestMonths.some(bm => Math.abs(bm - m) <= 1)) return 0.7
  return 0.4
}

function getMatchTags(city, filters) {
  const tags = []
  if (filters.crowd && filters.crowd !== '无所谓') {
    const s = scoreCrowd(city, filters.crowd)
    if (s >= 0.6) tags.push(filters.crowd)
  }
  if (filters.cost && filters.cost !== '无所谓') {
    const s = scoreCost(city, filters.cost)
    if (s >= 0.6) tags.push(filters.cost + '消费')
  }
  if (filters.food && filters.food.length > 0 && !filters.food.includes('无所谓')) {
    const s = scoreFood(city, filters.food)
    if (s >= 0.6) tags.push(filters.food[0])
  }
  if (filters.type && filters.type.length > 0 && !filters.type.includes('无所谓')) {
    const s = scoreType(city, filters.type)
    if (s >= 0.6) tags.push(filters.type[0])
  }
  return tags
}

export function rankCities(filters = {}) {
  const { crowd, cost, food, type, month } = filters
  const hasAnyFilter = (crowd && crowd !== '无所谓') ||
    (cost && cost !== '无所谓') ||
    (food && food.length > 0 && !food.includes('无所谓')) ||
    (type && type.length > 0 && !type.includes('无所谓')) ||
    (month && month !== '无所谓')

  if (!hasAnyFilter) {
    // Return top cities by food score as default
    return cities
      .sort((a, b) => b.foodScore - a.foodScore)
      .slice(0, 12)
      .map(c => ({ city: c, score: Math.round(70 + Math.random() * 25), tags: ['热门', '综合推荐'] }))
  }

  const results = cities.map(city => {
    const sCrowd = scoreCrowd(city, crowd)
    const sCost = scoreCost(city, cost)
    const sFood = scoreFood(city, food)
    const sType = scoreType(city, type)
    const sSeason = scoreSeason(city, month)

    const total = sCrowd * WEIGHTS.crowd + sCost * WEIGHTS.cost +
                  sFood * WEIGHTS.food + sType * WEIGHTS.type +
                  sSeason * WEIGHTS.season

    return { city, score: total, tags: getMatchTags(city, { crowd, cost, food, type }) }
  })

  return results
    .filter(r => r.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
}

export async function rankCitiesWithFlow(filters = {}) {
  const ranked = rankCities(filters)

  // Enrich with current flow data
  const enriched = await Promise.all(ranked.map(async ({ city, score, tags }) => {
    const flows = await getFlowForCity(city.id)
    const today = flows.find(f => !f.isPrediction) || flows[flows.length - 1]
    return {
      city,
      score: Math.round(score * 100),
      tags,
      flow: today || null,
    }
  }))

  return enriched
}
