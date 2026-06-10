import { createElement as h } from 'react'
import { Search, Map, UtensilsCrossed, Users, BookOpen, Sun, Moon, Star, Heart, Download, Edit3, ArrowRightLeft, ArrowLeft, ArrowRight, RefreshCw, Compass, Navigation, Plane, Train, Bus, Bed, ChefHat, Coffee, ShoppingBag, Camera, Mountain, Waves, Building2, MapPin, X, Plus, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, Calendar, Sparkles, User, Settings, Share2, Bookmark, Globe } from 'lucide-react'

var ICONS = {
  search: Search,
  map: Map,
  food: UtensilsCrossed,
  buddy: Users,
  guide: BookOpen,
  sun: Sun,
  moon: Moon,
  star: Star,
  heart: Heart,
  download: Download,
  edit: Edit3,
  swap: ArrowRightLeft,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  refresh: RefreshCw,
  compass: Compass,
  navigation: Navigation,
  plane: Plane,
  train: Train,
  bus: Bus,
  bed: Bed,
  chef: ChefHat,
  coffee: Coffee,
  shop: ShoppingBag,
  camera: Camera,
  mountain: Mountain,
  waves: Waves,
  building: Building2,
  mapPin: MapPin,
  x: X,
  plus: Plus,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  filter: Filter,
  sliders: SlidersHorizontal,
  calendar: Calendar,
  sparkles: Sparkles,
  user: User,
  settings: Settings,
  share: Share2,
  bookmark: Bookmark,
  globe: Globe,

}

export default function Icon({ name, size, strokeWidth, className, color }) {
  var icon = ICONS[name]
  if (!icon) return null
  return h(icon, { size: size || 20, strokeWidth: strokeWidth || 2, className: className, color: color })
}