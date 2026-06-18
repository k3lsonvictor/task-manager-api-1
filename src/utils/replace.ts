export type Replace<OriginalTypes, ReplaceTypes> = Omit<
  OriginalTypes,
  keyof ReplaceTypes
> &
  ReplaceTypes;