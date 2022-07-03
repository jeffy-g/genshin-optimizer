import { createContext } from "react";
import { TeamData } from "../DataContext";
import { CharacterKey } from "../Types/consts";
import { DBStorage } from "./DBStorage";
import { ArtifactDataManager } from "./Data/ArtifactData";
import { BuildsettingDataManager } from "./Data/BuildsettingData";
import { CharacterDataManager } from "./Data/CharacterData";
import { StateDataManager } from "./Data/StateData";
import { WeaponDataManager } from "./Data/WeaponData";
import { migrate } from "./imports/migrate";

export class ArtCharDatabase {
  storage: DBStorage
  arts: ArtifactDataManager
  chars: CharacterDataManager
  weapons: WeaponDataManager
  states: StateDataManager
  buildSettings: BuildsettingDataManager
  teamData: Partial<Record<CharacterKey, TeamData>> = {}

  constructor(storage: DBStorage) {
    this.storage = storage

    migrate(storage)
    this.chars = new CharacterDataManager(this)

    // Artifacts needs to after character to check for relations
    this.arts = new ArtifactDataManager(this)

    // Weapons needs to be reloaded after character to check for relations
    this.weapons = new WeaponDataManager(this)

    this.states = new StateDataManager(this)
    this.buildSettings = new BuildsettingDataManager(this)

    // invalidates character when things change.
    this.chars.followAny((key) => {
      if (typeof key === "string")
        this.invalidateTeamData(key as CharacterKey)
    })
  }

  _getTeamData(key: CharacterKey) {
    return this.teamData[key]
  }
  cacheTeamData(key: CharacterKey, data: TeamData) {
    this.teamData[key] = data
  }
  invalidateTeamData(key: CharacterKey | "") {
    delete this.teamData[key]
  }
}
export type DatabaseContextObj = {
  database: ArtCharDatabase,
  setDatabase: (db: ArtCharDatabase) => void
}
export const DatabaseContext = createContext({} as DatabaseContextObj)
