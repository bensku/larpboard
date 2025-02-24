import { AlertTriangleIcon } from 'lucide-react';
import { Badge } from './components/ui/badge';
import { Tag } from './data/tag';

/**
 * Generates a unique, recognizable color based on input text
 * @param {string} text - The text to generate a color for
 * @returns {string} - HSL color string
 */
function getColorForText(text: string) {
  // Generate a hash from the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Use absolute value of hash
  hash = Math.abs(hash);

  // Map to basic, easily recognizable hues (in degrees)
  const hues = [
    0, // Red
    30, // Orange
    60, // Yellow
    120, // Green
    180, // Cyan
    210, // Sky Blue
    240, // Blue
    270, // Purple
    300, // Pink
    330, // Magenta
  ];

  // Select a hue and vary saturation/lightness based on hash
  const hueIndex = hash % hues.length;
  const hue = hues[hueIndex];

  // Use the hash to create variations within each hue family
  const secondaryHash = Math.floor(hash / hues.length);

  // Adjust saturation and lightness based on secondary hash
  // This ensures different strings that map to the same hue still look different
  const saturation = 70 + (secondaryHash % 20); // 70-90%
  const lightness = 45 + (secondaryHash % 15); // 45-60%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Determines the best contrast color (black or white) for text
 * displayed on the given background color
 * @param {string} backgroundColor - HSL color string
 * @returns {string} - "#000000" for dark text or "#ffffff" for light text
 */
function calculateContrastColor(backgroundColor: string) {
  // Parse the HSL values
  const hslMatch =
    backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/i) ||
    backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%/i);

  if (!hslMatch) {
    // Default to white if parsing fails
    return '#ffffff';
  }

  const h = parseInt(hslMatch[1]);
  const s = parseInt(hslMatch[2]);
  const l = parseInt(hslMatch[3]);

  // Calculate perceived brightness
  // Lightness is the main factor, but we'll adjust for saturation
  // and certain hue ranges that appear darker/lighter to the eye

  // Hue adjustment - yellows appear brighter, blues darker
  let hueFactor = 0;
  if (h > 40 && h < 80) {
    // Yellow range appears brighter
    hueFactor = 10;
  } else if (h > 200 && h < 280) {
    // Blue/purple range appears darker
    hueFactor = -10;
  }

  // Calculate adjusted lightness
  const adjustedLightness = l + hueFactor;

  // For highly saturated colors, they can appear more vibrant
  // and might need adjustment for better contrast
  const saturationFactor = s > 80 ? -5 : 0;

  // Final perceived brightness
  const brightness = adjustedLightness + saturationFactor;

  // Simple threshold for black/white text
  return brightness > 55 ? '#000000' : '#ffffff';
}

export const BadgeGroup = ({ groups }: { groups: Tag[] }) => {
  return (
    <div>
      {groups.length > 0 ? (
        groups.map((group) => (
          <Badge
            key={group.id}
            variant="secondary"
            style={{
              backgroundColor: getColorForText(group.id),
              color: calculateContrastColor(getColorForText(group.id)),
            }}
          >
            {group.id}
          </Badge>
        ))
      ) : (
        <div className="flex text-yellow-600">
          <AlertTriangleIcon /> Ei ryhmiä
        </div>
      )}
    </div>
  );
};
