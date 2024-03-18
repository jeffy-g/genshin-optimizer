import {
  useBoolState,
  useForceUpdate,
} from '@genshin-optimizer/common/react-util'
import {
  BootstrapTooltip,
  CardThemed,
  ModalWrapper,
  SqBadge,
} from '@genshin-optimizer/common/ui'
import { objKeyMap } from '@genshin-optimizer/common/util'
import {
  allArtifactSlotKeys,
  charKeyToLocCharKey,
  charKeyToLocGenderedCharKey,
} from '@genshin-optimizer/gi/consts'
import type { LoadoutDatum } from '@genshin-optimizer/gi/db'
import { useDBMeta, useDatabase } from '@genshin-optimizer/gi/db-ui'
import { getCharData } from '@genshin-optimizer/gi/stats'
import { CharacterName, SillyContext } from '@genshin-optimizer/gi/ui'
import AddIcon from '@mui/icons-material/Add'
import CheckroomIcon from '@mui/icons-material/Checkroom'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import GroupsIcon from '@mui/icons-material/Groups'
import InfoIcon from '@mui/icons-material/Info'
import {
  Box,
  Button,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CharacterContext } from '../../../Context/CharacterContext'
import { DataContext } from '../../../Context/DataContext'
import { getCharSheet } from '../../../Data/Characters'
import { uiInput as input } from '../../../Formula'
import TeamCard from '../../../PageTeams/TeamCard'
import ImgIcon from '../../Image/ImgIcon'
import LevelSelect from '../../LevelSelect'
import { CharacterCardStats } from '../CharacterCard/CharacterCardStats'
import {
  CharacterCompactConstSelector,
  CharacterCoverArea,
} from '../CharacterProfilePieces'
import EquippedGrid from '../EquippedGrid'
import TalentDropdown from '../TalentDropdown'
import TravelerGenderSelect from './TravelerGenderSelect'

export default function Content({ onClose }: { onClose?: () => void }) {
  const { t } = useTranslation([
    'page_character',
    // Always load these 2 so character names are loaded for searching/sorting
    'sillyWisher_charNames',
    'charNames_gen',
  ])
  const navigate = useNavigate()
  const database = useDatabase()
  const {
    character,
    character: { key: characterKey },
    characterSheet,
  } = useContext(CharacterContext)
  const { gender } = useDBMeta()
  const { silly } = useContext(SillyContext)
  const deleteCharacter = useCallback(async () => {
    let name = getCharSheet(characterKey, gender).name
    // Use translated string
    if (typeof name === 'object')
      name = t(
        `${
          silly ? 'sillyWisher_charNames' : 'charNames_gen'
        }:${charKeyToLocGenderedCharKey(characterKey, gender)}`
      )

    if (!window.confirm(t('removeCharacter', { value: name }))) return
    database.chars.remove(characterKey)
    navigate('/characters')
  }, [database, navigate, characterKey, gender, silly, t])

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Box display="flex" gap={1}>
        <TravelerGenderSelect />
        <Button
          color="error"
          onClick={() => deleteCharacter()}
          startIcon={<DeleteForeverIcon />}
          sx={{ marginLeft: 'auto' }}
        >
          {t('delete')}
        </Button>
        {!!onClose && (
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box>
        <Grid container spacing={1} sx={{ justifyContent: 'center' }}>
          <Grid item xs={8} sm={5} md={4} lg={3}>
            <CardThemed
              bgt="light"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <CharacterCoverArea />
              <Box sx={{ px: 1 }}>
                <LevelSelect
                  level={character.level}
                  ascension={character.ascension}
                  setBoth={(data) => database.chars.set(characterKey, data)}
                />
              </Box>
              <Box sx={{ px: 2 }}>
                <CharacterCardStats />
              </Box>
              <Typography sx={{ textAlign: 'center', pb: -1 }} variant="h6">
                {characterSheet.constellationName}
              </Typography>
              <CharacterCompactConstSelector />
            </CardThemed>
          </Grid>
          <Grid
            item
            xs={12}
            sm={7}
            md={8}
            lg={9}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Box>
              <Grid container columns={3} spacing={1}>
                {(['auto', 'skill', 'burst'] as const).map((talentKey) => (
                  <Grid item xs={1} key={talentKey}>
                    <TalentDropdown
                      key={talentKey}
                      talentKey={talentKey}
                      dropDownButtonProps={{
                        startIcon: (
                          <ImgIcon
                            src={characterSheet.getTalentOfKey(talentKey)?.img}
                            size={1.75}
                            sideMargin
                          />
                        ),
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            <EquipmentSection />
            <InTeam />
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

function EquipmentSection() {
  const {
    character: { key: characterKey },
  } = useContext(CharacterContext)
  const { data } = useContext(DataContext)

  const database = useDatabase()

  const weaponTypeKey = getCharData(characterKey).weaponType
  const weaponId = data.get(input.weapon.id).value
  const artifactIds = useMemo(
    () =>
      objKeyMap(
        allArtifactSlotKeys,
        (slotKey) => data.get(input.art[slotKey].id).value
      ),
    [data]
  )
  return (
    <Box>
      <EquippedGrid
        weaponTypeKey={weaponTypeKey}
        weaponId={weaponId}
        artifactIds={artifactIds}
        setWeapon={(id) => {
          database.weapons.set(id, {
            location: charKeyToLocCharKey(characterKey),
          })
        }}
        setArtifact={(_, id) => {
          database.arts.set(id, {
            location: charKeyToLocCharKey(characterKey),
          })
        }}
      />
    </Box>
  )
}
const columns = {
  xs: 1,
  md: 2,
} as const
function InTeam() {
  const navigate = useNavigate()

  const {
    character: { key: characterKey },
  } = useContext(CharacterContext)
  const database = useDatabase()
  const { gender } = useDBMeta()
  const [dbDirty, setDbDirty] = useForceUpdate()
  const loadoutTeamMap = useMemo(() => {
    const loadoutTeamMap: Record<string, string[]> = {}
    database.teamChars.entries.map(([teamCharId, teamChar]) => {
      if (teamChar.key !== characterKey) return
      if (!loadoutTeamMap[teamCharId]) loadoutTeamMap[teamCharId] = []
    })
    database.teams.entries.forEach(([teamId, team]) => {
      const teamCharIdWithCKey = team.loadoutData.find(
        (loadoutDatum) =>
          loadoutDatum &&
          database.teamChars.get(loadoutDatum?.teamCharId)?.key === characterKey
      )
      if (teamCharIdWithCKey)
        loadoutTeamMap[teamCharIdWithCKey?.teamCharId].push(teamId)
    })
    return dbDirty && loadoutTeamMap
  }, [dbDirty, characterKey, database])
  useEffect(
    () => database.teams.followAny(() => setDbDirty()),
    [database, setDbDirty]
  )
  useEffect(
    () => database.teamChars.followAny(() => setDbDirty()),
    [database, setDbDirty]
  )
  const onAddTeam = (teamCharId: string) => {
    const teamId = database.teams.new()
    database.teams.set(teamId, (team) => {
      team.loadoutData[0] = { teamCharId } as LoadoutDatum
    })
    navigate(`/teams/${teamId}`, { state: { openSetting: true } })
  }
  const onAddNewTeam = () => {
    const teamId = database.teams.new()
    const teamCharId = database.teamChars.new(characterKey)
    database.teams.set(teamId, (team) => {
      team.loadoutData[0] = { teamCharId } as LoadoutDatum
    })
    navigate(`/teams/${teamId}`, { state: { openSetting: true } })
  }
  const onDelete = (teamCharId: string) => {
    if (
      !window.confirm(
        'The loadouts and data (such as multi-opts) on this character will be deleted.'
      )
    )
      return
    database.teamChars.remove(teamCharId)
  }
  const onDup = (teamCharId: string) => {
    const newTeamCharId = database.teamChars.duplicate(teamCharId)
    if (!newTeamCharId) return
  }
  // TODO: Translation
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant={'h6'}>
        Team Loadouts with{' '}
        <CharacterName characterKey={characterKey} gender={gender} />
      </Typography>

      {Object.entries(loadoutTeamMap).map(([teamCharId, teamIds]) => {
        const { name, description, buildIds, buildTcIds, customMultiTargets } =
          database.teamChars.get(teamCharId)!
        return (
          <CardThemed key={teamCharId} bgt="light">
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography>{name}</Typography>
                <BootstrapTooltip
                  title={<Typography>{description}</Typography>}
                >
                  <InfoIcon />
                </BootstrapTooltip>
                <SqBadge color={buildIds.length ? 'primary' : 'secondary'}>
                  {buildIds.length} Builds
                </SqBadge>
                <SqBadge color={buildTcIds.length ? 'primary' : 'secondary'}>
                  {buildTcIds.length} TC Builds
                </SqBadge>
                <SqBadge
                  color={customMultiTargets.length ? 'primary' : 'secondary'}
                >
                  {customMultiTargets.length} Multi-Opt
                </SqBadge>
                <Button
                  color="info"
                  onClick={() => onDup(teamCharId)}
                  sx={{ ml: 'auto' }}
                >
                  <ContentCopyIcon />
                </Button>
                <RemoveLoadout
                  teamCharId={teamCharId}
                  teamIds={teamIds}
                  onDelete={() => onDelete(teamCharId)}
                />
              </Box>
            </CardContent>
            <Divider />
            <CardContent>
              <Grid container columns={columns} spacing={1}>
                {teamIds.map((teamId) => (
                  <Grid item xs={1} key={teamId}>
                    <TeamCard
                      teamId={teamId}
                      onClick={(cid) =>
                        navigate(`/teams/${teamId}${cid ? `/${cid}` : ''}`)
                      }
                    />
                  </Grid>
                ))}
                <Grid item xs={1}>
                  <Button
                    fullWidth
                    sx={{ height: '100%' }}
                    onClick={() => onAddTeam(teamCharId)}
                    color="info"
                    startIcon={<AddIcon />}
                  >
                    Add new Team
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </CardThemed>
        )
      })}
      <Button
        fullWidth
        onClick={() => onAddNewTeam()}
        color="info"
        startIcon={<AddIcon />}
      >
        Add new Loadout+Team
      </Button>
      <CardThemed bgt="light"></CardThemed>
    </Box>
  )
}
function RemoveLoadout({
  teamCharId,
  onDelete,
  teamIds,
}: {
  teamCharId: string
  teamIds: string[]
  onDelete: () => void
}) {
  const database = useDatabase()
  const {
    name,
    description,
    buildIds,
    buildTcIds,
    customMultiTargets,
    bonusStats,
  } = database.teamChars.get(teamCharId)!

  const [show, onShow, onHide] = useBoolState()
  const onDeleteLoadout = useCallback(() => {
    onHide()
    onDelete()
  }, [onDelete, onHide])
  return (
    <>
      <Button color="error" onClick={onShow}>
        <DeleteForeverIcon />
      </Button>
      <ModalWrapper
        open={show}
        onClose={onHide}
        containerProps={{ maxWidth: 'md' }}
      >
        <CardThemed>
          <CardHeader
            title={
              <span>
                Delete Loadout: <strong>{name}</strong>?
              </span>
            }
            action={
              <IconButton onClick={onHide}>
                <CloseIcon />
              </IconButton>
            }
          />
          <Divider />
          <CardContent>
            {description && (
              <CardThemed bgt="dark" sx={{ mb: 2 }}>
                <CardContent>{description}</CardContent>
              </CardThemed>
            )}
            <Typography>
              Deleting the Loadout will also delete the following data:
            </Typography>
            <List sx={{ listStyleType: 'disc', pl: 4 }}>
              {!!buildIds.length && (
                <ListItem sx={{ display: 'list-item' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    All saved builds: {buildIds.length}{' '}
                    <Tooltip
                      title={
                        <Box>
                          {buildIds.map((bId) => (
                            <Typography
                              key={bId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <CheckroomIcon />
                              <span>{database.builds.get(bId)?.name}</span>
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <InfoIcon />
                    </Tooltip>
                  </Box>
                </ListItem>
              )}

              {!!buildTcIds.length && (
                <ListItem sx={{ display: 'list-item' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    All saved TC builds: {buildTcIds.length}{' '}
                    <Tooltip
                      title={
                        <Box>
                          {buildTcIds.map((bId) => (
                            <Typography
                              key={bId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <CheckroomIcon />
                              <span>{database.buildTcs.get(bId)?.name}</span>
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <InfoIcon />
                    </Tooltip>
                  </Box>
                </ListItem>
              )}

              {!!customMultiTargets.length && (
                <ListItem sx={{ display: 'list-item' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    All Custom Multi-targets: {customMultiTargets.length}{' '}
                    <Tooltip
                      title={
                        <Box>
                          {customMultiTargets.map((target, i) => (
                            <Typography
                              key={i}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <DashboardCustomizeIcon />
                              <span>{target.name}</span>
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <InfoIcon />
                    </Tooltip>
                  </Box>
                </ListItem>
              )}

              {!!Object.keys(bonusStats).length && (
                <ListItem sx={{ display: 'list-item' }}>
                  Bonus stats: {Object.keys(bonusStats).length}
                </ListItem>
              )}
              <ListItem sx={{ display: 'list-item' }}>
                Optimization Configuration
              </ListItem>

              {!!teamIds.length && (
                <ListItem sx={{ display: 'list-item' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>
                      Any teams with this loadout will have this loadout removed
                      from the team. Teams will not be deleted. Teams affected:{' '}
                      {teamIds.length}
                    </span>

                    <Tooltip
                      title={
                        <Box>
                          {teamIds.map((teamId) => (
                            <Typography
                              key={teamId}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <GroupsIcon />
                              <span>{database.teams.get(teamId)?.name}</span>
                            </Typography>
                          ))}
                        </Box>
                      }
                    >
                      <InfoIcon />
                    </Tooltip>
                  </Box>
                </ListItem>
              )}
            </List>
          </CardContent>
          <CardActions sx={{ float: 'right' }}>
            <Button
              startIcon={<CloseIcon />}
              color="secondary"
              onClick={onHide}
            >
              Cancel
            </Button>
            <Button
              startIcon={<DeleteForeverIcon />}
              color="error"
              onClick={onDeleteLoadout}
            >
              Delete
            </Button>
          </CardActions>
        </CardThemed>
      </ModalWrapper>
    </>
  )
}
