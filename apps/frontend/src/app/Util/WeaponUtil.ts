import type { WeaponKey, WeaponTypeKey } from '@genshin-optimizer/gi/consts'
import type { ICachedWeapon } from '@genshin-optimizer/gi/db'
/**
 * @deprecated use go/db
 */
export function defaultInitialWeaponKey(type: WeaponTypeKey): WeaponKey {
  switch (type) {
    case 'sword':
      return 'DullBlade'
    case 'bow':
      return 'HuntersBow'
    case 'claymore':
      return 'WasterGreatsword'
    case 'polearm':
      return 'BeginnersProtector'
    case 'catalyst':
      return 'ApprenticesNotes'
    default:
      return 'DullBlade'
  }
}
/**
 * @deprecated use go/db
 */
export const defaultInitialWeapon = (
  type: WeaponTypeKey = 'sword'
): ICachedWeapon => initialWeapon(defaultInitialWeaponKey(type))
/**
 * @deprecated use go/db
 */
export const initialWeapon = (key: WeaponKey): ICachedWeapon => ({
  id: '',
  key,
  level: 1,
  ascension: 0,
  refinement: 1,
  location: '',
  lock: false,
})
