export enum GitOriginUrlHandleType {
  None,
  Add,
  Set
}

export interface SelectBaseOption {
  name: string
  value: string | number
}

export type SelectOptions = string[] | SelectBaseOption[]
