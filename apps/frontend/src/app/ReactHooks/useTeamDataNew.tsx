import { useForceUpdate } from '@genshin-optimizer/common/react-util'
import { objMap } from '@genshin-optimizer/common/util'
import type { CharacterKey, GenderKey } from '@genshin-optimizer/gi/consts'
import { useContext, useDeferredValue, useEffect, useMemo } from 'react'
import type { TeamData } from '../Context/DataContext'
import { allArtifactData } from '../Data/Artifacts'
import { getCharSheet } from '../Data/Characters'
import type CharacterSheet from '../Data/Characters/CharacterSheet'
import { resonanceData } from '../Data/Resonance'
import { getWeaponSheet } from '../Data/Weapons'
import WeaponSheet from '../Data/Weapons/WeaponSheet'
import type { ArtCharDatabase } from '../Database/Database'
import { DatabaseContext } from '../Database/Database'
import { common } from '../Formula'
import type { CharInfo } from '../Formula/api'
import {
  dataObjForArtifact,
  dataObjForCharacterNew,
  dataObjForWeapon,
  mergeData,
  uiDataForTeam,
} from '../Formula/api'
import type { Data } from '../Formula/type'
import type { ICachedArtifact } from '../Types/artifact'
import type { ICachedCharacter } from '../Types/character'
import type { ICachedWeapon } from '../Types/weapon'
import { objectMap } from '../Util/Util'
import { defaultInitialWeapon } from '../Util/WeaponUtil'
import useDBMeta from './useDBMeta'

type TeamDataBundle = {
  teamData: Dict<CharacterKey, Data[]>
  teamBundle: Dict<CharacterKey, CharBundle>
}

export default function useTeamDataNew(
  teamId: string | '',
  mainStatAssumptionLevel = 0,
  overrideArt?: ICachedArtifact[] | Data,
  overrideWeapon?: ICachedWeapon
): TeamData | undefined {
  const { database } = useContext(DatabaseContext)
  const [dbDirty, setDbDirty] = useForceUpdate()
  const dbDirtyDeferred = useDeferredValue(dbDirty)
  const { gender } = useDBMeta()
  const data = useMemo(
    () =>
      dbDirtyDeferred &&
      getTeamDataCalc(
        database,
        teamId,
        mainStatAssumptionLevel,
        gender,
        overrideArt,
        overrideWeapon
      ),
    [
      dbDirtyDeferred,
      gender,
      teamId,
      database,
      mainStatAssumptionLevel,
      overrideArt,
      overrideWeapon,
    ]
  )

  useEffect(
    () => (teamId ? database.teams.follow(teamId, setDbDirty) : undefined),
    [teamId, setDbDirty, database]
  )

  return data
}

function getTeamDataCalc(
  database: ArtCharDatabase,
  teamId: string | '',
  mainStatAssumptionLevel = 0,
  gender: GenderKey,
  overrideArt?: ICachedArtifact[] | Data,
  overrideWeapon?: ICachedWeapon
): TeamData | undefined {
  if (!teamId) return undefined
  const team = database.teams.get(teamId)
  if (!team) return undefined
  const { characterIds } = team
  const active = database.teamChars.get(characterIds[0])
  if (!active) return undefined

  const { teamData, teamBundle } =
    getTeamData(
      database,
      teamId,
      mainStatAssumptionLevel,
      overrideArt,
      overrideWeapon
    ) ?? {}
  if (!teamData || !teamBundle) return undefined

  const calcData = uiDataForTeam(teamData, gender, active.key)

  const data = objectMap(calcData, (obj, ck) => {
    const { data: _, ...rest } = teamBundle[ck]!
    return { ...obj, ...rest }
  })
  return data
}

export function getTeamData(
  database: ArtCharDatabase,
  teamId: string | '',
  mainStatAssumptionLevel = 0,
  overrideArt?: ICachedArtifact[] | Data,
  overrideWeapon?: ICachedWeapon
): TeamDataBundle | undefined {
  if (!teamId) return undefined
  const team = database.teams.get(teamId)
  if (!team) return undefined
  const { characterIds, enemyOverride, hitMode, reaction } = team

  const teamBundleArr = characterIds.map((id, ind) => {
    const teamChar = database.teamChars.get(id)
    const { key: characterKey } = teamChar
    const character = database.chars.get(characterKey)
    const { key, level, constellation, ascension, talent } = character
    const { infusionAura, customMultiTargets, conditional, bonusStats } =
      teamChar
    return getCharDataBundle(
      database,
      ind === 0, // only true for the "main character"?
      ind === 0 ? mainStatAssumptionLevel : 0, // only used for the "main character"
      {
        key,
        level,
        constellation,
        ascension,
        talent,

        infusionAura,
        customMultiTargets,
        conditional,
        bonusStats,

        enemyOverride,
        hitMode,
        reaction,
      },
      // TODO instead of using equipped, should use the teamChar.buildId build
      ind === 0 && overrideWeapon
        ? overrideWeapon
        : database.weapons.get(character.equippedWeapon) ??
            defaultInitialWeapon(),
      (ind === 0 && overrideArt) ??
        (Object.values(character.equippedArtifacts)
          .map((a) => database.arts.get(a))
          .filter((a) => a) as ICachedArtifact[])
    )
  })
  const teamBundle = Object.fromEntries(
    teamBundleArr.map((bundle) => [bundle.character.key, bundle])
  )
  const teamData = objMap(teamBundle, ({ data }) => data)
  return { teamData, teamBundle }
}
type CharBundle = {
  character: ICachedCharacter
  weapon: ICachedWeapon
  characterSheet: CharacterSheet
  weaponSheet: WeaponSheet
  data: Data[]
}

function getCharDataBundle(
  database: ArtCharDatabase,
  useCustom = false,
  mainStatAssumptionLevel: number,
  charInfo: CharInfo,
  weapon: ICachedWeapon,
  artifacts: ICachedArtifact[] | Data
): CharBundle | undefined {
  const character = database.chars.get(charInfo.key)
  const characterSheet = getCharSheet(charInfo.key, database.gender)
  if (!characterSheet) return undefined
  const weaponSheet = getWeaponSheet(weapon.key)
  if (!weaponSheet) return undefined

  const weaponSheetsDataOfType = WeaponSheet.getAllDataOfType(
    characterSheet.weaponTypeKey
  )

  const weaponSheetsData = useCustom
    ? (() => {
        // display is included in WeaponSheet.getAllDataOfType
        const { display, ...restWeaponSheetData } = weaponSheet.data
        return mergeData([restWeaponSheetData, weaponSheetsDataOfType])
      })()
    : weaponSheet.data

  const sheetData = mergeData([
    characterSheet.data,
    weaponSheetsData,
    allArtifactData,
  ])
  const artifactData = Array.isArray(artifacts)
    ? artifacts.map((a) => dataObjForArtifact(a, mainStatAssumptionLevel))
    : [artifacts]
  const data = [
    ...artifactData,
    dataObjForCharacterNew(charInfo, useCustom ? sheetData : undefined),
    dataObjForWeapon(weapon),
    sheetData,
    common, // NEED TO PUT THIS AT THE END
    resonanceData,
  ]
  return { character, weapon, characterSheet, weaponSheet, data }
}
