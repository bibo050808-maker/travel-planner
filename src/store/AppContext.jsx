import React, { createContext, useContext, useReducer } from 'react'

const AppContext = createContext(null)

const initialState = {
  selectedCity: null,
  searchQuery: '',
  activeTab: 'search',
  filters: {
    crowdPrefer: null,
    costPrefer: null,
    foodPrefer: [],
    travelType: [],
    travelMonth: null,
  },
  favorites: [],
  tripCities: (function() { try { var s = localStorage.getItem('trip_cities'); return s ? JSON.parse(s) : []; } catch(e) { return []; } })(),
  tripRoutes: [],
  theme: 'light',
  isLoading: true,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CITY':
      return { ...state, selectedCity: action.payload }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload }
    case 'SET_TAB':
      return { ...state, activeTab: action.payload }
    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.payload } }
    case 'TOGGLE_FAVORITE': {
      const id = action.payload
      const exists = state.favorites.includes(id)
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter(fid => fid !== id)
          : [...state.favorites, id]
      }
    }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload }
    case 'ADD_TRIP_CITY': {
      const city = action.payload
      if (state.tripCities.find(c => c.id === city.id)) return state
      var nc = [...state.tripCities, city]; try { localStorage.setItem('trip_cities', JSON.stringify(nc)); } catch(e) {} return { ...state, tripCities: nc }
    }
    case 'REMOVE_TRIP_CITY':
      var fc = state.tripCities.filter(function(c) { return c.id !== action.payload }); try { localStorage.setItem('trip_cities', JSON.stringify(fc)); } catch(e) {} return { ...state, tripCities: fc }
    case 'ADD_TRIP_ROUTE': {
      const route = action.payload
      if (state.tripRoutes.find(r => r.fromId === route.fromId && r.toId === route.toId)) return state
      return { ...state, tripRoutes: [...state.tripRoutes, route] }
    }
    case 'CLEAR_TRIP':
      try { localStorage.removeItem('trip_cities'); } catch(e) {} return { ...state, tripCities: [], tripRoutes: [] }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    React.createElement(AppContext.Provider, { value: { state, dispatch } },
      children
    )
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}