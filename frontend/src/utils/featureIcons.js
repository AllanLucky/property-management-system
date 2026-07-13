import {
  Waves,
  Dumbbell,
  Car,
  ShieldCheck,
  Wifi,
  Battery,
  Fan,
  ArrowUp,
  Building,
  TreePine,
  Camera,
  Baby,
  Shirt,
  Sun,
  PawPrint,
  Sofa,
  Droplets,
  Zap,
  Flame,
  Accessibility,
  HelpCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Property Feature Icons
|--------------------------------------------------------------------------
| These keys must match the values stored in the database
|
| Example:
| Database:
| icon = "waves"
|
| Frontend:
| getFeatureIcon("waves") => <Waves />
|
*/

const featureIcons = {
  // Swimming & Fitness
  waves: Waves,
  dumbbell: Dumbbell,

  // Parking & Security
  car: Car,
  "shield-check": ShieldCheck,
  camera: Camera,
  "electric-fence": Zap,

  // Utilities
  wifi: Wifi,
  battery: Battery,
  droplets: Droplets,
  flame: Flame,

  // Comfort
  fan: Fan,
  sofa: Sofa,
  "arrow-up": ArrowUp,

  // Outdoor
  building: Building,
  "tree-pine": TreePine,
  sun: Sun,
  "paw-print": PawPrint,

  // Family & Accessibility
  baby: Baby,
  shirt: Shirt,
  accessibility: Accessibility,
};

/*
|--------------------------------------------------------------------------
| Get Feature Icon
|--------------------------------------------------------------------------
| Returns the matching Lucide icon
| Falls back to HelpCircle if icon does not exist
|--------------------------------------------------------------------------
*/

export const getFeatureIcon = (iconName) => {
  return featureIcons[iconName] || HelpCircle;
};

export default featureIcons;