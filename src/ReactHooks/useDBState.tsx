import { useCallback, useContext, useEffect, useState } from "react";
import { DatabaseContext } from "../Database/Database";

export default function useDBState<O extends object>(key: string, init: () => O): [O, (value: Partial<O>) => void] {
  const { database } = useContext(DatabaseContext)
  const [state, setState] = useState(database.states.getWithInit<O>(key, init))

  useEffect(() =>
    key ? database.states.follow(key, setState as any) : undefined,
    [key, setState, database])
  const updateState = useCallback(
    value => database.states.set(key, value),
    [database, key],
  )

  return [state, updateState]
}
