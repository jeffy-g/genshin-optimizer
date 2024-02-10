import { CardThemed } from '@genshin-optimizer/common/ui'
import { charKeyToLocGenderedCharKey } from '@genshin-optimizer/gi/consts'
import {
  useCharacter,
  useDBMeta,
  useDatabase,
  useTeam,
  useTeamChar,
} from '@genshin-optimizer/gi/db-ui'
import { Box, CardContent, Skeleton } from '@mui/material'
import { Suspense, useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useMatch, useNavigate, useParams } from 'react-router-dom'
import CloseButton from '../Components/CloseButton'
import { DataContext, type dataContextObj } from '../Context/DataContext'
import { FormulaDataWrapper } from '../Context/FormulaDataContext'
import {
  GraphContext,
  type ChartData,
  type GraphContextObj,
} from '../Context/GraphContext'
import { SillyContext } from '../Context/SillyContext'
import {
  TeamCharacterContext,
  type TeamCharacterContextObj,
} from '../Context/TeamCharacterContext'
import { getCharSheet } from '../Data/Characters'
import useTeamData from '../ReactHooks/useTeamData'
import useTitle from '../ReactHooks/useTitle'
import Content from './CharacterDisplay/Context'
import TeamCharacterSelector from './TeamCharacterSelector'
import TeamSettingElement from './TeamSettingElement'

export default function PageTeam() {
  const navigate = useNavigate()
  const database = useDatabase()
  const onClose = useCallback(() => navigate('/teams'), [navigate])
  const { teamId } = useParams<{ teamId?: string }>()
  const invalidKey = !database.teams.keys.includes(teamId)
  if (invalidKey) return <Navigate to="/characters" />

  return (
    <Box my={1} display="flex" flexDirection="column" gap={1}>
      <Suspense
        fallback={<Skeleton variant="rectangular" width="100%" height={1000} />}
      >
        {teamId && <Page teamId={teamId} onClose={onClose} />}
      </Suspense>
    </Box>
  )
}

function Page({ teamId, onClose }: { teamId: string; onClose?: () => void }) {
  const { silly } = useContext(SillyContext)
  const { gender } = useDBMeta()
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const team = useTeam(teamId)
  const { characterIds } = team
  const {
    params: { tab = 'overview' },
  } = useMatch({ path: '/teams/:teamId/:tab', end: false }) ?? {
    params: { tab: 'overview' },
  }
  const teamCharId = characterIds[currentCharIndex]
  const teamChar = useTeamChar(teamCharId)
  const characterKey = teamChar?.key

  const { t } = useTranslation([
    'sillyWisher_charNames',
    'charNames_gen',
    'page_character',
  ])

  useTitle(
    useMemo(
      () =>
        `${team.name} - ${t(
          `${
            silly ? 'sillyWisher_charNames' : 'charNames_gen'
          }:${charKeyToLocGenderedCharKey(characterKey, gender)}`
        )} - ${t(`page_character:tabs.${tab}`)}`,
      [t, team.name, silly, characterKey, gender, tab]
    )
  )

  const teamData = useTeamData(teamId)

  const characterSheet = getCharSheet(characterKey, gender)
  const character = useCharacter(characterKey)
  const { target: charUIData } = teamData?.[characterKey] ?? {}

  const dataContextValue: dataContextObj | undefined = useMemo(() => {
    if (!teamData || !charUIData) return undefined
    return {
      data: charUIData,
      teamData,
      oldData: undefined,
    }
  }, [charUIData, teamData])

  const characterContextValue: TeamCharacterContextObj | undefined =
    useMemo(() => {
      if (!character || !characterSheet) return undefined
      return {
        teamId,
        team,
        teamCharId,
        teamChar,
        character,
        characterSheet,
      }
    }, [teamId, team, teamCharId, teamChar, character, characterSheet])

  const [chartData, setChartData] = useState(undefined as ChartData | undefined)
  const [graphBuilds, setGraphBuilds] = useState<string[][]>()
  const graphContextValue: GraphContextObj | undefined = useMemo(() => {
    return {
      chartData,
      setChartData,
      graphBuilds,
      setGraphBuilds,
    }
  }, [chartData, graphBuilds])

  // Clear state when switching characters?
  // useEffect(() => {
  //   setChartData(undefined)
  //   setGraphBuilds(undefined)
  // }, [characterKey])

  return (
    <CardThemed>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Box flexGrow={1}>
            <TeamSettingElement teamId={teamId} />
          </Box>
          <CloseButton onClick={onClose} />
        </Box>

        <TeamCharacterSelector
          teamId={teamId}
          currentCharIndex={currentCharIndex}
          setCurrentCharIndex={setCurrentCharIndex}
        />
        {dataContextValue && characterContextValue && graphContextValue ? (
          <TeamCharacterContext.Provider value={characterContextValue}>
            <DataContext.Provider value={dataContextValue}>
              <GraphContext.Provider value={graphContextValue}>
                <FormulaDataWrapper>
                  <Content character={character} tab={tab} />
                </FormulaDataWrapper>
              </GraphContext.Provider>
            </DataContext.Provider>
          </TeamCharacterContext.Provider>
        ) : (
          <Skeleton variant="rectangular" width="100%" height={1000} />
        )}
      </CardContent>
    </CardThemed>
  )
}
