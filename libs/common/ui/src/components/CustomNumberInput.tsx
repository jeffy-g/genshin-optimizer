import type { ButtonProps, InputProps } from '@mui/material'
import { Button, InputBase, styled } from '@mui/material'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
export type CustomNumberInputProps = Omit<InputProps, 'onChange'> & {
  value?: number | undefined
  onChange: (newValue: number | undefined) => void
  disabled?: boolean
  float?: boolean
  allowEmpty?: boolean
  disableNegative?: boolean
}

export const StyledInputBase = styled(InputBase)(
  ({ theme, color = 'primary' }) => {
    const tmc = theme.palette[color]
    return {
      backgroundColor: tmc.main,
      transition: 'all 0.5s ease',
      '&:hover': {
        backgroundColor: tmc.dark,
      },
      '&.Mui-focused': {
        backgroundColor: tmc.dark,
      },
      '&.Mui-disabled': {
        backgroundColor: tmc.dark,
      },
      '.MuiInputBase-input::selection': {
        backgroundColor: tmc.light,
      },
    }
  }
)

const Wrapper = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: 0,
  overflow: 'hidden',
  div: {
    width: '100%',
    height: '100%',
  },
}))

// wrap the Input with this when using the input in a buttongroup
export function CustomNumberInputButtonGroupWrapper({
  children,
  disableRipple,
  disableFocusRipple,
  disableTouchRipple,
  ...props
}: ButtonProps) {
  return (
    <Wrapper
      disableRipple
      disableFocusRipple
      disableTouchRipple
      tabIndex={-1}
      {...props}
    >
      {children}
    </Wrapper>
  )
}

function handleOnFocus(this: GlobalEventHandlers /* , e: FocusEvent */) {
  (this as HTMLInputElement).select()
}

export function CustomNumberInput({
  value = 0,
  onChange,
  disabled = false,
  float = false,
  ...props
}: CustomNumberInputProps) {
  const { inputProps = {}, inputRef, ...restProps } = props
  const { min, max } = inputProps
  const [display, setDisplay] = useState(value.toString())

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDisplay(e.target.value),
    []
  )

  const parseFunc = useCallback(
    (val: string) => (float ? parseFloat(val) : parseInt(val)),
    [float]
  )
  const onValidate = useCallback(() => {
    const change = (v: number) => {
      setDisplay(v.toString())
      onChange(v)
    }
    const newNum = parseFunc(display) || 0
    if (min !== undefined && newNum < min) return change(min)
    if (max !== undefined && newNum > max) return change(max)
    return change(newNum)
  }, [min, max, parseFunc, onChange, display])

  useEffect(() => {
    setDisplay(value.toString())
    if (inputRef && (inputRef as any).current) {
      (inputRef as any).current.onfocus = disabled ? null : handleOnFocus
    }
  }, [value, setDisplay, disabled, inputRef]) // update value on value change

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      e.key === 'Enter' && onValidate(),
    [onValidate]
  )

  return (
    <StyledInputBase
      inputRef={inputRef}
      value={display}
      aria-label="custom-input"
      type="number"
      inputProps={{ step: float ? 0.1 : 1, ...inputProps }}
      onChange={onInputChange}
      onBlurCapture={onValidate}
      disabled={disabled}
      onKeyDown={onKeyDown}
      {...restProps}
    />
  )
}
