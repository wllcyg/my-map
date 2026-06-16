import { Place } from "@/types/map";

export function searchPlaces(places: Place[], query: string): Place[] {
  if (!query || query.trim() === "") return [];
  
  const lowerQuery = query.toLowerCase().trim();
  
  return places.filter((place) => {
    // 精确匹配 name 或 别名 的 startsWith
    if (place.name.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    if (place.aliases && place.aliases.some(alias => alias.toLowerCase().includes(lowerQuery))) {
      return true;
    }
    
    return false;
  });
}
